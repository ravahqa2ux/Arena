// Head stability during a sprint: std-dev / range of head pitch & roll in world space, plus anim2 state.
const { launch, startMatch } = require('./common');
const { installStudio } = require('./studio');
(async () => {
  const file = process.argv[2];
  const { browser, page } = await launch({ file, width: 300, height: 300 });
  await startMatch(page, {});
  await page.evaluate(installStudio);
  const out = await page.evaluate(() => {
    const S = globalThis.studio, A = globalThis.__arena, V = A.Vec3;
    S.gait = (v) => { const h = S.actor.data.height / 100; const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }; const t = sm(1.5, 3.8, v); return Math.min(2.25, v / ((1.25 + 1.9 * t + Math.max(0, v - 4) * 0.24) * (h / 1.8))); };
    S.use('field');
    const res = {};
    for (const [name, v, turn] of [['sprint', 7.4, 0], ['corrida', 5.5, 0], ['curva', 6, 1.6]]) {
      S.reset({ speed: v, heading: 0, moveDir: 0 });
      const drive = (a, dt) => { a.speed = v; a.turn = turn; a.heading += turn * dt; a.moveDir = a.heading; a.x += Math.sin(a.heading) * v * dt; a.z += Math.cos(a.heading) * v * dt; a.gaitPhase = (a.gaitPhase + S.gait(v) * dt) % 1; };
      S.advance(60, drive);
      const head = S.actor.model.bones[5];
      const Q = head.quaternion.constructor;
      const pitch = [], roll = [];
      for (let i = 0; i < 90; i++) {
        S.advance(1, drive);
        S.actor.model.root.updateWorldMatrix(true, true);
        const q = head.getWorldQuaternion(new Q());
        const up = new V(0, 1, 0).applyQuaternion(q);
        // express in actor frame (heading)
        const h = S.actor.anim.heading, fx = Math.sin(h), fz = Math.cos(h);
        const fwd = up.x * fx + up.z * fz, side = up.x * fz - up.z * fx;
        pitch.push(Math.atan2(fwd, up.y) * 57.3);
        roll.push(Math.atan2(side, up.y) * 57.3);
      }
      const st = (a) => { const m = a.reduce((x, y) => x + y, 0) / a.length; return { mean: +m.toFixed(1), sd: +Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length).toFixed(2), range: +(Math.max(...a) - Math.min(...a)).toFixed(1) }; };
      res[name] = { pitch: st(pitch), roll: st(roll) };
    }
    const s = S.actor.model.anim2;
    res.anim2 = s ? { clock: +s.clock.toFixed(2), lean: +s.lean.toFixed(2), elbow: +s.elbow.toFixed(2), headC: +s.headC.toFixed(2), ex: +s.ex.toFixed(2) } : null;
    return JSON.stringify(res);
  });
  console.log(out);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
