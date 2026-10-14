#!/usr/bin/env python3
"""Injects ARENA Motion 2.0 into the built ARENA-Jogar.html.

usage: apply.py <in.html> <out.html> [--module-out module.mjs]
Every anchor must occur exactly once, otherwise the script aborts without writing.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))


def read(name):
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        return f.read()


def main():
    src, dst = sys.argv[1], sys.argv[2]
    mod_out = None
    if "--module-out" in sys.argv:
        mod_out = sys.argv[sys.argv.index("--module-out") + 1]
    html = open(src, encoding="utf-8").read()
    tag = '<script type="module">'
    a = html.index(tag) + len(tag)
    b = html.rindex("</script>")
    js = html[a:b]
    if "anim2Body" in js:
        sys.exit("input already patched")

    core = read("core.js")
    clips = read("clips.js") if os.path.exists(os.path.join(HERE, "clips.js")) else ""
    celeb = read("celeb.js") if os.path.exists(os.path.join(HERE, "celeb.js")) else ""

    patches = [
        # 1. módulo novo, logo antes da classe do animador do jogador
        ("So=new q(0,0,1);class _w{", "So=new q(0,0,1);\n" + core + "\n" + celeb + "\nclass _w{"),
        # 2. estado por jogador
        ("this.idleT=t.seed%37*.13}setBody(", "this.idleT=t.seed%37*.13,anim2Init(this,t)}setBody("),
        # 3. camada de corpo (antes do olhar e dos IKs de locomoção)
        ("let V=0,Z=0;const z=e.lookW*(1-a);", "anim2Body(this,e,t,D,a,g,v,o,T);let V=0,Z=0;const z=e.lookW*(1-a);"),
        # 4. olhar
        (
            "if(this.lookYaw=yi(this.lookYaw,V,7,t)",
            "if(V=anim2Gaze(this,e,V,Z,a,g,o,t),Z=this.anim2?this.anim2.gz:Z,this.lookYaw=yi(this.lookYaw,V,7,t)",
        ),
        # 5. transições suaves no fim do update
        ("}}}dispose(){var e;", "}}anim2Final(this,e,t)}dispose(){var e;"),
        # 6. fase do jogo + fôlego
        (
            "for(const m of this.actors)m.model.update(m.anim,t)",
            "for(const m of this.actors)anim2Feed(m,a),m.model.update(m.anim,t)",
        ),
    ]
    if clips:
        patches.append(("const bh={gk:", clips + "\nconst bh={gk:"))
    extra = os.path.join(HERE, "patches_celeb.py")
    if os.path.exists(extra):
        ns = {}
        exec(open(extra, encoding="utf-8").read(), ns)
        patches += ns["PATCHES"]

    for needle, repl in patches:
        n = js.count(needle)
        if n != 1:
            sys.exit(f"anchor count {n} != 1: {needle[:90]!r}")
        js = js.replace(needle, repl)

    out = html[:a] + js + html[b:]
    os.makedirs(os.path.dirname(os.path.abspath(dst)), exist_ok=True)
    with open(dst, "w", encoding="utf-8") as f:
        f.write(out)
    if mod_out:
        with open(mod_out, "w", encoding="utf-8") as f:
            f.write(js)
    print(f"ok: {len(patches)} patches, {len(out) - len(html):+d} chars -> {dst}")


if __name__ == "__main__":
    main()
