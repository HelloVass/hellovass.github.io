// lib.js: staging helpers for the whole-pose film.
//
// Every figure on screen is ONE complete drawing of a pose (see scripts/build-sprites.py). Nothing here bends, cuts or
// re-joins a body: a pose changes by swapping one whole drawing for another, and between swaps the drawing only
// breathes, bobs to the beat and travels with the camera. Everything is a pure function of t.

// ---------- loading ----------
const _engineSetup = setup;
setup = async function () {
  const all = Object.values(SPRITES); let got = 0, next = 0;
  const load1 = async s => { for (let k = 0; ; k++) { try { s.img = await loadImage(SPRITE_DIR + s.file); break; } catch (e) { if (k >= 3) throw e; await new Promise(r => setTimeout(r, 500 * (k + 1))); } }
    if (window.onSpriteProgress) window.onSpriteProgress(++got, all.length); };
  await Promise.all(Array.from({ length: 6 }, async () => { while (next < all.length) await load1(all[next++]); }));
  await _engineSetup();
};

// ---------- beats ----------
const B = n => OFF + n * BEAT;                       // time of beat n (bars start on beats 0, 4, 8, ...)
const bseg = (t, a, b) => seg(t, B(a), B(b));        // 0..1 progress through beats [a, b]
const hitAge = (t, beats) => { let a = Infinity; for (const b of beats) { const d = t - B(b); if (d >= 0 && d < a) a = d; } return a; };

// ---------- brush bookkeeping ----------
// p5.brush defers its strokes, so anything painted has to be flushed before an image() that should sit on top of it.
let DIRTY = false;
function P(pts, o) { paint(pts, o); DIRTY = true; }
function settle() { if (DIRTY) { flushBrush(); DIRTY = false; } }

// ---------- the view: a camera on a 1920×1080 world, optionally clipped to it ----------
// A scene is drawn in world coordinates. view(cx, cy, z) looks at world point (cx, cy) with zoom z ≥ 1, clamped so the
// window never leaves the world. Backdrops and sprites cut themselves to the window (source-rect crops, no clip path),
// so the same scene can fill the screen or sit inside a small photo card.
let VIEW = null;
function viewBegin(cx = 960, cy = 540, z = 1) {
  z = Math.max(1, z); const hw = 960 / z, hh = 540 / z;
  cx = clamp(cx, hw, 1920 - hw); cy = clamp(cy, hh, 1080 - hh);
  VIEW = { cx, cy, z, x0: cx - hw, y0: cy - hh, x1: cx + hw, y1: cy + hh };
  push(); translate(960, 540); scale(z); translate(-cx, -cy);
}
function viewEnd() { settle(); pop(); VIEW = null; }

// The backdrop painting covers the whole world; only the window is drawn. A painting taller than 16:9 loses a band
// top and bottom: ay says which part to keep (0 = keep the top, 1 = keep the bottom).
function backdrop(name, a = 1, ay = .5) {
  const s = SPRITES[name], k = Math.max(1920 / s.w, 1080 / s.h), ox = (1920 - s.w * k) / 2, oy = (1080 - s.h * k) * ay, v = VIEW;
  settle();
  if (a < 1) tint(255, 255 * clamp(a));
  image(s.img, v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0, (v.x0 - ox) / k, (v.y0 - oy) / k, (v.x1 - v.x0) / k, (v.y1 - v.y0) / k);
  noTint();
}
// A flat painted ground of colour for scenes without a backdrop painting (kept inside the window).
function ground(col, op = 255) { const v = VIEW; boilSeed('ground'); P(rectPts(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0), { wash: col, washOp: op, ink: null }); }
// A soft watercolour blot behind a figure.
function blot(x, y, rx, ry, col, op = 110, key = 'blot') {
  const v = VIEW; if (v && (x - rx < v.x0 || x + rx > v.x1 || y - ry < v.y0 || y + ry > v.y1)) return;   // never spills out of a card
  boilSeed(key); P(ellPts(x, y, rx, ry, 26, 0), { fill: col, fillOp: op, bleed: .12, tex: .5, border: .2, ink: null });
}

