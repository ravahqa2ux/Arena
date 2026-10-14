// Motion 2.3: linguagem corporal em partida IA × IA com o animador rodando (60 Hz).
// Conta gestos iniciados por tipo, lamentos após chute para fora e ações de lamento presas em jogo.
//
//   SEED=n node socialtest.js <html> [segundos] [partidas] [cfgJSON]
const { launch } = require('./common');

(async () => {
  const file = process.argv[2], seconds = +(process.argv[3] || 120), matches = +(process.argv[4] || 2);
  const cfg = process.argv[5] ? JSON.parse(process.argv[5]) : null;
  const seed = +(process.env.SEED || 11);
  const { browser, page, logs } = await launch({ file, width: 320, height: 240 });
  const out = await page.evaluate(async (c) => {
    globalThis.__anim2cfg = c.cfg;
    const A = globalThis.__arena, g = A.game, store = A.store;
    g.running = false;
    cancelAnimationFrame(g.frame);
    const agg = { simSeconds: 0, starts: {}, sad: 0, stuckSadInPlay: 0, errors: 0, nan: 0, goals: 0, passes: 0, shots: 0,
      gestFramesPlay: 0, framesPlay: 0, gestMaxSameTeam: 0, phases: {} };
    const CX = 1 / 120;
    for (let m = 0; m < c.matches; m++) {
      store.set({ selection: { homeTeamId: 'bra', awayTeamId: 'arg', homeKit: 'home', awayKit: 'home' } });
      g.startMatch();
      g.rng = new g.rng.constructor((c.seed + m * 7919) >>> 0);
      g.humanSides = []; g.currentHumanSide = null;
      try { g.skip(); } catch (e) {}
      store.set({ hud: { ...store.get().hud, phase: 'play' } });
      if (!g.restart && !g.owner) { try { g.startKickoff(); } catch (e) {} }
      const prev = new Map();
      let shotOn = false, flight = false;
      const steps = Math.round(c.seconds / CX);
      for (let i = 0; i < steps; i++) {
        try { g.step(CX); } catch (e) { agg.errors++; agg.firstError = String(e).slice(0, 200); break; }
        if (g.shotFlight && !shotOn) agg.shots++;
        shotOn = !!g.shotFlight;
        if (g.passFlight && !flight) agg.passes++;
        flight = !!g.passFlight;
        if (i % 2) continue;
        const st = store.get(), ph = st.hud.phase;
        agg.phases[ph] = (agg.phases[ph] || 0) + 1;
        if (st.hud.paused || ['halftime', 'fulltime'].includes(ph)) { if (ph === 'halftime') try { g.startKickoff(); } catch (e) {} continue; }
        g.time += 1 / 60;
        try { for (const a of g.actors) __anim2.feed(a, st, g), a.model.update(a.anim, 1 / 60); } catch (e) { agg.errors++; agg.firstError = String(e).slice(0, 200); }
        const cnt = { home: 0, away: 0 };
        for (const a of g.actors) {
          const gs = a.__a2g, on = !!(gs && gs.until > g.time);
          if (on && !prev.get(a)) agg.starts[gs.kind + '@' + ph] = (agg.starts[gs.kind + '@' + ph] || 0) + 1;
          prev.set(a, on);
          if (on) cnt[a.side]++;
          if (a.__a2sadEnd && !a.__a2sadSeen) { agg.sad++; a.__a2sadSeen = 1; }
          if (!a.__a2sadEnd) a.__a2sadSeen = 0;
          if (ph === 'play' && (a.anim.action === 'handsOnHead' || a.anim.action === 'handsOnHips')) agg.stuckSadInPlay++;
          if (!isFinite(a.anim.x)) agg.nan++;
          const b = a.model.bones[0].quaternion;
          if (!isFinite(b.x + b.y + b.z + b.w)) agg.nan++;
        }
        if (ph === 'play') { agg.framesPlay++; if (cnt.home + cnt.away) agg.gestFramesPlay++; }
        agg.gestMaxSameTeam = Math.max(agg.gestMaxSameTeam, cnt.home, cnt.away);
      }
      agg.goals += (g.scores || [0, 0])[0] + (g.scores || [0, 0])[1];
      agg.simSeconds += c.seconds;
    }
    agg.gestPctPlay = +((100 * agg.gestFramesPlay) / Math.max(1, agg.framesPlay)).toFixed(1);
    return agg;
  }, { seconds, matches, seed, cfg });
  out.consoleErrors = logs.filter((l) => /error/i.test(l)).length;
  out.logs = logs.slice(0, 5);
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})().catch((e) => { console.error('SOCIAL FAILURE', e); process.exit(1); });
