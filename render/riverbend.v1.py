# Builds the fictional Riverbend Park Complex and renders the site's pictures.
# Usage: blender -b -P riverbend.py -- <view> <out.png> [samples]
# Views: hero, plate, tower, map
import bpy, math, random, sys
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
VIEW = argv[0] if argv else "hero"
OUT = argv[1] if len(argv) > 1 else "/tmp/riverbend.png"
SAMPLES = int(argv[2]) if len(argv) > 2 else 48
random.seed(7)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ---------- helpers ----------
def mat(name, color, rough=0.8, emit=None, strength=0.0, metallic=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metallic
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1)
        b.inputs["Emission Strength"].default_value = strength
    return m

def striped(name, c1, c2, scale, angle):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Roughness"].default_value = 0.9
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Rotation"].default_value[2] = angle
    wv = nt.nodes.new("ShaderNodeTexWave")
    wv.inputs["Scale"].default_value = scale
    wv.inputs["Distortion"].default_value = 0.0
    wv.inputs["Detail"].default_value = 0.0
    try:
        wv.wave_profile = "SIN"
    except Exception:
        pass
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "CONSTANT"
    ramp.color_ramp.elements[0].color = (*c1, 1)
    ramp.color_ramp.elements[1].position = 0.5
    ramp.color_ramp.elements[1].color = (*c2, 1)
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    nt.links.new(mp.outputs["Vector"], wv.inputs["Vector"])
    nt.links.new(wv.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], b.inputs["Base Color"])
    return m

def noisy(name, c1, c2, scale=0.08, rough=0.95):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Roughness"].default_value = rough
    n = nt.nodes.new("ShaderNodeTexNoise")
    n.inputs["Scale"].default_value = scale
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (*c1, 1)
    ramp.color_ramp.elements[1].color = (*c2, 1)
    nt.links.new(n.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], b.inputs["Base Color"])
    return m

def mesh_obj(name, verts, faces, material, loc=(0, 0, 0)):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    ob = bpy.data.objects.new(name, me)
    ob.location = loc
    ob.data.materials.append(material)
    bpy.context.collection.objects.link(ob)
    return ob

def sector(name, center, r, a0, a1, z, material, steps=48, r_in=0.0):
    cx, cy = center
    verts, faces = [], []
    if r_in <= 0:
        verts.append((cx, cy, z))
        for i in range(steps + 1):
            a = a0 + (a1 - a0) * i / steps
            verts.append((cx + r * math.cos(a), cy + r * math.sin(a), z))
        for i in range(steps):
            faces.append((0, i + 1, i + 2))
    else:
        for i in range(steps + 1):
            a = a0 + (a1 - a0) * i / steps
            verts.append((cx + r_in * math.cos(a), cy + r_in * math.sin(a), z))
            verts.append((cx + r * math.cos(a), cy + r * math.sin(a), z))
        for i in range(steps):
            faces.append((2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2))
    return mesh_obj(name, verts, faces, material)

def poly(name, pts, z, material):
    return mesh_obj(name, [(x, y, z) for x, y in pts], [tuple(range(len(pts)))], material)

