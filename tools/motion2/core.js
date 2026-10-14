/* ============================================================================================
 * ARENA Motion 2.0: camada procedural de animação dos jogadores
 *  - transições suaves (inertialization): sem "saltos" de pose entre ações, IK e posturas
 *  - idle vivo: respiração, troca de peso, olhares; pés travados por IK
 *  - postura de prontidão com a bola por perto; goleiro dando pequenos quiques
 *  - cansaço e fôlego: respiração ofegante, mãos nos joelhos ou na cintura nas paradas
 *  - inércia (molas): arrancadas e freadas com o corpo todo, braços e tronco com peso
 *  - cabeça estabilizada, antecipação de curvas, condutor alternando olhar bola/campo
 *  - estilo individual: cada jogador tem pequenas variações de postura
 * Qualquer erro desativa só esta camada; a animação original continua funcionando.
 * ========================================================================================== */
let anim2Off = false;
function anim2Fail(err) {
  if (!anim2Off) {
    anim2Off = true;
    console.warn("[ARENA Motion 2.0] camada desativada após erro:", err);
  }
}
function anim2Rng(seed) {
  let s = seed >>> 0 || 0x9e3779b9;
  return () => ((s ^= s << 13), (s ^= s >>> 17), (s ^= s << 5), (s >>> 0) / 4294967296);
}
const anim2B = {
  hip: cn.Hips, sp: cn.Spine, sp1: cn.Spine1, sp2: cn.Spine2, neck: cn.Neck, head: cn.Head,
  shL: cn.LeftShoulder, shR: cn.RightShoulder, armL: cn.LeftArm, armR: cn.RightArm,
  faL: cn.LeftForeArm, faR: cn.RightForeArm, handL: cn.LeftHand, handR: cn.RightHand,
  ulL: cn.LeftUpLeg, lgL: cn.LeftLeg, ftL: cn.LeftFoot, ulR: cn.RightUpLeg, lgR: cn.RightLeg, ftR: cn.RightFoot,
};
const anim2Q1 = new Un(), anim2Q2 = new Un(), anim2Q3 = new Un(), anim2Q4 = new Un();
const anim2V1 = new q(), anim2V2 = new q(), anim2V3 = new q(), anim2Tgt = new q();
const anim2FootP = [new q(), new q()], anim2FootQ = [new Un(), new Un()];
const anim2Up = new q(0, 1, 0);
const anim2Tmp = new Float32Array(3);

function anim2Init(r, o) {
  try {
    const rnd = anim2Rng((o.seed >>> 0) ^ 0x5bd1e995);
    const s = {
      // estilo individual
      lean: (rnd() - 0.5) * 6,
      elbow: (rnd() - 0.5) * 18,
      headC: (rnd() - 0.5) * 7,
      armOut: (rnd() - 0.3) * 6,
      breathK: 0.85 + rnd() * 0.3,
      fidget: 0.45 + rnd() * 0.55,
      restPose: rnd() < 0.55 ? 0 : 1, // 0: mãos nos joelhos, 1: mãos na cintura
      ph: [rnd() * 50, rnd() * 50, rnd() * 50, rnd() * 50],
      clock: rnd() * 20,
      // estados dinâmicos
      breathPh: rnd() * 6.28, ex: 0, fat: 0, stillT: 0,
      aLf: 0, aTf: 0, sp: 0, spv: 0, sr: 0, srv: 0, sa: 0, sav: 0,
      drive: 0, brake: 0, ready: 0, gkB: 0, tired: 0,
      cp: 0, cpSide: rnd() < 0.5 ? -1 : 1, cpT: 1 + rnd() * 4, cpAmt: 0.75 + rnd() * 0.5,
      gYaw: 0, gPitch: 0, gT: 0.5 + rnd() * 2,
      scanT: 0.8 + rnd() * 1.5, scanUntil: -1, scanDir: 1, scanW: 0, gz: 0,
      lastX: 1e9, lastZ: 1e9,
      // inertialization
      hasPrev: 0, sig: -1, offT: 99,
      prev: new Float32Array(on * 4), prev2: new Float32Array(on * 4),
      raw1: new Float32Array(on * 4), raw2: new Float32Array(on * 4),
      prevH: new Float32Array(3), prevH2: new Float32Array(3),
      rawH1: new Float32Array(3), rawH2: new Float32Array(3),
      off: new Float32Array(on * 3), offV: new Float32Array(on * 3),
      offH: new Float32Array(3), offHV: new Float32Array(3),
      prevDt: 1 / 60,
      headUp0: new q(0, 1, 0),
    };
    r.anim2 = s;
    // dedos (Motion 2.2): o rig tem ossos de dedo, mas o jogo só aplica uma pose fixa no início.
    // Guardamos essa pose como base e curvamos por estado (relaxado, corrida, goleiro pronto, agarrando).
    s.fing = [];
    s.curl = 0;
    s.curlOff = (rnd() - 0.5) * 0.16;
    for (const b of r.body.skeleton.bones) {
      const m = /(Left|Right)Hand(Thumb|Index|Middle|Ring|Pinky)(\d)/.exec(b.name);
      if (!m || +m[3] > 3) continue;
      const seg = +m[3], thumb = m[2] === "Thumb";
      s.fing.push({
        b, q0: b.quaternion.clone(), sg: m[1] === "Left" ? -1 : 1,
        w: thumb ? (seg === 1 ? 0 : 0.35) : [0, 0.85, 1, 0.7][seg],
        spread: thumb ? 0 : { Index: 1, Middle: 0.3, Ring: -0.4, Pinky: -1 }[m[2]],
      });
    }
    // direção "cima" da cabeça na pose de ligação (referência de cabeça nivelada)
    r.root.updateWorldMatrix(true, true);
    r.bones[anim2B.head].getWorldQuaternion(anim2Q1);
    r.root.getWorldQuaternion(anim2Q2).invert();
    s.headUp0.set(0, 1, 0).applyQuaternion(anim2Q2.multiply(anim2Q1)).normalize();
  } catch (err) {
    anim2Fail(err);
  }
}