// spr(name, x, y, h): one whole drawing with its bottom-centre at (x, y), h world px tall, cut to the window.
//   a = opacity, sx/sy = stretch about the feet, rot = lean about the feet (ignored when the drawing crosses the window
//   edge, where it must be cut straight), flip = mirror.
function spr(name, x, y, h, o = {}) {
  const s = SPRITES[name], a = o.a ?? 1; if (a <= .004 || !s) return;
  const w = s.w * h / s.h * (o.sx ?? 1), hh = h * (o.sy ?? 1), v = VIEW;
  const x0 = x - w / 2, y0 = y - hh, x1 = x + w / 2, y1 = y;
  settle();
  if (a < 1) tint(255, 255 * clamp(a));
  const inside = x0 >= v.x0 && x1 <= v.x1 && y0 >= v.y0 && y1 <= v.y1;
  if (inside && (o.rot || o.flip)) {
    push(); translate(x, y); rotate(o.rot || 0); if (o.flip) scale(-1, 1); image(s.img, -w / 2, -hh, w, hh); pop();
  } else {
    const cx0 = Math.max(x0, v.x0), cy0 = Math.max(y0, v.y0), cx1 = Math.min(x1, v.x1), cy1 = Math.min(y1, v.y1);
    if (cx1 > cx0 && cy1 > cy0) {
      const u = q => (q - x0) / (x1 - x0) * s.w, vv = q => (q - y0) / (y1 - y0) * s.h;
      image(s.img, cx0, cy0, cx1 - cx0, cy1 - cy0, u(cx0), vv(cy0), u(cx1) - u(cx0), vv(cy1) - vv(cy0));
    }
  }
  noTint();
}
// Soft contact shadow under feet that stand on a painted ground.
function shadow(x, y, rx, key = 'shadow', op = 70) {
  const v = VIEW, ry = rx * .16; if (v && (x - rx < v.x0 || x + rx > v.x1 || y + ry > v.y1)) return;
  boilSeed(key); P(ellPts(x, y, rx, ry, 20, 0), { fill: '#5E4B3A', fillOp: op, bleed: .08, tex: .3, border: .1, ink: null });
}

// ---------- stillness ----------
// A drawing holds perfectly still between pose changes: no breathing, no sway, no dip on the beat. (At 141 BPM a
// beat-locked bob on a painted figure reads as shaking, not as life.) The shot stays alive through the camera, the
// petals and the events. alive() is kept as the one place to change that.
function alive() { return { sy: 1, rot: 0 }; }
// Pose changes: keys = [[time, pose], ...] where pose = { name, x, y, h }. One whole drawing replaces another on a
// single frame (never a cross-fade: two half-transparent bodies read as a ghost), and the new one pops in with a
// small overshoot, like a drawn pose change.
function poses(t, keys) {
  let i = 0; while (i + 1 < keys.length && t >= keys[i + 1][0]) i++;
  const age = t - keys[i][0];
  return [{ ...keys[i][1], a: 1, k: i > 0 ? .94 + .06 * backOut(age / .3) : 1 }];
}
function drawPoses(t, keys, life = {}, a = 1) {
  for (const p of poses(t, keys)) spr(p.name, p.x, p.y, p.h * p.k, { a: p.a * a, sx: 1 / Math.sqrt(p.k), sy: life.sy, rot: life.rot });
}
// A drawing arriving: it fades up while rising into place.
const arrive = (t, t0, d = .55) => { const k = seg(t, t0, t0 + d); return { a: ease(k), dy: 26 * (1 - easeOut(k)) }; };
// A small happy hop that starts at t0 (h px high), for shuffling closer.
const hop = (t, t0, d = .34, h = 26) => { const k = (t - t0) / d; return k <= 0 || k >= 1 ? 0 : -h * 4 * k * (1 - k); };

