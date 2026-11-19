// player.js: plays the film live. The song is the clock: each animation frame asks the audio where it is and paints
// that moment (frames are pure functions of time), so picture and music cannot drift apart; a slow device just paints
// fewer frames. Nothing is painted while paused.
(() => {
  const $ = id => document.getElementById(id);
  const stage = $('stage'), audio = $('song'), big = $('big'), seek = $('seek'), timeEl = $('time'), tip = $('tip'), loading = $('loading');
  const LEN = PROJECT.duration, MIN_GAP = 1000 / 31;          // paint at most 30 frames a second
  const stats = [];                                           // how long the last paints took, in ms
  let ready = false, songReady = false, busy = false, want = null, raf = 0, lastPaint = 0, idleTimer = 0, slow = 0, dragging = false;

  // The other version is one link away: phones start on the light one, computers on the full one.
  const swap = $('swap');
  if (window.MV_LITE) { swap.textContent = '想更清晰？换高清版（可能会卡）'; swap.href = '?q=full'; } else { swap.textContent = '卡的话，换轻量版'; swap.href = '?q=lite'; }
  // ?debug=1 shows what this device is actually doing (for reporting a slow phone)
  const debug = new URLSearchParams(location.search).get('debug') ? $('debug') : null, paints = [];

  window.onSpriteProgress = (n, total) => { $('pct').textContent = Math.round(100 * n / total) + '%'; };
  const fail = msg => { loading.classList.add('is-error'); loading.textContent = msg; };
  window.addEventListener('error', e => { if (!ready) fail('画面没能加载出来，刷新一下试试。（' + (e.message || '未知错误') + '）'); });
  window.addEventListener('unhandledrejection', e => { if (!ready) fail(/webgl/i.test(String(e.reason && e.reason.message)) ? '这个浏览器没能打开 WebGL，画不出这支 MV，换个浏览器试试。' : '有图片没加载出来，刷新一下试试。'); });

  // Paint the frame for time t. Only one paint runs at a time; a request made meanwhile replaces any waiting one.
  async function paint(t) {
    want = t; if (busy) return;
    busy = true;
    try {
      while (want !== null) {
        const tt = Math.max(0, Math.min(LEN - .001, want)); want = null;
        const w0 = performance.now();
        T = tt; await redraw(); composite(tt);
        const ms = performance.now() - w0; stats.push(ms); if (stats.length > 600) stats.shift(); paints.push(performance.now());
        if (!audio.paused) { slow = slow * .9 + (ms > 70 ? 1 : 0) * .1; tip.hidden = slow < .6; }
      }
    } finally { busy = false; }
  }

  // The visible canvas takes the size the film is painted at (1920x1080, or two thirds of it in the light version);
  // the engine keeps drawing to it in 1920x1080 units.
  function fitOut() {
    const out = $('out'), gl = drawingContext.canvas; out.width = gl.width; out.height = gl.height;
    outX.setTransform(out.width / 1920, 0, 0, out.height / 1080, 0, 0);
  }
  // Bake the film's watercolour fills into pictures (see BAKE in scene.js): each is painted once, alone, and copied off
  // the canvas. The six album prints are cut out of their page-coloured ground so they can lie anywhere.
  async function bake() {
    const F = window.FILM, gl = drawingContext.canvas;
    for (const [name, fn, opt] of F.BAKE) {
      window.LOOP = () => F.bakeFrame(fn); T = 0; await redraw();
      const d = gl.width / 1920; let im;
      if (opt && opt.card) {
        const w = opt.card, [bx, by, bw, bh] = F.CARD_BOX, x0 = (960 + bx * w) * d, y0 = (540 + by * w) * d;
        im = createImage(Math.round(bw * w * d), Math.round(bh * w * d));
        for (const [kx, ky, kw, kh] of F.CARD_KEEP) {
          const sx = (960 + kx * w) * d, sy = (540 + ky * w) * d, sw = kw * w * d, sh = kh * w * d;
          im.drawingContext.drawImage(gl, sx, sy, sw, sh, sx - x0, sy - y0, sw, sh);
        }
      } else { im = createImage(gl.width, gl.height); im.drawingContext.drawImage(gl, 0, 0); }
      if (im.setModified) im.setModified(true);
      SPRITES['bk_' + name] = { img: im, w: im.width, h: im.height };
    }
    window.LOOP = null;
  }

  // The audio's own clock, read every frame, smoothed between its updates.
  let baseA = 0, baseW = 0;
  function now() {
    const a = audio.currentTime, w = performance.now();
    if (a !== baseA || audio.paused) { baseA = a; baseW = w; return a; }
    return a + Math.min(.1, (w - baseW) / 1000);
  }

  const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  function showTime(t) { timeEl.textContent = fmt(t) + ' / ' + fmt(LEN); if (!dragging) seek.value = t; }

  function tick() {
    raf = 0; if (audio.paused) return;
    const w = performance.now(), t = now();
    if (!busy && w - lastPaint >= MIN_GAP) { lastPaint = w; paint(t); }
    showTime(t);
    raf = requestAnimationFrame(tick);
  }
  function wake() {
    stage.classList.remove('is-idle'); clearTimeout(idleTimer);
    if (!audio.paused) idleTimer = setTimeout(() => { if (!audio.paused) stage.classList.add('is-idle'); }, 2200);
  }
  function setPlaying(on) {
    stage.classList.toggle('is-playing', on); big.hidden = on; $('play').setAttribute('aria-label', on ? '暂停' : '播放');
    if (on) { if (!raf) raf = requestAnimationFrame(tick); } else { tip.hidden = true; slow = 0; }
    wake();
  }
  async function toggle() {
    if (!ready) return;
    if (audio.paused) {
      if (audio.ended || audio.currentTime >= LEN - .05) audio.currentTime = 0;
      try { await audio.play(); } catch (e) { fail('音乐没能播放：' + e.message); stage.classList.add('is-loading'); }
    } else audio.pause();
  }
  function jump(t) { t = Math.max(0, Math.min(LEN - .05, t)); audio.currentTime = t; showTime(t); paint(t); }

  audio.addEventListener('play', () => setPlaying(true));
  audio.addEventListener('pause', () => { setPlaying(false); paint(audio.currentTime); });
  audio.addEventListener('ended', () => { setPlaying(false); big.setAttribute('aria-label', '重新播放'); });
  // The whole song is fetched into memory first (2.5 MB): it can then be sought anywhere at once, on any host.
  fetch(audio.dataset.src).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
    .then(buf => { audio.src = URL.createObjectURL(new Blob([buf], { type: 'audio/mp4' })); songReady = true; })
    .catch(() => fail('音乐文件没能加载出来，刷新一下试试。'));

  $('out').addEventListener('click', toggle); big.addEventListener('click', toggle); $('play').addEventListener('click', toggle);
  seek.addEventListener('input', () => { dragging = true; jump(+seek.value); });
  seek.addEventListener('change', () => { dragging = false; });
  $('mute').addEventListener('click', () => { audio.muted = !audio.muted; stage.classList.toggle('is-muted', audio.muted); });
  // Full screen. The page's own "full" state (.is-full) lays the picture across the whole screen; the browser's real full
  // screen and a landscape lock are asked for on top of it where they exist. Where they do not (an iPhone, some in-app
  // browsers) the CSS still covers the screen and, on an upright phone, turns the picture a quarter.
  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
  const nativeFs = stage.requestFullscreen || stage.webkitRequestFullscreen;
  let full = false, native = false;
  // Android Chrome can report a full-screen viewport taller than the glass (seen: 436 px on a 411 px screen), which pushes
  // the bottom of the picture, with the place tags and the controls, off the screen. The screen's own short side, read
  // while not in full screen, is the truth there: the picture is fitted into whichever of the two is smaller.
  const android = /Android/i.test(navigator.userAgent); let shortSide = Math.min(screen.width, screen.height);
  function fitFull() {
    if (!fsEl()) shortSide = Math.min(screen.width, screen.height);
    const h = full && native && android && innerWidth > innerHeight ? Math.min(innerHeight, shortSide - 1) : 0;
    stage.classList.toggle('fit-h', h > 0); if (h) stage.style.setProperty('--full-h', h + 'px');
  }
  function setFull(on) {
    full = on; stage.classList.toggle('is-full', on); document.documentElement.classList.toggle('mv-full', on);
    $('full').setAttribute('aria-label', on ? '退出全屏' : '全屏'); fitFull(); wake();
  }
  async function fullscreen() {
    if (!full) {
      setFull(true);
      if (nativeFs) {
        try { await nativeFs.call(stage); native = true; } catch (e) { native = false; }
        if (native) { try { await screen.orientation.lock('landscape'); } catch (e) {} }
        fitFull();
      }
    } else {
      setFull(false);
      try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) {}
      if (fsEl()) { try { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) {} }
      native = false;
    }
  }
  const onFsChange = () => { if (native && !fsEl() && full) { native = false; setFull(false); } fitFull(); };   // left with Esc or the back gesture
  document.addEventListener('fullscreenchange', onFsChange); document.addEventListener('webkitfullscreenchange', onFsChange);
  window.addEventListener('resize', fitFull); window.addEventListener('orientationchange', () => setTimeout(fitFull, 300));
  $('full').addEventListener('click', fullscreen); $('out').addEventListener('dblclick', fullscreen);
  stage.addEventListener('pointermove', wake); stage.addEventListener('pointerdown', wake);
  document.addEventListener('keydown', e => {
    if (!ready || e.target === seek || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.code === 'Space') { e.preventDefault(); toggle(); }
    else if (e.code === 'KeyF') fullscreen();
    else if (e.code === 'Escape' && full) fullscreen();
    else if (e.code === 'KeyM') $('mute').click();
    else if (e.code === 'ArrowRight') jump(audio.currentTime + 5);
    else if (e.code === 'ArrowLeft') jump(audio.currentTime - 5);
    else return;
    wake();
  });

  // The engine sets window.ready when every picture is loaded and the canvas exists; the song arrives on its own.
  const wait = setInterval(async () => {
    if (!window.ready || !songReady) return;
    clearInterval(wait);
    fitOut();
    // ?brush=1 keeps every mark a real brush stroke (slower; for comparing)
    try { await bake(); window.MV_FAST = !new URLSearchParams(location.search).get('brush'); } catch (e) { window.LOOP = null; console.warn('bake skipped:', e); }   // without it the film still plays, only slower
    await paint(.6);                                   // the empty album, waiting
    ready = true; stage.classList.remove('is-loading'); big.hidden = false; showTime(0);
    if (debug) {
      const g = drawingContext, e = g.getExtension('WEBGL_debug_renderer_info'), gpu = (e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : '?').replace(/^ANGLE \(|\)$/g, '').slice(0, 46);
      debug.hidden = false;
      setInterval(() => {
        const now = performance.now(); while (paints.length && now - paints[0] > 2000) paints.shift();
        const a = stats.slice(-90).sort((x, y) => x - y), q = p => a.length ? a[Math.min(a.length - 1, Math.floor(a.length * p))].toFixed(0) : '-';
        debug.textContent = `${window.MV_LITE ? '轻量' : '高清'} ${g.canvas.width}×${g.canvas.height}  屏幕 ${screen.width}×${screen.height}@${devicePixelRatio}\n${(paints.length / 2).toFixed(0)} 帧/秒  每帧 ${q(.5)} / ${q(.95)} / ${q(1)} ms（中位/95%/最慢）\n${gpu}`;
      }, 500);
    }
    window.__mv = { paint, audio, stats, fullscreen, get busy() { return busy; }, get full() { return full; }, scale: window.MV_SCALE || 1, lite: !!window.MV_LITE };
  }, 100);
})();