def box(name, loc, size, material, rot_z=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = size
    ob.rotation_euler[2] = rot_z
    ob.data.materials.append(material)
    return ob

def wall_arc(name, center, r, a0, a1, h, thick, material, steps=40):
    cx, cy = center
    verts, faces = [], []
    for i in range(steps + 1):
        a = a0 + (a1 - a0) * i / steps
        for rr in (r, r + thick):
            for zz in (0, h):
                verts.append((cx + rr * math.cos(a), cy + rr * math.sin(a), zz))
    for i in range(steps):
        o = 4 * i
        faces += [(o, o + 4, o + 5, o + 1), (o + 2, o + 3, o + 7, o + 6), (o + 1, o + 5, o + 7, o + 3)]
    return mesh_obj(name, verts, faces, material)

def rot(v, a):
    return Vector((v.x * math.cos(a) - v.y * math.sin(a), v.x * math.sin(a) + v.y * math.cos(a), 0))

# ---------- materials ----------
G_DARK = (0.030, 0.060, 0.020)
M = {
    "ground": noisy("ground", (0.035, 0.060, 0.020), (0.065, 0.072, 0.026), 0.02),
    "clay": noisy("clay", (0.42, 0.17, 0.07), (0.50, 0.23, 0.10), 0.6),
    "chalk": mat("chalk", (0.9, 0.9, 0.88), 0.6),
    "fence": mat("fence", (0.02, 0.05, 0.035), 0.7),
    "backstop": mat("backstop", (0.05, 0.05, 0.05), 0.5, metallic=0.6),
    "pole": mat("pole", (0.25, 0.25, 0.26), 0.5, metallic=0.8),
    "lamp": mat("lamp", (1, 1, 1), 0.3, emit=(1.0, 0.93, 0.80), strength=60),
    "water": mat("water", (0.010, 0.020, 0.028), 0.04),
    "concrete": noisy("concrete", (0.30, 0.29, 0.27), (0.36, 0.35, 0.33), 0.3),
    "asphalt": noisy("asphalt", (0.035, 0.035, 0.038), (0.05, 0.05, 0.05), 0.5),
    "tent": mat("tent", (0.80, 0.78, 0.74), 0.7),
    "bank": noisy("bank", (0.10, 0.07, 0.03), (0.06, 0.05, 0.02), 0.2),
}
LEAVES = [mat("leaf%d" % i, c, 0.9) for i, c in enumerate([
    (0.42, 0.10, 0.02), (0.62, 0.22, 0.03), (0.70, 0.42, 0.04),
    (0.30, 0.06, 0.03), (0.16, 0.20, 0.05), (0.55, 0.30, 0.05)])]
TRUNK = mat("trunk", (0.05, 0.035, 0.025), 0.9)

# ---------- ground, river, banks ----------
poly("ground", [(-6000, -6000), (6000, -6000), (6000, 6000), (-6000, 6000)], 0, M["ground"])
RC, R_IN, R_OUT = (0, 70), 175, 215
A0, A1 = math.radians(150), math.radians(390)
sector("bank_in", RC, R_IN, A0, A1, 0.01, M["bank"], 120, R_IN - 5)
sector("bank_out", RC, R_OUT + 6, A0, A1, 0.01, M["bank"], 120, R_OUT)
sector("river", RC, R_OUT, A0, A1, 0.02, M["water"], 160, R_IN)
# extend the river off-frame at both ends
for a, sgn in ((A0, 1), (A1, -1)):
    d = Vector((-math.sin(a), math.cos(a), 0)) * sgn
    p_in = Vector((RC[0] + R_IN * math.cos(a), RC[1] + R_IN * math.sin(a), 0))
    p_out = Vector((RC[0] + R_OUT * math.cos(a), RC[1] + R_OUT * math.sin(a), 0))
    poly("river_ext", [(p_in.x, p_in.y), (p_out.x, p_out.y), ((p_out + d * 600).x, (p_out + d * 600).y), ((p_in + d * 600).x, (p_in + d * 600).y)], 0.02, M["water"])

# ---------- the four fields ----------
HUB = Vector((0, 40, 0))
FIELDS = []
for i, deg in enumerate((225, 315, 135, 45)):  # field numbers 1-4
    th = math.radians(deg)
    d = Vector((math.cos(th), math.sin(th), 0))
    H = HUB + d * 16
    FIELDS.append((H, th, d))
    s1 = (0.045, 0.11, 0.03)
    s2 = (0.07, 0.15, 0.04)
    sector("outfield%d" % i, (H.x, H.y), 66, th - math.pi / 4, th + math.pi / 4, 0.02, striped("mow%d" % i, s1, s2, 0.11, th), 48)
    sector("skin%d" % i, (H.x, H.y), 27, th - math.pi / 4, th + math.pi / 4, 0.04, M["clay"], 32)
    b1 = H + rot(d, -math.pi / 4) * 18.3
    b3 = H + rot(d, math.pi / 4) * 18.3
    b2 = H + d * (18.3 * math.sqrt(2))
    c = (H + b2) / 2
    sq = [c + (p - c) * 0.80 for p in (H, b1, b2, b3)]
    poly("ingrass%d" % i, [(p.x, p.y) for p in sq], 0.05, striped("ig%d" % i, s2, s1, 0.25, th + 0.78))
    sector("mound%d" % i, ((H + d * 14).x, (H + d * 14).y), 2.6, 0, 2 * math.pi, 0.06, M["clay"], 20)
    sector("plate%d" % i, (H.x, H.y), 4.2, 0, 2 * math.pi, 0.06, M["clay"], 20)
    for j, p in enumerate((b1, b2, b3)):
        box("base%d%d" % (i, j), (p.x, p.y, 0.09), (0.45, 0.45, 0.08), M["chalk"], th)
    for side in (-1, 1):
        a = th + side * math.pi / 4
        e = Vector((math.cos(a), math.sin(a), 0))
        mid = H + e * 33
        box("foul%d%d" % (i, side), (mid.x, mid.y, 0.075), (66, 0.14, 0.02), M["chalk"], a)
    wall_arc("fence%d" % i, (H.x, H.y), 66, th - math.pi / 4, th + math.pi / 4, 2.2, 0.3, M["fence"])
    wall_arc("backstop%d" % i, (H.x, H.y), 7, th + math.pi - 0.9, th + math.pi + 0.9, 5.5, 0.15, M["backstop"], 16)
    # light poles: two along the baselines, two in the outfield corners
    for (r, off) in ((26, 1.25), (26, -1.25), (74, 0.62), (74, -0.62)):
        a = th + off
        p = H + Vector((math.cos(a), math.sin(a), 0)) * r
        bpy.ops.mesh.primitive_cylinder_add(radius=0.35, depth=24, location=(p.x, p.y, 12))
        pole = bpy.context.active_object
        pole.data.materials.append(M["pole"])
        box("lamp", (p.x, p.y, 24.3), (3.2, 0.5, 1.4), M["lamp"], a + math.pi / 2)
        tgt = H + d * 32
        ld = bpy.data.lights.new("spot", "SPOT")
        ld.energy = 110000 if r == 26 else 300000
        ld.spot_size = math.radians(75)
        ld.spot_blend = 0.8
        ld.color = (1.0, 0.92, 0.80)
        ld.use_shadow = False
        lo = bpy.data.objects.new("spot", ld)
        lo.location = (p.x, p.y, 24)
        dv = Vector((tgt.x, tgt.y, 0)) - Vector((p.x, p.y, 24))
        lo.rotation_euler = dv.to_track_quat("-Z", "Y").to_euler()
        bpy.context.collection.objects.link(lo)

# hub plaza, HQ tent, walkways, parking
sector("plaza", (HUB.x, HUB.y), 15, 0, 2 * math.pi, 0.03, M["concrete"], 40)
box("tent", (HUB.x, HUB.y, 1.6), (7, 5, 3.2), M["tent"])
bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=5.3, depth=2.2, location=(HUB.x, HUB.y, 4.3), rotation=(0, 0, math.pi / 4))
roof = bpy.context.active_object
roof.scale = (1.0, 0.72, 1)
roof.data.materials.append(mat("roof", (0.72, 0.28, 0.08), 0.7))
box("walk", (HUB.x + 120, HUB.y + 25, 0.03), (170, 4, 0.04), M["concrete"])
poly("parking", [(200, 20), (290, 20), (290, 110), (200, 110)], 0.03, M["asphalt"])
for k in range(13):
    x = 206 + k * 6.5
    for y in (40, 90):
        box("stall", (x, y, 0.06), (0.15, 12, 0.02), M["chalk"])