// ---------- photo cards ----------
// A memory is a white-bordered print with a painted scene inside. At w = FULL its inside fills the screen exactly, so
// a shot can play full-frame and then shrink into the album as the very same picture.
const CARD_B = .032, FULL = 1920 / (1 - 2 * CARD_B);
function card(key, cx, cy, w, rot, inner, o = {}) {
  const ar = o.ar ?? 9 / 16, b = w * CARD_B, iw = w - 2 * b, ih = iw * ar, h = ih + 2 * b + (o.chin ?? 0) * w;
  push(); translate(cx, cy); rotate(rot);
  if (w < FULL * .995) {
    boilSeed(key);
    P(rectPts(-w / 2 + w * .012, -h / 2 + w * .016, w, h, 0), { wash: '#8C7558', washOp: 46, ink: null });
    P(rectPts(-w / 2, -h / 2, w, h, .6), { wash: '#FFFBF3', ink: '#CDBBA0', sw: .5 });
  }
  settle();
  push(); translate(-iw / 2, -ih / 2 - (o.chin ?? 0) * w / 2); scale(iw / 1920);
  inner();
  pop(); pop();
}
// Interpolate a card between two placements {x, y, w, r}.
const place = (a, b, k) => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), w: lerp(a.w, b.w, k), r: lerp(a.r, b.r, k) });
const SCREEN = { x: 960, y: 540, w: FULL, r: 0 };

