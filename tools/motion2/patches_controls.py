# Gameplay 2.2 anchors: FIFA 19 controls (trivela pass/shot, early and ground cross) + controls table rows.
import os

_HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else HERE  # noqa: F821
_CTRL = open(os.path.join(_HERE, "controls.js"), encoding="utf-8").read()

PATCHES = [
    # helpers, right before the game class's input maps are used (module scope)
    ("function arenaScheme(){", _CTRL + "\nfunction arenaScheme(){"),
    # new specials take priority over the original modifier table
    ("modifier(e,t){var l,u,f;", "modifier(e,t){const fm2=arenaFlairMod(this,e,t);if(fm2)return fm2;var l,u,f;"),
    # kicker flag for the animation layer (outside-of-the-foot strike)
    ("this.playAction(e,p,M)", 'this.playAction(e,p,M),e.anim.trivela=a==="trivela"||a==="trivelaPass"?1:0'),
    # cross heights
    ('b=o==="drivenCross"?4.8:6.2+a*2.4', 'b=o==="drivenCross"?4.8:o==="groundCross"?.25:o==="earlyCross"?5.3:6.2+a*2.4'),
    # ground cross speed; trivela pass slightly lifted so the side-spin can bend it
    (
        "M=Ne(T/_*(1+T*.004),8,32)}{const ga2=t.anim.action;",
        'M=Ne(T/_*(1+T*.004),8,32);o==="groundCross"&&(M=Ne(I3(T,13,m),12,30))}o==="trivelaPass"&&(b=1.9);{const ga2=t.anim.action;',
    ),
    # side-spin
    (
        'this.ballSpin.set(A*M*2,o==="finesse"||u==="freeKick"?-Math.sign(A||1)*3.5:0,-v*M*2)',
        "this.ballSpin.set(A*M*2,arenaSpinY(o,u,A,t),-v*M*2)",
    ),
    # controls table
    (
        '{action:"Cavadinha",keyboard:"Q + L",gamepad:"LB + B"},',
        '{action:"Cavadinha",keyboard:"Q + L",gamepad:"LB + B"},'
        '{action:"Passe de trivela (parte de fora)",keyboard:"Espaço + K",gamepad:"LT + A"},'
        '{action:"Chute de trivela",keyboard:"Espaço + L",gamepad:"LT + B"},'
        '{action:"Cruzamento forte e baixo",keyboard:"E + J",gamepad:"RB + X"},'
        '{action:"Cruzamento antecipado",keyboard:"Q + J",gamepad:"LB + X"},'
        '{action:"Cruzamento rasteiro",keyboard:"Q + E + J",gamepad:"LB + RB + X"},'
        '{action:"Pique / arrancada explosiva (com bola: empurra e sai)",keyboard:"Shift duas vezes (segure)",gamepad:"R2/RT duas vezes (segure)"},',
    ),
    # camera follows with the real frame time too (it lagged behind under 20 fps)
    ("this.updateBallView(t),this.updateCamera(t)", "this.updateBallView(t),this.updateCamera(anim2FrameDt(i,t))"),
    # Motion 2.5: pique (R2 duas vezes) — detecção uma vez por quadro, depois dos controles
    ("this.pollKeyboardStick(e);this.previousActionKeys=e}", "arenaPique(this);this.pollKeyboardStick(e);this.previousActionKeys=e}"),
    # velocidade e aceleração da arrancada
    ("const E=this.playerSpeed(v),L=M*E,F=b*E,N=v.vx,_=v.vz;", "const E=this.playerSpeed(v)*arenaPiqueSpeed(v,e),L=M*E,F=b*E,N=v.vx,_=v.vz;"),
    ("W_(v.vx,v.vz,L,F,v.data.attrs.dri/99,e)", "W_(v.vx,v.vz,L,F,v.data.attrs.dri/99,e*arenaPiqueAcc(v))"),
]
