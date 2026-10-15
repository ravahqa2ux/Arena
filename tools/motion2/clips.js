/* ---------------- ARENA Motion 2.0: novas comemorações e reações (keyframes em graus) ---------------- */
const anim2Up0 = (o = {}) => ({
  Spine: [8, 0, 0], Spine1: [0, 0, 0], Spine2: [0, 0, 0], Neck: [0, 0, 0], Head: [0, 0, 0],
  LeftArm: [-8, 0, -66], RightArm: [-8, 0, 66], LeftForeArm: [0, -28, 0], RightForeArm: [0, 28, 0], ...o,
});
const anim2Clip = (dur, keys, extra = {}) => ({ dur, fadeIn: 0.15, fadeOut: 0.3, ...extra, keys });
Object.assign(gf, {
  // Samba no pé: passinhos rápidos, quadril solto, braços acompanhando
  celebSamba: (() => {
    const k = [le(0, { ...H_ }, [0, -0.02, 0])];
    for (let i = 0; i < 10; i++) {
      const t = 0.22 + i * 0.25, s = i % 2 ? 1 : -1;
      const L = s > 0 ? "Left" : "Right", R = s > 0 ? "Right" : "Left";
      k.push(
        le(
          t,
          {
            Hips: [4, 12 * s, -5 * s], Spine: [8, -12 * s, 5 * s], Spine1: [2, -6 * s, 3 * s], Spine2: [0, -4 * s, 0],
            Neck: [-6, 8 * s, -3 * s], Head: [0, 0, 0],
            [`${L}UpLeg`]: [-14, 0, 4 * s], [`${L}Leg`]: [24, 0, 0], [`${L}Foot`]: [-10, 0, 0],
            [`${R}UpLeg`]: [-34, 0, -6 * s], [`${R}Leg`]: [58, 0, 0], [`${R}Foot`]: [16, 0, 0],
            LeftArm: [-34, 0, -50 + 14 * s], RightArm: [-34, 0, 50 + 14 * s],
            LeftForeArm: [0, -88, 0], RightForeArm: [0, 88, 0],
          },
          [0.035 * s, -0.05, 0],
        ),
        le(
          t + 0.125,
          {
            Hips: [6, 4 * s, -2 * s], Spine: [10, -4 * s, 2 * s],
            [`${L}UpLeg`]: [-24, 0, 4 * s], [`${L}Leg`]: [42, 0, 0], [`${L}Foot`]: [-16, 0, 0],
            [`${R}UpLeg`]: [-20, 0, -4 * s], [`${R}Leg`]: [40, 0, 0], [`${R}Foot`]: [-10, 0, 0],
            LeftArm: [-40, 0, -46 + 6 * s], RightArm: [-40, 0, 46 + 6 * s],
          },
          [0.015 * s, -0.09, 0],
        ),
      );
    }
    k.push(le(2.95, { ...H_ }, [0, -0.02, 0]));
    return anim2Clip(2.95, k);
  })(),
  // Robô: poses travadas com estalos rápidos de braço, tronco e cabeça
  celebRobo: (() => {
    const base = { LeftArm: [-6, 0, -74], RightArm: [-6, 0, 74], LeftForeArm: [0, -92, 0], RightForeArm: [0, 92, 0], Spine: [2, 0, 0], Neck: [0, 0, 0], Spine1: [0, 0, 0] };
    const poses = [
      { ...base, Spine1: [0, 24, 0], Neck: [0, -34, 0] },
      { ...base, Spine1: [0, 24, 0], Neck: [0, -34, 0], RightArm: [-88, 0, 70], RightForeArm: [0, 0, 0] },
      { ...base, Spine1: [0, -24, 0], Neck: [0, 34, 0], LeftArm: [-88, 0, -70], LeftForeArm: [0, 0, 0] },
      { ...base, LeftArm: [-86, 0, -72], RightArm: [-86, 0, 72], LeftForeArm: [0, 0, 0], RightForeArm: [0, 0, 0], Neck: [6, 0, 0] },
      { ...base, Spine: [-6, 0, 0], Neck: [-10, 0, 0] },
    ];
    const k = [le(0, anim2Up0())];
    let t = 0.22;
    for (const p of poses) {
      k.push(le(t, p), le(t + 0.34, p));
      t += 0.42;
    }
    k.push(le(t + 0.3, anim2Up0()));
    return anim2Clip(t + 0.3, k, { upperOnly: true, fadeIn: 0.1 });
  })(),
  // Giro no ar: impulso, pulo com volta de 360° e aterrissagem de braços abertos
  celebGiro: anim2Clip(2.5, [
    le(0, { ...H_ }, [0, -0.02, 0]),
    le(0.22, { ...H_, Hips: [10, -8, 0], Spine: [16, 0, 0], ...Qn(0.13), LeftArm: [34, 0, -62], RightArm: [34, 0, 62], LeftForeArm: [0, -20, 0], RightForeArm: [0, 20, 0], Neck: [6, 0, 0] }, [0, -0.13, 0]),
    le(0.38, { Hips: [0, 50, 0], Spine: [0, 0, 0], LeftUpLeg: [-6, 0, 2], LeftLeg: [6, 0, 0], LeftFoot: [20, 0, 0], RightUpLeg: [-6, 0, -2], RightLeg: [6, 0, 0], RightFoot: [20, 0, 0], LeftArm: [-70, 0, -30], RightArm: [-70, 0, 30], LeftForeArm: [0, -30, 0], RightForeArm: [0, 30, 0], Neck: [-8, 0, 0] }, [0, 0.12, 0]),
    le(0.56, { Hips: [0, 190, 0], Spine: [4, 0, 0], LeftUpLeg: [-34, 0, 6], LeftLeg: [56, 0, 0], LeftFoot: [10, 0, 0], RightUpLeg: [-34, 0, -6], RightLeg: [56, 0, 0], RightFoot: [10, 0, 0], LeftArm: [-10, 0, -34], RightArm: [-10, 0, 34], LeftForeArm: [0, -20, 0], RightForeArm: [0, 20, 0] }, [0, 0.44, 0]),
    le(0.72, { Hips: [0, 320, 0], LeftUpLeg: [-26, 0, 8], LeftLeg: [34, 0, 0], RightUpLeg: [-26, 0, -8], RightLeg: [34, 0, 0], LeftFoot: [8, 0, 0], RightFoot: [8, 0, 0] }, [0, 0.2, 0]),
    le(0.84, { Hips: [8, 360, 0], Spine: [10, 0, 0], ...Qn(0.15), LeftUpLeg: [-48, 0, 12], RightUpLeg: [-48, 0, -12], LeftArm: [-8, 0, -40], RightArm: [-8, 0, 40], LeftForeArm: [0, -6, 0], RightForeArm: [0, 6, 0], Neck: [2, 0, 0] }, [0, -0.15, 0]),
    le(1.08, { Hips: [-2, 360, 0], Spine: [-10, 0, 0], Spine1: [-4, 0, 0], ...Qn(0.08), LeftUpLeg: [-30, 0, 13], RightUpLeg: [-30, 0, -13], LeftArm: [-4, 0, -30], RightArm: [-4, 0, 30], LeftForeArm: [0, -4, 0], RightForeArm: [0, 4, 0], Neck: [-20, 0, 0] }, [0, -0.08, 0]),
    le(1.95, { Hips: [-2, 360, 0], Spine: [-12, 0, 0], Spine1: [-5, 0, 0], ...Qn(0.08), LeftUpLeg: [-30, 0, 13], RightUpLeg: [-30, 0, -13], LeftArm: [-4, 0, -32], RightArm: [-4, 0, 32], Neck: [-24, 0, 0] }, [0, -0.08, 0]),
    le(2.5, { ...H_, Hips: [0, 360, 0] }, [0, -0.02, 0]),
  ]),
  // "Não tô ouvindo!": mão em concha na orelha, corpo virado para a torcida
  celebOuvido: anim2Clip(
    2.9,
    [
      le(0, anim2Up0()),
      le(0.3, anim2Up0({ Spine: [2, -14, 6], Spine1: [0, -8, 4], Neck: [-6, -22, 12], RightArm: [-50, 0, 40], RightForeArm: [0, 120, 0], LeftArm: [-46, 0, -44], LeftForeArm: [0, -70, 0] })),
      le(0.9, anim2Up0({ Spine: [0, -18, 8], Spine1: [0, -10, 5], Neck: [-8, -26, 14], RightArm: [-52, 0, 38], RightForeArm: [0, 124, 0], LeftArm: [-56, 0, -30], LeftForeArm: [0, -100, 0] })),
      le(1.5, anim2Up0({ Spine: [2, -12, 6], Spine1: [0, -8, 4], Neck: [-6, -18, 12], RightArm: [-50, 0, 40], RightForeArm: [0, 120, 0], LeftArm: [-46, 0, -44], LeftForeArm: [0, -70, 0] })),
      le(2.1, anim2Up0({ Spine: [0, -20, 8], Spine1: [0, -10, 5], Neck: [-10, -28, 14], RightArm: [-52, 0, 38], RightForeArm: [0, 124, 0], LeftArm: [-56, 0, -30], LeftForeArm: [0, -100, 0] })),
      le(2.9, anim2Up0()),
    ],
    { upperOnly: true },
  ),
  // Silêncio: dedo na boca, olhando a torcida de um lado ao outro
  celebSilencio: anim2Clip(
    3,
    [
      le(0, anim2Up0()),
      le(0.32, anim2Up0({ Spine: [-2, 18, 0], Neck: [-8, 10, 0], RightArm: [-55, 30, 50], RightForeArm: [0, 135, 0], LeftArm: [-10, 0, -60], LeftForeArm: [0, -20, 0] })),
      le(1.5, anim2Up0({ Spine: [-4, -4, 0], Neck: [-10, -6, 0], RightArm: [-55, 30, 50], RightForeArm: [0, 135, 0], LeftArm: [-10, 0, -60], LeftForeArm: [0, -20, 0] })),
      le(2.55, anim2Up0({ Spine: [-4, -22, 0], Neck: [-10, -14, 0], RightArm: [-55, 30, 50], RightForeArm: [0, 135, 0], LeftArm: [-10, 0, -60], LeftForeArm: [0, -20, 0] })),
      le(3, anim2Up0()),
    ],
    { upperOnly: true },
  ),
  // Estátua: braços cruzados, peito estufado, queixo erguido
  celebBracos: anim2Clip(
    3,
    [
      le(0, anim2Up0()),
      le(0.38, anim2Up0({ Spine: [-8, 0, 0], Spine1: [-4, 0, 0], Neck: [-16, 0, 0], LeftArm: [-28, -66, -70], RightArm: [-28, 66, 70], LeftForeArm: [0, -108, 0], RightForeArm: [0, 108, 0] })),
      le(1.6, anim2Up0({ Spine: [-10, 8, 0], Spine1: [-4, 4, 0], Neck: [-18, 10, 0], LeftArm: [-28, -66, -70], RightArm: [-28, 66, 70], LeftForeArm: [0, -108, 0], RightForeArm: [0, 108, 0] })),
      le(2.6, anim2Up0({ Spine: [-10, -6, 0], Spine1: [-4, -3, 0], Neck: [-18, -8, 0], LeftArm: [-28, -66, -70], RightArm: [-28, 66, 70], LeftForeArm: [0, -108, 0], RightForeArm: [0, 108, 0] })),
      le(3, anim2Up0()),
    ],
    { upperOnly: true },
  ),
  // companheiros: soco no ar
  celebPunho: {
    dur: 0.9, loop: true, upperOnly: true, fadeIn: 0.2, fadeOut: 0.25,
    keys: [
      le(0, { Spine: [-4, 0, 0], Neck: [-12, 0, 0], RightArm: [-24, 0, -58], RightForeArm: [0, 96, 0], LeftArm: [-20, 0, -52], LeftForeArm: [0, -60, 0] }),
      le(0.3, { Spine: [-8, 0, 0], Neck: [-18, 0, 0], RightArm: [-30, 0, -86], RightForeArm: [0, 18, 0], LeftArm: [-24, 0, -48], LeftForeArm: [0, -70, 0] }),
      le(0.6, { Spine: [-6, 0, 0], Neck: [-14, 0, 0], RightArm: [-26, 0, -66], RightForeArm: [0, 70, 0], LeftArm: [-20, 0, -52], LeftForeArm: [0, -62, 0] }),
    ],
  },
  // adversários: lamento agachado, cabeça baixa
  sadCrouch: {
    dur: 3, loop: true, fadeIn: 0.5, fadeOut: 0.4,
    keys: [
      le(0, { Hips: [0, 0, 0], Spine: [34, 0, 0], Spine1: [14, 0, 0], Spine2: [4, 0, 0], Neck: [24, 0, 0], Head: [6, 0, 0], LeftUpLeg: [-80, 0, 9], LeftLeg: [122, 0, 0], LeftFoot: [-38, 0, 0], RightUpLeg: [-80, 0, -9], RightLeg: [122, 0, 0], RightFoot: [-38, 0, 0], LeftArm: [-52, 0, -62], RightArm: [-52, 0, 62], LeftForeArm: [0, -58, 0], RightForeArm: [0, 58, 0] }, [0, -0.46, -0.13]),
      le(1.5, { Spine: [36, 0, 0], Spine1: [15, 0, 0], Neck: [28, 8, 0], Head: [8, 0, 0], LeftArm: [-50, 0, -60], RightArm: [-50, 0, 60] }, [0, -0.47, -0.13]),
    ],
  },
});
/* ---------------- Gameplay 2.0: ações redesenhadas (mesmos dur/contact => lógica do jogo intacta) ---------------- */
(() => {
  const keep = (id, keys) => { const c = gf[id]; if (c) gf[id] = { ...c, keys }; };
  // Defesa encaixada: estende as mãos, recebe e AMORTECE (joelhos cedem, tronco curva, bola vem ao peito)
  keep("gkCatch", [
    le(0, { Spine: [16, 0, 0], Spine1: [0, 0, 0], Neck: [0, 0, 0], ...Qn(0.1), LeftArm: [-45, 0, -40], RightArm: [-45, 0, 40], LeftForeArm: [0, -45, 0], RightForeArm: [0, 45, 0] }, [0, -0.1, 0]),
    le(0.12, { Spine: [6, 0, 0], Neck: [-4, 0, 0], ...Qn(0.05), LeftArm: [-78, 0, -38], RightArm: [-78, 0, 38], LeftForeArm: [0, -22, 0], RightForeArm: [0, 22, 0] }, [0, -0.05, 0.03]),
    le(0.24, { Spine: [12, 0, 0], Neck: [6, 0, 0], ...Qn(0.08), LeftArm: [-70, 0, -44], RightArm: [-70, 0, 44], LeftForeArm: [0, -55, 0], RightForeArm: [0, 55, 0] }, [0, -0.08, 0.02]),
    le(0.38, { Spine: [30, 0, 0], Spine1: [10, 0, 0], Neck: [16, 0, 0], ...Qn(0.2), LeftArm: [-34, 0, -60], RightArm: [-34, 0, 60], LeftForeArm: [0, -118, 0], RightForeArm: [0, 118, 0] }, [0, -0.2, -0.06]),
    le(0.56, { Spine: [22, 0, 0], Spine1: [6, 0, 0], Neck: [10, 0, 0], ...Qn(0.12), LeftArm: [-30, 0, -62], RightArm: [-30, 0, 62], LeftForeArm: [0, -122, 0], RightForeArm: [0, 122, 0] }, [0, -0.12, -0.04]),
    le(0.75, { Spine: [10, 0, 0], Spine1: [0, 0, 0], Neck: [4, 0, 0], ...Qn(0.04), LeftArm: [-30, 0, -64], RightArm: [-30, 0, 64], LeftForeArm: [0, -118, 0], RightForeArm: [0, 118, 0] }, [0, -0.04, 0]),
  ]);
  // Bola rasteira: abaixa com as mãos em concha no chão, recolhe junto ao corpo e levanta protegendo a bola
  keep("gkCatchLow", [
    le(0, { Spine: [16, 0, 0], Spine1: [0, 0, 0], Neck: [0, 0, 0], ...Qn(0.1), LeftArm: [-45, 0, -40], RightArm: [-45, 0, 40], LeftForeArm: [0, -30, 0], RightForeArm: [0, 30, 0] }, [0, -0.1, 0]),
    le(0.18, { Spine: [36, 0, 0], Spine1: [10, 0, 0], Neck: [6, 0, 0], ...Qn(0.3), LeftArm: [-58, 0, -62], RightArm: [-58, 0, 62], LeftForeArm: [0, -12, 0], RightForeArm: [0, 12, 0] }, [0, -0.3, -0.02]),
    le(0.3, { Spine: [44, 0, 0], Spine1: [12, 0, 0], Neck: [12, 0, 0], ...Qn(0.38), LeftArm: [-52, 0, -70], RightArm: [-52, 0, 70], LeftForeArm: [0, -18, 0], RightForeArm: [0, 18, 0] }, [0, -0.38, -0.04]),
    le(0.48, { Spine: [36, 0, 0], Spine1: [12, 0, 0], Neck: [14, 0, 0], ...Qn(0.3), LeftArm: [-36, 0, -64], RightArm: [-36, 0, 64], LeftForeArm: [0, -100, 0], RightForeArm: [0, 100, 0] }, [0, -0.3, -0.05]),
    le(0.68, { Spine: [20, 0, 0], Spine1: [6, 0, 0], Neck: [8, 0, 0], ...Qn(0.12), LeftArm: [-30, 0, -62], RightArm: [-30, 0, 62], LeftForeArm: [0, -120, 0], RightForeArm: [0, 120, 0] }, [0, -0.12, -0.02]),
    le(0.9, { Spine: [8, 0, 0], Spine1: [0, 0, 0], Neck: [4, 0, 0], ...Qn(0.03), LeftArm: [-30, 0, -64], RightArm: [-30, 0, 64], LeftForeArm: [0, -118, 0], RightForeArm: [0, 118, 0] }, [0, -0.03, 0]),
  ]);
  // Domínio no peito: peito estufado com braços abertos para trás (abre espaço para a bola),
  // depois o tronco "cede" e curva para baixo, amortecendo a bola em direção ao pé
  keep("chestControl", [
    le(0, { ...Mr, Spine: [-4, 0, 0], LeftArm: [-20, 0, -54], RightArm: [-20, 0, 54] }, [0, -0.025, 0]),
    le(0.12, { Hips: [-6, 0, 0], Spine: [-18, 0, 0], Spine1: [-10, 0, 0], Spine2: [-4, 0, 0], Neck: [18, 0, 0], ...Qn(0.07),
      LeftArm: [14, 0, -62], RightArm: [14, 0, 62], LeftForeArm: [0, -26, 0], RightForeArm: [0, 26, 0] }, [0, -0.06, -0.02]),
    le(0.2, { Hips: [-8, 0, 0], Spine: [-22, 0, 0], Spine1: [-12, 0, 0], Spine2: [-6, 0, 0], Neck: [24, 0, 0], ...Qn(0.1),
      LeftArm: [18, 0, -66], RightArm: [18, 0, 66], LeftForeArm: [0, -30, 0], RightForeArm: [0, 30, 0] }, [0, -0.09, -0.04]),
    le(0.32, { Hips: [0, 0, 0], Spine: [14, 0, 0], Spine1: [6, 0, 0], Spine2: [2, 0, 0], Neck: [26, 0, 0], ...Qn(0.12),
      LeftArm: [-4, 0, -60], RightArm: [-4, 0, 60], LeftForeArm: [0, -24, 0], RightForeArm: [0, 24, 0] }, [0, -0.12, 0.02]),
    le(0.46, { Hips: [0, 0, 0], Spine: [10, 0, 0], Spine1: [2, 0, 0], Spine2: [0, 0, 0], Neck: [18, 0, 0], ...Qn(0.06), ...ha }, [0, -0.05, 0]),
    le(0.64, { ...Mr }, [0, 0, 0]),
  ]);
  // Passe de chapa: pé de apoio plantado com joelho flexionado, perna de passe com back-swing visível,
  // pé aberto (chapa) no contato e follow-through na direção do passe; braço oposto equilibra
  keep("pass", [
    le(0, { Hips: [0, 0, 0], Spine: [5, 0, 0], Neck: [10, 0, 0], LeftUpLeg: [-10, 0, 0], LeftLeg: [15, 0, 0], LeftFoot: [-4, 0, 0],
      RightUpLeg: [5, 0, 0], RightLeg: [15, 0, 0], RightFoot: [0, 0, 0], LeftArm: [-10, 0, -68], RightArm: [0, 0, 68], LeftForeArm: [0, -20, 0], RightForeArm: [0, 20, 0] }, [0, 0, 0]),
    le(0.09, { Hips: [0, -16, -3], Spine: [10, 12, 0], Neck: [20, 0, 0], LeftUpLeg: [-21, 0, 4], LeftLeg: [43, 0, 0], LeftFoot: [-21, 0, 0],
      RightUpLeg: [36, -34, -8], RightLeg: [72, 0, 0], RightFoot: [6, 0, 0], LeftArm: [-34, 0, -44], RightArm: [26, 0, 56] }, [0, -0.06, 0]),
    le(0.17, { Hips: [0, 6, -4], Spine: [12, -2, -3], Neck: [24, 0, 0], LeftUpLeg: [-23, 0, 5], LeftLeg: [46, 0, 0], LeftFoot: [-23, 0, 0],
      RightUpLeg: [-26, -50, -10], RightLeg: [16, 0, 0], RightFoot: [-8, -10, 0], LeftArm: [-30, 0, -40], RightArm: [6, 0, 56] }, [0, -0.08, 0.03]),
    le(0.28, { Hips: [0, 12, -2], Spine: [9, -8, 0], Neck: [16, 0, 0], LeftUpLeg: [-18, 0, 3], LeftLeg: [36, 0, 0], LeftFoot: [-18, 0, 0],
      RightUpLeg: [-46, -38, -6], RightLeg: [18, 0, 0], RightFoot: [-6, -6, 0], LeftArm: [-16, 0, -54], RightArm: [-6, 0, 62] }, [0, -0.045, 0.04]),
    le(0.48, { Hips: [0, 0, 0], Spine: [5, 0, 0], Neck: [6, 0, 0], LeftUpLeg: [-8, 0, 0], LeftLeg: [15, 0, 0], LeftFoot: [-4, 0, 0],
      RightUpLeg: [-12, -10, 0], RightLeg: [25, 0, 0], RightFoot: [0, 0, 0], LeftArm: [-8, 0, -70], RightArm: [-4, 0, 70] }, [0, 0, 0]),
  ]);
  // Bote em pé: avanço com o quadril baixo, perna de apoio flexionada, perna do bote estendida à frente
  // (pé virado de lado), tronco inclinado sobre a bola e braços abertos para equilíbrio
  keep("tackle", [
    le(0, { ...Mr }, [0, 0, 0]),
    le(0.1, { Hips: [0, -6, 2], Spine: [20, 6, 0], Neck: [-8, 0, 0],
      LeftUpLeg: [-38, 0, 6], LeftLeg: [62, 0, 0], LeftFoot: [-22, 0, 0],
      RightUpLeg: [-34, -10, -14], RightLeg: [52, 0, 0], RightFoot: [-6, 0, 0],
      LeftArm: [-30, 0, -40], RightArm: [12, 0, 48], LeftForeArm: [0, -30, 0], RightForeArm: [0, 26, 0] }, [0, -0.16, 0.04]),
    le(0.22, { Hips: [0, -14, 6], Spine: [28, 10, 0], Spine1: [6, 4, 0], Neck: [-14, -6, 0],
      LeftUpLeg: [-48, 0, 8], LeftLeg: [92, 0, 0], LeftFoot: [-36, 0, 0],
      RightUpLeg: [-72, -28, -30], RightLeg: [6, 0, 0], RightFoot: [-18, -30, 0],
      LeftArm: [-48, 0, -30], RightArm: [24, 0, 52], LeftForeArm: [0, -24, 0], RightForeArm: [0, 20, 0] }, [0.03, -0.3, 0.12]),
    le(0.36, { Hips: [0, -10, 4], Spine: [24, 8, 0], Spine1: [4, 2, 0], Neck: [-10, -4, 0],
      LeftUpLeg: [-44, 0, 6], LeftLeg: [84, 0, 0], LeftFoot: [-32, 0, 0],
      RightUpLeg: [-60, -22, -24], RightLeg: [18, 0, 0], RightFoot: [-12, -20, 0],
      LeftArm: [-40, 0, -34], RightArm: [16, 0, 52], LeftForeArm: [0, -26, 0], RightForeArm: [0, 22, 0] }, [0.02, -0.26, 0.1]),
    le(0.5, { Hips: [0, -4, 2], Spine: [16, 2, 0], Neck: [-4, 0, 0],
      LeftUpLeg: [-28, 0, 4], LeftLeg: [50, 0, 0], LeftFoot: [-20, 0, 0],
      RightUpLeg: [-30, -8, -10], RightLeg: [40, 0, 0], RightFoot: [-8, 0, 0],
      LeftArm: [-20, 0, -48], RightArm: [0, 0, 56] }, [0, -0.14, 0.05]),
    le(0.62, { Hips: [0, 0, 0], Spine: [10, 0, 0], ...Qn(0.06), ...ha }, [0, -0.06, 0]),
  ]);
})();
/* ---------------- ARENA Motion 2.2: dribles novos (pose; trilhas de bola/corpo em skills.js) ----------------
 * Convenções (iguais às do jogo): UpLeg X<0 = coxa à frente, Leg X>0 = joelho dobra, Foot X<0 = ponta para cima,
 * Hips/Spine Y>0 = gira para a esquerda, Arm X<0 = braço à frente. Quadril [x(esq), y, z(frente)] em metros.
 * Todos usam side: o espelhamento do animador gera a versão para o outro lado. */
