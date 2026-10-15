// Live match test: play, force a goal, trigger a new celebration via keyboard, go through replay and kickoff.
const { launch, startMatch } = require('./common');

(async () => {
  const file = process.argv[2];
  const out = process.argv[3];
  const key = process.argv[4] || 'Digit3';
  const { browser, page, logs } = await launch({ file, width: 960, height: 540 });
  await startMatch(page, { timeOfDay: 'tarde' });
  const forceScreen = () => page.evaluate(() => { const st = globalThis.__arena.store; if (st.get().screen !== 'match') st.set({ screen: 'match' }); });
  await page.waitForTimeout(1500);
  await forceScreen();
  await page.evaluate(() => globalThis.__arena.game.skip());
  const phase = () => page.evaluate(() => globalThis.__arena.store.get().hud.phase);
  const t0 = Date.now();
  while ((await phase()) !== 'play' && Date.now() - t0 < 60000) await page.waitForTimeout(500);
  console.log('phase after skip:', await phase());
  await page.waitForTimeout(6000);
  await forceScreen();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}-play.png` });
  // force a goal for home, scored by a home outfield player
  const scorer = await page.evaluate(() => {
    const g = globalThis.__arena.game;
    const p = g.actors.find((a) => a.side === 'home' && a.data.position !== 'GOL' && a.anim.visible);
    g.lastTouch = p;
    g.scoreGoal('home');
    return p.data.shortName;
  });
  console.log('goal by', scorer, 'phase', await phase());
  await page.waitForTimeout(1200);
  await page.keyboard.press(key);
  const picked = [];
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(900);
    const st = await page.evaluate(() => {
      const g = globalThis.__arena.game, c = g.arenaCeleb;
      return { phase: globalThis.__arena.store.get().hud.phase, picked: c && c.picked, pending: c && c.pending,
        action: c && c.scorer.anim.action, sad: g.actors.filter((a) => a.anim.action === 'sadCrouch').length,
        punho: g.actors.filter((a) => a.anim.action === 'celebPunho').length };
    });
    picked.push(st);
    await forceScreen();
    if (i < 4) await page.screenshot({ path: `${out}-celeb${i}.png` });
  }
  console.log(JSON.stringify(picked));
  // let replay / kickoff run
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(3000);
    console.log('later phase', await phase());
    if (i === 2) await page.screenshot({ path: `${out}-after.png` });
  }
  const health = await page.evaluate(() => {
    const g = globalThis.__arena.game;
    return { actors: g.actors.length, withAnim2: g.actors.filter((a) => a.model.anim2).length, fps: globalThis.__arena.store.get().fps };
  });
  console.log('health', health);
  console.log('--- console errors/warnings (' + logs.length + ')');
  for (const l of logs.slice(0, 20)) console.log(l.slice(0, 500));
  await browser.close();
})().catch((e) => { console.error('MATCHTEST FAILURE', e); process.exit(1); });
