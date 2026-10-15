// Motion 2.4: em fps baixo (este ambiente roda a 1–5 fps), o relógio da animação acompanha o jogo?
// Mede, no loop real do jogo, tempo passado ao animador ÷ tempo de simulação, e quantas vezes a camada
// procedural foi "resetada" (molas zeradas) por deslocamento grande entre quadros.
//   node dttest.js <html> [segundos] [cfgJSON]
const { launch, startMatch } = require('./common');
(async () => {
  const file = process.argv[2], secs = +(process.argv[3] || 25), cfg = process.argv[4] ? JSON.parse(process.argv[4]) : null;
  const { browser, page, logs } = await launch({ file, width: 640, height: 360 });
  await page.evaluate((c) => { globalThis.__anim2cfg = c; }, cfg);
  await startMatch(page, { timeOfDay: 'tarde' });
  await page.evaluate(() => {
    const g = globalThis.__arena.game, st = globalThis.__arena.store;
    try { g.skip(); } catch (e) {}
    const M = { anim: 0, sim: 0, frames: 0, real: 0 };
    globalThis.__dtm = M;
    const a0 = g.actors[3], up = a0.model.update.bind(a0.model);
    a0.model.update = (an, dt) => { M.anim += dt; M.frames++; return up(an, dt); };
    const s0 = g.step.bind(g);
    g.step = (dt) => { if (st.get().hud.phase === 'play') M.sim += dt; return s0(dt); };
    for (const a of g.actors) { const s = a.model.anim2; if (!s) continue; const r0 = s.hasPrev; }
    const t0 = performance.now(); M.t0 = t0;
  });
  await page.waitForTimeout(secs * 1000);
  const out = await page.evaluate(() => {
    const M = globalThis.__dtm; M.real = (performance.now() - M.t0) / 1000;
    M.fps = +(M.frames / M.real).toFixed(1);
    M.animOverSim = +(M.anim / Math.max(1e-6, M.sim)).toFixed(2);
    M.animOverReal = +(M.anim / M.real).toFixed(2);
    M.phase = globalThis.__arena.store.get().hud.phase;
    return M;
  });
  out.consoleErrors = logs.length;
  console.log(JSON.stringify(out));
  await browser.close();
})().catch((e) => { console.error('DT FAILURE', e); process.exit(1); });