// ---------- painted effects (screen space unless noted) ----------
// Falling petals. They are flat wash marks, so they belong to the paint, and they never stop.
function petals(t, n = 22, cols = ['#F6C9CF', '#FBE3DC', '#F2B7C0'], key = 'petals', k = 1) {
  boilSeed(key);
  for (let i = 0; i < n; i++) {
    const sp = .045 + .05 * hash(i * 3.1), y = (frac(hash(i * 7.7) + t * sp) * 1.25 - .12) * H;
    const x = (hash(i * 5.3) * 1.2 - .1) * W + 70 * Math.sin(t * (.5 + hash(i)) + i * 2.4) - 30 * t * sp;
    const r = (8 + 9 * hash(i * 1.9)) * k, rot = t * (.6 + 1.4 * hash(i * 2.7)) + i;
    P(ellPts(x, y, r, r * (.45 + .25 * Math.sin(t * 2 + i)), 8, 0, rot), { wash: cols[i % cols.length], washOp: 215, ink: null });
  }
}
// Heart outline points, centred at (cx, cy), about 2r wide (from the kit's clawd.js, which this film does not load).
function heartPts(cx, cy, r, n = 22) {
  const p = []; for (let i = 0; i < n; i++) { const a = i / n * TAU; p.push([cx + 16 * Math.pow(Math.sin(a), 3) * r / 16, cy - (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * r / 16]); } return p;
}
// Little hearts rising from (x, y), n of them, starting at t0.
function hearts(t, t0, x, y, n = 4, s = 20, key = 'hearts') {
  boilSeed(key + t0);
  for (let i = 0; i < n; i++) {
    const age = t - t0 - i * .2; if (age <= 0 || age > 1.9) continue;
    const hx = x + (hash(i * 9.1 + t0) - .5) * 150 + 22 * Math.sin(age * 4 + i * 2), hy = y - 150 * age - 30 * age * age;
    const r = s * (.7 + .5 * hash(i * 4.3)) * backOut(age * 3.2) * (1 - seg(age, 1.4, 1.9));
    if (r > 1) P(heartPts(hx, hy, r), { wash: i % 2 ? '#EE8FA2' : '#E66F88', washOp: 235, ink: '#B9506A', sw: .45 });
  }
}
// Four-point sparkles twinkling around (x, y) within radius rad.
function sparkles(t, x, y, rad, n = 7, col = '#FFF3C4', key = 'sparkles', k = 1) {
  boilSeed(key);
  for (let i = 0; i < n; i++) {
    const a = hash(i * 3.7 + 1) * TAU + t * .25, d = rad * (.45 + .55 * hash(i * 6.1)), tw = .5 + .5 * Math.sin(t * (3 + 2 * hash(i)) + i * 1.7);
    const r = (10 + 14 * hash(i * 2.2)) * tw * k; if (r < 2) continue;
    P(starPts(x + Math.cos(a) * d, y + Math.sin(a) * d * .8, r, .28, 4, t * .4 + i), { wash: col, washOp: 240, ink: '#E5C77A', sw: .3 });
  }
}
// Confetti burst from (x, y) at t0: paper bits that fly out on arcs and flutter down.
// dir = -1 throws up and to the left, +1 up and to the right, 0 all around.
function confetti(t, t0, x, y, n = 26, cols = ['#D8574F', '#F2C14E', '#F6C9CF', '#FBE3DC'], key = 'confetti', dir = 0) {
  const age = t - t0; if (age <= 0 || age > 3.2) return;
  boilSeed(key + t0 + dir);
  for (let i = 0; i < n; i++) {
    const a = dir ? -Math.PI * (.5 - dir * (.04 + .4 * hash(i * 3.3))) : -Math.PI * (.12 + .76 * hash(i * 3.3)), v = 520 + 620 * hash(i * 5.9), drag = 1 - Math.exp(-2.2 * age);
    const px = x + Math.cos(a) * v * drag / 2.2 + 26 * Math.sin(age * 5 + i), py = y + Math.sin(a) * v * drag / 2.2 + 190 * age * age;
    const r = 11 + 9 * hash(i * 1.3), fl = Math.abs(Math.sin(age * 7 + i * 1.9));
    P(rectPts(px - r, py - r * .5 * fl, 2 * r, r * fl + 2), { wash: cols[i % cols.length], washOp: 235 * (1 - seg(age, 2.6, 3.2)), ink: null });
  }
}
// Paper-coloured brush wipe across a seam at time ts: covers before it, clears after it.
const WIPE = ['#F0E7D7', '#F8EEDC'];
function seam(t, ts, half = .3, cols = WIPE) { if (Math.abs(t - ts) < half) { boilSeed('seam' + ts); brushWipe((t - ts + half) / (2 * half), cols); } }

// ---------- the beat, carried by the picture and by what is IN the picture — never by a figure ----------
// A figure that bobs to a 141 BPM beat reads as shaking, and a sparkle pasted on a scene that has no reason to sparkle
// reads as an effect. What moves to the music instead:
//   · the whole frame: one small push-in on each bar's downbeat, with a soft lift of light (film() applies both);
//   · the things a picture already contains, moved as themselves: the sea rolls, a wave washes up the sand, leaves and
//     lanterns swing, balloons bob, a turbine turns, city lights come on, leaves fall, gulls fly, fireworks open.
// Each picture gets only what it actually shows (see ENV in scene.js); many get nothing. These are drawn only in the
// live full-frame picture (LIVE), never in the small prints of the album.
let LIVE = false;
const WARP_DEBUG = false;                               // true: outline every moving region (for placing them)
const beatPos = t => (t - OFF) / BEAT;
// 1 on every `every`-th beat (shifted by phase), then decaying; a one-frame attack keeps it from popping.
const hit = (t, every = 1, k = 3.2, phase = 0) => { const a = (((beatPos(t) - phase) % every) + every) % every; return a < .1 ? a / .1 : Math.exp(-k * (a - .1)); };
const lastBeat = (t, every = 1, phase = 0) => Math.floor((beatPos(t) - phase) / every) * every + phase;
// A counter that advances by 1 each step but does most of the move right at the start of the step: motion that
// lands on the beat and then settles. p = how sharply (1 = even).
const kick = (x, p = 1.7) => Math.floor(x) + 1 - Math.pow(1 - (x - Math.floor(x)), p);

// warp(name, ay, [u0, v0, u1, v1], fn): redraw one region of a painting (fractions of the painting) as a mesh whose
// points are moved by fn(a, b) → [dx, dy] in world px (a, b = 0..1 across the region). The move fades to nothing at the
// region's edges, so the moving part stays joined to the still picture; o.free lists edges ('t', 'b', 'l', 'r') that are
// the painting's own border and may move freely. The same mapping as backdrop(name, 1, ay).
function warp(name, ay, [u0, v0, u1, v1], fn, o = {}) {
  if (!LIVE) return;
  const s = SPRITES[name], k = Math.max(1920 / s.w, 1080 / s.h), ox = (1920 - s.w * k) / 2, oy = (1080 - s.h * k) * ay;
  const nx = o.nx ?? 16, ny = o.ny ?? 10, free = o.free ?? '', m = o.margin ?? .28, ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  const P0 = [];
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const a = i / nx, b = j / ny, u = lerp(u0, u1, a), v = lerp(v0, v1, b), [dx, dy] = fn(a, b);
    const e = (free.includes('l') ? 1 : ss(a / m)) * (free.includes('r') ? 1 : ss((1 - a) / m)) * (free.includes('t') ? 1 : ss(b / m)) * (free.includes('b') ? 1 : ss((1 - b) / m));
    P0.push([ox + u * s.w * k + dx * e, oy + v * s.h * k + dy * e, u, v]);
  }
  settle();
  push(); noStroke(); textureMode(NORMAL); texture(s.img);
  beginShape(TRIANGLES);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const q = [P0[j * (nx + 1) + i], P0[j * (nx + 1) + i + 1], P0[(j + 1) * (nx + 1) + i + 1], P0[(j + 1) * (nx + 1) + i]];
    for (const c of [0, 1, 2, 0, 2, 3]) vertex(q[c][0], q[c][1], 0, q[c][2], q[c][3]);
  }
  endShape();
  pop();
  if (WARP_DEBUG) { push(); noFill(); stroke(255, 0, 60); strokeWeight(4); rect(ox + u0 * s.w * k, oy + v0 * s.h * k, (u1 - u0) * s.w * k, (v1 - v0) * s.h * k); pop(); }
}
// Ways for a region to move (each returns fn(a, b) for warp):
// rolling water: crests travel toward the viewer, surging a quarter-wave on each beat.
const rolling = (t, amp = 4, n = 2.5) => (a, b) => { const ph = kick(beatPos(t), 1.6) / 4; return [amp * .4 * Math.sin(TAU * (a * 1.3 + ph)), amp * Math.sin(TAU * (n * b - ph) + 1.2 * Math.sin(TAU * a))]; };
// a gust through leaves, grass or a field: it leans one way on one bar and back on the next, the lean travelling across.
const gust = (t, amp = 6, every = 4) => (a, b) => { const ph = Math.PI * kick(beatPos(t) / every, 1.5); return [amp * Math.cos(ph - 1.4 * a), amp * .22 * Math.sin(ph - 2 * a + 1)]; };
// something hanging or floating that swings side to side, changing side every `every` beats.
const swing = (t, amp = 7, every = 2) => () => [amp * Math.cos(Math.PI * kick(beatPos(t) / every, 1.9)), 0];
// something that bobs up and down, changing direction every `every` beats; the bob travels across the region.
const bob = (t, amp = 5, every = 1) => a => [0, amp * Math.cos(Math.PI * kick(beatPos(t) / every, 1.7) - 2.2 * a)];
// a wave washing up a beach along direction (dx, dy) and sliding back, once a bar.
const swash = (t, amp, dir) => () => { const f = (((beatPos(t) % 4) + 4) % 4) / 4, k = f < .3 ? easeOut(f / .3) : 1 - ease((f - .3) / .7); return [dir[0] * amp * k, dir[1] * amp * k]; };

