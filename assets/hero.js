/* Innoraze hero: a high press, drawn on a pitch in perspective. */
(function () {
  'use strict';
  var svg = document.querySelector('[data-hero-pitch]');
  if (!svg) return;
  var NS = 'http://www.w3.org/2000/svg';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Camera behind the near touchline (y = 0), looking across the pitch. Units: pitch metres in, SVG pixels out.
  var D = 85, F = 1417, KY = 84145, H0 = -249.9, CX = 800;
  var P = function (x, y, h) {
    var z = D + y;
    return [CX + F * (x - 52.5) / z, H0 + KY / z - (h ? F * h / z : 0), D / z];
  };
  var el = function (name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    (parent || svg).appendChild(n);
    return n;
  };
  var poly = function (pts) {
    return pts.map(function (p, i) { var q = P(p[0], p[1], p[2]); return (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join('');
  };
  var rect = function (x0, y0, x1, y1) { return poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]) + 'Z'; };
  var arc = function (cx, cy, r, a0, a1, n) {
    var pts = [];
    for (var i = 0; i <= n; i++) { var a = a0 + (a1 - a0) * i / n; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
    return poly(pts);
  };

  // ---------------------------------------------------------------- pitch
  var gPitch = el('g', { 'class': 'hp-pitch' });
  el('path', { d: rect(-3, -3, 108, 71), 'class': 'hp-surround' }, gPitch);
  el('path', { d: rect(0, 0, 105, 68), 'class': 'hp-grass' }, gPitch);
  for (var s = 0; s < 14; s += 2) el('path', { d: rect(s * 7.5, 0, (s + 1) * 7.5, 68), 'class': 'hp-stripe' }, gPitch);
  var lines = [
    rect(0, 0, 105, 68), poly([[52.5, 0], [52.5, 68]]),
    arc(52.5, 34, 9.15, 0, Math.PI * 2, 64),
    rect(0, 13.84, 16.5, 54.16), rect(0, 24.84, 5.5, 43.16), arc(11, 34, 9.15, -0.927, 0.927, 20),
    rect(88.5, 13.84, 105, 54.16), rect(99.5, 24.84, 105, 43.16), arc(94, 34, 9.15, Math.PI - 0.927, Math.PI + 0.927, 20),
    arc(0, 0, 1, 0, Math.PI / 2, 6), arc(105, 0, 1, Math.PI / 2, Math.PI, 6), arc(105, 68, 1, Math.PI, Math.PI * 1.5, 6), arc(0, 68, 1, Math.PI * 1.5, Math.PI * 2, 6)
  ];
  el('path', { d: lines.join(''), 'class': 'hp-lines' }, gPitch);
  [[52.5, 34], [11, 34], [94, 34]].forEach(function (c) { var q = P(c[0], c[1]); el('ellipse', { cx: q[0], cy: q[1], rx: 3 * q[2], ry: 1.6 * q[2], 'class': 'hp-spot' }, gPitch); });
  // Goals with depth: posts 2.44 m high, net back 2 m.
  var nets = [];
  [[105, 107], [0, -2]].forEach(function (g) {
    var x = g[0], back = g[1], y0 = 30.34, y1 = 37.66, h = 2.44;
    nets.push(el('path', { d: poly([[back, y0, 0], [back, y0, h * 0.8], [back, y1, h * 0.8], [back, y1, 0]]) + poly([[x, y0, h], [back, y0, h * 0.8]]) + poly([[x, y1, h], [back, y1, h * 0.8]]), 'class': 'hp-net' }, gPitch));
    el('path', { d: poly([[x, y0, 0], [x, y0, h], [x, y1, h], [x, y1, 0]]), 'class': 'hp-goal' }, gPitch);
  });

  var gZone = el('g', { 'class': 'hp-zone' });
  var zone = el('path', { d: rect(62, 0, 92, 22) }, gZone);
  var gTrails = el('g', { 'class': 'hp-trails' });
  var gPlayers = el('g');
  var gChips = el('g', { 'class': 'hp-chips' });

  // ---------------------------------------------------------------- choreography
  // Positions are pitch metres. Your club attacks right (towards x = 105).
  var US = { u1: [16, 34], u5: [46, 24], u4: [46, 44], u3: [58, 9], u2: [58, 59], u6: [60, 34], u10: [70, 22], u8: [70, 46], u11: [80, 13], u7: [80, 55], u9: [82, 30] };
  var OPP = { o1: [101, 34], o4: [90, 25], o5: [90, 43], o2: [82, 5], o3: [82, 63], o6: [78, 34], o8: [66, 26], o10: [66, 42], o7: [58, 8], o11: [58, 60], o9: [52, 34] };
  var K = [
    { t: 0.0, b: [89.2, 25], ov: {} },
    { t: 1.3, b: [81.4, 5.6], ov: { o2: [82, 5.5], u11: [85, 10], u9: [88, 20], u10: [72, 16], u3: [64, 8], u6: [66, 28], o4: [92, 24], o8: [68, 19], o7: [60, 6], u8: [72, 40] } },
    { t: 2.2, b: [71, 17.4], ov: { o2: [81, 6], u11: [82.5, 7.5], u9: [88, 21], u10: [71.6, 17.4], u3: [66, 7], u6: [68, 27], o4: [92, 24], o8: [69, 19.5], o7: [61, 7], u8: [74, 38] } },
    { t: 3.0, b: [87.4, 27.5], ov: { u9: [88, 27.5], u10: [74, 18], u11: [86, 12], u7: [88, 46], o4: [94, 26], o5: [93, 36], o6: [84, 30], o8: [72, 20], o2: [84, 9], u8: [78, 38], u3: [68, 8], u6: [70, 28] } },
    { t: 3.75, b: [93, 30.2], ov: { u9: [93.6, 30.4], u10: [80, 20], u11: [90, 15], u7: [94, 44], o4: [97, 28], o5: [96, 35], o6: [88, 31], o1: [102.5, 32.5], o8: [76, 22], o2: [88, 12], u8: [82, 36], u3: [70, 8], u6: [72, 28] } },
    { t: 4.15, b: [105.8, 32.8], ov: { u9: [95, 30], u10: [82, 21], u11: [92, 16], u7: [96, 43], o4: [98, 29], o5: [97, 35], o6: [90, 31], o1: [103.6, 31.6], o8: [77, 22], o2: [89, 13], u8: [83, 36], u3: [71, 8], u6: [73, 28] } },
    { t: 6.6, b: [105.8, 32.8], ov: { u9: [99, 20], u10: [90, 21], u11: [96, 18], u7: [99, 30], o4: [99, 30], o5: [99, 36], o6: [91, 32], o1: [104, 32], o8: [79, 23], o2: [91, 14], u8: [88, 30], u3: [74, 10], u6: [76, 28] } }
  ];
  var HOLD = { 0: 'o4', 1: 'o2', 2: 'u10', 3: 'u9', 4: 'u9' };
  var PASSES = [ // from keyframe, to keyframe, team
    [0, 1, 'opp'], [1, 2, 'opp'], [2, 3, 'us'], [4, 5, 'us']
  ];
  var CHIPS = [ // [start, end, keyframe anchor, text, accent, dx, dy]
    [1.3, 3.0, 1, 'Press trigger: pass to the touchline', false, 10, -46],
    [2.2, 4.0, 2, 'Ball won, 34 m from goal', true, -60, -40],
    [3.0, 3.7, 3, 'Line broken, xT +0.18', false, -40, -44],
    [3.75, 6.9, 4, 'Shot, xG 0.38', true, -150, -46],
    [4.15, 6.9, 5, 'Goal', true, 18, -78]
  ];
  var LOOP = 7.6;

  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var frames = K.map(function (k, i) {
    var f = {}, bx = k.b[0];
    var put = function (base) {
      Object.keys(base).forEach(function (id) {
        var o = k.ov[id];
        var p = o || [base[id][0] + (id === 'u1' || id === 'o1' ? 0 : (bx - 85) * 0.18), base[id][1]];
        if (HOLD[i] === id && !o) p = [k.b[0] - 0.6, k.b[1]];
        f[id] = [clamp(p[0], 0.5, 104.5), clamp(p[1], 0.5, 67.5)];
      });
    };
    put(US); put(OPP);
    return f;
  });

  var dots = {};
  Object.keys(frames[0]).forEach(function (id) {
    var g = el('g', { 'class': id.charAt(0) === 'u' ? 'hp-us' : 'hp-opp' }, gPlayers);
    dots[id] = { shadow: el('ellipse', { 'class': 'hp-shadow' }, g), body: el('circle', {}, g) };
  });
  var ballShadow = el('ellipse', { 'class': 'hp-shadow' }, gPlayers);
  var ball = el('circle', { 'class': 'hp-ball' }, gPlayers);
  var holderRing = el('ellipse', { 'class': 'hp-ring' }, gPlayers);

  var trails = PASSES.map(function (p) { return el('path', { 'class': 'hp-pass hp-pass--' + p[2] }, gTrails); });

  var chips = CHIPS.map(function (c) {
    var g = el('g', { 'class': 'hp-chip' + (c[4] ? ' is-accent' : '') }, gChips);
    var line = el('line', { 'class': 'hp-chip__line' }, g);
    var box = el('rect', { rx: 9 }, g);
    var dot = el('circle', { r: 4 }, g);
    var text = el('text', {}, g);
    text.textContent = c[3];
    return { g: g, line: line, box: box, dot: dot, text: text, w: c[3].length * 8.4 + 34 };
  });
  var cs = 1; // chip scale: larger on phones, where the view is zoomed out
  var measure = function () {
    chips.forEach(function (c) {
      c.text.setAttribute('font-size', (16 * cs).toFixed(1));
      c.box.setAttribute('height', (34 * cs).toFixed(1));
      c.dot.setAttribute('r', (4 * cs).toFixed(1));
      try { c.w = c.text.getComputedTextLength() + 38 * cs; } catch (e) { c.w = c.text.textContent.length * 8.4 * cs + 34 * cs; }
    });
  };

  var ease = function (x) { return x * x * (3 - 2 * x); };
  var lerp = function (a, b, e) { return a + (b - a) * e; };
  var ballAt = function (t) {
    var i = 0;
    while (i < K.length - 2 && t > K[i + 1].t) i++;
    var a = K[i], b = K[i + 1], p = clamp((t - a.t) / (b.t - a.t), 0, 1);
    var e = i === 4 ? p * p : 1 - Math.pow(1 - p, 1.6);
    var lift = (i === 2) ? Math.sin(Math.PI * p) * 1.6 : 0; // the through pass is clipped off the ground
    return [lerp(a.b[0], b.b[0], e), lerp(a.b[1], b.b[1], e), lift];
  };

  var render = function (t) {
    var i = 0;
    while (i < K.length - 2 && t > K[i + 1].t) i++;
    var p = clamp((t - K[i].t) / (K[i + 1].t - K[i].t), 0, 1), e = ease(p);
    Object.keys(dots).forEach(function (id) {
      var A = frames[i][id], B = frames[i + 1][id];
      var q = P(lerp(A[0], B[0], e), lerp(A[1], B[1], e));
      var r = 10 * q[2], d = dots[id];
      d.body.setAttribute('cx', q[0].toFixed(1)); d.body.setAttribute('cy', (q[1] - r * 0.9).toFixed(1)); d.body.setAttribute('r', r.toFixed(2));
      d.shadow.setAttribute('cx', (q[0] + r * 0.4).toFixed(1)); d.shadow.setAttribute('cy', q[1].toFixed(1));
      d.shadow.setAttribute('rx', (r * 1.15).toFixed(2)); d.shadow.setAttribute('ry', (r * 0.42).toFixed(2));
    });
    var b = ballAt(t), qb = P(b[0], b[1], b[2]), qg = P(b[0], b[1]);
    ball.setAttribute('cx', qb[0].toFixed(1)); ball.setAttribute('cy', (qb[1] - 4.5 * qb[2]).toFixed(1)); ball.setAttribute('r', (4.6 * qb[2]).toFixed(2));
    ballShadow.setAttribute('cx', qg[0].toFixed(1)); ballShadow.setAttribute('cy', qg[1].toFixed(1));
    ballShadow.setAttribute('rx', (4.2 * qg[2]).toFixed(2)); ballShadow.setAttribute('ry', (1.6 * qg[2]).toFixed(2));
    var hid = HOLD[p > 0.5 ? Math.min(i + 1, 4) : i];
    if (hid && t < K[5].t) {
      var A2 = frames[i][hid], B2 = frames[i + 1][hid], qh = P(lerp(A2[0], B2[0], e), lerp(A2[1], B2[1], e));
      holderRing.setAttribute('cx', qh[0].toFixed(1)); holderRing.setAttribute('cy', qh[1].toFixed(1));
      holderRing.setAttribute('rx', (17 * qh[2]).toFixed(1)); holderRing.setAttribute('ry', (6.5 * qh[2]).toFixed(1));
      holderRing.setAttribute('class', 'hp-ring ' + (hid.charAt(0) === 'u' ? 'is-us' : 'is-opp'));
      holderRing.style.opacity = '1';
    } else holderRing.style.opacity = '0';

    // pass trails grow with the ball and fade towards the end of the loop
    PASSES.forEach(function (ps, n) {
      var a = K[ps[0]], z = K[ps[1]], path = trails[n];
      if (t < a.t) { path.setAttribute('d', ''); return; }
      var pp = clamp((t - a.t) / (z.t - a.t), 0, 1), bb = pp < 1 ? ballAt(t) : z.b;
      path.setAttribute('d', poly([[a.b[0], a.b[1]], [bb[0], bb[1]]]));
      path.style.opacity = t > LOOP - 1.2 ? String(clamp((LOOP - 0.6 - t) / 0.6, 0, 1)) : '';
    });

    zone.style.opacity = String(t < 1.1 ? 0 : t < 1.5 ? (t - 1.1) / 0.4 : t < 3.2 ? 1 : clamp(1 - (t - 3.2) / 0.5, 0, 1));

    CHIPS.forEach(function (c, n) {
      var o = t < c[0] ? 0 : t < c[0] + 0.25 ? (t - c[0]) / 0.25 : t < c[1] ? 1 : clamp(1 - (t - c[1]) / 0.3, 0, 1);
      var ch = chips[n];
      ch.g.style.opacity = o.toFixed(2);
      if (o <= 0) return;
      var kb = K[c[2]].b, q = P(kb[0], kb[1]), vb = svg.viewBox.baseVal;
      var x = clamp(q[0] + c[5] * cs, vb.x + 10, vb.x + vb.width - ch.w - 10);
      var y = q[1] + c[6] * cs - (1 - Math.min(1, o)) * 6;
      ch.box.setAttribute('x', x.toFixed(1)); ch.box.setAttribute('y', (y - 17 * cs).toFixed(1)); ch.box.setAttribute('width', ch.w.toFixed(1));
      ch.dot.setAttribute('cx', (x + 16 * cs).toFixed(1)); ch.dot.setAttribute('cy', y.toFixed(1));
      ch.text.setAttribute('x', (x + 28 * cs).toFixed(1)); ch.text.setAttribute('y', (y + 5 * cs).toFixed(1));
      var lx = clamp(q[0], x + 12, x + ch.w - 12);
      ch.line.setAttribute('x1', lx.toFixed(1)); ch.line.setAttribute('y1', (y + 17 * cs).toFixed(1));
      ch.line.setAttribute('x2', q[0].toFixed(1)); ch.line.setAttribute('y2', (q[1] - 6 * q[2]).toFixed(1));
    });
    gPlayers.style.opacity = t > LOOP - 0.5 ? String(clamp((LOOP - t) / 0.5, 0.35, 1)) : '';
    nets[0].classList.toggle('is-flash', t > 4.15 && t < 5.4);
  };

  // Frame the action: wide screens see the whole pitch, phones crop to the attacking half.
  var frame = function () {
    var w = svg.getBoundingClientRect().width || 1200;
    svg.setAttribute('viewBox', w < 700 ? '700 250 900 520' : w < 1100 ? '260 270 1340 500' : '0 270 1600 500');
    var ncs = w < 700 ? 1.7 : w < 1100 ? 1.2 : 1;
    if (ncs !== cs) { cs = ncs; measure(); }
  };
  frame();
  window.addEventListener('resize', frame);

  var start = function () {
    measure();
    if (reduceMotion) { render(4.6); return; }
    var t0 = null, tNow = 0, raf = null, visible = true, paused = false;
    var loop = function (ts) {
      if (t0 === null) t0 = ts - tNow * 1000;
      tNow = ((ts - t0) / 1000) % LOOP;
      render(tNow);
      raf = requestAnimationFrame(loop);
    };
    var run = function () {
      var on = visible && !paused && !document.hidden;
      if (on && raf === null) { t0 = null; raf = requestAnimationFrame(loop); }
      if (!on && raf !== null) { cancelAnimationFrame(raf); raf = null; }
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; run(); }).observe(svg);
    }
    document.addEventListener('visibilitychange', run);
    var btn = document.querySelector('[data-hero-toggle]');
    if (btn) {
      btn.hidden = false;
      btn.addEventListener('click', function () {
        paused = !paused;
        btn.querySelector('[data-label]').textContent = paused ? 'Play' : 'Pause';
        btn.firstElementChild.className = paused ? 'icon-play' : 'icon-pause';
        btn.setAttribute('aria-label', paused ? 'Play the animation' : 'Pause the animation');
        run();
      });
    }
    run();
  };
  render(0);
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(start);
})();
