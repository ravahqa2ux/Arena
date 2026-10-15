// Animation studio: freezes the match simulation, isolates one player and renders
// deterministic contact sheets of locomotion / actions straight from the game's animator.
//
//   node studio.js <html> <outPrefix> [sceneName,sceneName,...]
const fs = require('fs');
const { launch, startMatch } = require('./common');

// ---------------------------------------------------------------------------------------------
// In-page studio runtime (serialized into the page).
function installStudio() {
  const A = globalThis.__arena;
  const g = A.game;
  g.running = false;
  cancelAnimationFrame(g.frame);
  const st = document.createElement('style');
  st.textContent = '#root *{visibility:hidden!important} #root canvas{visibility:visible!important}';
  document.head.appendChild(st);
  for (const k of ['crowd', 'weather']) if (g[k] && g[k].mesh) g[k].mesh.visible = false;
  if (g.crowd) g.crowd.mesh.visible = false;
  if (g.weather) g.weather.group.visible = false;
  if (g.boards) g.boards.group.visible = false;
  if (g.stadium) g.stadium.group.visible = false;
  if (g.ballView) g.ballView.group.visible = false;
  if (g.shadows) g.shadows.mesh.visible = false;
  for (const m of g.markers || []) if (m && m.visible !== undefined) m.visible = false;
  const outfield = g.actors.find((a) => a.side === 'home' && a.data.position !== 'GOL');
  const keeper = g.actors.find((a) => a.data.position === 'GOL');
  const S = {
    g,
    outfield,
    keeper,
    actor: outfield,
    use(which) {
      this.actor = which === 'gk' ? keeper : outfield;
      for (const a of g.actors) {
        a.anim.visible = a === this.actor;
        a.model.update(a.anim, 1 / 60);
      }
    },
    reset(fields = {}) {
      const a = this.actor.anim;
      Object.assign(a, {
        x: 0, y: 0, z: 0, heading: Math.PI / 2, moveDir: Math.PI / 2, speed: 0, accel: 0, turn: 0,
        action: null, actionT: 0, actionSide: 1, stance: 'none', lookW: 0, touchT: 9, receiveT: 9,
        duelT: 9, footTargetW: 0, dribble: 0, plantW: 0, hold: 0, visible: true,
        calm: 0, fatigue: 0, lookX: 0, lookY: 1, lookZ: 60,
      }, fields);
      // let the animator's internal damped state settle
      for (let i = 0; i < 90; i++) this.actor.model.update(a, 1 / 60);
    },
    play(id, side = 1) {
      const a = this.actor.anim;
      a.action = id; a.actionSide = side; a.actionT = 0; a.actionRate = 1; a.actionSeq++;
    },
    // Advance the animator `n` frames at 60 Hz, applying `drive(anim, dt, t)` before each update.
    advance(n, drive) {
      const a = this.actor.anim;
      const dt = 1 / 60;
      for (let i = 0; i < n; i++) {
        this.time = (this.time || 0) + dt;
        if (drive) drive(a, dt, this.time);
        this.actor.model.update(a, dt);
      }
    },
    sheet: null,
    beginSheet(cols, rows, cw, ch) {
      const c = document.createElement('canvas');
      c.width = cols * cw; c.height = rows * ch;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#111'; ctx.fillRect(0, 0, c.width, c.height);
      this.sheet = { c, ctx, cols, rows, cw, ch, i: 0 };
    },
    // Render one frame with the camera orbiting the actor; crop to the actor and paste in the sheet.
    snap({ yaw = 0, dist = 4.2, height = 1.0, target = 0.9, fov = 34, label = '' } = {}) {
      const a = this.actor.anim;
      const cam = g.camera;
      const ang = a.heading + Math.PI / 2 + yaw; // default: side view (actor's right side)
      cam.fov = fov;
      cam.position.set(a.x + Math.sin(ang) * dist, height, a.z + Math.cos(ang) * dist);
      cam.lookAt(a.x, target, a.z);
      cam.updateProjectionMatrix();
      g.renderer.render(1 / 60, 0, 0);
      const src = g.renderer.canvas;
      const sh = this.sheet;
      const W = src.width, H = src.height;
      const cropH = H * 0.92, cropW = cropH * (sh.cw / sh.ch);
      const sx = (W - cropW) / 2, sy = (H - cropH) / 2;
      const dx = (sh.i % sh.cols) * sh.cw, dy = Math.floor(sh.i / sh.cols) * sh.ch;
      sh.ctx.drawImage(src, sx, sy, cropW, cropH, dx, dy, sh.cw, sh.ch);
      if (label) {
        sh.ctx.font = 'bold 15px sans-serif';
        sh.ctx.fillStyle = 'rgba(0,0,0,.55)';
        sh.ctx.fillRect(dx, dy, sh.ctx.measureText(label).width + 10, 20);
        sh.ctx.fillStyle = '#ffeb3b';
        sh.ctx.fillText(label, dx + 5, dy + 15);
      }
      sh.i++;
    },
    endSheet() {
      return this.sheet.c.toDataURL('image/png');
    },
  };
  globalThis.studio = S;
  return { outfield: outfield.data.shortName, keeper: keeper.data.shortName, h: outfield.data.height };
}

