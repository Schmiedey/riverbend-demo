# Draws the Riverbend site plan as inline SVG: partials/map.svg
import math, random
random.seed(11)
W = 600
hub = (300, 300)
parts = []
def P(x, y): return f"{x:.1f},{y:.1f}"

# river ring with an opening to the east (where the lot and gate are)
Rin, Rout = 196, 232
a0, a1 = math.radians(52), math.radians(336)
def pt(r, a): return (hub[0] + r * math.cos(a), hub[1] + r * math.sin(a))
o0, o1, i0, i1 = pt(Rout, a0), pt(Rout, a1), pt(Rin, a0), pt(Rin, a1)
river = f"M{P(*o0)} A{Rout} {Rout} 0 1 1 {P(*o1)} L{P(*i1)} A{Rin} {Rin} 0 1 0 {P(*i0)} Z"
parts.append(f'<path class="river" d="{river}"/>')

# trees
cols = ["#c2410c", "#d9731a", "#e0a526", "#8f2d12", "#6f8a2a", "#b45a14", "#d4572a"]
def in_gap(a): return not (a0 - 0.12 < (a % (2 * math.pi)) < a1 + 0.12)
trees = []
tries = 0
while len(trees) < 640 and tries < 40000:
    tries += 1
    r = random.uniform(150, 345)
    a = random.uniform(0, 2 * math.pi)
    if random.random() > math.exp(-abs(r - 214) / 46): continue
    x, y = pt(r, a)
    if not (4 < x < W - 4 and 4 < y < W - 4): continue
    if Rin - 3 < r < Rout + 3: continue
    if r < 172: continue
    if in_gap(a) and r < 345: continue
    if 450 < x < 580 and 296 < y < 424: continue
    trees.append((x, y, random.uniform(3.4, 6.6), random.choice(cols)))
trees.sort(key=lambda t: t[1])
parts.append('<g class="trees">' + "".join(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{c}"/>' for x, y, r, c in trees) + "</g>")

# walkway to the lot
parts.append(f'<path class="walk" d="M{P(*hub)} L470,330"/>')
# parking
parts.append('<g class="lot"><rect x="462" y="316" width="104" height="92" rx="2"/>' +
    "".join(f'<path d="M{474 + k * 12},326 v18 M{474 + k * 12},382 v18"/>' for k in range(8)) + '</g>')

R = 128
fields = [(1, 135, "12U"), (2, 45, "12U"), (3, 225, "14U"), (4, 315, "14U")]
for n, deg, age in fields:
    a = math.radians(deg)
    d = (math.cos(a), math.sin(a))
    home = (hub[0] + d[0] * 20, hub[1] + d[1] * 20)
    p1 = pt_ = (home[0] + R * math.cos(a - math.pi / 4), home[1] + R * math.sin(a - math.pi / 4))
    p2 = (home[0] + R * math.cos(a + math.pi / 4), home[1] + R * math.sin(a + math.pi / 4))
    fan = f"M{P(*home)} L{P(*p1)} A{R} {R} 0 0 1 {P(*p2)} Z"
    # infield diamond
    b1 = (home[0] + 52 * math.cos(a - math.pi / 4), home[1] + 52 * math.sin(a - math.pi / 4))
    b3 = (home[0] + 52 * math.cos(a + math.pi / 4), home[1] + 52 * math.sin(a + math.pi / 4))
    b2 = (home[0] + 73.5 * d[0], home[1] + 73.5 * d[1])
    dia = f"M{P(*home)} L{P(*b1)} L{P(*b2)} L{P(*b3)} Z"
    skin = f"M{P(*home)} L{P(*(home[0] + 66 * math.cos(a - math.pi / 4), home[1] + 66 * math.sin(a - math.pi / 4)))} A66 66 0 0 1 {P(*(home[0] + 66 * math.cos(a + math.pi / 4), home[1] + 66 * math.sin(a + math.pi / 4)))} Z"
    lab = (home[0] + d[0] * 98, home[1] + d[1] * 98)
    parts.append(
        f'<g class="fld" data-f="{n}"><path class="fan" d="{fan}"/><path class="skin" d="{skin}"/><path class="dia" d="{dia}"/>'
        f'<text x="{lab[0]:.1f}" y="{lab[1] - 2:.1f}" class="t1">Field {n}</text><text x="{lab[0]:.1f}" y="{lab[1] + 17:.1f}" class="t2">{age}</text></g>')

# plaza + HQ
parts.append(f'<g class="fld" data-f="0"><circle class="plaza" cx="{hub[0]}" cy="{hub[1]}" r="23"/><text x="{hub[0]}" y="{hub[1] + 5}" class="t3">HQ</text></g>')
parts.append('<text x="514" y="366" class="t2 mid">Parking</text>')
parts.append('<text x="470" y="302" class="t2">Main gate →</text>')

svg = (f'<svg class="sitemap" viewBox="0 0 {W} {W}" role="img" aria-labelledby="map-t map-d">'
       '<title id="map-t">Site plan of Riverbend Park Complex</title>'
       '<desc id="map-d">Fields 1 and 2, the 12U fields, are on the south side and Fields 3 and 4, the 14U fields, on the north side, all four around the HQ tent in the middle. A river bends around the west, north and south. Parking and the main gate are to the east.</desc>'
       f'<rect class="ground" width="{W}" height="{W}"/>' + "".join(parts) + '</svg>')
open("partials/map.svg", "w").write(svg)
print(len(svg), "bytes")
