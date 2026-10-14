// Measures how a probe bone moves (in the actor's frame: right/up/forward) when a bone is rotated
// +0.2 rad about a local axis, using either multiply (local) or premultiply (parent frame).
const { launch, startMatch } = require('./common');
const { installStudio } = require('./studio');

(async () => {
  const { browser, page } = await launch({ file: '/projects/sandbox/Arena/ARENA-Jogar.html', width: 400, height: 400 });
  await startMatch(page, {});
  await page.evaluate(installStudio);
  const out = await page.evaluate(() => {
    const S = globalThis.studio;
    const A = globalThis.__arena;
    S.use('field');
    S.reset({ speed: 0, heading: 0, moveDir: 0 });
    const r = S.actor.model;
    const names = ['Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head', 'LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand', 'RightShoulder', 'RightArm', 'RightForeArm', 'RightHand', 'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'LeftToeBase', 'RightUpLeg', 'RightLeg', 'RightFoot', 'RightToeBase'];
    const idx = Object.fromEntries(names.map((n, i) => [n, i]));
    const V = A.Vec3;
    const rootInv = () => r.root.matrixWorld.clone().invert();
    const posLocal = (b) => { r.root.updateWorldMatrix(true, true); const p = new V(); b.getWorldPosition(p); return p.applyMatrix4(rootInv()); };
    const Q = r.bones[0].quaternion.constructor;
    const axes = { X: new V(1, 0, 0), Y: new V(0, 1, 0), Z: new V(0, 0, 1) };
    const fmt = (d) => `L${d.x >= 0 ? '+' : ''}${(d.x * 100).toFixed(1)} U${d.y >= 0 ? '+' : ''}${(d.y * 100).toFixed(1)} F${d.z >= 0 ? '+' : ''}${(d.z * 100).toFixed(1)}`;
    const tests = [
      ['LeftShoulder', 'LeftArm'], ['RightShoulder', 'RightArm'],
      ['LeftHand', 'LeftHand', 'finger'], ['LeftArm', 'LeftHand'], ['RightArm', 'RightHand'],
      ['LeftForeArm', 'LeftHand'], ['RightForeArm', 'RightHand'],
      ['Hips', 'Head'], ['Spine', 'Head'], ['Spine2', 'Head'], ['Neck', 'Head', 'headtop'],
      ['LeftUpLeg', 'LeftFoot'], ['LeftFoot', 'LeftToeBase'],
    ];
    const lines = [];
    // root frame: x = actor's left? check
    const hl = posLocal(r.bones[idx.LeftHand]);
    lines.push('LeftHand at rest (actor frame, cm): ' + fmt(hl));
    const fingerBone = r.body.skeleton.bones.find((b) => /LeftHandIndex2/.test(b.name));
    for (const [bn, pn, kind] of tests) {
      const b = r.bones[idx[bn]];
      const probe = kind === 'finger' ? fingerBone : kind === 'headtop' ? null : r.bones[idx[pn]];
      for (const mode of ['mul', 'pre']) {
        const row = [];
        for (const [an, ax] of Object.entries(axes)) {
          const q0 = b.quaternion.clone();
          let p0, p1;
          if (kind === 'headtop') {
            // track a point 20cm above the head bone in head-local space
            const top = () => { r.root.updateWorldMatrix(true, true); const p = new V(0, 20, 0); b.children[0] ? 0 : 0; const hb = r.bones[idx.Head]; return hb.localToWorld(p.set(0, 20, 0)).applyMatrix4(rootInv()); };
            p0 = top();
            const dq = new Q().setFromAxisAngle(ax, 0.2);
            mode === 'mul' ? b.quaternion.multiply(dq) : b.quaternion.premultiply(dq);
            p1 = top();
          } else {
            p0 = posLocal(probe);
            const dq = new Q().setFromAxisAngle(ax, 0.2);
            mode === 'mul' ? b.quaternion.multiply(dq) : b.quaternion.premultiply(dq);
            p1 = posLocal(probe);
          }
          b.quaternion.copy(q0);
          row.push(`${an}: ${fmt(p1.clone().sub(p0))}`);
        }
        lines.push(`${bn.padEnd(13)} ${mode} -> ${(kind === 'finger' ? 'IndexFinger2' : kind === 'headtop' ? 'HeadTop' : pn).padEnd(12)} | ${row.join(' | ')}`);
      }
    }
    // hips position units: move hips y by -5 and check head drop
    const h0 = posLocal(r.bones[idx.Head]);
    r.bones[0].position.y -= 5;
    const h1 = posLocal(r.bones[idx.Head]);
    r.bones[0].position.y += 5;
    lines.push('Hips.position.y -= 5  => head moves ' + fmt(h1.clone().sub(h0)) + ' (cm in actor frame, root scale ' + r.root.scale.y.toFixed(3) + ')');
    r.bones[0].position.x += 5;
    const h2 = posLocal(r.bones[idx.Head]);
    r.bones[0].position.x -= 5;
    lines.push('Hips.position.x += 5  => head moves ' + fmt(h2.clone().sub(h0)));
    lines.push('finger bones: ' + r.body.skeleton.bones.filter((b) => /Hand.+\d/.test(b.name)).map((b) => b.name.replace('mixamorig', '')).join(','));
    return lines.join('\n');
  });
  console.log(out);
  await browser.close();
})().catch((e) => { console.error('CALIB FAILURE', e); process.exit(1); });
