/* ---------------- ARENA Motion 2.2: dribles novos (trilhas de corpo e bola + catálogo) ----------------
 * vt(t, corpoX, corpoZ, yaw°, bolaX, bolaZ, bolaY, contatoPé, pé)  — x = esquerda do jogador, z = frente.
 * Injetado logo depois das trilhas originais (O3), antes de Qp(). */
Object.assign(O3, {
  pedaladaDupla: [
    vt(0, 0, 0, 0, -0.02, 0.5),
    vt(0.18, 0.02, 0.1, 2, -0.04, 0.47),
    vt(0.38, 0.07, 0.2, 6, -0.07, 0.44),
    vt(0.56, 0.01, 0.3, -2, 0, 0.44),
    vt(0.76, -0.07, 0.4, -7, 0.07, 0.44),
    vt(0.88, 0.02, 0.5, 8, 0.02, 0.4, 0.11, 0.9, -1),
    vt(1, 0.3, 0.72, 24, 0.06, 0.52),
  ],
  paraArranca: [
    vt(0, 0, 0, 0, -0.04, 0.55),
    vt(0.14, 0, 0.14, 0, -0.07, 0.34, 0.11, 1, 1),
    vt(0.33, 0, 0.2, 0, -0.07, 0.31, 0.11, 1, 1),
    vt(0.5, 0, 0.22, 0, -0.07, 0.31, 0.11, 0.9, 1),
    vt(0.64, 0, 0.32, 0, -0.04, 0.44, 0.11, 0.8, 1),
    vt(1, 0, 0.95, 0, -0.02, 0.62),
  ],
  corteSeco: [
    vt(0, 0, 0, 0, -0.04, 0.5),
    vt(0.2, 0, 0.12, -4, -0.06, 0.42),
    vt(0.4, 0.02, 0.2, 18, -0.05, 0.36, 0.11, 0.9, 1),
    vt(0.58, 0.08, 0.24, 52, 0.04, 0.38, 0.11, 1, 1),
    vt(0.78, 0.2, 0.28, 74, 0.04, 0.46, 0.11, 0.4, 1),
    vt(1, 0.42, 0.34, 82, 0.02, 0.52),
  ],
});
Object.assign(O3.pedaladaDupla, { decay: 0.26, steerFrom: 0.78 });
Object.assign(O3.paraArranca, { decay: 0.11, steerFrom: 0.62 });
Object.assign(O3.corteSeco, { decay: 0.16, steerFrom: 0.6 });
Kc.push(
  {
    id: "pedaladaDupla",
    name: "Pedalada dupla",
    stars: 3,
    keyboard: "Num 9 7 (ou 7 9)",
    gamepad: "RS: toque ↗ ↖ (ou ↖ ↗)",
    description: "Duas pedaladas seguidas, uma com cada perna, e arrancada para o lado da primeira.",
  },
  {
    id: "paraArranca",
    name: "Para e arranca",
    stars: 2,
    keyboard: "Num 2 2 (correndo)",
    gamepad: "RS: toque ↓ ↓ (correndo)",
    description: "Pisa na bola em velocidade, congela o marcador e arranca de novo para a frente.",
    moving: true,
  },
  {
    id: "corteSeco",
    name: "Corte seco",
    stars: 3,
    keyboard: "Num 7 7 (ou 9 9) correndo",
    gamepad: "RS: toque ↖ ↖ (ou ↗ ↗) correndo",
    description: "Freia numa perna e corta a bola com a parte de dentro do pé, mudando de direção quase em ângulo reto.",
    moving: true,
  },
);