// Additive light, like glow() but without its random wobble (nothing still may flicker).
function lamp(x, y, r, col, a) {
  if (a <= .01 || r < 1) return;
  settle(); const c = color(col);
  push(); blendMode(ADD); tint(red(c), green(c), blue(c), 170 * clamp(a)); image(glowTex, x - r, y - r, 2 * r, 2 * r); noTint(); blendMode(BLEND); pop();
}
// A soft lift of light over the whole frame (screen space).
function lightPulse(a, col = '#FFF1D6') { lamp(960, 540, 1500, col, a); }
// Lights that come on: n fixed spots inside a rect of a night scene (windows, lanterns, bulbs); on each beat a
// different third of them glows and fades. o = { cols, r, every, seed, a }.
function cityLights(t, [x0, y0, x1, y1], n = 12, o = {}) {
  if (!LIVE) return;
  const bn = Math.floor(beatPos(t)), h = hit(t, 1, 2.2), every = o.every ?? 3, seed = o.seed ?? 0, cols = o.cols ?? ['#FFD27A'];
  for (let i = 0; i < n; i++) {
    if ((((bn + i) % every) + every) % every) continue;
    lamp(lerp(x0, x1, hash(i * 5.3 + seed + 1)), lerp(y0, y1, hash(i * 7.9 + seed + 2)), (o.r ?? 46) * (.7 + .6 * hash(i * 2.2 + seed)), cols[i % cols.length], (o.a ?? .6) * h);
  }
}
// Gulls: each a single ink stroke; the wings go up on one beat and down on the next. list = [[x, y, size, speed px/s], ...]
function gulls(t, t0, list, col = '#5B5560') {
  if (!LIVE) return;
  const f = Math.cos(beatPos(t) * Math.PI);
  list.forEach(([x, y, s, v = 14], i) => {
    const xx = x + v * (t - t0), yy = y + 6 * Math.sin(t * 1.1 + i * 2);
    boilSeed('gull' + i); inkLine([[xx - s, yy - s * .5 * f], [xx, yy], [xx + s, yy - s * .5 * f]], .7, col, 'inkfine', .6); DIRTY = true;
  });
}
// A puff of petals or leaves let go at time t0 from (x, y): they spread, drift down and are gone.
function puff(t, t0, x, y, n = 8, cols = ['#F6C9CF', '#FBE3DC', '#F2B7C0'], spread = 150) {
  if (!LIVE) return;
  const age = t - t0; if (age <= 0 || age > 1.7) return;
  for (let i = 0; i < n; i++) {
    const a = hash(i * 3.3 + t0) * TAU, d = spread * (.4 + .6 * hash(i * 5.9 + t0)) * easeOut(age / 1.1);
    const px = x + Math.cos(a) * d + 16 * Math.sin(age * 4 + i), py = y + Math.sin(a) * d * .55 + 80 * age * age, r = (8 + 7 * hash(i * 1.7 + t0)) * (1 - seg(age, 1.1, 1.7));
    if (r > 1) P(ellPts(px, py, r, r * .55, 8, 0, age * 2.2 + i), { wash: cols[i % cols.length], washOp: 220, ink: null });
  }
}
// One glint that pops at time t0 and is gone (the ring, when it is offered).
function ding(t, t0, x, y, r = 30, col = '#FFF6D2') {
  if (!LIVE) return;
  const age = t - t0; if (age <= 0 || age > .65) return;
  const rr = r * backOut(age / .16) * (1 - seg(age, .3, .65)); if (rr < 1.5) return;
  P(starPts(x, y, rr, .2, 4, age * 1.4), { wash: col, washOp: 245, ink: '#E5C77A', sw: .3 });
}
// A firework that opens at time t0: a scatter of sparks in light that spread, sink a little and fade.
function firework(t, t0, x, y, r = 170, col = '#FFD27A') {
  if (!LIVE) return;
  const age = t - t0; if (age <= 0 || age > 1.3) return;
  const a = 1 - age / 1.3, k = easeOut(age / .6);
  for (let i = 0; i < 28; i++) {
    const an = hash(i * 3.7 + t0) * TAU, d = r * (.3 + .7 * hash(i * 5.1 + t0)) * k;
    lamp(x + Math.cos(an) * d, y + Math.sin(an) * d + 55 * age * age, 10 + 14 * a, col, .95 * a * (.5 + .5 * hash(i * 2.3 + t0)));
  }
}
// The turbine's rotor: one painted blade drawn three times around the hub at (x, y), L px long, turned by ang.
function rotor(x, y, L, ang) {
  if (!LIVE) return;
  const s = SPRITES.rotor, k = L / (.536 * s.h), px = .498 * s.w, py = .541 * s.h;      // the hub's place in the drawing
  settle();
  for (let i = 0; i < 3; i++) {
    push(); translate(x, y); rotate(ang + i * TAU / 3);
    image(s.img, (.44 * s.w - px) * k, -py * k, .12 * s.w * k, .497 * s.h * k, .44 * s.w, 0, .12 * s.w, .497 * s.h);
    pop();
  }
  image(s.img, x + (.452 * s.w - px) * k, y + (.492 * s.h - py) * k, .092 * s.w * k, .1 * s.h * k, .452 * s.w, .492 * s.h, .092 * s.w, .1 * s.h);
}

