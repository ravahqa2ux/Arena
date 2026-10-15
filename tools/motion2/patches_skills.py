# Motion 2.2 anchors: new dribbles (tracks/catalogue, gestures, AI) and touch kind for the animator.
import os

_HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else HERE  # noqa: F821
_SKILLS = open(os.path.join(_HERE, "skills.js"), encoding="utf-8").read()

PATCHES = [
    # tracks + catalogue entries, right after the original O3 tables
    ("function Qp(n){return!!n&&Object.hasOwn(O3,n)}", _SKILLS + "\nfunction Qp(n){return!!n&&Object.hasOwn(O3,n)}"),
    # gestures (RS / numpad flicks): ↖↖ / ↗↗ corte seco, ↗↖ / ↖↗ pedalada dupla, ↓↓ para e arranca
    (
        'if(a([5,5]))return o("giro",-1);',
        'if(a([5,5]))return o("giro",-1);if(a([1,1]))return o("corteSeco",1);if(a([7,7]))return o("corteSeco",-1);'
        'if(a([7,1]))return o("pedaladaDupla",1);if(a([1,7]))return o("pedaladaDupla",-1);'
        'if(a([4,4]))return o("paraArranca",1);'
        # Motion 2.4: ↙↘ / ↘↙ elástico reverso, ↘↖ / ↙↗ elástico triplo, ↓↖ / ↓↗ giro de Berbatov
        'if(a([3,5]))return o("elasticoReverso",1);if(a([5,3]))return o("elasticoReverso",-1);'
        'if(a([5,1]))return o("elasticoTriplo",1);if(a([3,7]))return o("elasticoTriplo",-1);'
        'if(a([4,1]))return o("berbaSpin",1);if(a([4,7]))return o("berbaSpin",-1);',
    ),
    # AI repertoire
    (
        '["fintaCorpo","elastico","laCroqueta","pedalada","paraGira","giro","chapeu","rolarCorte"]',
        '["fintaCorpo","elastico","laCroqueta","pedalada","paraGira","giro","chapeu","rolarCorte","pedaladaDupla","corteSeco","paraArranca","elasticoReverso","berbaSpin"]',
    ),
    (
        '["pedalada","fintaCorpo","roleta","heelToHeel","laCroqueta","fintaSaida","paraGira","giro","rolarCorte"]',
        '["pedalada","fintaCorpo","roleta","heelToHeel","laCroqueta","fintaSaida","paraGira","giro","rolarCorte","pedaladaDupla","corteSeco","paraArranca","berbaSpin"]',
    ),
    (
        '["pedalada","fintaCorpo","roleta","fintaSaida","pedaladaReversa","rolarCorte"]',
        '["pedalada","fintaCorpo","roleta","fintaSaida","pedaladaReversa","rolarCorte","corteSeco","paraArranca"]',
    ),
    (
        '["pedalada","fintaCorpo","puxada","pedaladaReversa"]',
        '["pedalada","fintaCorpo","puxada","pedaladaReversa","paraArranca"]',
    ),
    # tipo do toque de condução (carry / turn / stop) visível para a camada de animação
    ("st.kind=kind;st.pending=true;st.steps=0};", "st.kind=kind;v.anim.touchKind=kind;st.pending=true;st.steps=0};"),
]
