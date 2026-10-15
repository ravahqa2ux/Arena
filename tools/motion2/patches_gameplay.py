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
    # ---- Gameplay 2.1 ----
    # GK lateral position: angle bisector
    (
        "Ne(this.ball.z*(.14+Lt*.025),-3.66+.6,Ce.goalHalfW-.6)",
        "gp2GkZ(this.ball.x,this.ball.z,Se,Oe,Lt,Ne(this.ball.z*(.14+Lt*.025),-3.66+.6,Ce.goalHalfW-.6))",
    ),
    # AI shielding (after the AI jockey assignment; slows the carrier while shielding)
    (
        '(v.anim.stance="jockey"),v.data.position==="GOL"&&this.owner!==v){',
        '(v.anim.stance="jockey"),gp2Shield(this,v)&&(M*=.8,b*=.8),v.data.position==="GOL"&&this.owner!==v){',
    ),
    # shielding body orientation
    (
        'v.anim.stance==="jockey"||v.data.position==="GOL"&&this.owner!==v?ls(this.ball.x-v.anim.x,this.ball.z-v.anim.z):',
        'gp2ShieldHeading(v)!=null?gp2ShieldHeading(v):v.anim.stance==="jockey"||v.data.position==="GOL"&&this.owner!==v?ls(this.ball.x-v.anim.x,this.ball.z-v.anim.z):',
    ),
    # standing tackle from behind on a shielding carrier can be blocked by the body
    (
        "h=l>-.15&&l<f&&u<(t.slide?.58:.5),p=this.owner&&this.owner.side!==e.side?this.owner:null;if(h)",
        "h=l>-.15&&l<f&&u<(t.slide?.58:.5),p=this.owner&&this.owner.side!==e.side?this.owner:null;if(h&&!(!t.slide&&gp2ShieldBlock(this,e,p)))",
    ),
    # aerial chest/thigh trap error
    (
        "k=Math.hypot(G.x,G.z)||1;this.ballVelocity.set(T.vx*.6+G.x/k*.9,-1.3,T.vz*.6+G.z/k*.9),",
        "k=Math.hypot(G.x,G.z)||1;const gp2In=this.ballVelocity.length();this.ballVelocity.set(T.vx*.6+G.x/k*.9,-1.3,T.vz*.6+G.z/k*.9),gp2TrapErr(this,T,gp2In),",
    ),
    # dribble touch: more visible leg action
    (
        "D[cn[`${H}UpLeg`]].quaternion.multiply(qn.setFromAxisAngle(Ch,-8*k*Ms)),D[cn[`${H}Leg`]].quaternion.multiply(qn.setFromAxisAngle(Ch,7*k*Ms)),D[cn[`${H}Foot`]].quaternion.multiply(qn.setFromAxisAngle(Ch,9*k*Ms))",
        "D[cn[`${H}UpLeg`]].quaternion.multiply(qn.setFromAxisAngle(Ch,-8*k*Ms*gp2('touchAmp'))),D[cn[`${H}Leg`]].quaternion.multiply(qn.setFromAxisAngle(Ch,7*k*Ms*gp2('touchAmp'))),D[cn[`${H}Foot`]].quaternion.multiply(qn.setFromAxisAngle(Ch,9*k*Ms*gp2('touchAmp')))",
    ),
]