// ---------------------------------------------------------------------------------------------
// Scenes. Each runs in the page with `S` = studio; it must return a dataURL.
const scenes = {
  // Gait cycles at several speeds (side view): one row per speed, 8 frames per cycle.
  locomotion: `(() => {
    const rows = [['parado',0],['andar',1.5],['trote',3.4],['corrida',5.6],['pique',7.6]];
    S.use('field'); S.beginSheet(8, rows.length, 200, 300);
    for (const [name, v] of rows) {
      S.reset({ speed: v });
      const T0 = __arena.makeAnim ? null : null;
      // advance one second at this speed to settle blends, moving forward
      const drive = (a, dt) => { a.speed = v; a.accel = 0; a.turn = 0; a.x += Math.sin(a.heading) * v * dt; a.z += Math.cos(a.heading) * v * dt;
        a.gaitPhase = (a.gaitPhase + S.gait(v) * dt) % 1; };
      S.advance(60, drive);
      const cyc = v > 0 ? 1 / S.gait(v) : 2.0;
      for (let k = 0; k < 8; k++) { S.advance(Math.max(1, Math.round(cyc * 60 / 8)), drive); S.snap({ label: k === 0 ? name : '' }); }
    }
    return S.endSheet();
  })()`,
  // Starts, stops and cuts (3/4 view).
  transitions: `(() => {
    S.use('field'); S.beginSheet(8, 3, 200, 300);
    // 1) explosive start from standstill to sprint
    S.reset({ speed: 0 });
    let v = 0;
    const accelDrive = (a, dt) => { const nv = Math.min(7.6, v + 6.5 * dt); a.accel = (nv - v) / dt; v = nv; a.speed = v; a.turn = 0;
      a.x += Math.sin(a.heading) * v * dt; a.z += Math.cos(a.heading) * v * dt; a.gaitPhase = (a.gaitPhase + S.gait(v) * dt) % 1; };
    for (let k = 0; k < 8; k++) { S.advance(9, accelDrive); S.snap({ label: k ? '' : 'arrancada', yaw: -0.5 }); }
    // 2) hard stop from sprint
    S.reset({ speed: 7.4 }); v = 7.4;
    const run = (a, dt) => { a.speed = v; a.accel = 0; a.x += Math.sin(a.heading) * v * dt; a.z += Math.cos(a.heading) * v * dt; a.gaitPhase = (a.gaitPhase + S.gait(v) * dt) % 1; };
    S.advance(60, run);
    const stopDrive = (a, dt) => { const nv = Math.max(0, v - 11 * dt); a.accel = (nv - v) / dt; v = nv; a.speed = v; a.turn = 0;
      a.x += Math.sin(a.heading) * v * dt; a.z += Math.cos(a.heading) * v * dt; a.gaitPhase = (a.gaitPhase + S.gait(v) * dt) % 1; };
    for (let k = 0; k < 8; k++) { S.advance(8, stopDrive); S.snap({ label: k ? '' : 'freada', yaw: -0.5 }); }
    // 3) sharp cut: running then turning 100 deg in ~0.35 s
    S.reset({ speed: 6 }); v = 6;
    S.advance(45, run);
    let turnLeft = 1.75;
    const cut = (a, dt) => { const w = turnLeft > 0 ? 5.0 : 0; const d = Math.min(turnLeft, w * dt); turnLeft -= d; a.turn = d / dt; a.heading += d; a.moveDir = a.heading;
      v = Math.max(4.2, v - (w ? 6 : -3) * dt); a.speed = v; a.accel = w ? -6 : 3; a.x += Math.sin(a.heading) * v * dt; a.z += Math.cos(a.heading) * v * dt; a.gaitPhase = (a.gaitPhase + S.gait(v) * dt) % 1; };
    for (let k = 0; k < 8; k++) { S.advance(6, cut); S.snap({ label: k ? '' : 'corte', yaw: -0.4 }); }
    return S.endSheet();
  })()`,
  idle: `(() => {
    S.use('field'); S.beginSheet(8, 2, 200, 300);
    S.reset({ speed: 0 });
    for (let k = 0; k < 8; k++) { S.advance(30); S.snap({ label: k ? '' : 'idle frente', yaw: -Math.PI / 2, dist: 3.6 }); }
    S.reset({ speed: 0, stance: 'gk' });
    for (let k = 0; k < 8; k++) { S.advance(30); S.snap({ label: k ? '' : 'idle lado', dist: 3.6 }); }
    return S.endSheet();
  })()`,
};