function anim2Reset(s) {
  s.sp = s.spv = s.sr = s.srv = s.sa = s.sav = 0;
  s.aLf = s.aTf = 0;
  s.hasPrev = 0;
  s.offT = 99;
}

// Fase do jogo e fôlego, alimentados pelo loop principal antes de cada update.
function anim2Feed(m, st) {
  const ph = st.hud.phase;
  m.anim.calm = ph === "play" || ph === "replay" || ph === "kickoff" ? 0 : 1;
  m.anim.fatigue = 1 - (m.stamina ?? 1);
}

// Camada de corpo: roda depois das camadas originais e antes do olhar e dos IKs de locomoção.
function anim2Body(r, e, dt, D, a, g, v, o, T) {
  const s = r.anim2, C = globalThis.__anim2cfg;
  if (anim2Off || !s || !(dt > 0) || (C && C.noBody)) return;
  try {
    if (Math.hypot(e.x - s.lastX, e.z - s.lastZ) > 1) anim2Reset(s);
    s.lastX = e.x;
    s.lastZ = e.z;
    s.clock += dt;
    const c = s.clock, sc = r.sc, B = anim2B;
    const cur = r.cur, fd = r.fade;
    const upC = !!(cur.id && gf[cur.id] && gf[cur.id].upperOnly),
      upF = !!(fd.id && gf[fd.id] && gf[fd.id].upperOnly);
    const aLow = Math.max(upC ? 0 : cur.w, upF ? 0 : fd.w * 0.8);
    const free = 1 - a, stand = (1 - g) * (1 - aLow), mv = g * free;
    const gkW = r.stanceW.gk, stW = Math.max(gkW, r.stanceW.shield, r.stanceW.jockey);
    const calm = Eo(e.calm ?? 0);

    // ---------------- esforço, fôlego e cansaço
    s.fat = yi(s.fat, qt(0.05, 0.5, e.fatigue ?? 0), 0.6, dt);
    const sprint = qt(5.4, 7, o), run = qt(2.4, 4.8, o);
    s.ex = Eo(s.ex + dt * (sprint * 0.16 + run * 0.03 - (1 - run) * 0.07));
    const puff = Math.max(s.fat, s.ex);
    s.stillT = o < 0.45 ? s.stillT + dt : 0;

    // ---------------- inércia: molas no tronco e nos braços guiadas pela aceleração
    s.aLf = yi(s.aLf, Ne(e.accel, -16, 12), 14, dt);
    s.aTf = yi(s.aTf, Ne(o * e.turn, -14, 14), 12, dt);
    const uP = -0.0075 * s.aLf * mv, uR = 0.005 * s.aTf * mv, uA = -0.016 * s.aLf * mv;
    const n = Math.min(8, Math.ceil(dt * 120)), h = dt / n;
    for (let i = 0; i < n; i++) {
      s.spv += (100 * (uP - s.sp) - 8.4 * s.spv) * h;
      s.sp += s.spv * h;
      s.srv += (100 * (uR - s.sr) - 8.4 * s.srv) * h;
      s.sr += s.srv * h;
      s.sav += (64 * (uA - s.sa) - 5.6 * s.sav) * h;
      s.sa += s.sav * h;
    }
    s.drive = yi(s.drive, qt(2, 6.5, s.aLf) * (1 - qt(4.5, 7.5, o)) * mv, 10, dt);
    s.brake = yi(s.brake, qt(-3.5, -11, s.aLf) * qt(1.2, 3.5, o) * mv, 12, dt);

    // ---------------- respiração
    s.breathPh += dt * (0.24 + 0.5 * puff) * s.breathK * Math.PI * 2;
    const br = 0.5 - 0.5 * Math.cos(s.breathPh);
    const bA = (0.7 + 2.4 * puff) * Ms * free * (1 - 0.6 * g);

    // ---------------- prontidão, goleiro ativo, troca de peso e descanso
    const sway = Math.sin(c * 0.83 + s.ph[0]) * 0.6 + Math.sin(c * 0.37 + s.ph[1]) * 0.4;
    const shiftW = stand * (1 - stW) * (0.5 + 0.5 * calm) * s.fidget;
    const dLook = Math.hypot(e.lookX - e.x, e.lookZ - e.z);
    const attn = qt(0.2, 0.4, e.lookW) * qt(30, 9, dLook);
    s.ready = yi(s.ready, stand * (1 - calm) * attn * (1 - gkW), 3, dt);
    s.gkB = yi(s.gkB, gkW * stand * (1 - calm) * qt(34, 14, dLook), 4, dt);
    const restWant = calm * stand * (1 - stW) * qt(0.4, 0.75, puff) * qt(1, 1.8, s.stillT);
    s.tired = yi(s.tired, restWant, restWant > s.tired ? 2 : 5, dt);
    const ready = s.ready, gkB = s.gkB, tired = s.tired, knees = s.restPose === 0;
    // contrapposto: parado, o peso fica numa perna só (quadril desloca, bacia inclina, joelho livre
    // destrava) e troca de perna de tempos em tempos, devagar — nada de "soldado em sentido"
    s.cpT -= dt;
    if (s.cpT <= 0) {
      const x = Math.sin(c * 12.9898 + s.ph[1]) * 43758.5453, u = x - Math.floor(x);
      s.cpSide = u < 0.75 ? -s.cpSide : s.cpSide;
      s.cpT = 3.5 + u * 6;
    }
    const cpW = stand * (1 - stW) * (1 - tired) * (1 - 0.65 * ready) * (1 - gkB) * s.cpAmt;
    s.cp = yi(s.cp, s.cpSide * cpW, 1.5, dt);
    const cp = s.cp, cpA = Math.abs(cp);

    // pés antes das mudanças (para travá-los no chão depois)
    const lockW = C && C.noLock ? 0 : stand;
    if (lockW > 0.02)
      for (let k = 0; k < 2; k++) {
        const f = D[k ? B.ftR : B.ftL];
        f.getWorldPosition(anim2FootP[k]);
        f.getWorldQuaternion(anim2FootQ[k]);
      }

    // ---------------- quadril (cm no espaço do ator; +x = esquerda do jogador)
    const hp = D[B.hip].position;
    const bounce = gkB * (0.5 - 0.5 * Math.cos(c * Math.PI * 2 * 2.1)) * 2.6;
    const tk = knees ? tired : 0;
    hp.y -= ready * 4 + tk * 14 + tired * (1 - knees) * 1.5 + bounce + s.drive * 4 + s.brake * 4.5 + s.fat * mv * 1.5;
    hp.z -= tk * 10;
    hp.x += sway * 1.4 * shiftW + gkB * Math.sin(c * 1.4 + s.ph[2]) * 1.6 + cp * 3.4;
    hp.y -= cpA * 1.1;
    const hipPitch = (s.drive * 8 - s.brake * 7 + tk * 26) * Ms;
    if (Math.abs(hipPitch) > 1e-5) D[B.hip].quaternion.premultiply(anim2Q1.setFromAxisAngle(Ch, hipPitch));
    const hipRoll = (sway * 1.2 * shiftW + cp * 4.2) * Ms;
    if (Math.abs(hipRoll) > 1e-6) D[B.hip].quaternion.premultiply(anim2Q1.setFromAxisAngle(So, hipRoll));

    // ---------------- coluna
    const spP =
      (s.drive * 5 + ready * 7 + s.fat * mv * 4 + s.lean * v * free + tk * (18 + br * 4) - (tired - tk) * 3) * Ms + s.sp;
    D[B.sp].quaternion.premultiply(anim2Q1.setFromAxisAngle(Ch, spP));
    D[B.sp1].quaternion.premultiply(
      anim2Q1.setFromAxisAngle(Ch, s.sp * 0.6 + tk * 12 * Ms - br * bA * 0.4),
    );
    D[B.sp2].quaternion.premultiply(anim2Q1.setFromAxisAngle(Ch, tk * 6 * Ms - br * bA));
    const spR = s.sr - hipRoll * 0.8;
    if (Math.abs(spR) > 1e-6) D[B.sp1].quaternion.premultiply(anim2Q1.setFromAxisAngle(So, spR));

    // ---------------- ombros (respiração, cansaço)
    const shrug = br * bA * 1.6 - s.fat * mv * 3 * Ms + tired * (knees ? 6 : 2) * Ms * br;
    D[B.shL].quaternion.multiply(anim2Q1.setFromAxisAngle(So, shrug));
    D[B.shR].quaternion.multiply(anim2Q1.setFromAxisAngle(So, -shrug));

    // ---------------- pescoço (porte da cabeça)
    const nk = (s.headC * free - ready * 4 - s.drive * 3 + s.fat * mv * 4 - tk * 26 + (tired - tk) * 4) * Ms;
    D[B.neck].quaternion.premultiply(anim2Q1.setFromAxisAngle(Ch, nk));
    if (cpA > 0.01) D[B.neck].quaternion.premultiply(anim2Q1.setFromAxisAngle(So, cp * 2.2 * Ms));

    // ---------------- braços (prontidão, estilo, inércia)
    const idleArm = stand * free * (1 - stW) * (1 - tired);
    const walkW = qt(0.5, 1.2, o) * (1 - qt(2.4, 3.6, o)) * mv;
    const armFwd = -ready * 6 * Ms - idleArm * 3 * Ms - s.sa;
    // na corrida, braços um pouco mais abertos: as mãos não cruzam a linha do peito
    const armOut = (ready * 9 + s.armOut * free * (0.4 + 0.6 * g) + gkB * 4 + qt(1.6, 4.2, o) * 10 * mv) * Ms;
    for (let k = 0; k < 2; k++) {
      const sg = k ? -1 : 1;
      const arm = D[k ? B.armR : B.armL], fa = D[k ? B.faR : B.faL];
      arm.quaternion.premultiply(anim2Q1.setFromAxisAngle(Ch, armFwd));
      arm.quaternion.multiply(anim2Q1.setFromAxisAngle(So, sg * armOut));
      const flex = (ready * 14 + s.elbow * g * free - s.fat * mv * 12 + gkB * 6 * Math.sin(c * 4.2 + sg) +
        idleArm * (10 + sg * cp * 5) + walkW * 16) * Ms;
      fa.quaternion.multiply(anim2Q1.setFromAxisAngle(Fc, -sg * flex));
    }

    // ---------------- toque de condução por tipo (Motion 2.2): o jogo diz se o toque é condução,
    // mudança de direção ou parada; cada um ganha uma mecânica de pé, quadril, tronco e braços própria
    const tw = e.touchT < 0.32 && !(C && C.noTouch) ? Math.sin((e.touchT / 0.32) * Math.PI) * free * Eo((e.dribble ?? 0) * 1.5) : 0;
    if (tw > 0.01) {
      const kind = e.touchKind || "carry", fs = e.touchFoot >= 0 ? 1 : -1; // +1 = pé direito
      const R = fs > 0, ul = D[R ? B.ulR : B.ulL], lg = D[R ? B.lgR : B.lgL], ft = D[R ? B.ftR : B.ftL];
      const oArm = D[R ? B.armL : B.armR], sArm = D[R ? B.armR : B.armL];
      if (kind === "stop") {
        // sola na bola: coxa à frente, ponta do pé para cima, tronco para trás, braços abrem
        ul.quaternion.multiply(anim2Q1.setFromAxisAngle(Ch, -12 * tw * Ms));
        lg.quaternion.multiply(anim2Q1.setFromAxisAngle(Ch, 6 * tw * Ms));
        ft.quaternion.multiply(anim2Q1.setFromAxisAngle(Ch, -20 * tw * Ms));
        D[B.sp].quaternion.premultiply(anim2Q1.setFromAxisAngle(Ch, -6 * tw * Ms));
        oArm.quaternion.multiply(anim2Q1.setFromAxisAngle(So, (R ? 1 : -1) * 12 * tw * Ms));
        sArm.quaternion.multiply(anim2Q1.setFromAxisAngle(So, (R ? -1 : 1) * 10 * tw * Ms));
      } else if (kind === "turn") {
        // mudança de direção: pé gira (parte de dentro/fora), quadril e tronco antecipam a curva
        const ts = Math.sign(e.turn || 0) || (fs > 0 ? 1 : -1);
        ft.quaternion.premultiply(anim2Q1.setFromAxisAngle(Fc, ts * 22 * tw * Ms));
        ul.quaternion.multiply(anim2Q1.setFromAxisAngle(Ch, -8 * tw * Ms));
        D[B.hip].quaternion.premultiply(anim2Q1.setFromAxisAngle(Fc, ts * 8 * tw * Ms));
        D[B.sp1].quaternion.premultiply(anim2Q1.setFromAxisAngle(Fc, ts * 6 * tw * Ms));
        D[B.sp].quaternion.premultiply(anim2Q1.setFromAxisAngle(So, -ts * 4 * tw * Ms));
        oArm.quaternion.multiply(anim2Q1.setFromAxisAngle(So, (R ? 1 : -1) * 10 * tw * Ms));
      } else {
        // condução: empurra com o peito do pé, joelho sobe um pouco, braço oposto equilibra, ombros giram
        ul.quaternion.multiply(anim2Q1.setFromAxisAngle(Ch, -7 * tw * Ms));
        ft.quaternion.multiply(anim2Q1.setFromAxisAngle(Ch, 8 * tw * Ms));
        D[B.sp2].quaternion.premultiply(anim2Q1.setFromAxisAngle(Fc, fs * 5 * tw * Ms));
        oArm.quaternion.multiply(anim2Q1.setFromAxisAngle(So, (R ? 1 : -1) * 7 * tw * Ms));
      }
    }

    // ---------------- trava dos pés (IK) para as mudanças de quadril não deslizarem os pés
    if (lockW > 0.02)
      for (let k = 0; k < 2; k++) {
        const ft = D[k ? B.ftR : B.ftL];
        Rh(D[k ? B.ulR : B.ulL], D[k ? B.lgR : B.lgL], ft, anim2FootP[k], lockW, e.heading);
        ft.parent.getWorldQuaternion(anim2Q1).invert();
        anim2Q2.copy(anim2Q1).multiply(anim2FootQ[k]);
        ft.quaternion.slerp(anim2Q2, lockW);
        ft.updateWorldMatrix(false, true);
      }

    // ---------------- descanso: mãos nos joelhos ou na cintura (IK de braço)
    if (tired > 0.02) {
      const hs = Math.sin(e.heading), hc = Math.cos(e.heading);
      for (let k = 0; k < 2; k++) {
        const sg = k ? -1 : 1;
        const arm = D[k ? B.armR : B.armL], fa = D[k ? B.faR : B.faL];
        arm.quaternion.multiply(anim2Q1.setFromAxisAngle(So, sg * 25 * Ms * tired));
        fa.quaternion.multiply(anim2Q1.setFromAxisAngle(Fc, -sg * 50 * Ms * tired));
        if (knees) {
          D[k ? B.lgR : B.lgL].getWorldPosition(anim2Tgt);
          anim2Tgt.x += (hs * 0.05 + hc * sg * 0.035) * sc;
          anim2Tgt.z += (hc * 0.05 - hs * sg * 0.035) * sc;
          anim2Tgt.y += 0.09 * sc;
        } else {
          D[B.hip].getWorldPosition(anim2Tgt);
          anim2Tgt.x += (hc * sg * 0.17 - hs * 0.03) * sc;
          anim2Tgt.z += (-hs * sg * 0.17 - hc * 0.03) * sc;
          anim2Tgt.y += 0.06 * sc;
        }
        Rh(arm, fa, D[k ? B.handR : B.handL], anim2Tgt, tired, e.heading);
      }
    }

    // ---------------- cabeça estabilizada (reflexo de manter o olhar nivelado)
    const stab = (0.12 + 0.48 * g) * free * (1 - 0.6 * stW) * (1 - tired);
    if (stab > 0.01) {
      const hd = D[B.head];
      hd.getWorldQuaternion(anim2Q1);
      anim2V1.copy(anim2Up).applyQuaternion(anim2Q1);
      anim2V2.copy(s.headUp0).applyAxisAngle(anim2Up, e.heading);
      anim2V3.copy(anim2V1).lerp(anim2V2, stab).normalize();
      anim2Q2.setFromUnitVectors(anim2V1, anim2V3);
      hd.parent.getWorldQuaternion(anim2Q3).invert();
      hd.quaternion.copy(anim2Q3.multiply(anim2Q2.multiply(anim2Q1)));
    }
  } catch (err) {
    anim2Fail(err);
  }
}

