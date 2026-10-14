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