// action scenes: one row per action, 8 evenly spaced frames across its duration
function actionScene(list, who = 'field', view = {}) {
  return `(() => {
    const list = ${JSON.stringify(list)};
    S.use('${who}'); S.beginSheet(8, list.length, 200, 300);
    for (const [id, cfg] of list) {
      S.reset(Object.assign({ speed: 0 }, cfg.anim || {}));
      const dur = __arena.clips[id].dur * (cfg.span || 1);
      S.play(id, cfg.side || 1);
      let t = 0;
      const drive = (a, dt) => { t += dt; a.actionT = t; if (cfg.anim && cfg.anim.speed) { a.x += Math.sin(a.heading) * a.speed * dt; a.z += Math.cos(a.heading) * a.speed * dt; a.gaitPhase = (a.gaitPhase + S.gait(a.speed) * dt) % 1; }
        if (!__arena.clips[id].loop && t > __arena.clips[id].dur) a.action = null; };
      for (let k = 0; k < 8; k++) {
        S.advance(Math.max(1, Math.round((dur / 8) * 60)), drive);
        S.snap(Object.assign({ label: k ? '' : id }, ${JSON.stringify(view)}, cfg.view || {}));
      }
    }
    return S.endSheet();
  })()`;
}
scenes.kicks = actionScene([
  ['kick', {}], ['pass', {}], ['cross', {}], ['chip', {}], ['volley', {}],
], 'field', { yaw: -0.35 });
scenes.contact = actionScene([
  ['header', {}], ['tackle', {}], ['slide', {}], ['chestControl', {}], ['stumble', {}],
], 'field', { yaw: -0.35 });
scenes.gk = actionScene([
  ['gkDiveLow', { side: 1 }], ['gkDiveHigh', { side: 1 }], ['gkCatch', {}], ['gkJump', {}], ['gkThrow', {}],
], 'gk', { yaw: -Math.PI / 2, dist: 5.2 });
scenes.gkcatch = actionScene([
  ['gkCatch', {}], ['gkCatch', { view: { yaw: -Math.PI / 2, dist: 4.4 } }], ['gkCatchLow', {}], ['gkCatchLow', { view: { yaw: -Math.PI / 2, dist: 4.4 } }],
], 'gk', { yaw: -0.25, dist: 4.4 });
// dribble touch: jog with ball, touch on every 2nd footfall; row 1 = original amplitude, row 2 = new
scenes.touch = `(() => {
  S.use('field'); S.beginSheet(8, 2, 200, 300);
  for (const amp of [1, 1.8]) {
    globalThis.__gp2 = Object.assign(globalThis.__gp2 || {}, { touchAmp: amp });
    S.reset({ speed: 3.6 });
    let steps = 0;
    const run = (a, dt) => { a.speed = 3.6; a.dribble = 1; const p0 = a.gaitPhase; a.gaitPhase = (a.gaitPhase + S.gait(3.6) * dt) % 1;
      a.x += Math.sin(a.heading) * 3.6 * dt; a.z += Math.cos(a.heading) * 3.6 * dt; a.touchT += dt;
      if (Math.floor(p0 * 2) !== Math.floor(a.gaitPhase * 2) && ++steps % 2 === 0) { a.touchT = 0; a.touchFoot = a.gaitPhase < 0.5 ? -1 : 1; } };
    S.advance(90, run);
    while (true) { const before = steps; S.advance(1, run); if (steps !== before && steps % 2 === 0) break; }
    for (let k = 0; k < 8; k++) { S.advance(3, run); S.snap({ label: k ? '' : 'toque x' + amp, yaw: -0.25, dist: 3.8 }); }
  }
  return S.endSheet();
})()`;
scenes.front = `(() => {
  const rows = [['parado',0,-1.5708],['andar',1.5,-1.5708],['trote',3.4,-1.5708],['corrida',5.6,-1.5708],['corrida 3/4',5.6,-0.8]];
  S.use('field'); S.beginSheet(8, rows.length, 200, 300);
  for (const [name, v, yaw] of rows) {
    S.reset({ speed: v });
    const drive = (a, dt) => { a.speed = v; a.accel = 0; a.turn = 0; a.x += Math.sin(a.heading) * v * dt; a.z += Math.cos(a.heading) * v * dt;
      a.gaitPhase = (a.gaitPhase + S.gait(v) * dt) % 1; };
    S.advance(60, drive);
    const cyc = v > 0 ? 1 / S.gait(v) : 2.0;
    for (let k = 0; k < 8; k++) { S.advance(Math.max(1, Math.round(cyc * 60 / 8)), drive); S.snap({ label: k === 0 ? name : '', yaw, dist: 3.8 }); }
  }
  return S.endSheet();
})()`;
// Motion 2.2: dribles novos (pose do clipe; side +1 e -1)
scenes.skills2 = actionScene([
  ['pedaladaDupla', { anim: { speed: 2 } }], ['paraArranca', { anim: { speed: 4 } }], ['corteSeco', { anim: { speed: 4 } }],
  ['corteSeco', { side: -1, anim: { speed: 4 }, view: { yaw: -Math.PI / 2 } }],
], 'field', { yaw: -0.5, dist: 4.2 });
// mãos de perto: parado, correndo, goleiro pronto, goleiro agarrando
scenes.hands = `(() => {
  S.beginSheet(4, 4, 300, 300);
  const rows = [['parado', 'field', { speed: 0 }, 0], ['corrida', 'field', { speed: 5.6 }, 5.6], ['goleiro pronto', 'gk', { speed: 0, stance: 'gk', lookW: 0.6, lookX: 6, lookY: 0.4, lookZ: 0 }, 0], ['agarrou', 'gk', { speed: 0, hold: 1 }, 0]];
  for (const [name, who, f, v] of rows) {
    S.use(who); S.reset(f);
    const drive = (a, dt) => { a.speed = v; if (v) { a.x += Math.sin(a.heading) * v * dt; a.z += Math.cos(a.heading) * v * dt; a.gaitPhase = (a.gaitPhase + S.gait(v) * dt) % 1; } };
    S.advance(90, drive);
    for (let k = 0; k < 4; k++) {
      S.advance(v ? 7 : 20, drive);
      const a = S.actor.anim, hp = new __arena.Vec3(); S.actor.model.boneWorld(k % 2 ? 'RightHand' : 'LeftHand', hp);
      const cam = S.g.camera, ang = a.heading + (k % 2 ? -Math.PI / 2 : Math.PI / 2) + (k > 1 ? 0.9 : 0.3);
      cam.fov = 16; cam.position.set(hp.x + Math.sin(ang) * 1.3, hp.y + 0.15, hp.z + Math.cos(ang) * 1.3); cam.lookAt(hp.x, hp.y, hp.z); cam.updateProjectionMatrix();
      S.g.renderer.render(1 / 60, 0, 0);
      const src = S.g.renderer.canvas, sh = S.sheet, H = src.height, W = src.width, cw = H * 0.9;
      const dx = (sh.i % sh.cols) * sh.cw, dy = Math.floor(sh.i / sh.cols) * sh.ch;
      sh.ctx.drawImage(src, (W - cw) / 2, (H - cw) / 2, cw, cw, dx, dy, sh.cw, sh.ch);
      if (!k) { sh.ctx.font = 'bold 15px sans-serif'; sh.ctx.fillStyle = '#ffeb3b'; sh.ctx.fillText(name, dx + 5, dy + 15); }
      sh.i++;
    }
  }
  return S.endSheet();
})()`;
// ombros: braços levantados (comemoração) e corrida de frente
scenes.shoulders = actionScene([
  ['celebArms', { view: { yaw: -Math.PI / 2, dist: 4 } }], ['gkJump', { view: { yaw: -Math.PI / 2, dist: 4.6 } }],
], 'field', {});
// medida do ombro: posição da mão esquerda (m, espaço do ator) em poses de braço
scenes.shprobe = `(() => {
  S.use('field'); const res = {}, hp = new __arena.Vec3(), sp = new __arena.Vec3();
  const probe = (name) => { S.actor.model.root.updateWorldMatrix(true, true); S.actor.model.boneWorld('LeftHand', hp); S.actor.model.boneWorld('LeftArm', sp);
    res[name] = { hand: [+(hp.x).toFixed(3), +(hp.y).toFixed(3), +(hp.z).toFixed(3)], sh: [+(sp.x).toFixed(3), +(sp.y).toFixed(3), +(sp.z).toFixed(3)] }; };
  S.reset({ speed: 0, gaitPhase: 0 }); S.advance(30); probe('idle');
  S.reset({ speed: 0 }); S.play('gkJump'); let t = 0; S.advance(Math.round(__arena.clips.gkJump.dur * 0.3 * 60), (a, dt) => { t += dt; a.actionT = t; }); probe('gkJumpTop');
  S.reset({ speed: 5.6, gaitPhase: 0 }); const v = 5.6; let best = -9;
  const drive = (a, dt) => { a.speed = v; a.x += Math.sin(a.heading) * v * dt; a.z += Math.cos(a.heading) * v * dt; a.gaitPhase = (a.gaitPhase + S.gait(v) * dt) % 1; };
  S.advance(60, drive); for (let i = 0; i < 40; i++) { S.advance(1, drive); probe('run'); const f = (hp.x - S.actor.anim.x) * Math.sin(S.actor.anim.heading) + (hp.z - S.actor.anim.z) * Math.cos(S.actor.anim.heading); best = Math.max(best, f); }
  res.runHandFwdMax = +best.toFixed(3);
  return 'TEXT:' + JSON.stringify(res);
})()`;
// toque de condução por tipo (carry / turn / stop), de 3/4
scenes.touch2 = `(() => {
  S.use('field'); S.beginSheet(8, 3, 200, 300);
  for (const kind of ['carry', 'turn', 'stop']) {
    const v = kind === 'stop' ? 2.2 : 3.6;
    S.reset({ speed: v, dribble: 1 });
    const run = (a, dt) => { a.speed = v; a.dribble = 1; a.turn = kind === 'turn' ? 1.6 : 0; a.heading += a.turn * dt; a.moveDir = a.heading;
      a.x += Math.sin(a.heading) * v * dt; a.z += Math.cos(a.heading) * v * dt; a.touchT += dt; a.gaitPhase = (a.gaitPhase + S.gait(v) * dt) % 1; };
    S.advance(60, run);
    const a = S.actor.anim; a.touchT = 0; a.touchFoot = 1; a.touchKind = kind;
    for (let k = 0; k < 8; k++) { S.advance(3, run); S.snap({ label: k ? '' : 'toque ' + kind, yaw: -0.6, dist: 3.6 }); }
  }
  return S.endSheet();
})()`;
// amplitude do atraso do punho (graus) em cada velocidade
scenes.wrist = `(() => {
  S.use('field'); const res = {};
  for (const v of [0, 1.5, 3.4, 5.6, 7]) {
    S.reset({ speed: v });
    const drive = (a, dt) => { a.speed = v; a.accel = 0; a.turn = 0; a.x += Math.sin(a.heading) * v * dt; a.z += Math.cos(a.heading) * v * dt;
      a.gaitPhase = (a.gaitPhase + S.gait(v) * dt) % 1; };
    S.advance(60, drive);
    let mx = 0;
    for (let i = 0; i < 90; i++) { S.advance(1, drive); const w = S.actor.model.anim2.wr; if (w) for (let k = 0; k < 2; k++) mx = Math.max(mx, Math.hypot(w.o[k*3], w.o[k*3+1], w.o[k*3+2])); }
    res['v' + v] = +(mx * 57.3).toFixed(1);
  }
  return 'TEXT:' + JSON.stringify(res);
})()`;
scenes.contact2 = actionScene([
  ['tackle', {}], ['tackle', { view: { yaw: -Math.PI / 2 } }], ['chestControl', {}], ['chestControl', { view: { yaw: -Math.PI / 2 } }],
], 'field', { yaw: -0.2, dist: 4.4 });
scenes.celebs = actionScene([
  ['celebKneeSlide', {}], ['celebJump', {}], ['celebArms', {}], ['celebPoint', {}], ['celebAqui', {}],
  ['celebCavalinho', {}], ['celebBeijo', {}],
], 'field', { yaw: -0.9, dist: 5 });

