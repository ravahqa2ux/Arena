# ARENA Motion 2.4 + Gameplay 2.2

Fonte das camadas injetadas em `ARENA-Jogar.html`.
Para reaplicar num build novo do jogo (sem o patch):

    python3 tools/motion2/apply.py ARENA-original.html ARENA-Jogar.html

O script falha se alguma âncora do bundle não for encontrada exatamente uma vez.

| Arquivo | Conteúdo |
|---|---|
| `core.js` | camada procedural (corpo, olhar, inertialization, contato com o chão; Motion 2.1: contrapposto, braços relaxados, punho com atraso — desligável com `__anim2cfg.noWrist`) |
| `clips.js` | comemorações novas + ações redesenhadas (`gkCatch`, `gkCatchLow`, `tackle`, `chestControl`, `pass`) com os mesmos `dur`/`contact` do original |
| `core.js` (Motion 2.2) | dedos animados (`anim2Fingers`: mão fechada correndo, aberta no goleiro, agarra no `gkCatch`/segurando a bola), clavícula acompanha o braço (`anim2Shoulder`), toque de condução por tipo (`carry`/`turn`/`stop`) com olhar na bola |
| `core.js` (Motion 2.3) | poses de mão por dedo (punho, apontar, espalmada, segurando) por ação; linguagem corporal (`anim2Social`: pede a bola, goleiro organiza, zagueiro aponta a marcação, lamento após chute para fora; só visual); inclinação do corpo nas curvas |
| `skills.js`, `patches_skills.py` | dribles novos `pedaladaDupla`, `paraArranca`, `corteSeco`: trilhas, catálogo, gestos e listas da IA |
| `core.js` (Motion 2.4) | animação no mesmo relógio da simulação (antes ficava em câmera lenta abaixo de 20 fps; `__anim2cfg.oldDt` volta ao antigo); chute/passe de trivela com a perna girando para dentro |
| `clips.js`, `skills.js` (Motion 2.4) | dribles do FIFA 19: `elasticoReverso`, `elasticoTriplo`, `berbaSpin` |
| `controls.js`, `patches_controls.py` | Gameplay 2.2: trivela (LT + A / LT + B), cruzamento antecipado (LB + X) e rasteiro (LB + RB + X), linhas novas na tela de controles |
| `celeb.js`, `patches_celeb.py` | sistema de comemorações |
| `gameplay.js`, `patches_gameplay.py` | Gameplay 2.0: multiplicadores e regras novas em `globalThis.__gp2` |
| `harness/` | testes com Playwright: `gameplay.js` (IA × IA com seed, `SEED=n`), `shottest.js` (finalização controlada), `gkangle.py` (geometria do goleiro), `studio.js` (folhas de pose) |

## Chaves de `globalThis.__gp2`

| Chave | Padrão | Efeito |
|---|---|---|
| `passErr`, `passPressure` | 1,55 / 1,6 | erro de passe e peso da pressão |
| `laneReach`, `laneGk` | 1,22 / 1,3 | alcance de interceptação na linha de passe |
| `intercept` | 1,14 | raio de disputa de bola solta |
| `shotSpread` | 1,3 | dispersão do chute |
| `gkHigh` | 1,08 | alcance do goleiro na bola alta |
| `trapErr` | 1 | erro no domínio de peito/coxa (o original era sempre perfeito) |
| `shieldBlock` | 1 | proteção de bola (Espaço/LB) bloqueia bote em pé por trás |
| `touchAmp` | 1,8 | amplitude visual do toque de condução |
| `shieldAI` | 0 | IA protege a bola sob pressão. Experimental: nos testes não reduziu perdas de posse |
| `gkAngle` | 0 | goleiro na bissetriz do ângulo. Experimental: reduz o ângulo livre no modelo geométrico, mas sofreu mais gols nos testes de finalização |

Com valor 1 nos multiplicadores e 0 em `trapErr`/`shieldBlock`/`touchAmp=1`, o jogo volta ao original.
Depuração da animação: `globalThis.__anim2cfg = { noBody: 1, noGaze: 1, noFinal: 1, noWrist: 1, noShoulder: 1, noFingers: 1, noTouch: 1, noGesture: 1, noSocial: 1 }`; `bank` escala a inclinação nas curvas (0 desliga); `curl` força o fechamento dos dedos e `shGain` escala o ombro.

Testes novos em `harness/`: `skilltest.js <html> [tentativas] [dribles]` (melhor driblador × melhor marcador, % de posse mantida) e `devtest.js <html>` (controle padrão emulado e toques reais via CDP em viewport de celular) `dttest.js <html> [s] [cfg]` (relógio da animação no loop real em fps baixo) e `socialtest.js <html> [s] [partidas] [cfg]` (gestos em partida IA × IA com o animador rodando).