# ---------- trees ----------
tree_meshes = []
for k in range(6):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=1, location=(0, 0, -50))
    t = bpy.context.active_object
    for v in t.data.vertices:
        v.co *= random.uniform(0.86, 1.12)
    bpy.ops.object.shade_smooth()
    t.data.materials.append(LEAVES[k])
    tree_meshes.append(t.data)
    bpy.data.objects.remove(t)

def tree(x, y, s):
    me = random.choice(tree_meshes)
    ob = bpy.data.objects.new("tree", me)
    h = s * random.uniform(1.1, 1.5)
    ob.location = (x, y, h * 0.9 + 2)
    ob.scale = (s, s * random.uniform(0.85, 1.15), h)
    bpy.context.collection.objects.link(ob)

for _ in range(520):
    a = random.uniform(A0 - 0.2, A1 + 0.2)
    band = (R_IN - 26, R_IN - 10) if random.random() < 0.22 else (R_OUT + 10, R_OUT + 80)
    r = random.uniform(*band)
    tree(RC[0] + r * math.cos(a), RC[1] + r * math.sin(a), random.uniform(3.5, 7.5))
for _ in range(1400):  # woods behind, toward the horizon
    x, y = random.uniform(-1600, 1600), random.uniform(-1500, -150)
    if math.hypot(x - RC[0], y - RC[1]) < R_OUT + 20:
        continue
    tree(x, y, random.uniform(5, 9))
for _ in range(90):  # a few between fields and parking
    x, y = random.uniform(-160, 160), random.uniform(110, 240)
    if 190 < x < 300 and 10 < y < 120:
        continue
    tree(x, y, random.uniform(3, 6))