// Olhar: antecipa curvas, olha em volta quando parado, condutor alterna bola/campo.
function anim2Gaze(r, e, V, Z, a, g, o, dt) {
  const s = r.anim2, C = globalThis.__anim2cfg;
  if (anim2Off || !s) return V;
  s.gz = Z;
  if (C && C.noGaze) return V;
  try {
    const free = 1 - a, c = s.clock;
    const track = Eo((e.lookW * free) / 0.75);
    let dv = Ne(e.turn * 0.085, -0.4, 0.4) * g * free * (1 - 0.6 * track),
      dz = 0;
    const idle = (1 - g) * free * (1 - track * 0.85);
    s.gT -= dt;
    if (s.gT <= 0) {
      const x1 = Math.sin(c * 12.9898 + s.ph[3]) * 43758.5453, u1 = x1 - Math.floor(x1);
      const x2 = Math.sin(c * 78.233 + s.ph[2]) * 12345.678, u2 = x2 - Math.floor(x2);
      if (u1 < 0.4) s.gYaw = s.gPitch = 0;
      else (s.gYaw = (u2 - 0.5) * 1.6), (s.gPitch = (u1 - 0.7) * 0.4);
      s.gT = 1.2 + u2 * 2.8;
    }
    dv += s.gYaw * idle;
    dz += s.gPitch * idle;
    // olhada rápida para a bola em cada toque de condução (cabeça desce e volta a subir)
    const gl = (1 - qt(0.04, 0.42, e.touchT)) * Eo((e.dribble ?? 0) * 1.5) * free * (1 - (s.scanW || 0));
    dz += gl * 0.2;
    const carry = Eo((e.dribble ?? 0) * 1.4 - 0.3) * qt(0.8, 2, o) * free;
    s.scanT -= dt * carry;
    if (s.scanT <= 0) {
      s.scanT = 1.3 + (Math.sin(c * 3.1 + s.ph[1]) + 1) * 0.6;
      s.scanDir = Math.sin(c * 7.7 + s.ph[0]) > 0 ? 1 : -1;
      s.scanUntil = c + 0.55;
    }
    s.scanW = yi(s.scanW, carry * (c < s.scanUntil ? 1 : 0), 10, dt);
    V = V * (1 - s.scanW * 0.6) + s.scanW * s.scanDir * 0.35 + dv;
    Z = Z * (1 - s.scanW * 0.85) - s.scanW * 0.08 + dz + s.tired * 0.12 * (0.5 + 0.5 * Math.sin(c * 0.5 + s.ph[2]));
    s.gz = Ne(Z, -0.5, 0.75);
    return Ne(V, -1.25, 1.25);
  } catch (err) {
    anim2Fail(err);
    return V;
  }
}