// ---- Motion 2.0 scenes ----------------------------------------------------------------------
// rows of standing variants, 8 frames each, sampled every `every` frames
function standScene(rows, who = 'field', every = 30, view = {}) {
  return `(() => {
    const rows = ${JSON.stringify(rows)};
    S.use('${who}'); S.beginSheet(8, rows.length, 200, 300);
    for (const [name, f, persona] of rows) {
      S.reset(Object.assign({ speed: 0 }, f));
      if (persona && S.actor.model.anim2) Object.assign(S.actor.model.anim2, persona);
      S.advance(150);
      for (let k = 0; k < 8; k++) { S.advance(${every}); S.snap(Object.assign({ label: k ? '' : name }, ${JSON.stringify(view)})); }
    }
    return S.endSheet();
  })()`;
}
const ballNear = { lookW: 0.45, lookX: 4, lookY: 0.11, lookZ: 3 };
scenes.idle2 = standScene([
  ['idle calmo', { calm: 1 }],
  ['idle calmo lado', { calm: 1 }, null],
], 'field', 24, { yaw: -Math.PI / 2, dist: 3.6 });
scenes.ready = standScene([
  ['bola perto (em jogo)', Object.assign({ calm: 0 }, ballNear)],
  ['parada (calmo)', Object.assign({ calm: 1 }, ballNear)],
], 'field', 20, { yaw: -0.5, dist: 3.8 });
scenes.tired = standScene([
  ['cansado: joelhos', { calm: 1, fatigue: 0.95 }, { restPose: 0 }],
  ['cansado: cintura', { calm: 1, fatigue: 0.95 }, { restPose: 1 }],
], 'field', 20, { yaw: -0.6, dist: 3.8 });
scenes.gkready = standScene([
  ['goleiro: bola perto', Object.assign({ calm: 0, stance: 'gk' }, ballNear)],
], 'gk', 6, { yaw: -Math.PI / 2, dist: 4.4 });

