/* ============================================================================================
 * ARENA Gameplay 2.0: ajuste de realismo da jogabilidade (referência FIFA 19)
 *
 * Em vez de reescrever a física (arriscado), esta camada ajusta constantes nomeadas via
 * `globalThis.__gp2`, sempre escaladas por atributo — o craque continua errando menos que o
 * perna-de-pau, mas o jogo ganha a variância e o fluxo de ação de um FIFA 19:
 *   - passe erra mais sob pressão e com perna ruim (menos tiki-taka perfeito)
 *   - defensores interceptam num raio um pouco maior e leem lançamentos melhor
 *   - chute tem spread coerente: finalizador acerta, mas chute difícil sai torto
 *   - goleiro reage um pouco melhor em bola alta
 * Todos os ganchos têm leitura defensiva de `__gp2` com valor-padrão 1, então, se o objeto
 * sumir, o comportamento é idêntico ao original.
 * ========================================================================================== */
globalThis.__gp2 = Object.assign(
  {
    passErr: 1.55, // multiplicador do erro lateral de passe (fG)
    passPressure: 1.6, // peso extra da pressão no erro de passe
    laneReach: 1.22, // alcance de interceção do defensor na linha de passe
    laneGk: 1.3, // alcance do goleiro na linha
    shotSpread: 1.3, // spread do chute (V_)
    gkHigh: 1.08, // alcance do goleiro em bola alta/salto
    intercept: 1.14, // raio de contato defensivo em bola solta
    gkAngle: 0, // 0 = posicionamento lateral original; 1 = bissetriz pura (testado: piora no jogo, ver README)
    shieldAI: 0, // 1 = IA protege a bola sob pressão (testado: não reduz perdas de posse; ver README)
    shieldPass: 1, // ao proteger, a IA antecipa a decisão de passe
    shieldTurn: 1, // ao proteger, vira o corpo de costas/lado para o marcador
    shieldBlock: 1, // força da proteção contra bote por trás
    trapErr: 1, // erro do domínio aéreo (peito/coxa); 0 = domínio perfeito original
    touchAmp: 1.8, // amplitude visual do toque de condução (1 = original)
  },
  globalThis.__gp2 || {},
);
function gp2(k) {
  const c = globalThis.__gp2;
  return c && typeof c[k] === "number" ? c[k] : 1;
}
const gp2Stat = (globalThis.__gp2stat = globalThis.__gp2stat || {
  shieldStart: 0, shieldFrames: 0, shieldLost: 0, shieldBlocked: 0, traps: 0, trapLost: 0,
});
// ---- Goleiro: fica na bissetriz do ângulo bola→traves (FIFA: "cobrir o ângulo"), na mesma
// profundidade original. Fórmula original era uma fração fixa de ball.z (descobre o 1º pau de perto).
function gp2GkZ(bx, bz, Se, Oe, Lt, orig) {
  try {
    const w = gp2("gkAngle");
    if (!w) return orig;
    const dx = (bx - Se) * Oe;
    if (!(dx > 0.6)) return orig;
    const H = 3.66,
      a1 = Math.atan2(-H - bz, -dx),
      a2 = Math.atan2(H - bz, -dx),
      ux = Math.cos(a1) + Math.cos(a2),
      uz = Math.sin(a1) + Math.sin(a2);
    if (ux > -1e-6) return orig;
    const gz = bz + uz * (-dx / ux),
      t = Math.min(1, Math.max(0, Lt / dx));
    let z = gz + (bz - gz) * t;
    z = Math.max(-H + 0.35, Math.min(H - 0.35, z));
    return orig + (z - orig) * w;
  } catch (e) {
    return orig;
  }
}
// ---- IA protege a bola: sob pressão próxima (fora da zona de finalização) o portador vira o corpo
// de lado/costas para o marcador, reduz a velocidade e segura a bola do lado oposto. Retorna true
// quando está protegendo (o chamador reduz a velocidade).
function gp2Shield(g, v) {
  try {
    if (!gp2("shieldAI") || g.owner !== v || g.humanSides.includes(v.side) || v.data.position === "GOL" ||
        g.heldBy === v || v.anim.action || g.skills.has(v) || g.restart ||
        (g.pendingKick && g.pendingKick.actor === v) || g.ball.y > 0.5) {
      if (v.__sh) v.__sh = 0;
      v.__shAway = null;
      return false;
    }
    let best = null, bd = 9;
    for (const o of g.actors) {
      if (o.side === v.side || !o.anim.visible) continue;
      const d = Math.hypot(o.anim.x - v.anim.x, o.anim.z - v.anim.z);
      if (d < bd) { bd = d; best = o; }
    }
    const dir = g.attackDirection(v.side),
      toGoal = Math.abs(dir * 52.5 - v.anim.x),
      sk = (v.data.attrs.phy + v.data.attrs.dri) / 200; // vontade/qualidade de proteger
    const st = v.__sh || 0;
    // só protege quando o marcador chega por trás/lado (de frente, o certo é driblar ou passar)
    let fromBehind = false;
    if (best) {
      const s = Math.hypot(v.vx, v.vz),
        mx = s > 0.4 ? v.vx / s : Math.sin(v.anim.heading),
        mz = s > 0.4 ? v.vz / s : Math.cos(v.anim.heading);
      fromBehind = ((best.anim.x - v.anim.x) * mx + (best.anim.z - v.anim.z) * mz) / Math.max(bd, 0.01) < 0.35;
    }
    const enter = best && fromBehind && bd < 1.2 + sk * 0.3 && toGoal > 20,
      keep = best && st > 0 && bd < 2.1 && st < 0.6 + sk * 0.8;
    if (!(enter || keep)) {
      if (st > 0) v.__shCdUntil = (g.simulationTime || 0) + 1.2;
      v.__sh = 0;
      v.__shAway = null;
      return false;
    }
    if (!st && (g.simulationTime || 0) < (v.__shCdUntil || 0)) return false;
    if (!st) {
      gp2Stat.shieldStart++;
      // protegido, a IA decide logo o passe/saída (proteger para tocar, como no FIFA)
      if (gp2("shieldPass")) v.aiTimer = Math.min(v.aiTimer || 0, 0.12);
    }
    gp2Stat.shieldFrames++;
    v.__sh = st + 1 / 120;
    v.anim.stance = "shield";
    // corpo de lado para o marcador: costas para ele, girado até 70° para a direção de jogo
    const away = Math.atan2(v.anim.x - best.anim.x, v.anim.z - best.anim.z),
      mv = Math.hypot(v.driveX || 0, v.driveZ || 0) > 0.08 ? Math.atan2(v.driveX, v.driveZ) : away,
      d = Es(away, mv);
    v.__shAway = away + Math.max(-1.2, Math.min(1.2, d));
    v.__shBy = best;
    return true;
  } catch (e) {
    return false;
  }
}
function gp2ShieldHeading(v) {
  return gp2("shieldTurn") && v.anim.stance === "shield" && v.__shAway != null ? v.__shAway : null;
}
// ---- Bote por trás num jogador protegendo: o corpo bloqueia o acesso à bola. Retorna true quando
// o bote é bloqueado (vira disputa/falta pelo fluxo original).
function gp2ShieldBlock(g, e, p) {
  try {
    if (!p || p.anim.stance !== "shield") return false;
    const k = gp2("shieldBlock");
    if (!k) return false;
    const rx = e.anim.x - p.anim.x, rz = e.anim.z - p.anim.z, d = Math.hypot(rx, rz) || 1;
    const back = -(rx * Math.sin(p.anim.heading) + rz * Math.cos(p.anim.heading)) / d; // 1 = atrás
    if (back < 0.2) return false;
    const pr = Math.min(0.85, (0.3 + 0.45 * back) * (0.6 + p.data.attrs.phy / 200) * (1.15 - e.data.attrs.def / 300) * k);
    if (g.rng.next() < pr) { gp2Stat.shieldBlocked++; return true; }
    return false;
  } catch (x) {
    return false;
  }
}
// ---- Domínio aéreo (peito/coxa) com erro: depende de controle, pressão e velocidade da bola
// (original: amortecimento perfeito sempre).
function gp2TrapErr(g, T, inSpd) {
  try {
    const k = gp2("trapErr");
    if (!k) return;
    gp2Stat.traps++;
    const c = Math.max(0, Math.min(1, T.data.attrs.dri / 100)),
      p = Math.max(0, Math.min(1, g.pressureOn(T))),
      s = Math.max(0, Math.min(1, (inSpd - 8) / 14));
    const err = ((1 - c) * 2.4 + p * 1.1) * (0.45 + s) * k;
    const h = T.anim.heading;
    g.ballVelocity.x += Math.sin(h) * Math.abs(g.rng.normal()) * err + g.rng.normal() * err * 0.6;
    g.ballVelocity.z += Math.cos(h) * Math.abs(g.rng.normal()) * err + g.rng.normal() * err * 0.6;
    T.__trapT = 0.8;
  } catch (e) {}
}
