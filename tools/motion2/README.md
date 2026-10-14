# ARENA Motion 2.0 + Gameplay 2.0

Fonte das camadas injetadas em `ARENA-Jogar.html`.
Para reaplicar num build novo do jogo (sem o patch):

    python3 tools/motion2/apply.py ARENA-original.html ARENA-Jogar.html

O script falha se alguma âncora do bundle não for encontrada exatamente uma vez.

| Arquivo | Conteúdo |
|---|---|
| `core.js` | camada procedural (corpo, olhar, inertialization, contato com o chão) |
| `clips.js` | comemorações novas + ações redesenhadas (`gkCatch`, `gkCatchLow`, `tackle`, `chestControl`, `pass`) com os mesmos `dur`/`contact` do original |
| `celeb.js`, `patches_celeb.py` | sistema de comemorações |
| `gameplay.js`, `patches_gameplay.py` | Gameplay 2.0: multiplicadores em `globalThis.__gp2` |

Depuração no navegador:
- `globalThis.__anim2cfg = { noBody: 1, noGaze: 1, noFinal: 1 }` desliga cada camada de animação.
- `globalThis.__gp2 = { passErr: 1, passPressure: 1, laneReach: 1, laneGk: 1, shotSpread: 1, gkHigh: 1, intercept: 1 }` volta a jogabilidade ao comportamento original (qualquer chave ausente vale 1).