// ---------- place names ----------
// A little paper tag in the lower-left corner, hand-lettered, pinned with tape: it pops in when the film arrives
// somewhere, stays a few seconds and fades. Screen space, outside the frame's beat push, so it never moves.
function placeTag(t, name, t0, t1) {
  if (!name || t < t0 || t >= t1) return;
  const k = backOut((t - t0) / .28), a = 1 - seg(t, t1 - .4, t1), size = 50, w = (size * name.length + 64) * k, h = 84 * k, cx = 76 + (size * name.length + 64) / 2, cy = 968, rot = -.035;
  if (a <= .01 || k <= .02) return;
  push(); translate(cx, cy); rotate(rot);
  boilSeed('tag' + name);
  P(rrPts(-w / 2 + 5, -h / 2 + 7, w, h, 12 * k, 0), { wash: '#8C7558', washOp: 50 * a, ink: null });
  P(rrPts(-w / 2, -h / 2, w, h, 12 * k, 0), { wash: '#FFFBF3', washOp: 255 * a, ink: '#CDBBA0', sw: .5 });
  P(rectPts(-30 * k, -h / 2 - 12 * k, 60 * k, 24 * k, 0), { wash: '#F2B7C0', washOp: 205 * a, ink: null });
  pop();
  const sp = SPRITES['tag_' + name]; if (!sp) return;       // the lettering is a picture (see build-sprites.py), not a system font
  settle(); push(); translate(cx, cy + 2); rotate(rot); tint(255, 255 * a); image(sp.img, -sp.w / 4, -sp.h / 4, sp.w / 2, sp.h / 2); noTint(); pop();
}

