/* ---------------- ARENA Gameplay 2.2: comandos do FIFA 19 que faltavam ----------------
 *  LT + A  (Espaço + K)   passe de trivela: sai com a parte de fora, levemente por cima e com efeito para fora
 *  LT + B  (Espaço + L)   chute de trivela: efeito para fora (o contrário do chute colocado)
 *  LB + X  (Q + J)        cruzamento antecipado: mais tenso e mais baixo que o normal
 *  LB + RB + X (Q + E + J) cruzamento rasteiro
 * Se segurar Espaço/LT e apertar passe com o chute já carregado, continua valendo a finta (corte de calcanhar). */
function arenaFlairMod(g, side, act) {
  const kb = g.keyboardSide() === side && we.get().controllerSides.keyboard === side;
  let lb = kb && g.keyState.has("KeyQ"),
    rb = kb && g.keyState.has("KeyE"),
    lt = kb && g.keyState.has("Space");
  const P = arenaPad();
  for (const h of (navigator.getGamepads && navigator.getGamepads()) || [])
    if (h && h.connected && we.get().controllerSides[`pad${h.index}`] === side)
      (lb = lb || arenaBtn(h, P.lb)), (rb = rb || arenaBtn(h, P.mod)), (lt = lt || arenaBtn(h, P.protect));
  if (act === "cross" && lb) return rb ? "groundCross" : "earlyCross";
  if (lt && !lb && !rb) return act === "shot" ? "trivela" : act === "pass" ? "trivelaPass" : null;
  return null;
}
// efeito lateral (spin.y): positivo curva para a esquerda de quem chuta
function arenaSpinY(special, restart, dirZ, kicker) {
  if (special === "trivela" || special === "trivelaPass") {
    const foot = (kicker && kicker.anim.actionSide) || 1; // +1 = pé direito
    return -foot * (special === "trivela" ? 5.5 : 6);
  }
  return special === "finesse" || restart === "freeKick" ? -Math.sign(dirZ || 1) * 3.5 : 0;
}

/* ---------------- ARENA Motion 2.5: PIQUE — R2/RT duas vezes (teclado: Shift duas vezes; toque: botão Correr duas vezes)
 *  Toque duplo no botão de corrida = arrancada explosiva: aceleração bem maior e ~10% a mais de velocidade
 *  por ~1,1 s enquanto o botão continua apertado. Com a bola no pé, o jogador ainda empurra a bola
 *  para a frente (na direção do analógico) e sai atrás dela — como o "pique" do FIFA.
 *  Custa fôlego e tem recarga de ~1,3 s. Desligar: __gp2.noPique = true */
const ARENA_PIQUE = { win: 0.34, dur: 1.1, cd: 1.3, spd: 0.11, acc: 0.9, cost: 0.035 };
function arenaPiqueHeld(g, side) {
  const P = arenaPad();
  let held = false;
  try {
    if (g.keyboardSide() === side && we.get().controllerSides.keyboard === side)
      held = g.keyState.has("ShiftLeft") || g.keyState.has("ShiftRight");
    for (const h of (navigator.getGamepads && navigator.getGamepads()) || [])
      if (h && h.connected && we.get().controllerSides[`pad${h.index}`] === side)
        held = held || (arenaBtn(h, P.sprint) && !arenaBtn(h, P.protect));
    if (we.get().controllerSides.touch === side) held = held || !!g.touchState.sprint;
  } catch (e) {}
  return held;
}
function arenaPique(g) {
  try {
    const cfg = globalThis.__gp2 || {};
    if (cfg.noPique) return;
    const now = g.simulationTime || 0,
      st = g.__pique || (g.__pique = {});
    for (const side of g.humanSides || []) {
      const s = st[side] || (st[side] = { down: false, tap: -9, cd: -9 }),
        held = arenaPiqueHeld(g, side);
      if (held && !s.down) {
        const v = g.owner && g.owner.side === side ? g.owner : g.selected[side];
        if (now - s.tap < ARENA_PIQUE.win && now > s.cd && v && we.get().hud.phase === "play") {
          s.tap = -9;
          s.cd = now + ARENA_PIQUE.cd;
          arenaPiqueStart(g, v, side);
        } else s.tap = now;
      }
      s.down = held;
      // soltou o R2: a arrancada termina logo
      if (!held) for (const a of g.actors || []) a.side === side && a.pique && (a.pique.held = false);
    }
  } catch (e) {}
}
function arenaPiqueStart(g, v, side) {
  if (!v || v.anim.action || (v.stamina ?? 1) < 0.08) return;
  v.pique = { t: 0, held: true };
  v.stamina = Math.max(0, (v.stamina ?? 1) - ARENA_PIQUE.cost);
  g.__piqueCount = (g.__piqueCount || 0) + 1;
  if (g.owner === v) {
    const w = v.f19Want || { x: 0, z: 0 },
      wl = Math.hypot(w.x, w.z),
      d = wl > 0.3 ? { x: w.x / wl, z: w.z / wl } : { x: Math.sin(v.anim.heading), z: Math.cos(v.anim.heading) };
    const before = g.owner;
    g.knockOn(side, d);
    g.owner !== before && (v.pique.knock = 1, (g.__piqueKnock = (g.__piqueKnock || 0) + 1));
  }
}
// peso 0..1 da arrancada (sobe rápido, cai suave); chamado a cada passo da simulação
function arenaPiqueW(v, dt) {
  const p = v.pique;
  if (!p) return 0;
  p.t += dt * (p.held ? 1 : 2.5);
  if (p.t >= ARENA_PIQUE.dur) return (v.pique = null), (v.anim.pique = 0), 0;
  const x = p.t / ARENA_PIQUE.dur,
    w = Math.min(1, x * 9) * (1 - qt(0.55, 1, x));
  v.anim.pique = w;
  return w;
}
function arenaPiqueSpeed(v, dt) {
  try {
    const w = arenaPiqueW(v, dt);
    return 1 + ARENA_PIQUE.spd * w * Math.max(0.4, v.stamina ?? 1);
  } catch (e) {
    return 1;
  }
}
function arenaPiqueAcc(v) {
  return 1 + ARENA_PIQUE.acc * (v.anim.pique || 0);
}
