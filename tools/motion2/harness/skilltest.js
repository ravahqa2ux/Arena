// Dribble test with the real game rules: the best dribbler runs at a defender (AI on), performs a
// skill at ~3 m and we track whether he keeps the ball, how far it strays, how far he travels and
// whether the defender wins it. Each skill: N trials, both sides.
//
//   node skilltest.js <html> [trials] [skill,skill,...]
const { launch } = require('./common');

(async () => {
  const file = process.argv[2];
  const trials = +(process.argv[3] || 10);
  const list = (process.argv[4] || 'pedalada,fintaCorpo,elastico,giro,pedaladaDupla,paraArranca,corteSeco').split(',');
  const { browser, page, logs } = await launch({ file, width: 320, height: 240 });
  await page.waitForFunction(() => globalThis.__arena.store.get().screen === 'title', null, { timeout: 60000 }).catch(() => {});
  const out = await page.evaluate(async ({ trials, list }) => {
    const A = globalThis.__arena, g = A.game, store = A.store;
    g.running = false; cancelAnimationFrame(g.frame);
    store.set({ selection: { homeTeamId: 'bra', awayTeamId: 'arg', homeKit: 'home', awayKit: 'home' } });
    g.startMatch(); g.humanSides = []; g.currentHumanSide = null;
    try { g.skip(); } catch (e) {}
    g.scoreGoal = () => {};
    const dt = 1 / 120;
    const me = g.actors.filter((a) => a.side === 'home' && a.data.position !== 'GOL').sort((a, b) => b.data.skillMoves - a.data.skillMoves || b.data.attrs.dri - a.data.attrs.dri)[0];
    const def = g.actors.filter((a) => a.side === 'away' && a.data.position !== 'GOL').sort((a, b) => b.data.attrs.def - a.data.attrs.def)[0];
    const dir = g.attackDirection('home');
    const res = {};
    for (const id of list) {
      const r = (res[id] = { n: 0, started: 0, kept: 0, defWon: 0, loose: 0, maxBallDist: 0, travel: 0, turnDeg: 0, nan: 0, errors: 0 });
      for (let t = 0; t < trials; t++) {
        try {
          store.set({ hud: { ...store.get().hud, phase: 'play', restart: null } });
          g.restart = null; g.pendingKick = null; g.passFlight = null; g.passReceiver = null; g.shotFlight = null; g.heldBy = null; g.directRestart = null;
          g.offside.clear(); g.clearSkills(); if (typeof g.clock === 'number') g.clock = 300;
          for (const a of g.actors) { a.anim.action = null; a.anim.stance = 'none'; a.vx = a.vz = 0; a.skillTimer = 0;
            if (a !== me && a !== def) { a.anim.x = -dir * 35 + (Math.random() - 0.5) * 10; a.anim.z = a.side === 'home' ? -28 : 28; } }
          const z0 = (Math.random() - 0.5) * 6, x0 = -dir * 8;
          const moving = id !== 'pulinho';
          const v = moving ? 4.2 : 0;
          const h = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
          const settle = (k) => {
            const xx = x0 + dir * v * k * dt;
            me.anim.x = xx; me.anim.z = z0; me.anim.heading = h; me.anim.moveDir = h; me.vx = Math.sin(h) * v; me.vz = 0; me.anim.speed = v; me.aiTimer = 9;
            g.owner = me; g.ball.set(xx + Math.sin(h) * 0.45, 0.11, z0); g.ballVelocity.set(me.vx, 0, 0);
          };
          def.anim.x = x0 + dir * (moving ? 5.2 : 2.6); def.anim.z = z0 + (Math.random() - 0.5) * 0.6; def.anim.heading = -h;
          for (let k = 0; k < 60; k++) { settle(k); g.step(dt); }
          settle(60);
          const sx = me.anim.x, sz = me.anim.z, side = t % 2 ? -1 : 1;
          g.performSkill('home', id, side);
          if (me.anim.action !== id) { r.n++; continue; }
          r.started++;
          const dur = A.clips[id].dur;
          let lost = null;
          for (let i = 0; i < Math.round((dur + 0.5) / dt); i++) {
            g.step(dt);
            const bd = Math.hypot(g.ball.x - me.anim.x, g.ball.z - me.anim.z);
            if (!Number.isFinite(bd) || !Number.isFinite(me.anim.x)) { r.nan++; break; }
            if (i * dt < dur) r.maxBallDist = Math.max(r.maxBallDist, bd);
            if (!lost && g.owner && g.owner !== me) lost = g.owner.side === 'away' ? 'def' : 'mate';
            if (i * dt < dur - 0.02 && me.anim.action !== id && !r.cut) r.cut = (r.cut || 0) + 0, r.early = (r.early || 0) + (r._e !== t ? 1 : 0), r._e = t;
          }
          r.n++;
          if (g.owner === me && !lost) r.kept++;
          else if (lost === 'def' || (g.owner && g.owner.side === 'away')) r.defWon++;
          else r.loose++;
          r.travel += Math.hypot(me.anim.x - sx, me.anim.z - sz);
          r.turnDeg += Math.abs(A.Vec3 ? (((me.anim.heading - h + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI) * 57.3 : 0);
        } catch (e) { r.errors++; r.firstError = String(e).slice(0, 200); }
      }
      r.keptPct = r.started ? +(100 * r.kept / r.started).toFixed(0) : null;
      r.defWonPct = r.started ? +(100 * r.defWon / r.started).toFixed(0) : null;
      r.travel = r.started ? +(r.travel / r.started).toFixed(2) : 0;
      r.turnDeg = r.started ? +(r.turnDeg / r.started).toFixed(0) : 0;
      r.maxBallDist = +r.maxBallDist.toFixed(2); delete r._e; delete r.cut;
    }
    return { player: me.data.shortName, stars: me.data.skillMoves, dri: me.data.attrs.dri, defender: def.data.shortName, res };
  }, { trials, list });
  out.consoleErrors = logs.length;
  await browser.close();
  console.log(JSON.stringify(out, null, 1));
})().catch((e) => { console.error('SKILLTEST FAILURE', e); process.exit(1); });
