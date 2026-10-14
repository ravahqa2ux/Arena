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
