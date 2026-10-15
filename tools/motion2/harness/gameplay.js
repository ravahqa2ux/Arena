// Gameplay instrumentation: run real AI-vs-AI matches headlessly at fixed timestep (bypassing
// the slow renderer) and measure physics / shooting / AI / GK behavior quantitatively.
//
//   node gameplay.js <html> [seconds] [matches]
const { launch } = require('./common');

async function run(file, seconds, matches, gp2) {
  const { browser, page, logs } = await launch({ file, width: 320, height: 240 });
  if (gp2) await page.evaluate((o) => { globalThis.__gp2 = Object.assign(globalThis.__gp2 || {}, o); }, gp2);
  // Freeze the render loop; we will step the simulation deterministically ourselves.
  const out = await page.evaluate(async (cfg) => {
    const A = globalThis.__arena, g = A.game, store = A.store;
    g.running = false;
    cancelAnimationFrame(g.frame);
    const PITCH = A.PITCH;
    const agg = {
      matches: 0, simSeconds: 0,
      goals: 0, shots: 0, shotsOnTarget: 0, passes: 0, passCompleted: 0,
      tackles: 0, interceptions: 0, possChanges: 0, outOfPlay: 0,
      ballSpeedMax: 0, ballOffPitchFrames: 0, totalFrames: 0,
      gkSaves: 0, gkGoalsConceded: 0, playerSpeedMax: 0,
      stuckFrames: 0, nanFrames: 0, errors: 0,
    };
    const CX = 1 / 120;
    const sg = g.scoreGoal.bind(g); g.scoreGoal = (side) => { agg.goalEvents = (agg.goalEvents || 0) + 1; return sg(side); };
    for (let m = 0; m < cfg.matches; m++) {
      store.set({ selection: { homeTeamId: 'bra', awayTeamId: 'arg', homeKit: 'home', awayKit: 'home' } });
      g.startMatch();
      g.rng = new g.rng.constructor((cfg.seed + m * 7919) >>> 0);
      // pure AI-vs-AI: no human side, so AI auto-takes kickoffs immediately
      g.humanSides = [];
      g.currentHumanSide = null;
      g.selected = { home: g.selected.home, away: g.selected.away };
      // skip intro into live play
      try { g.skip(); } catch (e) {}
      store.set({ hud: { ...store.get().hud, phase: 'play' } });
      if (!g.restart && !g.owner) { try { g.startKickoff(); } catch (e) {} }
      let prevOwner = g.owner, prevScore = (g.scores || [0, 0]).join(','), lastBallMove = 0, lastBall = { x: g.ball.x, z: g.ball.z };
      // direct pass-outcome tracking: when a pass starts (passFlight set), remember the passer's side
      // and intended receiver; resolve when someone next owns the ball or it goes out.
      let flight = null, shotOn = false, shSide = null, shT = -999, prSide = null, prT = -999, prevHeld = false; // { side, startFrame }
      const steps = Math.round(cfg.seconds / CX);
      for (let i = 0; i < steps; i++) {
        try { g.step(CX); } catch (e) { agg.errors++; if (agg.errors < 3) agg.firstError = String(e).slice(0, 300); break; }
        // pass outcome tracking
        if (g.passFlight && !flight) { flight = { side: g.passFlight.side, start: i }; agg.passEvents = (agg.passEvents || 0) + 1; }
        if (flight && !g.passFlight) {
          // flight ended: who got it?
          if (g.owner) { if (g.owner.side === flight.side) agg.passOk = (agg.passOk || 0) + 1; else agg.passCut = (agg.passCut || 0) + 1; }
          else agg.passLoose = (agg.passLoose || 0) + 1;
          flight = null;
        }
        if (g.shotFlight && !shotOn) { shotOn = true; agg.shotEvents = (agg.shotEvents || 0) + 1; } else if (!g.shotFlight) shotOn = false;
        agg.totalFrames++;
        if (g.owner && g.owner.anim.stance === 'shield') agg.shieldFrames = (agg.shieldFrames || 0) + 1;
        if (g.heldBy && !prevHeld) agg.gkHolds = (agg.gkHolds || 0) + 1; prevHeld = !!g.heldBy;
        const b = g.ball, bv = g.ballVelocity;
        if (!isFinite(b.x) || !isFinite(b.z) || !isFinite(bv.x)) { agg.nanFrames++; break; }
        const bs = Math.hypot(bv.x, bv.y, bv.z);
        if (bs > agg.ballSpeedMax) agg.ballSpeedMax = bs;
        if (Math.abs(b.x) > PITCH.halfL + 0.3 || Math.abs(b.z) > PITCH.halfW + 0.3) agg.ballOffPitchFrames++;
        for (const a of g.actors) { const ps = Math.hypot(a.vx, a.vz); if (ps > agg.playerSpeedMax) agg.playerSpeedMax = ps; }
        // possession change
        if (g.owner && g.owner !== prevOwner) {
          if (prevOwner && g.owner.side !== prevOwner.side) { agg.possChanges++; if (prSide && prSide !== g.owner.side && i - prT < 150) { agg.pressLost = (agg.pressLost || 0) + 1; prSide = null; }
            if (shSide && shSide !== g.owner.side && i - shT < 120) { agg.shieldLost = (agg.shieldLost || 0) + 1; shSide = null; } }
          prevOwner = g.owner;
        }
        // stuck detection
        const moved = Math.hypot(b.x - lastBall.x, b.z - lastBall.z);
        if (moved > 0.05) { lastBallMove = i; lastBall = { x: b.x, z: b.z }; }
        if (g.restart || store.get().hud.phase !== 'play') lastBallMove = i; if (i - lastBallMove > 240) agg.stuckFrames++;
        if (g.owner && g.owner.data.position !== 'GOL' && (!prSide || i - prT > 150)) {
          const ow = g.owner, dirA = g.attackDirection(ow.side);
          if (Math.abs(dirA * 52.5 - ow.anim.x) > 20) {
            let nd = 9; for (const o of g.actors) if (o.side !== ow.side && o.anim.visible) nd = Math.min(nd, Math.hypot(o.anim.x - ow.anim.x, o.anim.z - ow.anim.z));
            if (nd < 1.3) { prSide = ow.side; prT = i; agg.pressEp = (agg.pressEp || 0) + 1; }
          }
        }
        if (g.owner && g.owner.anim.stance === 'shield') { if (!shSide || i - shT > 120) agg.shieldEp = (agg.shieldEp || 0) + 1; shSide = g.owner.side; shT = i; }
      }
      const hud = store.get().hud;
      // read goals from hud.goals (persists through our read) and live scores before restart
      agg.goals += (g.scores ? g.scores[0] + g.scores[1] : 0);
      agg.goalsHud = (agg.goalsHud || 0) + ((hud.goals && hud.goals.length) || 0);
      const st = hud.stats || {};
      let mShots = 0, mSoT = 0, mPass = 0, mPassC = 0;
      for (const side of ['home', 'away']) {
        if (st[side]) { mShots += st[side].shots || 0; mSoT += st[side].shotsOnTarget || 0; mPass += st[side].passes || 0; mPassC += st[side].passesCompleted || 0; }
      }
      agg.shots += mShots; agg.shotsOnTarget += mSoT; agg.passes += mPass; agg.passCompleted += mPassC;
      (agg.perMatch = agg.perMatch || []).push({ shots: mShots, sot: mSoT, pass: mPass, passC: mPassC });
      agg.simSeconds += cfg.seconds;
      agg.matches++;
      g.restartMatch && g.restartMatch();
    }
    return agg;
  }, { seconds, matches, seed: +(process.env.SEED || 1) });
  out.consoleErrors = logs.length;
  out.gp2stat = await page.evaluate(() => globalThis.__gp2stat || null);
  out.consoleSample = logs.slice(0, 5);
  await browser.close();
  return out;
}

(async () => {
  const file = process.argv[2];
  const seconds = +(process.argv[3] || 90);
  const matches = +(process.argv[4] || 3);
  const gp2 = process.argv[5] ? JSON.parse(process.argv[5]) : null;
  const r = await run(file, seconds, matches, gp2);
  // compact derived rates
  const pe = r.passEvents || 0;
  r.passEventOkPct = pe ? +(100 * (r.passOk || 0) / pe).toFixed(1) : null;
  r.passEventCutPct = pe ? +(100 * (r.passCut || 0) / pe).toFixed(1) : null;
  r.passEventLoosePct = pe ? +(100 * (r.passLoose || 0) / pe).toFixed(1) : null;
  r.goalsPerMatch = +(r.goals / r.matches).toFixed(2);
  r.possChangesPerMin = +(r.possChanges / (r.simSeconds / 60)).toFixed(2);
  console.log(JSON.stringify(r, null, 1));
})().catch((e) => { console.error('GAMEPLAY FAILURE', e); process.exit(1); });
