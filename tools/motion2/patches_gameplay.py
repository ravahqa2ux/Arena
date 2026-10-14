# Gameplay 2.0 anchors (each must occur exactly once in the bundle).
# Scaled by globalThis.__gp2 multipliers; default 1 => identical to original.
PATCHES = [
    # --- inject the config + gp2() helper right after the Motion 2.0 module marker (So=new q(0,0,1);) ---
    # (handled in apply.py by prepending gameplay.js; see MODULE_PREPEND below)

    # pass lateral error (fG)
    (
        "function fG(n,e,t,i){return i.normal()*(.035+(1-n/100)*.55+(5-e)*.055+t*.18)}",
        "function fG(n,e,t,i){return i.normal()*(.035+(1-n/100)*.55+(5-e)*.055+t*.18*gp2('passPressure'))*gp2('passErr')}",
    ),
    # pass lane interception reach (f19LaneRisk)
    (
        'const reach=o.data.position==="GOL"?1.05:.78;',
        "const reach=(o.data.position===\"GOL\"?1.05*gp2('laneGk'):.78*gp2('laneReach'));",
    ),
    # shot spread (V_): l is the lateral spread; scale it
    (
        "l=(.16+i*1.35+n.distance*.026+o)*(1+Math.abs(n.angle)*.28)*a,u=e.normal()*l;",
        "l=(.16+i*1.35+n.distance*.026+o)*(1+Math.abs(n.angle)*.28)*a*gp2('shotSpread'),u=e.normal()*l;",
    ),
    # loose-ball defensive contact radius (resolveContacts): scale the non-keeper interception radius
    (
        "V=R?L?.85:O?.7:.42:I?D?this.passReceiver===g&&b<.5?1:.85:.72:.43,",
        "V=R?L?.85:O?.7:.42:I?D?this.passReceiver===g&&b<.5?1:.85:.72*gp2('intercept'):.43*gp2('intercept'),",
    ),
    # GK high-ball dive/jump reach (Z radius for keeper)
    (
        'Z=R?g.anim.action==="gkDiveHigh"?2.55:g.anim.action==="gkJump"?2.75:E?1.15:2.05:1.65;',
        "Z=R?(g.anim.action===\"gkDiveHigh\"?2.55:g.anim.action===\"gkJump\"?2.75:E?1.15:2.05)*gp2('gkHigh'):1.65;",
    ),
]
