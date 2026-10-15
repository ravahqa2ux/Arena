# Geometric test of goalkeeper positioning: for a grid of ball positions in the shooting zone,
# compute the largest uncovered angular gap of the goal (as seen from the ball) given the keeper
# position and a lateral reach r. Lower = better positioning. Compares original vs bisector formula.
import math

HALF_W = 3.66
def clamp(v, a, b): return max(a, min(b, v))

def depth(dx, pos=75):
    return 1.1 + pos * 0.005 + clamp(1 - dx / 40, 0, 1) * (1.3 + pos * 0.01)

def gk_orig(dx, bz, pos=75):
    lt = depth(dx, pos)
    return lt, clamp(bz * (0.14 + lt * 0.025), -HALF_W + 0.6, HALF_W - 0.6)

def gk_new(dx, bz, pos=75, w=1.0):
    lt = depth(dx, pos)
    # bisector of the angle ball->posts, intersected with the goal line, then walk out to depth lt
    a1 = math.atan2(-HALF_W - bz, -dx); a2 = math.atan2(HALF_W - bz, -dx)
    u = (math.cos(a1) + math.cos(a2), math.sin(a1) + math.sin(a2))
    gz = bz + u[1] * (-dx / u[0]) if abs(u[0]) > 1e-6 else 0
    t = clamp(lt / max(dx, 0.1), 0, 1)
    z = gz + (bz - gz) * t
    z = clamp(z, -HALF_W + 0.35, HALF_W - 0.35)
    zo = gk_orig(dx, bz, pos)[1]
    return lt, zo + (z - zo) * w

def gap(dx, bz, f, r=1.75):
    lt, gz = f(dx, bz)
    # angles measured from ball looking at goal line (x=0); keeper at (lt, gz)
    ang = lambda x, z: math.atan2(z - bz, dx - x)
    lo, hi = ang(0, -HALF_W), ang(0, HALF_W)
    kd = math.hypot(dx - lt, gz - bz)
    kc = ang(lt, gz); kw = math.atan2(r, kd)
    cl, ch = max(lo, kc - kw), min(hi, kc + kw)
    if ch <= cl: return math.degrees(hi - lo), math.degrees(hi - lo)
    return math.degrees(max(cl - lo, hi - ch)), math.degrees(hi - lo)

def run(f):
    worst, tot, n = 0, 0, 0
    for dx in [6, 8, 11, 14, 17, 20, 25, 30]:
        for bz in [-18, -14, -10, -7, -4, -2, 0, 2, 4, 7, 10, 14, 18]:
            if abs(bz) > 4 + dx * 1.4: continue
            g, full = gap(dx, bz, f)
            tot += g / full; n += 1; worst = max(worst, g / full)
    return tot / n, worst

if __name__ == "__main__":
    for name, f in [("original", gk_orig), ("bissetriz", gk_new)]:
        m, w = run(f)
        print(f"{name:10s} gap médio {100*m:5.1f}% do gol | pior {100*w:5.1f}%")
    for dx, bz in [(8, 12), (11, 0), (14, -10), (20, 15), (25, 5)]:
        print(dx, bz, "orig z=%.2f" % gk_orig(dx, bz)[1], "new z=%.2f" % gk_new(dx, bz)[1],
              "gap orig %.0f%% new %.0f%%" % tuple(100 * gap(dx, bz, f)[0] / gap(dx, bz, f)[1] for f in (gk_orig, gk_new)))