// Numeric "pop" metric: max per-frame prediction error over all 22 bones during a scripted
// sequence (strafe -> kick, run -> slide, jockey -> tackle, sprint -> stop -> pass).
scenes.pops = `(() => {
  S.use('field');
  const D = S.actor.model.bones;
  const hist = [];
  const res = [];
  const Q = D[0].quaternion.constructor;
  const q1 = new Q(), q2 = new Q(), q3 = new Q();
  const skate = {};
  const feet = [D[16], D[20]];
  const fp = [null, null];
  const V3 = __arena.Vec3;
  const sample = (tag) => {
    S.actor.model.root.updateWorldMatrix(true, true);
    for (let k = 0; k < 2; k++) {
      const p = feet[k].getWorldPosition(new V3());
      if (fp[k] && skip === 0 && p.y < 0.13 && fp[k].y < 0.13) { const dd = Math.hypot(p.x - fp[k].x, p.z - fp[k].z) * (Math.max(0, 0.13 - p.y) / 0.13); skate[tag] = (skate[tag] || 0) + dd; skate[tag + (k ? '#R' : '#L')] = (skate[tag + (k ? '#R' : '#L')] || 0) + dd; }
      fp[k] = p;
    }
    const cur = D.map((b) => b.quaternion.clone());
    if (skip > 0) skip--;
    else if (hist.length >= 2) {
      let worst = 0, wb = -1, uw = 0;
      for (let k = 0; k < cur.length; k++) {
        q1.copy(hist[1][k]).invert(); q2.copy(hist[0][k]);
        q3.copy(q2).multiply(q1).multiply(q2);
        const err = cur[k].angleTo(q3) * 57.2958;
        if (err > worst) { worst = err; wb = k; }
        if (k < 14 && err > uw) uw = err;
      }
      res.push([worst, wb, tag, uw]);
    }
    hist.unshift(cur); if (hist.length > 2) hist.pop();
  };
  const run = (tag, n, drive) => { for (let i = 0; i < n; i++) { S.advance(1, drive); sample(tag); } };
  let skip = 0;
  const R0 = S.reset.bind(S); S.reset = (f) => { R0(f); hist.length = 0; skip = 4; fp[0] = fp[1] = null; };
  let v = 0, t = 0;
  const move = (a, dt) => { a.x += Math.sin(a.moveDir) * a.speed * dt; a.z += Math.cos(a.moveDir) * a.speed * dt; a.gaitPhase = (a.gaitPhase + S.gait(a.speed) * dt) % 1; };
  // 1) strafe (heading != moveDir) then kick
  S.reset({ speed: 2.2, heading: 0, moveDir: Math.PI / 2, stance: 'jockey' });
  run('strafe', 40, move);
  S.play('kick'); t = 0;
  run('strafe->kick', 50, (a, dt) => { t += dt; a.actionT = t; move(a, dt); if (t > 0.62) a.action = null; });
  run('kick->strafe', 30, move);
  // 2) run then slide then get up
  S.reset({ speed: 6, heading: 0, moveDir: 0 });
  run('run', 30, move);
  S.play('slide'); t = 0;
  run('run->slide', 100, (a, dt) => { t += dt; a.actionT = t; a.speed = Math.max(0, a.speed - 4 * dt); move(a, dt); if (t > 1.4) a.action = null; });
  // 3) sprint, hard stop, pass
  S.reset({ speed: 7.5, heading: 0, moveDir: 0 }); v = 7.5;
  run('sprint', 30, move);
  run('brake', 40, (a, dt) => { const nv = Math.max(0, v - 11 * dt); a.accel = (nv - v) / dt; v = nv; a.speed = v; move(a, dt); });
  S.play('pass'); t = 0;
  run('stop->pass', 40, (a, dt) => { t += dt; a.actionT = t; a.accel = 0; if (t > 0.48) a.action = null; });
  // 4) interrupt: pass interrupted by a new kick mid-fade
  S.reset({ speed: 3, heading: 0, moveDir: 0 });
  S.play('pass'); t = 0;
  run('pass', 18, (a, dt) => { t += dt; a.actionT = t; move(a, dt); });
  S.play('chip'); t = 0;
  run('pass->chip', 40, (a, dt) => { t += dt; a.actionT = t; move(a, dt); if (t > 0.52) a.action = null; });
  S.reset = R0;
  res.sort((x, y) => y[0] - x[0]);
  const names = ${JSON.stringify(['Hips','Spine','Spine1','Spine2','Neck','Head','LeftShoulder','LeftArm','LeftForeArm','LeftHand','RightShoulder','RightArm','RightForeArm','RightHand','LeftUpLeg','LeftLeg','LeftFoot','LeftToeBase','RightUpLeg','RightLeg','RightFoot','RightToeBase'])};
  const byTag = {};
  for (const [e, b, tag] of res) if (!byTag[tag] || byTag[tag][0] < e) byTag[tag] = [e, names[b]];
  const over = (th) => res.filter((r) => r[0] > th).length;
  const upper = {};
  for (const [e, b, tag, ue] of res) if (!upper[tag] || upper[tag] < ue) upper[tag] = ue;
  return 'TEXT:' + JSON.stringify({ frames: res.length, over5: over(5), over10: over(10), over20: over(20),
    top: res.slice(0, 6).map((r) => r[0].toFixed(1) + '° ' + names[r[1]] + ' @' + r[2]),
    upperMax: Object.fromEntries(Object.entries(upper).map(([k, v]) => [k, +v.toFixed(1)])),
    upperOver10: res.filter((r) => r[3] > 10).length,
    skateCm: Object.fromEntries(Object.entries(skate).map(([k, v]) => [k, +(v * 100).toFixed(1)])),
    worstPerPhase: Object.fromEntries(Object.entries(byTag).map(([k, v]) => [k, v[0].toFixed(1) + '° ' + v[1]])) }, null, 1);
})()`;

