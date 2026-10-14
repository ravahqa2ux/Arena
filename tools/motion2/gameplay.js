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
  },
  globalThis.__gp2 || {},
);
function gp2(k) {
  const c = globalThis.__gp2;
  return c && typeof c[k] === "number" ? c[k] : 1;
}