Object.assign(gf, {
  // Pedalada dupla: a perna esquerda passa por cima da bola, depois a direita, e sai explosivo para a esquerda
  pedaladaDupla: arenaClip(0.86, [
    le(0, { ...H_ }, [0, -0.03, 0]),
    le(0.08, { Hips: [0, -4, -3], Spine: [10, -2, 2], LeftUpLeg: [-24, -4, -6], LeftLeg: [46, 0, 0], LeftFoot: [14, 0, 0],
      RightUpLeg: [-8, 0, -6], RightLeg: [26, 0, 0], RightFoot: [-6, 0, 0], ...aWideR }, [-0.02, -0.04, 0]),
    le(0.16, { Hips: [0, -6, 0], Spine: [8, -4, 0], LeftUpLeg: [-44, -8, -10], LeftLeg: [38, 0, 0], LeftFoot: [10, 0, 0],
      RightUpLeg: [-6, 0, -4], RightLeg: [26, 0, 0] }, [-0.02, -0.035, 0.01]),
    le(0.24, { Hips: [0, 4, -4], Spine: [8, 4, -4], LeftUpLeg: [-46, 4, 8], LeftLeg: [34, 0, 0], LeftFoot: [8, 0, 0] }, [0.02, -0.04, 0.02]),
    le(0.33, { Hips: [0, 10, -7], Spine: [12, 8, -9], Neck: [6, -5, 0], LeftUpLeg: [-26, 6, 16], LeftLeg: [30, 0, 0], LeftFoot: [-4, 0, 0],
      RightUpLeg: [-4, 0, -10], RightLeg: [30, 0, 0], RightFoot: [-6, 0, 0], ...aWideL }, [0.06, -0.07, 0.02]),
    // transferência: o peso vai para a esquerda e a direita já começa a levantar
    le(0.41, { Hips: [0, 4, 3], Spine: [10, 2, -2], Neck: [2, 0, 0], LeftUpLeg: [-8, 0, 8], LeftLeg: [28, 0, 0], LeftFoot: [-6, 0, 0],
      RightUpLeg: [-24, 4, 6], RightLeg: [46, 0, 0], RightFoot: [14, 0, 0], ...aWideL }, [0.03, -0.05, 0.02]),
    le(0.49, { Hips: [0, 6, 0], Spine: [8, 4, 0], RightUpLeg: [-44, 8, 10], RightLeg: [38, 0, 0], RightFoot: [10, 0, 0],
      LeftUpLeg: [-6, 0, 4], LeftLeg: [26, 0, 0] }, [0.02, -0.035, 0.03]),
    le(0.57, { Hips: [0, -4, 4], Spine: [8, -4, 4], RightUpLeg: [-46, -4, -8], RightLeg: [34, 0, 0], RightFoot: [8, 0, 0] }, [-0.02, -0.04, 0.04]),
    le(0.66, { Hips: [0, -10, 7], Spine: [12, -8, 9], Neck: [6, 5, 0], RightUpLeg: [-26, -6, -16], RightLeg: [30, 0, 0], RightFoot: [-4, 0, 0],
      LeftUpLeg: [-4, 0, 10], LeftLeg: [30, 0, 0], LeftFoot: [-6, 0, 0], ...aWideR }, [-0.06, -0.08, 0.04]),
    // arrancada para a esquerda: empurra com a direita, a esquerda leva a bola com a parte de fora
    le(0.76, { Hips: [0, 12, -6], Spine: [16, 10, -8], Neck: [-4, -6, 0], LeftUpLeg: [-36, 6, 10], LeftLeg: [42, 0, 0], LeftFoot: [6, 0, 0],
      RightUpLeg: [6, 0, -10], RightLeg: [26, 0, 0], RightFoot: [6, 0, 0], LeftArm: [26, 0, -58], RightArm: [-34, 0, 54],
      LeftForeArm: [0, -40, 0], RightForeArm: [0, 44, 0] }, [0.04, -0.08, 0.04]),
    le(0.86, { ...H_ }, [0, -0.03, 0]),
  ]),
  // Para e arranca: pisa na bola com a sola em velocidade, congela o marcador e explode para a frente
  paraArranca: arenaClip(0.74, [
    le(0, { ...H_, Spine: [12, 0, 0] }, [0, -0.04, 0]),
    le(0.1, { Hips: [-6, 0, 0], Spine: [0, 0, 0], Neck: [-4, 0, 0], RightUpLeg: [-36, 0, -4], RightLeg: [30, 0, 0], RightFoot: [-24, 0, 0],
      LeftUpLeg: [8, 0, 4], LeftLeg: [42, 0, 0], LeftFoot: [4, 0, 0], ...aBal }, [0, -0.07, -0.04]),
    le(0.24, { Hips: [-2, 0, 0], Spine: [3, 0, 0], Neck: [-6, 0, 0], RightUpLeg: [-30, 0, -4], RightLeg: [34, 0, 0], RightFoot: [-18, 0, 0],
      LeftUpLeg: [2, 0, 4], LeftLeg: [36, 0, 0], LeftFoot: [-2, 0, 0], LeftArm: [-16, 0, -56], RightArm: [-16, 0, 56] }, [0, -0.06, -0.03]),
    // pausa curta: ombros caem, o peso vai para a frente (o marcador "compra" a parada)
    le(0.36, { Hips: [2, 0, 0], Spine: [10, 0, 0], Neck: [-8, 0, 0], RightUpLeg: [-28, 0, -4], RightLeg: [38, 0, 0], RightFoot: [-14, 0, 0],
      LeftUpLeg: [-2, 0, 4], LeftLeg: [44, 0, 0], LeftFoot: [-6, 0, 0] }, [0, -0.085, -0.01]),
    le(0.46, { Hips: [4, 0, 0], Spine: [18, 0, 0], Neck: [-10, 0, 0], RightUpLeg: [-42, 0, -4], RightLeg: [26, 0, 0], RightFoot: [8, 0, 0],
      LeftUpLeg: [10, 0, 4], LeftLeg: [40, 0, 0], LeftFoot: [10, 0, 0], ...aBal }, [0, -0.08, 0.03]),
    le(0.58, { Hips: [6, 0, 0], Spine: [22, 0, 0], Neck: [-12, 0, 0], LeftUpLeg: [-48, 0, 4], LeftLeg: [62, 0, 0], LeftFoot: [-6, 0, 0],
      RightUpLeg: [14, 0, -4], RightLeg: [30, 0, 0], RightFoot: [14, 0, 0], LeftArm: [30, 0, -62], RightArm: [-38, 0, 56],
      LeftForeArm: [0, -44, 0], RightForeArm: [0, 48, 0] }, [0, -0.07, 0.06]),
    le(0.74, { ...H_, Spine: [14, 0, 0] }, [0, -0.04, 0]),
  ]),
  // Corte seco: em velocidade, freia na perna esquerda e corta a bola ~80° para a esquerda com a parte de dentro do pé direito
  corteSeco: arenaClip(0.54, [
    le(0, { ...H_, Spine: [12, 0, 0] }, [0, -0.04, 0]),
    le(0.1, { Hips: [-4, -6, 0], Spine: [6, -4, 0], LeftUpLeg: [-22, 0, 6], LeftLeg: [40, 0, 0], LeftFoot: [-8, 0, 0],
      RightUpLeg: [-28, -12, -4], RightLeg: [32, 0, 0], RightFoot: [-4, 0, 0], ...aWideR }, [0, -0.075, -0.02]),
    le(0.2, { Hips: [0, 10, -2], Spine: [10, 14, -6], Neck: [4, -8, 0], LeftUpLeg: [-14, 0, 10], LeftLeg: [46, 0, 0], LeftFoot: [-8, 0, 0],
      RightUpLeg: [-36, -26, 10], RightLeg: [34, 0, 0], RightFoot: [-8, 0, 0], ...aWideL }, [0.02, -0.095, 0]),
    le(0.3, { Hips: [0, 24, -6], Spine: [12, 18, -10], Neck: [6, -10, 0], LeftUpLeg: [-6, 0, 12], LeftLeg: [48, 0, 0], LeftFoot: [-6, 0, 0],
      RightUpLeg: [-24, -12, 12], RightLeg: [32, 0, 0], RightFoot: [-2, 0, 0], LeftArm: [-30, 0, -36], RightArm: [-6, 0, 50] }, [0.04, -0.1, 0.01]),
    le(0.41, { Hips: [2, 12, -4], Spine: [18, 8, -6], Neck: [-6, -4, 0], RightUpLeg: [-42, 0, -4], RightLeg: [58, 0, 0], RightFoot: [-4, 0, 0],
      LeftUpLeg: [12, 0, 4], LeftLeg: [32, 0, 0], LeftFoot: [10, 0, 0], LeftArm: [24, 0, -58], RightArm: [-34, 0, 54] }, [0.03, -0.075, 0.03]),
    le(0.54, { ...H_, Spine: [12, 0, 0] }, [0, -0.04, 0]),
  ]),
});
/* ---------------- ARENA Motion 2.4: dribles do FIFA 19 (elástico reverso, elástico triplo, giro de Berbatov) ----------------
 * O elástico reverso usa a MESMA perna do elástico com o movimento lateral invertido (primeiro a parte de dentro,
 * depois a de fora): rotações Y/Z e o quadril lateral do elástico original são negados, sem trocar esquerda/direita. */