# ---------- world and sun ----------
world = bpy.data.worlds.new("dusk")
scene.world = world
world.use_nodes = True
wn = world.node_tree
bg = wn.nodes["Background"]
sky_ok = False
try:
    sky = wn.nodes.new("ShaderNodeTexSky")
    for t in ("MULTIPLE_SCATTERING", "NISHITA", "SINGLE_SCATTERING", "HOSEK_WILKIE"):
        try:
            sky.sky_type = t
            break
        except Exception:
            pass
    for attr, val in (("sun_elevation", math.radians(1.2)), ("sun_rotation", math.radians(200)), ("altitude", 30), ("air_density", 1.4), ("dust_density", 3.0)):
        if hasattr(sky, attr):
            setattr(sky, attr, val)
    wn.links.new(sky.outputs["Color"], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = 0.42
    sky_ok = True
except Exception as e:
    print("sky failed", e)
if not sky_ok:
    bg.inputs["Color"].default_value = (0.25, 0.12, 0.08, 1)

sun_d = bpy.data.lights.new("sun", "SUN")
sun_d.energy = 1.2
sun_d.color = (1.0, 0.55, 0.28)
sun = bpy.data.objects.new("sun", sun_d)
sun.rotation_euler = (math.radians(88), 0, math.radians(200 + 90))
scene.collection.objects.link(sun)

# ---------- render settings ----------
for eng in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT"):
    try:
        scene.render.engine = eng
        break
    except Exception:
        pass
ee = scene.eevee
for attr, val in (("taa_render_samples", SAMPLES), ("use_raytracing", True), ("use_shadows", True), ("use_gtao", True)):
    if hasattr(ee, attr):
        try:
            setattr(ee, attr, val)
        except Exception:
            pass
try:
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
except Exception:
    pass
scene.view_settings.exposure = 0.0

# ---------- cameras ----------
cam_d = bpy.data.cameras.new("cam")
cam = bpy.data.objects.new("cam", cam_d)
scene.collection.objects.link(cam)
scene.camera = cam

def aim(loc, target, lens):
    cam.location = loc
    cam.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    cam_d.lens = lens
    cam_d.clip_end = 5000

H1, th1, d1 = FIELDS[0]
if VIEW == "hero":
    scene.render.resolution_x, scene.render.resolution_y = 2400, 1500
    aim((-150, 235, 95), (90, 94, 0), 22)
    cam_d.dof.use_dof = True
    cam_d.dof.focus_distance = (Vector((-150, 235, 95)) - Vector((0, 40, 0))).length
    cam_d.dof.aperture_fstop = 0.015
elif VIEW == "plate":
    scene.render.resolution_x, scene.render.resolution_y = 1600, 2000
    p = H1 - d1 * 4.2
    aim((p.x, p.y, 1.3), ((H1 + d1 * 40).x, (H1 + d1 * 40).y, 3.2), 24)
elif VIEW == "loop":
    scene.render.resolution_x, scene.render.resolution_y = 1280, 1280
    scene.frame_start, scene.frame_end = 1, 96
    scene.render.fps = 24
    base = Vector((-120, 250, 130)) - HUB
    tgt = Vector((0, -40, 0))
    cam_d.lens = 34
    def place(sc, *_):
        t = (sc.frame_current - 1) / 96.0
        a = 0.09 * math.sin(2 * math.pi * t)
        p = HUB + Vector((base.x * math.cos(a) - base.y * math.sin(a), base.x * math.sin(a) + base.y * math.cos(a), base.z + 6 * math.cos(2 * math.pi * t)))
        cam.location = p
        cam.rotation_euler = (tgt - p).to_track_quat("-Z", "Y").to_euler()
    bpy.app.handlers.frame_change_pre.append(place)
    place(scene)
elif VIEW == "river":
    scene.render.resolution_x, scene.render.resolution_y = 1600, 2000
    aim((-20, -132, 22), (0, 30, 0), 30)
elif VIEW == "tower":
    scene.render.resolution_x, scene.render.resolution_y = 1600, 2000
    a = th1 + 1.25
    pp = H1 + Vector((math.cos(a), math.sin(a), 0)) * 26
    cpos = pp + (H1 + d1 * 32 - pp).normalized() * 9
    aim((cpos.x, cpos.y, 2.0), (pp.x, pp.y, 23), 30)
elif VIEW == "map":
    scene.render.resolution_x, scene.render.resolution_y = 1800, 1800
    cam_d.type = "ORTHO"
    cam_d.ortho_scale = 330
    cam.location = (HUB.x, HUB.y + 10, 400)
    cam.rotation_euler = (0, 0, 0)
    scene.view_settings.exposure = 0.6

scene.render.image_settings.file_format = "PNG"
scene.render.filepath = OUT
if VIEW == "loop":
    bpy.ops.render.render(animation=True)
else:
    bpy.ops.render.render(write_still=True)
print("WROTE", OUT)