// Per-frame CPU cost of model.update for all 22 actors (ms), measured in the page.
scenes.perf = `(() => {
  const g = __arena.game;
  for (const a of g.actors) { a.anim.visible = true; a.anim.speed = 3; a.anim.lookW = 0.45; }
  const N = 240;
  let ms = 1e9;
  for (let rep = 0; rep < 5; rep++) {
    const t0 = performance.now();
    for (let i = 0; i < N; i++) for (const a of g.actors) { a.anim.gaitPhase = (a.anim.gaitPhase + 0.02) % 1; a.model.update(a.anim, 1 / 60); }
    ms = Math.min(ms, (performance.now() - t0) / N);
  }
  return 'TEXT:' + JSON.stringify({ msPerFrame22: +ms.toFixed(3) });
})()`;

scenes.celebs3 = actionScene([
  ['celebOuvido', {}], ['celebSilencio', {}], ['celebBracos', {}],
], 'field', { yaw: -Math.PI / 2 + 0.35, dist: 3.4, target: 1.2, height: 1.3 });
scenes.celebs2 = actionScene([
  ['celebSamba', {}], ['celebRobo', {}], ['celebGiro', {}], ['celebOuvido', {}], ['celebSilencio', {}], ['celebBracos', {}],
  ['celebPunho', { span: 1 }], ['sadCrouch', { span: 1 }],
], 'field', { yaw: -0.9, dist: 5 });
// Motion 2.3: inclinação na curva (vista de trás): reta, curva à esquerda, curva à direita
scenes.curve = `(() => {
  const rows = [['reta', 0], ['curva esq', 1.1], ['curva dir', -1.1]];
  S.use('field'); S.beginSheet(8, rows.length, 200, 300);
  for (const [name, w] of rows) {
    const v = 6.2;
    S.reset({ speed: v });
    const drive = (a, dt) => { a.speed = v; a.accel = 0; a.turn = w; a.heading += w * dt; a.moveDir = a.heading;
      a.x += Math.sin(a.heading) * v * dt; a.z += Math.cos(a.heading) * v * dt; a.gaitPhase = (a.gaitPhase + S.gait(v) * dt) % 1; };
    S.advance(60, drive);
    const cyc = 1 / S.gait(v);
    for (let k = 0; k < 8; k++) { S.advance(Math.max(1, Math.round(cyc * 60 / 8)), drive); S.snap({ label: k ? '' : name, yaw: Math.PI / 2, dist: 4.4 }); }
  }
  return S.endSheet();
})()`;
// medida: rolagem do quadril e da cabeça (graus) em curva
scenes.curveprobe = `(() => {
  S.use('field'); const res = {};
  for (const w of [0, 1.1, -1.1]) {
    const v = 6.2; S.reset({ speed: v });
    const drive = (a, dt) => { a.speed = v; a.turn = w; a.heading += w * dt; a.moveDir = a.heading;
      a.x += Math.sin(a.heading) * v * dt; a.z += Math.cos(a.heading) * v * dt; a.gaitPhase = (a.gaitPhase + S.gait(v) * dt) % 1; };
    S.advance(60, drive); let sum = 0, n = 0; const hp = new __arena.Vec3(), hd = new __arena.Vec3();
    for (let i = 0; i < 60; i++) { S.advance(1, drive); const a = S.actor.anim; S.actor.model.root.updateWorldMatrix(true, true);
      S.actor.model.boneWorld('Hips', hp); S.actor.model.boneWorld('Neck', hd);
      // deslocamento lateral do pescoço em relação ao quadril, + = esquerda do jogador
      const lx = Math.cos(a.heading), lz = -Math.sin(a.heading);
      const lat = (hd.x - hp.x) * lx + (hd.z - hp.z) * lz, up = hd.y - hp.y; sum += Math.atan2(lat, up) * 57.3; n++; }
    res['turn' + w] = +(sum / n).toFixed(1);
  }
  return 'TEXT:' + JSON.stringify(res);
})()`;
// gestos: pede a bola (braço alto, olha o condutor), aponta/marca, goleiro organizando
scenes.gestures = `(() => {
  const rows = [['pede a bola', 'field', 'call', [8, 0], [-6, 9]], ['aponta (marca)', 'field', 'mark', [3, -6], null],
    ['goleiro organiza', 'gk', 'org', [6, 5], null], ['pede (andando)', 'field', 'call', [8, 0], [-6, -9]]];
  S.beginSheet(8, rows.length, 200, 300);
  for (const [name, who, kind, p, l] of rows) {
    S.use(who); const v = name.includes('andando') ? 1.6 : 0;
    S.reset({ speed: v });
    const a = S.actor.anim;
    const drive = (an, dt, t) => { an.speed = v; if (v) { an.x += Math.sin(an.heading) * v * dt; an.z += Math.cos(an.heading) * v * dt; an.gaitPhase = (an.gaitPhase + S.gait(v) * dt) % 1; }
      an.gestW = frame < 60 ? 1 : 0; an.gestKind = kind; an.gestPX = an.x + p[0]; an.gestPZ = an.z + p[1];
      an.gestLX = l ? an.x + l[0] : an.gestPX; an.gestLZ = l ? an.z + l[1] : an.gestPZ; frame++; };
    let frame = 0;
    for (let k = 0; k < 8; k++) { S.advance(10, drive); S.snap({ label: k ? '' : name, yaw: -1.0, dist: 4.0 }); }
  }
  return S.endSheet();
})()`;
// mãos de perto nas poses novas
scenes.hands2 = `(() => {
  S.beginSheet(4, 2, 300, 300);
  const shots = [['punho', 'celebPunho', 0.55, null], ['apontar', null, 0, 'mark'], ['mão aberta (pede)', null, 0, 'call'], ['segurando (lateral)', 'throwIn', 0.25, null],
    ['aviãozinho', 'celebArms', 0.5, null], ['silêncio', 'celebSilencio', 0.5, null], ['palmas', 'clap', 0.3, null], ['carrinho', 'slide', 0.4, null]];
  for (const [name, id, frac, kind] of shots) {
    S.use('field'); S.reset({ speed: 0 });
    let t = 0;
    if (id) S.play(id);
    const drive = (an, dt) => { t += dt; if (id) an.actionT = t; if (kind) { an.gestW = 1; an.gestKind = kind; an.gestPX = an.x + 3; an.gestPZ = an.z + (kind === 'mark' ? 6 : 0); an.gestLX = an.gestPX; an.gestLZ = an.gestPZ; } };
    S.advance(Math.max(30, Math.round((id ? __arena.clips[id].dur * frac : 1) * 60)), drive);
    // mão que mais se mexeu: a mais alta
    const L = new __arena.Vec3(), R = new __arena.Vec3(); S.actor.model.root.updateWorldMatrix(true, true);
    S.actor.model.boneWorld('LeftHand', L); S.actor.model.boneWorld('RightHand', R);
    const hp = L.y > R.y ? L : R, a = S.actor.anim;
    const cam = S.g.camera, ang = a.heading + (hp === L ? 0.9 : -0.9);
    cam.fov = 18; cam.position.set(hp.x + Math.sin(ang) * 1.5, hp.y + 0.12, hp.z + Math.cos(ang) * 1.5); cam.lookAt(hp.x, hp.y, hp.z); cam.updateProjectionMatrix();
    S.g.renderer.render(1 / 60, 0, 0);
    const src = S.g.renderer.canvas, sh = S.sheet, H = src.height, W = src.width, cw = H * 0.9;
    const dx = (sh.i % sh.cols) * sh.cw, dy = Math.floor(sh.i / sh.cols) * sh.ch;
    sh.ctx.drawImage(src, (W - cw) / 2, (H - cw) / 2, cw, cw, dx, dy, sh.cw, sh.ch);
    sh.ctx.font = 'bold 15px sans-serif'; sh.ctx.fillStyle = '#ffeb3b'; sh.ctx.fillText(name, dx + 5, dy + 15);
    sh.i++;
    for (const x of ['gestW']) a[x] = 0;
  }
  return S.endSheet();
})()`;
// Motion 2.4: dribles do FIFA 19 e trivela
scenes.skills3 = actionScene([
  ['elastico', {}], ['elasticoReverso', {}], ['elasticoTriplo', {}], ['berbaSpin', {}], ['berbaSpin', { view: { yaw: -Math.PI / 2 } }],
], 'field', { yaw: -0.5, dist: 4.2 });
scenes.trivela = actionScene([
  ['pass', { anim: { trivela: 0 } }], ['pass', { anim: { trivela: 1 } }], ['kick', { anim: { trivela: 1 } }], ['pass', { side: -1, anim: { trivela: 1 } }],
], 'field', { yaw: -Math.PI / 2 + 0.25, dist: 3.8 });
module.exports = { scenes, actionScene, installStudio };

