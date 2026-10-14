// Input devices test: emulated gamepad (navigator.getGamepads) and real touch events (CDP) driving the
// actual game input code: stick movement, RS gestures for dribbles, R3, touch joystick and touch buttons.
// It is an emulation: it validates the game's input paths, not physical hardware.
//
//   node devtest.js <html>
const fs = require('fs');
const { chromium, CHROME } = require('./common');
const HOME = '/projects/sandbox/_work/home';

async function boot(file, ctxOpts) {
  const browser = await chromium.launch({
    executablePath: CHROME, headless: true, env: { ...process.env, HOME },
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio'],
  });
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  await page.addInitScript(() => {
    globalThis.ARENA_DEBUG_HOOK = true;
    // controle virtual no padrão "standard" (17 botões, 4 eixos)
    const pad = { id: 'ARENA virtual pad (standard)', index: 0, connected: true, mapping: 'standard', timestamp: 0,
      axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })) };
    globalThis.__vpad = pad;
    if (globalThis.__wantPad !== false) navigator.getGamepads = () => [pad, null, null, null];
  });
  await page.goto('file://' + file, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => globalThis.__arena && globalThis.__arena.store.get().boot.ready, null, { timeout: 240000, polling: 500 });
  // a tela de boot troca para "title" com atraso; espera para a navegação não ser sobrescrita
  await page.waitForFunction(() => globalThis.__arena.store.get().screen === 'title', null, { timeout: 60000, polling: 250 }).catch(() => {});
  return { browser, page, logs };
}

// in-page helpers: start a match for "home" with the given device and freeze the clock loop
const SETUP = (device) => {
  const A = globalThis.__arena, g = A.game, store = A.store;
  store.set({ settings: { ...store.get().settings, quality: 'baixa' } });
  const cs = device === 'pad' ? { keyboard: 'away', touch: null, pad0: 'home' } : { keyboard: 'away', touch: 'home' };
  store.set({ controllerSides: cs });
  g.startMatch(); store.get().go('match'); if (store.get().screen !== 'match') store.set({ screen: 'match' });
  return true;
};
const PREP = () => {
  const A = globalThis.__arena, g = A.game, store = A.store;
  g.running = false; cancelAnimationFrame(g.frame);
  try { g.skip(); } catch (e) {}
  store.set({ hud: { ...store.get().hud, phase: 'play', restart: null, paused: false }, inputMode: 'game' });
  g.restart = null;
  const me = g.actors.filter((a) => a.side === 'home' && a.data.position !== 'GOL').sort((a, b) => b.data.skillMoves - a.data.skillMoves)[0];
  for (const a of g.actors) if (a !== me) { a.anim.x = (a.side === 'home' ? -30 : 30) + (Math.random() - 0.5) * 8; a.anim.z = (Math.random() - 0.5) * 40; a.vx = a.vz = 0; }
  me.anim.x = 0; me.anim.z = 0; me.anim.heading = Math.PI / 2; me.vx = me.vz = 0; me.anim.action = null; me.skillTimer = 0;
  g.owner = me; g.selected.home = me; g.ball.set(0.45, 0.11, 0); g.ballVelocity.set(0, 0, 0);
  globalThis.__me = me;
  // stick (sx, sy) que produz a direção local (lat=esquerda, fwd) do jogador, invertendo screenDirection
  globalThis.__stick = (lat, fwd) => {
    const h = me.anim.heading;
    const dx = lat * Math.cos(h) + fwd * Math.sin(h), dz = -lat * Math.sin(h) + fwd * Math.cos(h);
    const a = g.screenDirection(1, 0), b = g.screenDirection(0, 1);
    const det = a.x * b.z - b.x * a.z || 1;
    return { sx: (dx * b.z - b.x * dz) / det, sy: (a.x * dz - dx * a.z) / det };
  };
  return { name: me.data.shortName, stars: me.data.skillMoves, humanSides: g.humanSides };
};

