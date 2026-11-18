// player.js: plays the film live. The song is the clock: each animation frame asks the audio where it is and paints
// that moment (frames are pure functions of time), so picture and music cannot drift apart; a slow device just paints
// fewer frames. Nothing is painted while paused.
(() => {
  const $ = id => document.getElementById(id);
  const stage = $('stage'), audio = $('song'), big = $('big'), seek = $('seek'), timeEl = $('time'), tip = $('tip'), loading = $('loading');
  const LEN = PROJECT.duration, MIN_GAP = 1000 / 31;          // paint at most 30 frames a second
  const stats = [];                                           // how long the last paints took, in ms
  let ready = false, songReady = false, busy = false, want = null, raf = 0, lastPaint = 0, idleTimer = 0, slow = 0, dragging = false;

  window.onSpriteProgress = (n, total) => { $('pct').textContent = Math.round(100 * n / total) + '%'; };
  const fail = msg => { loading.classList.add('is-error'); loading.textContent = msg; };
  window.addEventListener('error', e => { if (!ready) fail('画面没能加载出来，刷新一下试试。（' + (e.message || '未知错误') + '）'); });
  window.addEventListener('unhandledrejection', () => { if (!ready) fail('有图片没加载出来，刷新一下试试。'); });

  // Paint the frame for time t. Only one paint runs at a time; a request made meanwhile replaces any waiting one.
  async function paint(t) {
    want = t; if (busy) return;
    busy = true;
    try {
      while (want !== null) {
        const tt = Math.max(0, Math.min(LEN - .001, want)); want = null;
        const w0 = performance.now();
        T = tt; await redraw(); composite(tt);
        const ms = performance.now() - w0; stats.push(ms); if (stats.length > 600) stats.shift();
        if (!audio.paused) { slow = slow * .9 + (ms > 70 ? 1 : 0) * .1; tip.hidden = slow < .6; }
      }
    } finally { busy = false; }
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
  function setFull(on) {
    full = on; stage.classList.toggle('is-full', on); document.documentElement.classList.toggle('mv-full', on);
    $('full').setAttribute('aria-label', on ? '退出全屏' : '全屏'); wake();
  }
  async function fullscreen() {
    if (!full) {
      setFull(true);
      if (nativeFs) {
        try { await nativeFs.call(stage); native = true; } catch (e) { native = false; }
        if (native) { try { await screen.orientation.lock('landscape'); } catch (e) {} }
      }
    } else {
      setFull(false);
      try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) {}
      if (fsEl()) { try { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) {} }
      native = false;
    }
  }
  const onFsChange = () => { if (native && !fsEl() && full) { native = false; setFull(false); } };   // left with Esc or the back gesture
  document.addEventListener('fullscreenchange', onFsChange); document.addEventListener('webkitfullscreenchange', onFsChange);
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
    await paint(.6);                                   // the empty album, waiting
    ready = true; stage.classList.remove('is-loading'); big.hidden = false; showTime(0);
    window.__mv = { paint, audio, stats, fullscreen, get busy() { return busy; }, get full() { return full; } };
  }, 100);
})();
