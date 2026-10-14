/* ---------------- ARENA Motion 2.0: atalhos das novas comemorações ---------------- */
const ANIM2_CELEB_KEYS = {
  Digit1: "celebSamba", Digit2: "celebRobo", Digit3: "celebGiro",
  Digit4: "celebOuvido", Digit5: "celebSilencio", Digit6: "celebBracos",
};
function anim2CelebKey(game, code) {
  const id = ANIM2_CELEB_KEYS[code];
  id && game.arenaCelebPlay(id);
}
// D-pad (mapeamento padrão: 12 cima, 13 baixo, 14 esquerda, 15 direita)
function anim2CelebPad(game, pad, l, u, o) {
  const up = u("dUp", l(12)), down = u("dDown", l(13)), left = u("dLeft", l(14)), right = u("dRight", l(15));
  if (l(o.lb)) {
    up ? game.arenaCelebPlay("celebBracos") : down && game.arenaCelebPlay("celebRobo");
    return;
  }
  up
    ? game.arenaCelebPlay("celebGiro")
    : down
      ? game.arenaCelebPlay("celebSamba")
      : left
        ? game.arenaCelebPlay("celebOuvido")
        : right && game.arenaCelebPlay("celebSilencio");
}
