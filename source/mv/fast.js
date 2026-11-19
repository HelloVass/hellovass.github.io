// fast.js: plain shapes instead of brush strokes, for the live page only.
//
// p5.brush draws every wash and ink line into its own layer and blends that layer into the picture with a full-canvas
// pass. Chrome on a computer shrugs that off; Safari and phones do not (measured on an iPad simulator: a frame with any
// brush mark in it took 10-45 ms, a frame without one 1-5 ms). The film's brush marks are all flat washes and thin ink
// lines -- petals, hearts, card frames, the shutter's blades -- so once the watercolour fills have been baked (see BAKE
// in scene.js) the player sets window.MV_FAST and these two wrappers draw them as ordinary shapes. Anything that still
// asks for a watercolour fill or a hatch goes to the brush as before, and is flushed as before.
(() => {
  const brushPaint = paint, brushLine = inkLine, brushFlush = flushBrush, INK = 4.6;   // INK: canvas px per unit of ink weight
  const deeper = col => { const c = color(col); return color(red(c) * .84, green(c) * .84, blue(c) * .84); };   // ink sits a little darker than its pigment
  let pending = false;                                 // brush marks waiting to be blended in
  const flat = () => { const g = drawingContext; g.disable(g.DEPTH_TEST); };            // strictly painter's order
  paint = function (pts, o = {}) {
    if (!window.MV_FAST || o.fill || o.hatch || o.curv) { pending = true; return brushPaint(pts, o); }
    if (!pts.length) return;
    flat(); push();
    if (o.wash) { const c = color(o.wash); c.setAlpha(o.washOp ?? 255); fill(c); } else noFill();
    if (o.ink !== null) { stroke(deeper(o.ink || PAL.ink)); strokeWeight((o.sw ?? 1) * INK); strokeJoin(ROUND); } else noStroke();
    beginShape(); for (const p of pts) vertex(p[0], p[1]); endShape(CLOSE);
    pop();
  };
  inkLine = function (pts, sw = 1, col = PAL.ink, br = 'ink', curv = .5) {
    if (!window.MV_FAST) { pending = true; return brushLine(pts, sw, col, br, curv); }
    flat(); push(); noFill(); stroke(col); strokeWeight(sw * INK * (br === 'inkfine' ? .55 : 1)); strokeJoin(ROUND); strokeCap(ROUND);
    beginShape(); for (const p of pts) vertex(p[0], p[1]); endShape();
    pop();
  };
  flushBrush = function () { if (window.MV_FAST && !pending) return; pending = false; brushFlush(); };
})();
