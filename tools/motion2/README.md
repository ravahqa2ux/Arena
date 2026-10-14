# ARENA Motion 2.0

Fonte da camada de animação injetada em `ARENA-Jogar.html`.
Para reaplicar num build novo do jogo (sem o patch):

    python3 tools/motion2/apply.py ARENA-original.html ARENA-Jogar.html

O script falha se alguma âncora do bundle não for encontrada exatamente uma vez.
Para depurar no navegador: `globalThis.__anim2cfg = { noBody: 1, noGaze: 1, noFinal: 1 }` desliga cada camada.