if (require.main === module) {
  (async () => {
    const file = process.argv[2];
    const out = process.argv[3];
    const want = (process.argv[4] || Object.keys(scenes).join(',')).split(',');
    const cfgs = process.argv[5] ? JSON.parse(process.argv[5]) : null; // {label: cfg}
    const t0 = Date.now();
    const { browser, page, logs } = await launch({ file, width: 1000, height: 1000 });
    await startMatch(page, { timeOfDay: 'tarde' });
    await page.waitForTimeout(1500);
    const info = await page.evaluate(installStudio);
    await page.evaluate(() => {
      const S = globalThis.studio;
      S.gait = (v) => {
        // mirror of the game's stride-frequency model (T0) for the outfield player's height
        const h = S.actor.data.height / 100;
        const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
        const t = smooth(1.5, 3.8, v);
        const L = (1.25 + (3.15 - 1.25) * t + Math.max(0, v - 4) * 0.24) * (h / 1.8);
        return Math.min(2.25, v / L);
      };
      __arena.game.applyMatchEnvironment && __arena.game.applyMatchEnvironment();
    });
    console.log('studio ready', info, ((Date.now() - t0) / 1000).toFixed(1) + 's');
    for (const [clabel, cfg] of Object.entries(cfgs || { '': null })) {
    await page.evaluate((c) => { globalThis.__anim2cfg = c; }, cfg);
    for (const name0 of want) {
      const name = clabel ? name0 + '-' + clabel : name0;
      const t1 = Date.now();
      const url = await page.evaluate((code) => {
        const S = globalThis.studio; // eslint-disable-line no-unused-vars
        return eval(code);
      }, scenes[name0]);
      if (url.startsWith('TEXT:')) {
        fs.writeFileSync(`${out}-${name}.json`, url.slice(5));
        console.log('scene', name, url.slice(5));
      } else {
        fs.writeFileSync(`${out}-${name}.png`, Buffer.from(url.split(',')[1], 'base64'));
        console.log('scene', name, ((Date.now() - t1) / 1000).toFixed(1) + 's');
      }
    }
    }
    if (logs.length) console.log('console:', logs.slice(0, 20).join('\n').slice(0, 3000));
    await browser.close();
  })().catch((e) => {
    console.error('STUDIO FAILURE', e);
    process.exit(1);
  });
}
