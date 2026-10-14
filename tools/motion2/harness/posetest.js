// Renders ad-hoc upper-body poses (front view) to tune keyframes quickly.
const fs = require('fs');
const { launch, startMatch } = require('./common');
const { installStudio } = require('./studio');
(async () => {
  const [file, out, posesJson] = process.argv.slice(2);
  const poses = JSON.parse(fs.readFileSync(posesJson, 'utf8'));
  const { browser, page } = await launch({ file, width: 1000, height: 1000 });
  await startMatch(page, { timeOfDay: 'tarde' });
  await page.evaluate(installStudio);
  const url = await page.evaluate((poses) => {
    const S = globalThis.studio, gf = __arena.clips;
    S.use('field');
    const cols = Math.min(6, poses.length), rows = Math.ceil(poses.length / cols) * 2;
    S.beginSheet(cols, rows, 220, 300);
    const le = (t, b) => ({ t, b });
    const shots = [];
    poses.forEach((p, i) => {
      const id = 'tmpPose' + i;
      gf[id] = { dur: 2, upperOnly: true, fadeIn: 0.05, fadeOut: 0.05, keys: [le(0, p.b), le(2, p.b)] };
      shots.push(id);
    });
    for (const [vi, view] of [[0, { yaw: -Math.PI / 2, dist: 2.6, target: 1.25, height: 1.35 }], [1, { yaw: -0.25, dist: 2.6, target: 1.25, height: 1.35 }]]) {
      poses.forEach((p, i) => {
        S.reset({ speed: 0 });
        S.play(shots[i]);
        let t = 0;
        S.advance(40, (a, dt) => { t += dt; a.actionT = Math.min(1, t); });
        S.sheet.i = (Math.floor(i / cols) * 2 + vi) * cols + (i % cols);
        S.snap(Object.assign({ label: vi ? '' : p.name }, view));
      });
    }
    return S.endSheet();
  }, poses);
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