// ---------- the camera: viewfinder and shutter ----------
// A memory is "taken" the way a photo is: a viewfinder comes up over the picture and its focus box closes in and locks;
// then the shutter's blades close over the lens and open again on the next picture. The blades are painted, dark and
// warm — never a white flash (between pictures a flash reads as the screen blinking). All in screen space.
const BLADE = '#33292F', BLADE_EDGE = '#6A5A62';
// The aperture: six blades leaving a hexagonal opening of radius r that twists shut. r ≥ 1300 = fully open (nothing drawn).
function aperture(r, cx = 960, cy = 540) {
  if (r >= 1300) return;
  boilSeed('aperture');
  if (r < 5) { P(rectPts(-60, -60, W + 120, H + 120), { wash: BLADE, ink: null }); return; }
  const rot = -Math.PI / 2 + 1.1 * (1 - r / 1300), pts = [];
  for (let i = 0; i < 6; i++) pts.push([cx + r * Math.cos(rot + i * TAU / 6), cy + r * Math.sin(rot + i * TAU / 6)]);
  irisShape(pts, BLADE, 1500); DIRTY = true;            // 1500 reaches past every corner; larger only costs fill
  for (let i = 0; i < 6; i++) {                        // each blade's edge runs on past the corner, under the next blade
    const a = pts[i], b = pts[(i + 1) % 6], d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ux = (b[0] - a[0]) / d, uy = (b[1] - a[1]) / d;
    inkLine([a, [b[0] + ux * 1100, b[1] + uy * 1100]], 2.2, BLADE_EDGE, 'ink', 0);
  }
}
// How open the aperture is around a shutter release at time ts: it closes over `close` s, is shut exactly at ts, and
// opens over `open` s. Returns a radius (≥ 1300 = open).
function shutterR(t, ts, close = .15, open = .2) {
  const d = t - ts;
  if (d < -close || d >= open) return 1300;
  return d < 0 ? 1300 * Math.pow(-d / close, 1.5) : 1300 * Math.pow(d / open, 1.4);
}
// The viewfinder over a picture that is about to be taken: k = 0..1 through its time on screen. Corner brackets come
// up, the focus box closes in on the middle and locks (turns green) for the last third.
function viewfinder(k) {
  if (k <= 0 || k >= 1) return;
  const a = backOut(clamp(k / .22)), lock = k > .62, m = 90 + 26 * (1 - a), L = 130, box = lerp(215, 118, easeOut(clamp(k / .6))), col = lock ? '#BFE8A6' : '#FFFBF3';
  const stroke = pts => { inkLine(pts, 2.6, '#3A3038', 'ink', 0); inkLine(pts, 1.2, col, 'ink', 0); };
  boilSeed('viewfinder');
  for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const x = sx > 0 ? m : W - m, y = sy > 0 ? m : H - m;
    stroke([[x + sx * L, y], [x, y], [x, y + sy * L]]);                                    // frame corner
    const bx = 960 - sx * box, by = 520 - sy * box * .72, l = 46;
    stroke([[bx + sx * l, by], [bx, by], [bx, by + sy * l]]);                                // focus-box corner
  }
  if (lock) { stroke([[948, 520], [972, 520]]); stroke([[960, 508], [960, 532]]); }
  DIRTY = true;
}
