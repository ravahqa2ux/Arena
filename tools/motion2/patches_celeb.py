# Extra anchors for the celebration wiring (each must occur exactly once in the bundle).
PATCHES = [
    (
        'const ARENA_CELEBS=["celebKneeSlide","celebJump","celebArms","celebPoint","celebAqui","celebCavalinho","celebBeijo"],'
        'ARENA_CELEB_ENTRY={celebKneeSlide:"run",celebArms:"any",celebPoint:"any",celebCavalinho:"slow"};',
        'const ARENA_CELEBS=["celebKneeSlide","celebJump","celebArms","celebPoint","celebAqui","celebCavalinho","celebBeijo",'
        '"celebSamba","celebRobo","celebGiro","celebOuvido","celebSilencio","celebBracos"],'
        'ARENA_CELEB_ENTRY={celebKneeSlide:"run",celebArms:"any",celebPoint:"any",celebCavalinho:"slow",celebOuvido:"any",celebSilencio:"any"};',
    ),
    (
        ':e==="Numpad8"&&this.arenaCelebPlay("celebArms")}',
        ':e==="Numpad8"?this.arenaCelebPlay("celebArms"):anim2CelebKey(this,e)}',
    ),
    (
        'u("rsUp",h<-.75)&&this.arenaCelebPlay("celebArms"))}',
        'u("rsUp",h<-.75)&&this.arenaCelebPlay("celebArms")),anim2CelebPad(this,e,l,u,o)}',
    ),
    (
        'this.playAction(f,h%2?"handsOnHips":"handsOnHead")',
        'this.playAction(f,["handsOnHead","handsOnHips","sadCrouch"][h%3])',
    ),
    (
        'this.playAction(o,i.mates.size%2?"clap":"celebPoint")',
        'this.playAction(o,["clap","celebPoint","celebPunho"][i.mates.size%3])',
    ),
    (
        '{action:"Aviãozinho (atalho ARENA)",keyboard:"Num 8",gamepad:"RS ↑"},',
        '{action:"Aviãozinho (atalho ARENA)",keyboard:"Num 8",gamepad:"RS ↑"},'
        '{action:"Samba no pé",keyboard:"1",gamepad:"D-pad ↓"},'
        '{action:"Robô",keyboard:"2",gamepad:"LB + D-pad ↓"},'
        '{action:"Giro no ar",keyboard:"3",gamepad:"D-pad ↑"},'
        '{action:"Não tô ouvindo!",keyboard:"4",gamepad:"D-pad ←"},'
        '{action:"Silêncio",keyboard:"5",gamepad:"D-pad →"},'
        '{action:"Braços cruzados",keyboard:"6",gamepad:"LB + D-pad ↑"},',
    ),
]