(async () => {
  const file = process.argv[2];
  const report = { pad: {}, touch: {} };

  // ------------------------------------------------------------------ gamepad
  {
    const { browser, page, logs } = await boot(file, { viewport: { width: 480, height: 270 } });
    await page.evaluate(SETUP, 'pad');
    await page.waitForFunction(() => globalThis.__arena.game.actors.length > 0, null, { timeout: 120000 });
    report.pad.player = await page.evaluate(PREP);
    report.pad.results = await page.evaluate(() => {
      const g = globalThis.__arena.game, pad = globalThis.__vpad, me = globalThis.__me, dt = 1 / 60, out = {};
      const calls = []; const ps = g.performSkill.bind(g);
      g.performSkill = (side, id, sd) => { calls.push([id, sd, me.anim.action, +me.skillTimer.toFixed(2), g.owner === me, +me.anim.speed.toFixed(1), globalThis.__arena.store.get().hud.phase]); return ps(side, id, sd); };
      out.calls = calls;
      const step = (n) => { for (let i = 0; i < n; i++) { pad.timestamp++; g.step(dt); } };
      const ls = (lat, fwd) => { const s = globalThis.__stick(lat, fwd); pad.axes[0] = s.sx; pad.axes[1] = -s.sy; };
      const rs = (lat, fwd) => { if (!lat && !fwd) { pad.axes[2] = pad.axes[3] = 0; return; } const s = globalThis.__stick(lat, fwd); const m = Math.hypot(s.sx, s.sy) || 1; pad.axes[2] = s.sx / m; pad.axes[3] = -s.sy / m; };
      const keepBall = () => { if (g.owner !== me) { g.owner = me; g.ball.set(me.anim.x + Math.sin(me.anim.heading) * 0.45, 0.11, me.anim.z + Math.cos(me.anim.heading) * 0.45); g.ballVelocity.set(me.vx, 0, me.vz); } };
      const reset = () => { pad.axes = [0, 0, 0, 0]; for (const b of pad.buttons) b.pressed = false, b.value = 0; step(40);
        me.anim.action = null; me.skillTimer = 0; g.skills.clear(); me.anim.x = 0; me.anim.z = 0; me.anim.heading = Math.PI / 2; me.vx = me.vz = 0;
        for (const a of g.actors) if (a !== me && Math.hypot(a.anim.x, a.anim.z) < 15) { a.anim.x = a.side === 'home' ? -30 : 30; }
        g.owner = null; keepBall(); step(1); };
      const watch = (n, ids) => { let seen = null; for (let i = 0; i < n; i++) { step(1); if (!seen && ids.includes(me.anim.action)) seen = me.anim.action; } return seen; };
      const runUp = () => { ls(0, 1); for (let i = 0; i < 70; i++) { step(1); keepBall(); } };
      // 1) LS move
      reset(); ls(0, 1); const x0 = me.anim.x; for (let i = 0; i < 60; i++) { step(1); keepBall(); }
      out.lsSpeed = +me.anim.speed.toFixed(2); out.lsMoved = +(Math.hypot(me.anim.x - x0, me.anim.z)).toFixed(2);
      // 2) RS flicks (2 strokes): ↖↖ corte seco (correndo)
      const flick2 = (a, b) => { for (const [l, f] of [a, b]) { rs(l, f); step(4); rs(0, 0); step(4); } };
      const D = Math.SQRT1_2;
      reset(); runUp(); flick2([D, D], [D, D]); out.corteSeco = watch(20, ['corteSeco']);
      reset(); runUp(); flick2([-D, D], [D, D]); out.pedaladaDupla = watch(20, ['pedaladaDupla']);
      reset(); runUp(); flick2([0, -1], [0, -1]); out.paraArranca = watch(20, ['paraArranca']);
      // 3) RS rotation (original): ↑ ↖ ← = pedalada
      reset(); out.diag = []; for (let i = 0; i < 6; i++) { step(1); out.diag.push([g.owner === me, g.owner && g.owner.data.shortName, +g.ball.x.toFixed(2), +g.ball.z.toFixed(2), +g.ball.y.toFixed(2), +me.anim.x.toFixed(2), me.anim.action, g.restart && g.restart.kind]); }
      for (const [l, f] of [[0, 1], [D, D], [1, 0]]) { rs(l, f); step(3); } rs(0, 0); out.pedalada = watch(20, ['pedalada']);
      // 4) R3 parado = pulinho
      reset(); ls(0, 0); step(30); pad.buttons[11].pressed = true; pad.buttons[11].value = 1; out.pulinhoR3 = watch(10, ['pulinho']); pad.buttons[11].pressed = false;
      // 5) A = passe (botão 0, segurar e soltar)
      reset(); pad.buttons[0].pressed = true; step(8); pad.buttons[0].pressed = false; out.passA = watch(30, ['pass']);
      // 6) Motion 2.4: dribles novos por flick (parado)
      reset(); step(10); flick2([D, -D], [-D, -D]); out.elasticoReverso = watch(20, ['elasticoReverso']);
      reset(); step(10); flick2([-D, -D], [D, D]); out.elasticoTriplo = watch(20, ['elasticoTriplo']);
      reset(); step(10); flick2([0, -1], [D, D]); out.berbaSpin = watch(20, ['berbaSpin']);
      // 7) Gameplay 2.2: trivela (LT + A / LT + B), cruzamento antecipado (LB + X) e rasteiro (LB + RB + X)
      const kick = (btns, main) => {
        reset(); ls(0, 0); step(20);
        for (const b of btns) pad.buttons[b].pressed = true;
        let sp = null, vy = null, rel = false;
        const pk0 = g.releaseKick.bind(g);
        g.releaseKick = () => { const pk = g.pendingKick; sp = pk && pk.special; pk0(); vy = +g.ballVelocity.y.toFixed(2); rel = +g.ballSpin.y.toFixed(2); };
        pad.buttons[main].pressed = true; step(10); pad.buttons[main].pressed = false; step(1);
        for (const b of btns) pad.buttons[b].pressed = false;
        for (let i = 0; i < 60 && vy === null; i++) step(1);
        g.releaseKick = pk0;
        return { special: sp, liftVy: vy, spinY: rel, anim: me.anim.action, trivelaFlag: me.anim.trivela };
      };
      out.trivelaPass = kick([6], 0);
      out.trivelaShot = kick([6], 1);
      out.earlyCross = kick([4], 2);
      out.groundCross = kick([4, 5], 2);
      out.normalCross = kick([], 2);
      out.skillsTelemetry = g.telemetry.skills;
      out.state = { owner: g.owner === me, action: me.anim.action, phase: globalThis.__arena.store.get().hud.phase, restart: !!g.restart, x: +me.anim.x.toFixed(1) };
      return out;
    });
    report.pad.consoleErrors = logs.length; report.pad.logs = logs.slice(0, 5);
    await browser.close();
  }

  // ------------------------------------------------------------------ touch (real CDP touch events)
  {
    const { browser, page, logs } = await boot(file, { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
    await page.evaluate(() => { globalThis.__wantPad = false; navigator.getGamepads = () => []; });
    report.touch.coarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches);
    await page.evaluate(SETUP, 'touch');
    await page.waitForFunction(() => globalThis.__arena.game.actors.length > 0, null, { timeout: 120000 });
    report.touch.player = await page.evaluate(PREP);
    for (let i = 0; i < 40; i++) {
      await page.evaluate(() => { const st = globalThis.__arena.store; st.set({ hud: { ...st.get().hud, phase: 'play', paused: false, replay: false } }); });
      await page.waitForTimeout(500);
      const e = await page.$('[data-testid="touch-skill"]');
      if (e && (await e.boundingBox())) break;
    }
    report.touch.phaseNow = await page.evaluate(() => globalThis.__arena.store.get().hud.phase);
    const hasOverlay = await page.$('[data-testid="overlay-touch"]');
    report.touch.overlay = !!hasOverlay;
    report.touch.dbg = await page.evaluate(() => { const st = globalThis.__arena.store.get(); return { screen: st.screen, hud: { phase: st.hud.phase, paused: st.hud.paused, replay: st.hud.replay }, cs: st.controllerSides, ctx: st.matchContext && st.matchContext.humanSides, ids: [...document.querySelectorAll('[data-testid]')].map((e) => e.dataset.testid).slice(0, 40) }; });
    const cdp = await page.context().newCDPSession(page);
    const box = async (sel) => { const e = await page.$(sel); return e ? await e.boundingBox() : null; };
    const stepN = (n) => page.evaluate((n) => { const g = globalThis.__arena.game; for (let i = 0; i < n; i++) g.step(1 / 60); }, n);
    const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
    // joystick: arrasta para a direita da tela
    const jb = await box('[data-testid="touch-joystick"]');
    report.touch.boxes = { jb, sb: await box('[data-testid="touch-skill"]'), vis: await page.evaluate(() => { const e = document.querySelector('[data-testid="touch-skill"]'); if (!e) return null; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return [r.x, r.y, r.width, r.height, cs.visibility, cs.display, cs.opacity]; }) };
    if (jb) {
      const cx = jb.x + 80, cy = jb.y + jb.height - 80;
      await touch('touchStart', cx, cy); await touch('touchMove', cx + 40, cy); await touch('touchMove', cx + 70, cy - 10);
      report.touch.joyInput = await page.evaluate(() => [+globalThis.__arena.game.touchX.toFixed(2), +globalThis.__arena.game.touchY.toFixed(2)]);
      await stepN(40);
      report.touch.joySpeed = await page.evaluate(() => +globalThis.__me.anim.speed.toFixed(2));
      await touch('touchEnd');
    }
    // botão Drible (segura 3 passos e solta)
    const sb = await box('[data-testid="touch-skill"]');
    if (sb) {
      await page.evaluate(() => { const g = globalThis.__arena.game, me = globalThis.__me; me.anim.action = null; me.skillTimer = 0; g.skills.clear(); g.owner = me; me.vx = me.vz = 0; });
      const k0 = await page.evaluate(() => globalThis.__arena.game.telemetry.skills);
      await touch('touchStart', sb.x + sb.width / 2, sb.y + sb.height / 2);
      report.touch.skillPressed = await page.evaluate(() => !!globalThis.__arena.game.touchState.skill);
      await stepN(3); await touch('touchEnd'); await stepN(2);
      report.touch.skillAction = await page.evaluate(() => globalThis.__me.anim.action);
      report.touch.skillCount = (await page.evaluate(() => globalThis.__arena.game.telemetry.skills)) - k0;
    }
    report.touch.consoleErrors = logs.length; report.touch.logs = logs.slice(0, 5);
    await browser.close();
  }
  console.log(JSON.stringify(report, null, 1));
})().catch((e) => { console.error('DEVTEST FAILURE', e); process.exit(1); });
