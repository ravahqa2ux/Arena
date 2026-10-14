// Controlled finishing test: an AI striker shoots from a grid of positions after the opposing
// keeper had 1.5 s to position himself. Measures goal / save / miss rates with the real game
// physics, AI shot aim and keeper logic.
//
//   node shottest.js <html> [trialsPerSpot] [gp2Json]
const { launch } = require('./common');

(async () => {
  const file = process.argv[2];
  const trials = +(process.argv[3] || 6);
  const gp2 = process.argv[4] ? JSON.parse(process.argv[4]) : null;
  const { browser, page, logs } = await launch({ file, width: 320, height: 240 });
  if (gp2) await page.evaluate((o) => { globalThis.__gp2 = Object.assign(globalThis.__gp2 || {}, o); }, gp2);
  const out = await page.evaluate(async (cfg) => {
    const A = globalThis.__arena, g = A.game, store = A.store;
    g.running = false; cancelAnimationFrame(g.frame);
    store.set({ selection: { homeTeamId: 'bra', awayTeamId: 'arg', homeKit: 'home', awayKit: 'home' } });
    g.startMatch(); g.humanSides = []; g.currentHumanSide = null;
    try { g.skip(); } catch (e) {}
    let goals = 0;
    const sg = g.scoreGoal.bind(g); g.scoreGoal = (s) => { goals++; };  // count, but don't run the celebration flow
    const CX = 1 / 120;
    const dir = g.attackDirection('home'), goalX = dir * 52.5;
    const shooter = g.actors.filter((a) => a.side === 'home' && a.data.position !== 'GOL').sort((a, b) => b.data.attrs.sho - a.data.attrs.sho)[0];
    const gk = g.actors.find((a) => a.side === 'away' && a.data.position === 'GOL');
    const spots = [];
    for (const d of [9, 13, 17, 22]) for (const z of [-14, -8, -3, 0, 4, 9, 15]) if (Math.abs(z) < 4 + d * 0.9) spots.push([d, z]);
    const res = { trials: 0, goal: 0, save: 0, miss: 0, other: 0, errors: 0, bySpot: {} };
    for (const [d, z] of spots) {
      for (let t = 0; t < cfg.trials; t++) {
        try {
          store.set({ hud: { ...store.get().hud, phase: 'play', restart: null } });
          g.restart = null; g.pendingKick = null; g.passFlight = null; g.passReceiver = null; g.shotFlight = null;
          g.heldBy = null; g.keeperAttempt = null; g.directRestart = null; g.offside.clear(); g.skills.clear?.();
          g.keeperRush = { home: 0, away: 0 }; if (typeof g.clock === 'number') g.clock = 300; if (g.half != null && g.half !== 1) g.half = 1;
          for (const a of g.actors) {
            a.anim.action = null; a.anim.stance = 'none'; a.vx = a.vz = 0;
            if (a !== shooter && a !== gk) { a.anim.x = -dir * 40 + (Math.random() - 0.5) * 6; a.anim.z = (a.side === 'home' ? -25 : 25); }
          }
          const sx = goalX - dir * d;
          gk.anim.x = goalX - dir * 1.2; gk.anim.z = 0;
          const settle = () => {
            shooter.anim.x = sx; shooter.anim.z = z; shooter.vx = shooter.vz = 0; shooter.aiTimer = 9;
            shooter.anim.heading = Math.atan2(goalX - sx, -z);
            g.owner = shooter; g.ball.set(sx + Math.sin(shooter.anim.heading) * 0.42, 0.11, z + Math.cos(shooter.anim.heading) * 0.42);
            g.ballVelocity.set(0, 0, 0);
          };
          for (let i = 0; i < 180; i++) { settle(); g.step(CX); }
          settle();
          const g0 = goals;
          g.kickBall(shooter, 'shot', 0.82);
          let outcome = 'other';
          for (let i = 0; i < 480; i++) {
            g.step(CX);
            if (goals > g0) { outcome = 'goal'; break; }
            if (g.heldBy === gk || (g.lastTouch === gk && !g.shotFlight)) { outcome = 'save'; break; }
            if (g.restart) { outcome = 'miss'; break; }
            if (g.owner && g.owner !== shooter) { outcome = g.owner === gk ? 'save' : 'other'; break; }
          }
          if (outcome === 'other' && (res.dbg = res.dbg || []).length < 4) res.dbg.push({ d, z, pk: !!g.pendingKick, own: g.owner && g.owner.data.shortName, ownSide: g.owner && g.owner.side, sf: !!g.shotFlight, bx: +g.ball.x.toFixed(1), bz: +g.ball.z.toFixed(1), by: +g.ball.y.toFixed(2), bv: +g.ballVelocity.length().toFixed(1), act: shooter.anim.action, phase: store.get().hud.phase, lt: g.lastTouch && g.lastTouch.data.shortName });
          res[outcome]++; res.trials++;
          const k = d + ',' + z; (res.bySpot[k] = res.bySpot[k] || { goal: 0, n: 0 }).n++; if (outcome === 'goal') res.bySpot[k].goal++;
        } catch (e) { res.errors++; res.firstError = String(e).slice(0, 200); }
      }
    }
    return res;
  }, { trials });
  out.consoleErrors = logs.length;
  await browser.close();
  const p = (k) => +(100 * out[k] / out.trials).toFixed(1);
  console.log(JSON.stringify({ dbg: out.dbg, trials: out.trials, goalPct: p('goal'), savePct: p('save'), missPct: p('miss'), otherPct: p('other'), errors: out.errors, firstError: out.firstError, consoleErrors: out.consoleErrors, bySpot: out.bySpot }));
})().catch((e) => { console.error('SHOTTEST FAILURE', e); process.exit(1); });