(() => {
  const E = gf.elastico.keys;
  // pernas e tronco: mesmo osso com Y/Z negados; braços: espelhados (o braço de equilíbrio troca de lado)
  const negYZ = (k, t) => {
    const b = {};
    for (const [n, v] of Object.entries(k.b)) {
      const arm = /Arm$/.test(n);
      const dst = arm ? (n.startsWith("Left") ? n.replace("Left", "Right") : n.replace("Right", "Left")) : n;
      b[dst] = [v[0], -v[1], -v[2]];
    }
    return { t: t ?? k.t, b, hip: [-k.hip[0], k.hip[1], k.hip[2]] };
  };
  const at = (k, t) => ({ t, b: k.b, hip: k.hip });
  const dE = gf.elastico.dur, sh = 0.21;
  Object.assign(gf, {
    elasticoReverso: arenaClip(dE, E.map((k) => negYZ(k))),
    // elástico triplo: fora, dentro, fora, dentro e sai (o vaivém do elástico duas vezes)
    elasticoTriplo: arenaClip(dE + sh, [
      at(E[0], 0), at(E[1], 0.12), at(E[2], 0.23), at(E[1], 0.34), at(E[2], 0.45),
      ...E.slice(3).map((k) => at(k, k.t + sh)),
    ]),
    // Berbatov: pisa com a direita, puxa a bola para trás girando para a esquerda e sai com a esquerda
    berbaSpin: arenaClip(0.8, [
      le(0, { ...H_ }, [0, -0.03, 0]),
      le(0.12, { Spine: [-2, 0, 0], RightUpLeg: [-34, 0, -2], RightLeg: [32, 0, 0], RightFoot: [-24, 0, 0],
        LeftUpLeg: [-4, 0, 2], LeftLeg: [24, 0, 0], ...aBal }, [0, -0.04, -0.02]),
      le(0.26, { Hips: [0, 8, 0], Spine: [2, 6, 0], RightUpLeg: [8, 4, -4], RightLeg: [44, 0, 0], RightFoot: [-12, 0, 0],
        LeftUpLeg: [-8, 0, 4], LeftLeg: [30, 0, 0], ...aWideL }, [0, -0.06, -0.04]),
      le(0.4, { Hips: [0, 20, -4], Spine: [8, 14, -4], Neck: [4, -8, 0], RightUpLeg: [-4, 10, -6], RightLeg: [36, 0, 0],
        LeftUpLeg: [-22, -10, 10], LeftLeg: [40, 0, 0], LeftFoot: [-4, 0, 0], ...aWideL }, [0.02, -0.07, 0]),
      le(0.52, { Hips: [0, 14, -6], Spine: [12, 10, -6], LeftUpLeg: [-30, -16, 14], LeftLeg: [34, 0, 0], LeftFoot: [0, 0, 0],
        RightUpLeg: [2, 0, -4], RightLeg: [34, 0, 0], LeftArm: [-24, 0, -40], RightArm: [10, 0, 58] }, [0.03, -0.07, 0.02]),
      le(0.66, { Hips: [0, 6, -4], Spine: [16, 6, -4], Neck: [-4, -4, 0], LeftUpLeg: [-36, 0, 6], LeftLeg: [44, 0, 0],
        RightUpLeg: [8, 0, -4], RightLeg: [28, 0, 0], RightFoot: [10, 0, 0], LeftArm: [26, 0, -58], RightArm: [-30, 0, 54],
        LeftForeArm: [0, -40, 0], RightForeArm: [0, 44, 0] }, [0.02, -0.07, 0.03]),
      le(0.8, { ...H_ }, [0, -0.03, 0]),
    ]),
  });
})();
