// Smoke test: boot the game, start a match, let it play, screenshot and report errors.
const { launch, startMatch } = require('./common');

(async () => {
  const file = process.argv[2] || '/projects/sandbox/Arena/ARENA-Jogar.html';
  const out = process.argv[3] || '/projects/sandbox/_work/shots/smoke';
  const t0 = Date.now();
  const { browser, page, logs } = await launch({ file });
  console.log('boot ready in', ((Date.now() - t0) / 1000).toFixed(1), 's');
  await page.screenshot({ path: out + '-menu.png' });
  await startMatch(page, {});
  const info = await page.evaluate(() => {
    const g = globalThis.__arena.game;
    return { actors: g.actors.length, phase: globalThis.__arena.store.get().hud.phase };
  });
  console.log('match started', info);
  for (let i = 0; i < 3; i++) {
    await page.waitForTimeout(4000);
    const st = await page.evaluate(() => {
      const s = globalThis.__arena.store.get();
      return { phase: s.hud.phase, fps: s.fps, simT: globalThis.__arena.game.simulationTime.toFixed(2) };
    });
    console.log('t+', (i + 1) * 4, 's', st);
    await page.screenshot({ path: `${out}-play${i}.png` });
  }
  console.log('--- console errors/warnings (' + logs.length + ')');
  for (const l of logs.slice(0, 30)) console.log(l.slice(0, 400));
  await browser.close();
})().catch((e) => {
  console.error('HARNESS FAILURE', e);
  process.exit(1);
});
