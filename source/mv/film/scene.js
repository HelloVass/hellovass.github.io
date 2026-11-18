// scene.js: 《把回忆拼好给你》 v5 — the real timeline, from the photos they favourited.
//
// Two kinds of picture share one painted world:
//   · acted scenes: whole-pose drawings on a backdrop (the park, Sanya, Chongqing, home …), poses change in one frame;
//   · memories: real photos redrawn as full-bleed storybook paintings (m_*), each held with one slow push or pull.
// Cut to the song (bars start on beats 0, 4, 8 …; see STORYBOARD-V5.md):
//   0–4 the empty album · 4–64 2021–22: first dates in Shanghai, Sanya, the castle · 64–128 proposal, the red booklets,
//   wedding · 128–180 Chongqing (prints on the silent beats 167/171/175) · 180–200 breakdown: the new car, Danxia, the
//   desert, a quiet beach · 200 drop: the sea, Qingdao → Weihai → Yantai · 246–280 Suzhou, Nanjing · 280–296 build: New
//   Year, Hangzhou, Taizhou · 296–332 breakdown: home, expecting, one empty place · 332 drop: 小九 · 396–428 the album is
//   complete. Every place and event comes from a real photo; only the poses on painted backdrops (Sanya, Chongqing, the
//   selfie in Yantai, home) are staged. Nothing stands shaking in place, and there is no lettering but the place tags.
(() => {
  const kb = (t, keys, e) => kf(t, keys.map(([b, v]) => [B(b), v]), e);
  const bt = t => (t - OFF) / BEAT;
  let LAST_VIEW = null;
  const done = () => { LAST_VIEW = VIEW; viewEnd(); };
  const at = (x, y, v = LAST_VIEW) => [(x - v.cx) * v.z + 960, (y - v.cy) * v.z + 540];      // world → screen of the last view
  const G = 940;                                     // where feet meet the park path
  const popIn = (t, b, d = 1.2, from = .94) => from + (1 - from) * backOut(bseg(t, b, b + d));
  const S = {};

  // ---------- memories: redrawn real photos ----------
  // mem(name, o)(t, b0, b1): the painting fills the frame and drifts once across its shot.
  //   o.ay = which band of the 3:2 painting to keep (0 top … 1 bottom), o.z = base zoom, o.dir = +1 push in / −1 pull out,
  //   o.x / o.y = where the push aims.
  // What each memory shows that can move, and how it moves to the beat (lib.js: warp + rolling / gust / swing / bob /
  // swash, cityLights, gulls, puff, firework, rotor). Coordinates are fractions of the painting, kept off the people.
  // A picture with nothing in it that would move has no entry: it only gets the frame's push and lift of light.
  // Still water is one of those: a river or a lake pushed around reads as stiff, so only the open sea rolls.
  const LEAF_R = ['#D9622B', '#C8452B', '#E9A23B'], LEAF_G = ['#F2C14E', '#E9B23B', '#F6D777'], PETAL = ['#F6C9CF', '#FBE3DC', '#F2B7C0'];
  const NEON = ['#FFD27A', '#FFB45A', '#FFE9A8'];
  const ENV = {
    // stage lights take turns; the sea of balloons bobs
    m_livehouse: (t, b0, b1, M) => {
      M.warp([.27, .47, .82, .66], bob(t, 6, 1));
      [[.25, .11, '#C77DFF'], [.34, .11, '#FF7AC8'], [.45, .12, '#C77DFF'], [.74, .15, '#FF7AC8'], [.86, .14, '#C77DFF']].forEach(([u, v, c], i) => lamp(M.X(u), M.Y(v), 150, c, .5 * hit(t, 2, 2.4, i % 2)));
    },
    // the balloons sway; the ring catches the light once, as it is offered
    m_propose: (t, b0, b1, M) => { M.warp([0, .2, .215, .62], swing(t, 7, 2), { free: 'l' }); ding(t, B(b0 + 1), M.X(.524), M.Y(.47), 34); },
    // the red lantern swings and glows
    m_certdesk: (t, b0, b1, M) => { M.warp([.79, .08, .97, .48], swing(t, 6, 2)); lamp(M.X(.885), M.Y(.28), 170, '#FF8A5A', .12 + .2 * hit(t, 2, 2)); },
    // wind in the trees above them
    m_wedlawn: (t, b0, b1, M) => M.warp([0, 0, 1, .23], gust(t, 6), { free: 'tlr', nx: 24 }),
    // Hongyadong: the windows come on in turns
    m_cqnight_her: (t, b0, b1, M) => { cityLights(t, M.R([.02, .03, .95, .28]), 16, { cols: NEON, a: .5 }); cityLights(t, M.R([.02, .3, .27, .6]), 6, { cols: NEON, seed: 5, a: .5 }); cityLights(t, M.R([.7, .3, .95, .55]), 6, { cols: NEON, seed: 9, a: .5 }); },
    m_cqnight_him: (t, b0, b1, M) => { cityLights(t, M.R([.63, .05, 1, .75]), 16, { cols: NEON, a: .5 }); cityLights(t, M.R([.5, .02, .62, .33]), 5, { cols: NEON, seed: 5, a: .5 }); },
    // the bridge's lights run along the deck, one step a beat
    m_cqbridge: (t, b0, b1, M) => {
      const bn = Math.floor(beatPos(t)), h = hit(t, 1, 2);
      for (let i = 0; i < 12; i++) if ((i + bn) % 3 === 0) { const u = .3 + i * .06; lamp(M.X(u), M.Y(.36 - (u - .3) * .24), 52, '#FF6A48', .6 * h); }
    },
    // the sea comes in along the wet sand; gulls
    m_sdbeach: (t, b0, b1, M) => { M.warp([0, .47, .37, .64], rolling(t, 4, 2), { free: 'l' }); gulls(t, B(b0), [[M.X(.2), M.Y(.3), 13, 16], [M.X(.3), M.Y(.36), 10, 12]]); },
    // waves break on the rocks
    m_sdrocks: (t, b0, b1, M) => M.warp([.62, .4, 1, .53], rolling(t, 3, 1.5), { free: 'r' }),
    // the pine's crown stirs; open water moves (not the rocks)
    m_sdtree: (t, b0, b1, M) => { M.warp([.08, 0, .7, .3], gust(t, 4), { free: 't' }); M.warp([.63, .255, 1, .37], rolling(t, 3, 2), { free: 'r' }); M.warp([0, .255, .27, .42], rolling(t, 3, 2), { free: 'l' }); M.warp([.76, .47, 1, .6], rolling(t, 4, 2), { free: 'r' }); },
    // the turbine turns, a third of a blade-gap on every beat; gulls
    m_sdwind: (t, b0, b1, M) => { rotor(M.X(.672), M.Y(.275), 520, kick(beatPos(t), 1.6) * TAU / 9); gulls(t, B(b0), [[M.X(.3), M.Y(.3), 14, 20], [M.X(.4), M.Y(.38), 11, 16], [M.X(.22), M.Y(.42), 9, 14]]); },
    // rollers come in on both sides of her; gulls by the wreck
    m_sdship: (t, b0, b1, M) => {
      M.warp([0, .25, .44, .52], rolling(t, 7, 2), { free: 'l' }); M.warp([.71, .25, 1, .52], rolling(t, 7, 2), { free: 'r' });
      M.warp([0, .7, .34, 1], rolling(t, 5, 1.5), { free: 'lb' }); M.warp([.72, .7, 1, 1], rolling(t, 5, 1.5), { free: 'rb' });
      gulls(t, B(b0), [[M.X(.12), M.Y(.1), 12, 16], [M.X(.2), M.Y(.15), 9, 12]]);
    },
    // one wave washes up the sand toward their shadows and slides back, once a bar
    m_sdshadow: (t, b0, b1, M) => { M.warp([0, 0, .62, .31], swash(t, 20, [-.5, .85]), { free: 'tl', margin: .4 }); M.warp([.66, .16, 1, .6], swash(t, 20, [-.5, .85]), { free: 'r', margin: .4 }); },
    // the boats ride the water; leaves stir around her
    m_sdbay: (t, b0, b1, M) => { M.warp([.14, .29, .54, .51], rolling(t, 3, 1.5)); M.warp([0, 0, 1, .16], gust(t, 6), { free: 'tlr', nx: 24 }); M.warp([0, .5, .42, .9], gust(t, 5), { free: 'l' }); },
    m_sdwharf: (t, b0, b1, M) => { M.warp([.32, .43, .64, .58], rolling(t, 2.5, 2)); M.warp([.87, .4, 1, .92], rolling(t, 3.5, 2.5), { free: 'r' }); },
    // the sun's path on the water moves; the sun itself breathes
    m_sdsunset: (t, b0, b1, M) => { M.warp([.64, .2, 1, .43], rolling(t, 3.5, 2), { free: 'r' }); lamp(M.X(.755), M.Y(.165), 240, '#FFC766', .12 + .18 * hit(t, 2, 1.8)); },
    // the maple and its shadow on the wall sway together; leaves fall
    m_szmaple: (t, b0, b1, M) => { M.warp([.3, 0, 1, .47], gust(t, 6), { free: 'tr' }); M.warp([.02, .27, .34, .7], gust(t, 5)); puff(t, B(b0), M.X(.72), M.Y(.3), 9, LEAF_R, 220); puff(t, B(b0 + 2), M.X(.62), M.Y(.25), 7, LEAF_R, 200); },
    m_njginkgo: (t, b0, b1, M) => { M.warp([0, 0, .4, .36], gust(t, 6), { free: 'tl' }); M.warp([.6, 0, 1, .5], gust(t, 6), { free: 'tr' }); puff(t, B(b0), M.X(.3), M.Y(.2), 10, LEAF_G, 260); puff(t, B(b0 + 2), M.X(.85), M.Y(.25), 8, LEAF_G, 220); },
    m_njmaple: (t, b0, b1, M) => { puff(t, B(b0), M.X(.15), M.Y(.15), 9, LEAF_R, 240); puff(t, B(b0 + 2), M.X(.88), M.Y(.12), 8, LEAF_R, 200); },
    // lanterns along the bank come on in turns
    m_njnight: (t, b0, b1, M) => { cityLights(t, M.R([0, .2, .42, .44]), 10, { cols: NEON, r: 36, a: .45 }); },
    // the willow sways, the low sun breathes
    m_nanjing_lake: (t, b0, b1, M) => {
      M.warp([.5, 0, .73, .17], swing(t, 5, 4), { free: 't' }); M.warp([.78, 0, 1, .4], swing(t, 6, 4), { free: 'tr' });
      lamp(M.X(.46), M.Y(.4), 220, '#FFC766', .1 + .16 * hit(t, 2, 1.8));
    },
    // a firework opens on every beat; the lights in the tree come on in turns
    m_fireworks: (t, b0, b1, M) => {
      const bn = Math.floor(beatPos(t)), at = [[.25, .28], [.45, .18], [.58, .34], [.34, .4]], col = ['#FFD27A', '#FF9AB8', '#A8E0FF', '#FFE9A8'];
      for (let k = 0; k < 3; k++) { const q = bn - k; if (q >= b0) firework(t, B(q), M.X(at[q % 4][0]), M.Y(at[q % 4][1]), 150, col[q % 4]); }
      cityLights(t, M.R([.62, .1, .98, .55]), 14, { cols: ['#FFE9A8'], r: 26 });
    },
    // the strings of lanterns swing; the stalls' bulbs come on in turns
    m_market: (t, b0, b1, M) => { M.warp([0, 0, 1, .34], swing(t, 6, 2), { free: 'tlr', nx: 24 }); cityLights(t, M.R([0, .3, .3, .5]), 8, { cols: ['#FFE9A8'], r: 30, a: .45 }); cityLights(t, M.R([.7, .3, 1, .5]), 8, { cols: ['#FFE9A8'], r: 30, a: .45, seed: 7 }); },
    // wind runs across the rapeseed
    m_rapeseed: (t, b0, b1, M) => M.warp([0, .8, 1, 1], gust(t, 7), { free: 'blr', nx: 28 }),
    // and across the paddies beside her
    m_valley: (t, b0, b1, M) => { M.warp([0, .6, .39, .81], gust(t, 4), { free: 'l' }); M.warp([.71, .6, 1, .81], gust(t, 4), { free: 'r' }); },
  };
  // The acted scenes' backdrops, the same way.
  const BG = (name, r, fn, o) => warp(name, .5, r, fn, o);
  const WORLD = {
    // bamboo and the branch overhead sway in the sea wind (the far bay is too small to move without moving the city)
    bg_sanya: t => { BG('bg_sanya', [.55, .42, .8, .82], gust(t, 6)); BG('bg_sanya', [.74, .1, 1, .42], gust(t, 5), { free: 'tr' }); },
    // the harbour rolls in toward the sand, the boats with it
    bg_shandong: t => BG('bg_shandong', [0, .73, 1, 1], rolling(t, 5, 2.5), { free: 'lrb', nx: 28 }),
    // (rivers and lakes are left still: only the sea rolls)
    bg_chongqing: t => {},
    // the sheer curtain moves; window and lamp glow
    bg_home: t => { BG('bg_home', [.185, .02, .31, .7], swing(t, 4, 4)); if (LIVE) { lamp(134, 284, 320, '#FFF1D0', .06 + .1 * hit(t, 2, 1.8)); lamp(1728, 220, 260, '#FFD9A0', .08 + .14 * hit(t, 2, 1.8)); } },
  };
  const mem = (name, o = {}) => (t, b0, b1) => {
    const k = bseg(t, b0, b1), z0 = o.z ?? 1.04, z = z0 + .075 * ((o.dir ?? 1) > 0 ? k : 1 - k);
    viewBegin(o.x ?? 960, o.y ?? 540, z); backdrop(name, 1, o.ay ?? .4);
    if (LIVE && ENV[name]) {                           // the picture's own world, moving to the beat (painting fractions → world)
      const s = SPRITES[name], kk = Math.max(1920 / s.w, 1080 / s.h), ox = (1920 - s.w * kk) / 2, oy = (1080 - s.h * kk) * (o.ay ?? .4);
      const X = u => ox + u * s.w * kk, Y = v => oy + v * s.h * kk;
      ENV[name](t, b0, b1, { X, Y, R: ([u0, v0, u1, v1]) => [X(u0), Y(v0), X(u1), Y(v1)], warp: (r, fn, w) => warp(name, o.ay ?? .4, r, fn, w) });
    }
    done();
  };

  // A memory in two poses: the same painting with only the people changed (scripts/pose2.py keeps every other pixel),
  // swapped on beat b0 + at. The camera move runs through the swap.
  const mem2 = (a, b, at, o) => (t, b0, b1) => mem(bt(t) < b0 + at ? a : b, o)(t, b0, b1);
  ENV.m_propose2 = (t, b0, b1, M) => M.warp([0, .2, .215, .62], swing(t, 7, 2), { free: 'l' });
  ENV.m_sdsunset2 = ENV.m_sdsunset;

  // ---------- acted scenes (all take the beat they start on) ----------
  S.sanya = (t, b0, b1) => {
    const q = n => b0 + n, b = bt(t);
    viewBegin(...(b < q(8) ? kb(t, [[q(0), [700, 560, 1.34]], [q(8), [880, 552, 1.25]]]) : [1150, 580, 1.26 + .05 * bseg(t, q(8), b1)])); backdrop('bg_sanya'); WORLD.bg_sanya(t);
    drawPoses(t, [[0, { name: 'hands', x: 560, y: 1330, h: 1040 }], [B(q(3)), { name: 'point', x: 560, y: 1330, h: 1040 }], [B(q(8)), { name: 'camera', x: 1130, y: 1290, h: 900 }]]);
    done();
  };
  S.cert = (t, b0, b1) => {
    viewBegin(960, 560, 1.04 + .05 * bseg(t, b0, b1)); ground('#F8E9DF');
    blot(960, 560, 620, 400, '#EFA9A0', 95, 'cert-a'); blot(960, 600, 420, 300, '#F6C9B8', 80, 'cert-b');
    spr('cert', 960, 1040, 880 * popIn(t, b0, 1.2, .9));
    done();
  };
  S.wedding = (t, b0, b1) => {
    viewBegin(...kb(t, [[b0, [960, 540, 1]], [b1, [960, 440, 1.22]]])); ground('#F7EEDF');
    blot(960, 560, 660, 430, '#F5DFA8', 80, 'wed-a'); blot(960, 620, 430, 300, '#FBE3DC', 70, 'wed-b');
    spr('wedding', 960, 1052, 950 * popIn(t, b0, 1.4));
    done();
  };
  S.cqwalk = (t, b0, b1) => {
    const x = lerp(520, 900, bseg(t, b0, b1)), b = bt(t);
    viewBegin(x + 260, 560, 1.28); backdrop('bg_chongqing'); WORLD.bg_chongqing(t);
    spr(Math.floor(b) % 2 ? 'walk_b' : 'walk_a', x, 1330 - 14 * Math.abs(Math.sin(b * Math.PI)), 1010);
    done();
  };
  S.cqheart = (t, b0, b1) => {
    viewBegin(900, 540, 1.2 + .08 * bseg(t, b0, b1)); backdrop('bg_chongqing'); WORLD.bg_chongqing(t);
    spr('heart', 660, 1590, 1290 * popIn(t, b0, 1.2, .95));
    done();
  };
  S.sdselfie = (t, b0, b1) => {
    const z = 1.1 + .08 * bseg(t, b0, b1);
    viewBegin(960, 1080 - 540 / z, z); backdrop('bg_shandong'); WORLD.bg_shandong(t);
    spr('selfie', 1090, 1080, 850 * popIn(t, b0, 1.2, .93));
    done();
  };
  S.home = (t, b0, b1) => {
    viewBegin(...kb(t, [[b0, [960, 560, 1]], [b1, [960, 640, 1.34]]])); backdrop('bg_home'); WORLD.bg_home(t);
    shadow(960, 1022, 560, 'sh-sofa', 50);
    spr('album_home', 960, 1040, 740);
    done();
  };
  S.cradle = (t, b0, b1) => {
    const z = 1.12 + .03 * bseg(t, b0, b0 + 6) + .2 * ease(bseg(t, b0 + 6, b1));
    viewBegin(lerp(960, 1010, ease(bseg(t, b0 + 6, b1))), 1080 - 540 / z, z); backdrop('bg_home'); WORLD.bg_home(t);
    spr('cradle', 1000, 1080, 960 * popIn(t, b0, 1.3, .93));
    done();
  };
  S.lift = (t, b0, b1) => {
    viewBegin(960, 600, 1.16 + .12 * bseg(t, b0, b1)); backdrop('bg_home'); WORLD.bg_home(t);
    shadow(960, 1016, 290, 'sh-lift', 50);
    spr('lift', 960, 1024, 800 * popIn(t, b0, 1.2, .96));
    done();
  };
  S.family = (t, b0, b1) => {
    const z = 1.08 + .1 * ease(bseg(t, b0, b1));
    viewBegin(960, 1080 - 540 / z, z); backdrop('bg_home'); WORLD.bg_home(t);
    spr(bt(t) < b0 + 9 ? 'portrait' : 'portrait2', 960, 1080, 960);
    done();
  };

  // ---------- the album ----------
  // Six memories around the page, and the middle kept for the family.
  const SLOT = [{ x: 330, y: 238, w: 432, r: -.07 }, { x: 262, y: 548, w: 432, r: .045 }, { x: 345, y: 856, w: 432, r: -.035 },
                { x: 1590, y: 238, w: 432, r: .06 }, { x: 1658, y: 548, w: 432, r: -.05 }, { x: 1575, y: 856, w: 432, r: .04 }];
  const HEART = { x: 960, y: 548, w: 790, r: 0 };
  const MEM = [() => mem('m_propose2', { ay: .45 })(B(73), 64, 74), () => mem('m_certdesk', { ay: .4 })(B(100) - .02, 92, 100), () => S.wedding(B(124), 118, 128),
               () => S.cqheart(B(175) - .02, 172, 176), () => mem('m_sdsunset2', { ay: .35, dir: -1 })(B(245), 240, 246), () => mem('m_nanjing_lake', { ay: .7, dir: -1 })(B(272), 264, 274)];
  const TAPE = ['#F2B7C0', '#E9B872', '#F6DDA0', '#9CCBD6', '#A9C8A4', '#E7A58F'];
  function page() {
    boilSeed('page');
    P(rrPts(46, 34, 1828, 1012, 26, 0), { wash: '#F8F0E1', ink: '#D7C5A8', sw: .7 });
    blot(960, 548, 520, 330, '#F9DDCB', 60, 'page-blot');
  }
  function memCard(t, i, p = SLOT[i]) {
    const r = p.r + .004 * Math.sin(t * .7 + i * 2.3);
    card('mem' + i, p.x, p.y, p.w, r, MEM[i]);
    push(); translate(p.x, p.y); rotate(r);
    boilSeed('tape' + i); P(rectPts(-p.w * .1, -p.w * .315, p.w * .2, p.w * .055, 0), { wash: TAPE[i], washOp: 205, ink: null });
    pop();
  }
  function album(t, n) { page(); for (let i = 0; i < n; i++) memCard(t, i, SLOT[i]); }
  // A print flies from where it was shown (from) into album slot i, landing on beat bLand; n slots are already filled.
  function landing(t, i, bFrom, bLand, n, from = SCREEN) {
    album(t, n);
    const k = bseg(t, bFrom, bLand), p = place(from, SLOT[i], ease(k));
    if (k < 1) card('fly' + i, p.x, p.y - 60 * Math.sin(k * Math.PI), p.w, p.r, MEM[i]);
    else memCard(t, i, { ...SLOT[i], r: SLOT[i].r + .05 * spring(t, B(bLand), 7, 16) });
  }
  const full = draw => { LIVE = true; card('full', 960, 540, FULL, 0, draw); LIVE = false; };

  // ---------- effects that ride on a shot (screen space) ----------
  const FX = {
    petals: n => t => petals(t, n),
    snow: n => t => petals(t, n, ['#FFFFFF', '#FBE3DC', '#F6C9CF'], 'snow'),
    leaves: n => t => petals(t, n, ['#E9A23B', '#D9622B', '#F2C14E'], 'leaves'),
    hearts: (x, y, n = 4) => (t, b0) => { hearts(t, B(b0 + 1), x, y, n, 24); hearts(t, B(b0 + 3.5), 1920 - x, y, n - 1, 24); },
    sparkle: (x, y, r, n = 8) => t => sparkles(t, x, y, r, n),
  };
  const both = (...f) => (t, b0, b1) => f.forEach(g => g(t, b0, b1));

  // ---------- special shots (they draw the whole frame themselves) ----------
  // The film opens on the album, still empty: six places around the page and one in the middle. (It ends on the same
  // page, full.)
  function shotOpen(t, b0, b1) {
    camBegin(960, 540, 1.1 - .08 * ease(bseg(t, b0, b1)));
    page();
    boilSeed('empty');
    for (const p of SLOT) { const h = p.w * (1 - 2 * CARD_B) * 9 / 16 + 2 * p.w * CARD_B; push(); translate(p.x, p.y); rotate(p.r); P(rrPts(-p.w / 2, -h / 2, p.w, h, 8, 0), { wash: '#FBF4E8', ink: '#DCCBB0', sw: .6 }); pop(); }
    const w = HEART.w * .62, h = w * .78; P(rrPts(960 - w / 2, 548 - h / 2, w, h, 20, 0), { wash: '#FBF4E8', ink: '#DCCBB0', sw: .6 });
    camEnd();
  }
  // Wedding: plays full-frame, the shutter clicks on 124 and the print joins the proposal and the booklets in the album.
  function shotWedding(t, b0, b1) {
    if (bt(t) < 124.4) { full(() => S.wedding(Math.min(t, B(124)), b0, b1)); if (t < B(124)) { FX.snow(26)(t); sparkles(t, ...at(960, 480), 430, 8); } }
    else landing(t, 2, 124.4, 126.7, 2);
  }
  // Chongqing at night: each bar plays three beats, then freezes into a print on the silent beat. The last print goes home.
  const NIGHT = [mem('m_cqnight_him', { ay: .3 }), mem('m_cqbridge', { ay: .45 }), S.cqheart];
  function shotNights(t, b0, b1) {
    const b = bt(t);
    if (b < 176) {
      const j = Math.floor((b - 164) / 4), bs = 164 + 4 * j, sc = NIGHT[j];
      if (b < bs + 3) full(() => sc(t, bs, bs + 4));
      else {                                           // the print appears over its own night scene, dimmed — not on a bright page
        const k = backOut(bseg(t, bs + 3, bs + 3.5)), still = () => sc(B(bs + 3) - .02, bs, bs + 4);
        card('still' + j, 960, 540, FULL, 0, still); boilSeed('dim'); P(rectPts(-60, -60, W + 120, H + 120), { wash: '#241C28', washOp: 150, ink: null });
        card('snap' + j, 960, 540, FULL * lerp(.86, .76, k), (j % 2 ? .05 : -.045) * k, still);
      }
    } else landing(t, 3, 176, 178.5, 3, { x: 960, y: 540, w: FULL * .76, r: -.045 });
  }
  // Nanjing lake at sunset: the long held memory of the autumn; then the page, now with all six, drifts by.
  function shotLake(t, b0, b1) {
    const b = bt(t), lake = mem('m_nanjing_lake', { ay: .7, dir: -1 });
    if (b < 272.4) { full(() => lake(Math.min(t, B(272)), 264, 274)); if (b < 272) FX.hearts(330, 420)(t, 265); }
    else if (b < 275) landing(t, 5, 272.4, 274.7, 5);
    else { camBegin(...kb(t, [[275, [960, 540, 1]], [278, [1300, 560, 1.28]], [280, [1300, 560, 1.3]]])); album(t, 6); camEnd(); }
  }
  // The build: New Year's fireworks and spring 2025 flash by, the bar's last picture freezing into a print on the silent
  // beat; the third bar is one picture held.
  const FIREWORKS = mem('m_fireworks', { ay: .3, dir: -1 }), MARKET = mem('m_market', { ay: .5 }), VALLEY = mem('m_valley', { ay: .3 });
  const SPRING = [[FIREWORKS, FIREWORKS], [MARKET, MARKET], [VALLEY, VALLEY]];
  function shotBuild(t, b0, b1) {
    const b = bt(t);
    if (b < 292) {
      const j = Math.floor((b - 280) / 4), bs = 280 + 4 * j, same = SPRING[j][0] === SPRING[j][1], first = b < bs + 2, sc = SPRING[j][first ? 0 : 1];
      const s0 = same || first ? bs : bs + 2, s1 = same ? bs + 4 : first ? bs + 2 : bs + 4;
      if (b < bs + 3) full(() => sc(t, s0, s1));
      else { page(); const k = backOut(bseg(t, bs + 3, bs + 3.5)); card('spring' + j, 960, 540, FULL * lerp(.9, .78, k), (j % 2 ? -.05 : .05) * k, () => sc(B(bs + 3) - .02, s0, s1)); }
    } else {                                   // the whole page once more before going home
      camBegin(...kb(t, [[292, [620, 540, 1.3]], [294.2, [1300, 540, 1.3]], [295.7, [960, 540, 1]]])); album(t, 6); camEnd();
    }
  }
  // The album again, closer: one place in the middle is still empty. Then somebody arrives in it.
  function shotEmpty(t, b0, b1) {
    const z = kb(t, [[b0, 1.02], [b1, 1.5]]), born = ease(bseg(t, b0 + 5, b0 + 8.5)), swell = bseg(t, b1 - 5, b1);
    camBegin(960, 548, z);
    album(t, 6);
    const w = HEART.w * .62, h = w * .78;
    blot(960, 548, 330 + 60 * swell, 250 + 40 * swell, '#FBD9C2', 80 + 60 * swell, 'nest-blot');
    boilSeed('nest'); P(rrPts(960 - w / 2, 548 - h / 2, w, h, 20, 0), { wash: '#FFFAF1', washOp: 140 + 115 * born, ink: '#D2BE9E', sw: .8 });
    settle();
    if (born > 0) { tint(255, 255 * born); const s = SPRITES.baby_newborn, bh = h * .9; image(s.img, 960 - bh * s.w / s.h / 2, 548 - bh / 2 + 8 * (1 - born), bh * s.w / s.h, bh); noTint(); }
    sparkles(t, 960, 548, 300 + 80 * swell, 6 + Math.round(8 * born), '#FFF3C4', 'nest-sp', .6 + .8 * Math.max(born * .6, swell));
    camEnd();
  }
  // 小九's hand finds a finger: three drawings of the same hand, on a print.
  function shotGrasp(t, b0, b1) {
    const b = bt(t), i = b < b0 + 4 ? 0 : b < b0 + 8 ? 1 : 2, k = i ? .96 + .04 * backOut((t - B(b0 + 4 * i)) / .3) : popIn(t, b0, 1.2, .9);
    camBegin(960, 540, 1 + .05 * bseg(t, b0, b1));
    boilSeed('gr-bg'); P(rectPts(-40, -40, W + 80, H + 80), { wash: '#FBEADD', ink: null });
    blot(960, 540, 760, 460, '#F7CDB7', 80, 'gr-blot');
    card('grasp', 960, 548, 900 * k, -.03, () => { const s = SPRITES['grasp_' + i]; image(s.img, 0, 0, 1920, 1920); }, { ar: 1 });
    camEnd();
    petals(t, 12);
    hearts(t, B(b0 + 8.5), 1380, 520, 5, 26); hearts(t, B(b0 + 10.5), 1400, 520, 4, 26);
  }
  // Four little prints of 小九, one a bar.
  function shotBabies(t, b0, b1) {
    const faces = ['baby_front', 'baby_smile', 'baby_reach', 'baby_sleep'], tone = ['#DCEBDD', '#FBE0CF', '#DCE9F2', '#EFE2F0'];
    boilSeed('bb-bg'); P(rectPts(-40, -40, W + 80, H + 80), { wash: '#FBEFE2', ink: null });
    for (let i = 0; i < 4; i++) {
      const k = bseg(t, b0 + 4 * i, b0 + 1.3 + 4 * i); if (k <= 0) continue;
      card('baby' + i, 300 + i * 440, i % 2 ? 590 : 500, 400 * backOut(k), i % 2 ? .05 : -.06, () => {
        P(rectPts(0, 0, 1920, 1920, 0), { wash: tone[i], ink: null }); settle();
        const s = SPRITES[faces[i]], h = 1640, w = h * s.w / s.h; image(s.img, 960 - w / 2, 1920 - h - 60, w, h);
      }, { ar: 1 });
    }
    petals(t, 16);
  }
  // Every memory comes home to its place, and the middle one last.
  function shotGather(t, b0, b1) {
    page();
    for (let i = 0; i < 6; i++) {
      const k = bseg(t, b0 + 2 * i, b0 + 1.6 + 2 * i); if (k <= 0) continue;
      const from = { x: i < 3 ? -420 : W + 420, y: SLOT[i].y + 200, w: SLOT[i].w * 1.25, r: i < 3 ? -.5 : .5 };
      memCard(t, i, place(from, SLOT[i], backOut(k)));
    }
    const k = bseg(t, b0 + 12, b0 + 14.4);
    if (k > 0) { const p = place({ x: 960, y: 1500, w: HEART.w * 1.2, r: .12 }, HEART, backOut(k)); card('family', p.x, p.y, p.w, p.r, () => S.family(B(b1), b1, 428)); }
    if (k >= 1) sparkles(t, 960, 548, 520, 9);
  }
  function shotFinal(t, b0, b1) {
    const k = ease(bseg(t, b0, b0 + 5));
    if (k < 1) { album(t, 6); const p = place(HEART, SCREEN, k); card('family', p.x, p.y, p.w, 0, () => S.family(t, b0, 428)); }
    else full(() => S.family(t, b0, 428));
    petals(t, 26); if (k >= 1) { hearts(t, B(b0 + 8), 380, 520, 5, 26); hearts(t, B(b0 + 12), 1540, 520, 5, 26); }
  }

  // ---------- the timeline ----------
  // [beat, scene, how it comes in, effect, raw]. How: 'snap' = the picture before is taken like a photo — a viewfinder
  // comes up over it, focus locks, the shutter's blades close and open on this one (only when the place changes); 'cut' = a plain cut
  // on the beat; '' = inside the same place. No white flashes and no pale wipes anywhere: between pictures those read
  // as the screen blinking. raw shots draw the whole frame themselves; the others are played full-frame through full().
  const TL = [
    [0, shotOpen, '', null, true],
    // 2021, Shanghai and Sanya
    [4, mem('m_gundam', { ay: .2, dir: -1 }), 'snap'], [12, mem('m_sanya_sofa', { ay: .4 }), 'snap'], [18, S.sanya, 'cut'],
    [30, mem('m_archery', { ay: .45 }), 'snap'], [38, mem('m_livehouse', { ay: .5, dir: -1 }), 'cut'],
    // 2022
    [46, mem('m_fastfood', { ay: .5 }), 'cut'], [54, mem('m_castle', { ay: .35 }), 'cut', FX.hearts(300, 430, 3)],
    [64, mem2('m_propose', 'm_propose2', 5, { ay: .45 }), 'snap', (t, b0) => { for (const d of [-1, 1]) confetti(t, B(b0 + 5), 960 + d * 760, 980, 14, undefined, 'cf-p', d); hearts(t, B(b0 + 6), 960, 300, 4, 24); }],
    [74, mem('m_forehead', { ay: .35, dir: -1 }), 'cut', FX.hearts(300, 400, 3)],
    [82, mem2('m_certhall', 'm_certhall2', 5, { ay: .85 }), 'snap', (t, b0) => { for (const d of [-1, 1]) confetti(t, B(b0), 960 + d * 760, 980, 14, undefined, 'cf-a', d); hearts(t, B(b0 + 6), 520, 420, 3, 24); hearts(t, B(b0 + 7), 1400, 420, 3, 24); }],
    [92, mem('m_certdesk', { ay: .4 }), 'cut'],
    // 2023: the wedding photos, Chongqing
    [100, mem('m_wedlawn', { ay: .55, dir: -1 }), 'snap', FX.snow(18)], [106, mem('m_wedriver', { ay: .6 }), 'cut'], [112, mem('m_wedveil', { ay: .35, dir: -1 }), 'cut', FX.snow(14)],
    [118, shotWedding, 'cut', null, true],
    [128, S.cqwalk, 'snap'], [140, S.cqheart, 'cut', (t, b0) => { hearts(t, B(b0 + 1.5), ...at(700, 300), 5, 24); hearts(t, B(b0 + 6), ...at(700, 300), 4, 24); }],
    [150, mem('m_cqrail', { ay: .35 }), 'cut'], [157, mem('m_cqnight_her', { ay: .35, dir: -1 }), 'cut', FX.sparkle(1300, 380, 520, 7)],
    [164, shotNights, '', null, true],
    // 2024: the car, the north-west, then the sea
    [180, mem('m_car', { ay: .55 }), 'snap'], [184, mem('m_danxia', { ay: .4, dir: -1 }), 'cut'], [188, mem('m_camels', { ay: .5 }), 'cut'],
    [192, mem('m_sdbeach', { ay: .6, dir: -1 }), 'snap'],                                   // Qingdao
    [200, mem('m_sdrocks', { ay: .12 }), 'cut', (t, b0) => hearts(t, B(b0 + 1.5), 1620, 430, 4, 24)], [204, mem('m_sdtree', { ay: .7, dir: -1 }), 'cut'], [208, mem('m_sdheart', { ay: .6 }), 'cut', FX.hearts(420, 380, 3)],
    [212, mem('m_sdcable', { ay: .35, dir: -1 }), 'cut'], [216, mem('m_sdwind', { ay: .3 }), 'cut'], [220, mem('m_sdship', { ay: .08, dir: -1 }), 'cut'], [224, mem('m_sdshadow', { ay: .6 }), 'cut'],   // Weihai
    [228, mem('m_sdbay', { ay: .55, dir: -1 }), 'cut'], [232, S.sdselfie, 'cut', (t, b0) => hearts(t, B(b0 + 1.5), 1600, 420, 4, 24)], [236, mem('m_sdwharf', { ay: .5 }), 'cut'],                // Yantai
    [240, mem2('m_sdsunset', 'm_sdsunset2', 3, { ay: .35, dir: -1 }), 'cut', (t, b0) => hearts(t, B(b0 + 3.5), 1500, 300, 4, 24)],
    [246, mem('m_szmaple', { ay: .6 }), 'snap', FX.leaves(12)],
    [252, mem('m_njginkgo', { ay: .4 }), 'snap', FX.leaves(16)], [258, mem('m_njnight', { ay: .6, dir: -1 }), 'cut'],
    [264, shotLake, 'cut', null, true],
    [280, shotBuild, '', null, true],
    // home, and 小九
    [296, S.home, 'snap', (t, b0) => hearts(t, B(b0 + 5), ...at(960, 420), 2, 16)],
    [306, mem('m_maternity', { ay: .5, z: 1.02 }), 'cut', FX.snow(10)],
    [318, shotEmpty, 'cut', null, true],
    [332, S.cradle, 'snap', (t, b0) => { petals(t, 22); hearts(t, B(b0 + 4), 420, 420, 4, 26); hearts(t, B(b0 + 8), 1560, 420, 4, 26); }],
    [344, shotGrasp, 'cut', null, true],
    [356, mem('m_babysleep', { ay: .5 }), 'cut'],
    [364, S.lift, 'cut', (t, b0) => { hearts(t, B(b0 + 3), ...at(640, 380), 4, 22); hearts(t, B(b0 + 6), ...at(1290, 380), 4, 22); }],
    [372, mem('m_familyselfie', { ay: .4, dir: -1 }), 'cut', FX.hearts(260, 400, 3)],
    [380, shotBabies, 'cut', null, true], [396, shotGather, 'snap', null, true], [412, shotFinal, '', null, true],
  ];

  // How hard the frame answers the downbeat: [push-in, lift of light]. The two breakdowns stay perfectly calm.
  const energy = b => b < 128 ? [.011, .05] : b < 180 ? [.019, .09] : b < 200 ? [0, 0] : b < 280 ? [.019, .09] : b < 296 ? [.015, .07]
    : b < 332 ? [0, 0] : b < 412 ? [.019, .09] : b < 428 ? [.012, .06] : [0, 0];
  // Where each stretch of the film is: [beat it starts, name]. From the photos' own location data (or the phone's on the
  // same day); null = no tag (the symbolic park, home, and places not confirmed). A tag shows for at most 8 beats.
  const PLACES = [[0, null], [4, '上海'], [12, '三亚'], [30, '上海'], [64, '西安'], [82, '宁波'], [100, '上海'], [128, '重庆'], [180, '上海'], [184, null],
    [192, '青岛'], [212, '威海'], [228, '烟台'], [246, '苏州'], [252, '南京'], [280, '上海'], [284, '杭州'], [288, '台州'], [292, null]];
  const PRINTS = [124, 167, 171, 175, 272];             // beats where a full-frame picture freezes into a print
  function shot(i, t) {
    const [b0, scene, , fx, raw] = TL[i], b1 = i + 1 < TL.length ? TL[i + 1][0] : 432;
    if (raw) scene(t, b0, b1); else { full(() => scene(t, b0, b1)); if (fx) fx(t, b0, b1); }
  }
  function film(t) {
    DIRTY = false; VIEW = null;
    BOILN = 0; boilSeed('film');                       // no boil: still things must not shimmer 12 times a second
    const b = bt(t); let i = 0; while (i + 1 < TL.length && b >= TL[i + 1][0]) i++;
    const [amp, lum] = energy(b), e = b < 0 ? 0 : hit(t, 4, 3);
    push(); translate(960, 540); scale(1 + amp * e); translate(-960, -540);        // the downbeat push: the whole frame, never a figure
    shot(i, t);
    settle(); pop();
    lightPulse(lum * e);
    // the camera: a viewfinder over the last moments of a chapter, then the shutter on the beat the next one starts;
    // and a bare shutter click on the beats where a picture freezes into a print
    let r = 1300;
    for (const [sb, , how] of TL) if (how === 'snap' && sb > 0) { viewfinder(seg(t, B(sb) - .95, B(sb) - .02)); r = Math.min(r, shutterR(t, B(sb))); }
    for (const sb of PRINTS) r = Math.min(r, shutterR(t, B(sb), .1, .16));
    if (r >= 1300) { let k = 0; while (k + 1 < PLACES.length && b >= PLACES[k + 1][0]) k++;
      const p0 = PLACES[k][0], p1 = k + 1 < PLACES.length ? PLACES[k + 1][0] : 432; placeTag(t, PLACES[k][1], B(p0) + .3, B(Math.min(p1, p0 + 8)) - .25); }
    aperture(r);
    if (t < .32) { boilSeed('open'); brushWipe(.5 + t / .64, WIPE); }                                        // opens out of paper
    const end = 181.7; if (t > end) { boilSeed('close'); brushWipe(Math.min(.4999, (t - end) / 2.6), WIPE); }   // and closes into it
  }
  window.FILM = { S, TL, SLOT, B };
  shots([[0, film]]);
})();
