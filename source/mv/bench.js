// bench.js: loaded only with ?bench=1. Measures what this device actually does and shows it (and posts it to /report on
// a test server, if there is one): (1) every 2 s of the film painted once, how long each frame takes; (2) four stretches
// of the film played against a clock with no sound, how many frames a second get painted. ?tag=name labels the report.
(() => {
  const Q = new URLSearchParams(location.search), box = document.getElementById('debug'), t00 = performance.now(), errors = [];
  window.addEventListener('error', e => errors.push(String(e.message).slice(0, 120)));
  const say = s => { if (box) { box.hidden = false; box.textContent = s; } };
  const wait = setInterval(async () => {
    if (!window.__mv) return; clearInterval(wait);
    const readyMs = performance.now() - t00, g = drawingContext, e = g.getExtension('WEBGL_debug_renderer_info');
    // ?shot=<seconds>: no timing. Leave that one frame up (&fs=1: in the page's full-screen state) and report how the
    // picture actually lies on this screen, again after every turn or resize.
    if (Q.get('shot')) {
      try { T = +Q.get('shot'); await redraw(); composite(T); } catch (x) {}
      if (Q.get('fs')) await window.__mv.fullscreen();
      const probe = css => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;left:0;top:0;visibility:hidden;' + css; document.body.appendChild(d); const r = d.getBoundingClientRect(); d.remove(); return [Math.round(r.width), Math.round(r.height)]; };
      const rect = id => { const r = document.getElementById(id).getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(v => Math.round(v)); };
      let n = 0;
      const report = async () => {
        const vv = window.visualViewport, r = { tag: (Q.get('tag') || 'shot') + '-' + (n++), ua: navigator.userAgent, lite: !!window.MV_LITE, full: window.__mv.full, nativeFs: !!(document.fullscreenElement || document.webkitFullscreenElement),
          inner: [innerWidth, innerHeight], client: [document.documentElement.clientWidth, document.documentElement.clientHeight], visual: vv ? [Math.round(vv.width), Math.round(vv.height), Math.round(vv.offsetTop), vv.scale] : null,
          screen: [screen.width, screen.height, devicePixelRatio], portrait: matchMedia('(orientation: portrait)').matches,
          vh: probe('width:100vw;height:100vh')[1], dvh: probe('width:1px;height:100dvh')[1], svh: probe('width:1px;height:100svh')[1], lvh: probe('width:1px;height:100lvh')[1], vw: probe('width:100vw;height:1px')[0],
          safe: probe('width:calc(env(safe-area-inset-left) + env(safe-area-inset-right));height:calc(env(safe-area-inset-top) + env(safe-area-inset-bottom))'),
          supports: ['height:100dvh', 'aspect-ratio:16/9', 'width:min(1px,2px)', 'inset:0'].map(s => CSS.supports(s)),
          stage: rect('stage'), out: rect('out'), bar: rect('bar'), canvas: [g.canvas.width, g.canvas.height, document.getElementById('out').width, document.getElementById('out').height] };
        say(`视口 ${r.inner.join('×')}  画面 ${r.out[2]}×${r.out[3]} @ ${r.out[0]},${r.out[1]}  比例 ${(r.out[2] / r.out[3]).toFixed(3)}\n${r.portrait ? '竖' : '横'}  dvh ${r.dvh} vh ${r.vh}  全屏 ${r.full ? '是' : '否'}`);
        window.__shot = r; try { await fetch('/report', { method: 'POST', body: JSON.stringify(r) }); } catch (x) {}
      };
      setTimeout(report, 700); let rt = 0; const again = () => { clearTimeout(rt); rt = setTimeout(report, 700); };
      window.addEventListener('resize', again); window.addEventListener('orientationchange', again); if (window.visualViewport) visualViewport.addEventListener('resize', again);
      return;
    }
    const frames = [];
    for (let pass = 0; pass < 2; pass++) for (let t = 1; t < 183; t += 2) {            // pass 0 warms every picture up
      const a = performance.now(); let err = '';
      try { T = t; await redraw(); g.finish(); } catch (x) { err = String(x.message || x).slice(0, 80); }
      const b = performance.now(); try { composite(t); } catch (x) { err = err || String(x.message || x).slice(0, 80); }
      const c = performance.now();
      if (pass) frames.push([t, +(b - a).toFixed(1), +(c - b).toFixed(1), err]);
      if (t % 20 === 1) say(`测速中 ${pass + 1}/2 … ${t} 秒`);
      await new Promise(r => setTimeout(r, 0));
    }
    const plays = [];
    for (const [from, len] of [[26, 5], [52, 5], [116, 5], [136, 6], [170, 8]]) {       // plain pictures, wedding+album, album pan, the empty place, the finale
      say(`试播 ${from} 秒起…`);
      const n = await new Promise(done => { let k = 0, last = 0, busy = false; const s = performance.now();
        const tick = async () => { const now = performance.now(), el = (now - s) / 1000; if (el >= len) return done(k);
          if (!busy && now - last >= 1000 / 31) { busy = true; last = now; try { T = from + el; await redraw(); composite(T); k++; } catch (x) {} busy = false; }
          requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
      plays.push([from, len, +(n / len).toFixed(1)]);
    }
    const tot = frames.map(f => f[1] + f[2]).sort((x, y) => x - y), q = p => tot[Math.min(tot.length - 1, Math.floor(tot.length * p))];
    const r = { tag: Q.get('tag') || '', ua: navigator.userAgent, lite: !!window.MV_LITE, canvas: [g.canvas.width, g.canvas.height], baked: Object.keys(SPRITES).filter(k => k.startsWith('bk_')).length,
      gpu: e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : '?', screen: [screen.width, screen.height, devicePixelRatio], cores: navigator.hardwareConcurrency, memGB: navigator.deviceMemory || null,
      readyMs: Math.round(readyMs), median: q(.5), p90: q(.9), max: q(1), over33: tot.filter(v => v > 33).length, over66: tot.filter(v => v > 66).length, n: tot.length,
      frameErrors: frames.filter(f => f[3]).length, plays, errors, frames };
    say(`${r.lite ? '轻量' : '高清'} ${r.canvas.join('×')}  加载 ${(r.readyMs / 1000).toFixed(1)} 秒\n每帧 ${r.median.toFixed(0)} / ${r.p90.toFixed(0)} / ${r.max.toFixed(0)} ms（中位/90%/最慢）  超 33ms：${r.over33}/${r.n}\n试播帧率 ${plays.map(p => p[2]).join(' · ')}  报错 ${r.frameErrors}\n${String(r.gpu).slice(0, 50)}`);
    if (Q.get('still')) { try { T = +Q.get('still'); await redraw(); composite(T); } catch (x) {} }   // leave one chosen frame up, for a screenshot
    window.__bench = r;
    try { await fetch('/report', { method: 'POST', body: JSON.stringify(r) }); } catch (x) {}
  }, 200);
})();