function anim2Log(qq, out, o) {
  let w = qq.w, x = qq.x, y = qq.y, z = qq.z;
  if (w < 0) (w = -w), (x = -x), (y = -y), (z = -z);
  const sn = Math.hypot(x, y, z), k = sn > 1e-9 ? (2 * Math.atan2(sn, w)) / sn : 2;
  out[o] = x * k;
  out[o + 1] = y * k;
  out[o + 2] = z * k;
}
function anim2Exp(x, y, z, qq) {
  const ang = Math.hypot(x, y, z);
  if (ang < 1e-9) return qq.set(0, 0, 0, 1);
  const sn = Math.sin(ang / 2) / ang;
  return qq.set(x * sn, y * sn, z * sn, Math.cos(ang / 2));
}

// Inertialization: quando algo muda de forma brusca (nova ação, IK liga/desliga, gates do
// animador), a diferença para a pose anterior decai com uma mola criticamente amortecida.
const ANIM2_HALF = 0.075;
function anim2AngVel(qa, qb, o, out, iv) {
  // velocidade angular (frame do corpo) de qa -> qb, em rad/s
  anim2Q3.fromArray(qa, o).invert().multiply(anim2Q4.fromArray(qb, o));
  anim2Log(anim2Q3, out, 0);
  out[0] *= iv;
  out[1] *= iv;
  out[2] *= iv;
}
const anim2W1 = new Float32Array(3), anim2W2 = new Float32Array(3);
// mantém pés e pontas das chuteiras acima do gramado depois da suavização
function anim2Ground(r, e) {
  const D = r.bones, sc = r.sc;
  r.root.updateWorldMatrix(true, true);
  for (let k = 0; k < 2; k++) {
    const ft = D[k ? cn.RightFoot : cn.LeftFoot], toe = D[k ? cn.RightToeBase : cn.LeftToeBase];
    ft.getWorldPosition(anim2Tgt);
    toe.getWorldPosition(anim2V1);
    const lift = Math.max(0.075 * sc - anim2Tgt.y, 0.022 * sc - anim2V1.y);
    if (lift > 0.002) {
      anim2Tgt.y += lift;
      Rh(D[k ? cn.RightUpLeg : cn.LeftUpLeg], D[k ? cn.RightLeg : cn.LeftLeg], ft, anim2Tgt, 1, e.heading);
    }
  }
}
// Movimento secundário: a mão "atrasa" em relação ao antebraço (punho solto, não um bloco rígido).
// Mola amortecida por mão, guiada pela velocidade angular do antebraço no espaço do quadril.
const anim2ArmChain = [
  [cn.Hips, cn.Spine, cn.Spine1, cn.Spine2, cn.LeftShoulder, cn.LeftArm, cn.LeftForeArm],
  [cn.Hips, cn.Spine, cn.Spine1, cn.Spine2, cn.RightShoulder, cn.RightArm, cn.RightForeArm],
];
const anim2WrQ = new Un(), anim2WrP = new Un();
function anim2Wrist(r, s, dt, fw) {
  const D = r.bones, W = globalThis.__anim2cfg?.wrist ?? 1;
  if (!s.wr) s.wr = { q: new Float32Array(8), o: new Float32Array(6), v: new Float32Array(6), n: 0 };
  const wr = s.wr;
  if (!s.hasPrev || dt > 0.1) wr.n = 0;
  const iv = 1 / dt, w0 = 17, zd = 2 * 0.72 * w0, tau = 0.04 * W * fw * fw, lim = 0.22;
  const sub = Math.min(6, Math.ceil(dt * 120)), h = dt / sub;
  for (let k = 0; k < 2; k++) {
    const ch = anim2ArmChain[k];
    anim2WrQ.identity();
    for (let i = 0; i < ch.length; i++) anim2WrQ.multiply(D[ch[i]].quaternion);
    const o3 = k * 3, hand = D[k ? cn.RightHand : cn.LeftHand];
    if (wr.n >= 1) {
      anim2WrP.fromArray(wr.q, k * 4).invert().multiply(anim2WrQ);
      anim2Log(anim2WrP, anim2W1, 0);
      // remove a torção em torno do eixo do osso (só flexão/desvio do punho)
      anim2V1.copy(hand.position).normalize();
      const ax = anim2V1.x, ay = anim2V1.y, az = anim2V1.z;
      let wx = anim2W1[0] * iv, wy = anim2W1[1] * iv, wz = anim2W1[2] * iv;
      const d = wx * ax + wy * ay + wz * az;
      wx -= d * ax; wy -= d * ay; wz -= d * az;
      const tg = [Ne(-wx * tau, -lim, lim), Ne(-wy * tau, -lim, lim), Ne(-wz * tau, -lim, lim)];
      for (let j = 0; j < sub; j++)
        for (let i = 0; i < 3; i++) {
          wr.v[o3 + i] += (w0 * w0 * (tg[i] - wr.o[o3 + i]) - zd * wr.v[o3 + i]) * h;
          wr.o[o3 + i] += wr.v[o3 + i] * h;
        }
      const ox = Ne(wr.o[o3], -lim, lim), oy = Ne(wr.o[o3 + 1], -lim, lim), oz = Ne(wr.o[o3 + 2], -lim, lim);
      // vetor de rotação está no frame do antebraço: leva para o frame local da mão
      anim2V2.set(ox, oy, oz).applyQuaternion(anim2Q2.copy(hand.quaternion).invert());
      hand.quaternion.multiply(anim2Exp(anim2V2.x, anim2V2.y, anim2V2.z, anim2Q1));
    } else {
      for (let i = 0; i < 3; i++) wr.o[o3 + i] = wr.v[o3 + i] = 0;
    }
    anim2WrQ.toArray(wr.q, k * 4);
  }
  wr.n++;
}
// Dedos: curvatura por estado, suavizada (mão relaxada parada, punho solto correndo, mão aberta do
// goleiro pronto, fechando na bola quando agarra).
const anim2FQ = new Un();
function anim2Fingers(r, s, e, dt, a) {
  if (!s.fing || !s.fing.length) return;
  const C = globalThis.__anim2cfg, act = e.action || "";
  const g = r.moveBlend, spr = r.sprintW, gkA = act.startsWith("gk") && act !== "gkThrow";
  const gkOpen = Math.max(s.gkB, r.stanceW.gk * 0.7, gkA ? Math.max(r.cur.w, 0.5) : 0);
  let want = 0.08 + s.curlOff + g * (1 - a) * (0.22 + 0.22 * spr) - s.tired * 0.12;
  want = Ts(want, -0.32, gkOpen);
  // agarrou: fecha as mãos na bola (depois do contato da defesa, ou segurando a bola)
  const grip = act === "gkCatch" || act === "gkCatchLow" ? qt(0, 0.08, e.actionT - ca(act)) * r.cur.w : 0;
  want = Ts(want, 0.4, Math.max(Eo(e.hold ?? 0), grip));
  if (C && C.curl !== undefined) want = C.curl;
  s.curl = yi(s.curl, want, 9, dt);
  // os ossos dos dedos não são tocados pelo jogo depois da construção: só reescreve se mudou
  if (Math.abs(s.curl - (s.curlApplied ?? 99)) < 0.004) return;
  s.curlApplied = s.curl;
  const fan = Math.max(0, -s.curl) * 0.3;
  for (const f of s.fing) {
    f.b.quaternion.copy(f.q0);
    if (f.w) f.b.quaternion.multiply(anim2FQ.setFromAxisAngle(So, f.sg * s.curl * f.w));
    if (f.spread && fan > 0.001) f.b.quaternion.multiply(anim2FQ.setFromAxisAngle(Fc, f.sg * f.spread * fan));
  }
}
// Ombro (clavícula) acompanha o braço: protrai quando o braço vai à frente, retrai quando vai atrás
// e sobe quando o braço levanta (ritmo escápulo-umeral). Delta em relação ao braço caído.
function anim2Shoulder(r, s) {
  const D = r.bones, C = globalThis.__anim2cfg, G = C?.shGain ?? 1;
  if (!G) return;
  for (let k = 0; k < 2; k++) {
    const sg = k ? -1 : 1; // eixo do osso: +X à esquerda, -X à direita
    const sh = D[k ? cn.RightShoulder : cn.LeftShoulder], arm = D[k ? cn.RightArm : cn.LeftArm];
    anim2V1.set(sg, 0, 0).applyQuaternion(arm.quaternion).applyQuaternion(sh.quaternion);
    const fwd = Ne(anim2V1.z, -0.8, 0.9), up = Ne(anim2V1.y + 0.9, 0, 1.9);
    const pro = (fwd > 0 ? 0.2 : 0.14) * fwd * G, ele = 0.4 * (up / 1.9) * (up / 1.9) * G;
    // proteção: Y gira o osso para frente/trás; Z levanta (sinais espelhados entre os lados)
    anim2Q3.copy(sh.quaternion);
    sh.quaternion.premultiply(anim2Q1.setFromAxisAngle(Fc, -sg * pro));
    sh.quaternion.premultiply(anim2Q1.setFromAxisAngle(So, sg * ele));
    // o braço mantém (quase toda) a direção: só a articulação do ombro anda (sobe / vai à frente)
    anim2Q2.copy(sh.quaternion).invert().multiply(anim2Q3).multiply(arm.quaternion);
    arm.quaternion.slerp(anim2Q2, 0.9);
  }
}
function anim2Final(r, e, dt) {
  const s = r.anim2, C = globalThis.__anim2cfg;
  if (anim2Off || !s || !(dt > 0) || (C && C.noFinal)) return;
  try {
    const D = r.bones, hp = D[0].position;
    const a = Math.max(r.cur.w, r.fade.w * 0.8);
    const up = !!(e.action && gf[e.action] && gf[e.action].upperOnly);
    const ik = (a < 0.05 && !e.action) || (up && r.fade.w < 0.05);
    const sig =
      (e.actionSeq % 1e5) * 256 +
      (e.action ? 1 : 0) + (ik ? 2 : 0) + (a < 0.1 ? 4 : 0) + (a < 0.5 ? 8 : 0) +
      (a < 0.7 ? 16 : 0) + (a < 0.9 ? 32 : 0) + (e.footTargetW > 0.01 ? 64 : 0);
    let trig = s.hasPrev >= 2 && sig !== s.sig;
    // detector genérico: a pose alvo saiu muito da previsão por velocidade constante
    if (!trig && s.hasPrev >= 2 && !(C && C.noDetect)) {
      const thr = Math.max(0.3, 400 * dt * dt);
      for (let k = 0; k < cn.LeftUpLeg && !trig; k++) {
        anim2Q1.fromArray(s.raw2, k * 4).invert();
        anim2Q2.fromArray(s.raw1, k * 4);
        anim2Q3.copy(anim2Q2).multiply(anim2Q1).multiply(anim2Q2); // raw1 * raw2^-1 * raw1
        if (D[k].quaternion.angleTo(anim2Q3) > thr) trig = true;
      }
    }
    if (trig) {
      const iv = 1 / Math.max(1e-3, s.prevDt);
      for (let k = 0; k < on; k++) {
        const k3 = k * 3, k4 = k * 4;
        anim2Q1.copy(D[k].quaternion).invert().multiply(anim2Q2.fromArray(s.prev, k4));
        anim2Log(anim2Q1, s.off, k3);
        anim2AngVel(s.prev2, s.prev, k4, anim2W1, iv);
        anim2AngVel(s.raw2, s.raw1, k4, anim2W2, iv);
        let vx = anim2W1[0] - anim2W2[0], vy = anim2W1[1] - anim2W2[1], vz = anim2W1[2] - anim2W2[2];
        const vm = Math.hypot(vx, vy, vz), cl = vm > 10 ? 10 / vm : 1;
        s.offV[k3] = vx * cl;
        s.offV[k3 + 1] = vy * cl;
        s.offV[k3 + 2] = vz * cl;
      }
      const hx = [hp.x, hp.y, hp.z];
      for (let i = 0; i < 3; i++) {
        s.offH[i] = s.prevH[i] - hx[i];
        s.offHV[i] = Ne((s.prevH[i] - s.prevH2[i] - (s.rawH1[i] - s.rawH2[i])) * iv, -150, 150);
      }
      s.offT = 0;
    }
    // histórico da pose alvo bruta
    s.raw2.set(s.raw1);
    for (let k = 0; k < on; k++) D[k].quaternion.toArray(s.raw1, k * 4);
    s.rawH2.set(s.rawH1);
    s.rawH1[0] = hp.x;
    s.rawH1[1] = hp.y;
    s.rawH1[2] = hp.z;
    // pernas: quando o IK de pisada está ativo, ele manda nas pernas (sem suavizar = sem deslizar)
    s.legW = yi(s.legW ?? 1, ik ? 0 : 1, 25, dt);
    if (s.offT < 0.6) {
      s.offT += dt;
      const y = 1.386 / ANIM2_HALF, t = s.offT, ex = Math.exp(-y * t);
      for (let k = 0; k < on; k++) {
        const k3 = k * 3, lw = k >= cn.LeftUpLeg ? s.legW : 1;
        if (lw < 0.01) continue;
        const fx = (s.off[k3] + (s.offV[k3] + y * s.off[k3]) * t) * ex,
          fy = (s.off[k3 + 1] + (s.offV[k3 + 1] + y * s.off[k3 + 1]) * t) * ex,
          fz = (s.off[k3 + 2] + (s.offV[k3 + 2] + y * s.off[k3 + 2]) * t) * ex;
        D[k].quaternion.multiply(anim2Exp(fx * lw, fy * lw, fz * lw, anim2Q1));
      }
      hp.x += (s.offH[0] + (s.offHV[0] + y * s.offH[0]) * t) * ex;
      hp.y += (s.offH[1] + (s.offHV[1] + y * s.offH[1]) * t) * ex;
      hp.z += (s.offH[2] + (s.offHV[2] + y * s.offH[2]) * t) * ex;
      if (s.legW > 0.01) anim2Ground(r, e);
    }
    if (!(C && C.noShoulder)) anim2Shoulder(r, s);
    if (!(C && C.noWrist)) anim2Wrist(r, s, dt, 1 - a);
    if (!(C && C.noFingers)) anim2Fingers(r, s, e, dt, a);
    s.prev2.set(s.prev);
    for (let k = 0; k < on; k++) D[k].quaternion.toArray(s.prev, k * 4);
    s.prevH2.set(s.prevH);
    s.prevH[0] = hp.x;
    s.prevH[1] = hp.y;
    s.prevH[2] = hp.z;
    s.sig = sig;
    s.prevDt = dt;
    s.hasPrev++;
  } catch (err) {
    anim2Fail(err);
  }
}
/* ======================================= fim ARENA Motion 2.0 ============================== */
