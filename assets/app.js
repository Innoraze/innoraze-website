/* Innoraze site behaviour. No dependencies. Everything respects prefers-reduced-motion. */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var onScreen = function (el, cb, opts) {
    if (!('IntersectionObserver' in window)) { cb(true); return function () {}; }
    var io = new IntersectionObserver(function (entries) { cb(entries[0].isIntersecting, entries[0]); }, opts || { threshold: 0 });
    io.observe(el);
    return function () { io.disconnect(); };
  };
  var once = function (el, cb, threshold) {
    var stop = onScreen(el, function (vis) { if (vis) { stop(); cb(); } }, { threshold: threshold || 0.3 });
  };
  var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();

  /* Header ------------------------------------------------------------ */
  var header = $('[data-header]');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    var darkHero = $('[data-dark-hero]');
    if (darkHero) {
      onScreen(darkHero, function (vis, entry) {
        header.classList.toggle('is-dark', vis && entry.intersectionRect.top <= 80);
      }, { rootMargin: '-68px 0px 0px 0px', threshold: [0, 0.01] });
      header.classList.add('is-dark');
    }
  }

  var toggle = $('[data-nav-toggle]');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', function () { setOpen(toggle.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setOpen(false); toggle.focus(); }
    });
  }

  /* Pointer light on product windows ---------------------------------- */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.addEventListener('pointermove', function (e) {
      var w = e.target.closest && e.target.closest('.window');
      if (!w) return;
      var r = w.getBoundingClientRect();
      w.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      w.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }

  /* Count-up numbers ---------------------------------------------------- */
  var countUp = function (els, duration, delay) {
    if (reduceMotion) return;
    els.forEach(function (el) {
      var to = parseFloat(el.getAttribute('data-count')), dp = parseInt(el.getAttribute('data-dp') || '0', 10);
      el.textContent = (0).toFixed(dp);
      var start = null;
      var tick = function (t) {
        if (start === null) start = t + delay;
        var p = Math.min(1, Math.max(0, (t - start) / duration));
        var e = 1 - Math.pow(1 - p, 3);
        el.textContent = (to * e).toFixed(dp);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  };

  /* Match report window: the match replays as it comes into view ------- */
  var report = $('.hero-window');
  var clock = $('[data-clock]');
  if (report) {
    var replayBtn = $('[data-replay]', report);
    var play = function () {
      report.classList.remove('is-played');
      void report.getBoundingClientRect();
      report.classList.add('is-played');
      if (reduceMotion) return;
      countUp($$('[data-count]', report), 2600, 400);
      if (!clock) return;
      var start = null, delay = 400, length = 2600;
      var tick = function (t) {
        if (start === null) start = t;
        var p = (t - start - delay) / length;
        if (p < 0) clock.textContent = '0’';
        else if (p < 1) clock.textContent = Math.floor(p * 90) + '’';
        else { clock.textContent = 'Full time'; return; }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    fontsReady.then(function () { once(report, play, 0.25); });
    if (replayBtn && !reduceMotion) {
      replayBtn.hidden = false;
      replayBtn.addEventListener('click', play);
    }
  }

  /* Tabs (sample report) ---------------------------------------------- */
  $$('[data-tabs]').forEach(function (root) {
    var tabs = $$('[role="tab"]', root);
    var list = $('[role="tablist"]', root);
    var select = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tab.focus({ preventScroll: true });
      if (list && list.scrollWidth > list.clientWidth) {
        list.scrollTo({ left: Math.max(0, tab.offsetLeft - 20), behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    };
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab, false); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') next = tabs[0];
        if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); select(next, true); }
      });
    });
  });

  /* Matchweek scroll story -------------------------------------------- */
  var story = $('[data-story]');
  if (story) {
    var steps = $$('.story__step', story);
    var screens = steps.map(function (s) { return $('.story__screen', s); });
    var stage = $('[data-stage]', story);
    screens.forEach(function (s) { s.setAttribute('data-reveal', ''); });
    var wide = window.matchMedia('(min-width: 961px)');
    var current = -1;
    var setCurrent = function (i) {
      if (i === current) return;
      current = i;
      steps.forEach(function (s, n) { s.classList.toggle('is-current', n === i); });
      screens.forEach(function (s, n) {
        s.classList.toggle('is-current', n === i);
        if (n === i) s.classList.add('is-active');
        else if (story.classList.contains('is-staged')) s.classList.remove('is-active');
      });
    };
    var layout = function () {
      if (wide.matches && !story.classList.contains('is-staged')) {
        screens.forEach(function (s) { stage.appendChild(s); });
        story.classList.add('is-staged');
        current = -1;
      } else if (!wide.matches && story.classList.contains('is-staged')) {
        screens.forEach(function (s, n) { steps[n].appendChild(s); s.classList.remove('is-current'); });
        story.classList.remove('is-staged');
      }
    };
    layout();
    if (wide.addEventListener) wide.addEventListener('change', layout);
    var pick = function () {
      if (story.classList.contains('is-staged')) {
        var mid = window.innerHeight * 0.5, best = 0;
        steps.forEach(function (s, n) { if (s.getBoundingClientRect().top < mid) best = n; });
        setCurrent(best);
        var list = $('.story__steps', story), r = list.getBoundingClientRect();
        var p = Math.min(1, Math.max(0, (mid - r.top) / r.height));
        list.style.setProperty('--progress', p.toFixed(3));
      }
    };
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; pick(); });
    }, { passive: true });
    pick();
    // On narrow screens each screen animates as it scrolls into view.
    screens.forEach(function (s) {
      onScreen(s, function (vis) { if (vis && !story.classList.contains('is-staged')) s.classList.add('is-active'); }, { threshold: 0.35 });
    });
  }

  /* Matchweek feed (product card) ------------------------------------- */
  var feed = $('[data-feed]');
  if (feed) {
    var track = $('.feed__track', feed);
    var items = $$('li', track);
    var visibleCount = 3, rowH = 56, idx = 2, timer = null;
    // Show three at a time; the newest slides in at the bottom.
    var renderFeed = function (animate) {
      var top = Math.max(0, idx - (visibleCount - 1));
      track.style.transition = animate ? 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none';
      track.style.transform = 'translateY(' + (-top * rowH) + 'px)';
      items.forEach(function (li, n) {
        li.classList.toggle('is-new', n === idx);
        li.style.opacity = n > idx ? '0' : '';
        li.style.transition = 'opacity 0.4s ease';
      });
    };
    var step = function () {
      idx++;
      renderFeed(true);
      if (idx >= items.length - 1) { clearInterval(timer); timer = -1; } // plays through the week once
    };
    track.style.transition = 'opacity 0.3s ease';
    if (reduceMotion) { idx = 2; renderFeed(false); }
    else {
      renderFeed(false);
      onScreen(feed, function (vis) {
        if (timer === -1) return;
        if (vis && !timer) timer = setInterval(step, 2200);
        if (!vis && timer) { clearInterval(timer); timer = null; }
      }, { threshold: 0.3 });
    }
  }

  /* Recruit mini search (product card) -------------------------------- */
  var ms = $('[data-mini-search]');
  if (ms && !reduceMotion) {
    var typed = $('[data-typed]', ms), results = $('[data-results]', ms);
    var Q = [
      { q: 'Left-footed centre-back, under 23', r: [['Player E', 92], ['Player F', 89], ['Player G', 84]] },
      { q: 'Pressing striker, 8+ league goals', r: [['Player H', 90], ['Player J', 87], ['Player K', 81]] },
      { q: 'Ball-winning midfielder, Nordic leagues', r: [['Player L', 93], ['Player M', 88], ['Player N', 85]] }
    ];
    var qi = 0, running = false, alive = false;
    var wait = function (ms_) { return new Promise(function (res) { setTimeout(res, ms_); }); };
    var cycle = function () {
      if (!alive) { running = false; return; }
      running = true;
      var item = Q[qi % Q.length];
      results.classList.add('is-hidden');
      var text = item.q, n = 0;
      typed.textContent = '';
      var typeNext = function () {
        if (n <= text.length) { typed.textContent = text.slice(0, n++); setTimeout(typeNext, 38); return; }
        $$('li', results).forEach(function (li, k) {
          var r = item.r[k];
          li.children[0].textContent = r[0];
          li.children[2].textContent = r[1] + '%';
          li.querySelector('.mbar span').style.width = r[1] + '%';
          li.style.transitionDelay = (k * 90) + 'ms';
        });
        wait(250).then(function () { results.classList.remove('is-hidden'); return wait(3200); })
          .then(function () { qi++; if (qi < Q.length) cycle(); else { running = true; alive = false; } });
      };
      typeNext();
    };
    onScreen(ms, function (vis) { alive = vis; if (vis && !running) cycle(); }, { threshold: 0.4 });
  }

  /* Dashboards mini trend (product card) ------------------------------ */
  var trendSvg = $('[data-trend]');
  if (trendSvg) {
    var wrap = trendSvg.closest('[data-trend-wrap]');
    var data = trendSvg.getAttribute('data-trend').split(',').map(function (p) { return p.split('|').map(parseFloat); });
    var x0 = +trendSvg.getAttribute('data-x0'), x1 = +trendSvg.getAttribute('data-x1');
    var gy0 = +trendSvg.getAttribute('data-y0'), gy1 = +trendSvg.getAttribute('data-y1');
    var X = function (i) { return x0 + (x1 - x0) * i / (data.length - 1); };
    var Y = function (v) { return gy0 - (gy0 - gy1) * (v - 0.8) / (2.1 - 0.8); };
    var cur = $('.trend-cursor', trendSvg), du = $('.trend-dot--us', trendSvg), dop = $('.trend-dot--opp', trendSvg);
    var val = $('[data-trend-value]', wrap), lab = $('[data-trend-label]', wrap);
    var show = function (i) {
      var d = data[i], diff = d[0] - d[1];
      cur.setAttribute('x1', X(i)); cur.setAttribute('x2', X(i));
      du.setAttribute('cx', X(i)); du.setAttribute('cy', Y(d[0]));
      dop.setAttribute('cx', X(i)); dop.setAttribute('cy', Y(d[1]));
      val.textContent = (diff >= 0 ? '+' : '−') + Math.abs(diff).toFixed(2);
      lab.textContent = 'Matchday ' + (i + 1);
    };
    show(data.length - 1);
    wrap.setAttribute('data-reveal', '');
    var sweeping = null;
    var sweep = function () {
      if (reduceMotion) return;
      var start = null, dur = 2400;
      var tick = function (t) {
        if (start === null) start = t;
        var p = Math.min(1, (t - start) / dur);
        show(Math.round(p * (data.length - 1)));
        if (p < 1) sweeping = requestAnimationFrame(tick); else sweeping = null;
      };
      sweeping = requestAnimationFrame(tick);
    };
    once(wrap, function () { wrap.classList.add('is-active'); setTimeout(sweep, 300); }, 0.4);
    trendSvg.addEventListener('pointermove', function (e) {
      if (sweeping) { cancelAnimationFrame(sweeping); sweeping = null; }
      var r = trendSvg.getBoundingClientRect();
      var vbx = (e.clientX - r.left) / r.width * 360;
      var i = Math.round((vbx - x0) / (x1 - x0) * (data.length - 1));
      show(Math.max(0, Math.min(data.length - 1, i)));
    });
    trendSvg.addEventListener('pointerleave', function () { show(data.length - 1); });
  }

  /* Recruit window: cycles through the shortlist ---------------------- */
  $$('[data-recruit]').forEach(function (win) {
    var players = JSON.parse(win.getAttribute('data-recruit'));
    var buttons = $$('[data-player]', win);
    var nameEl = $('[data-pname]', win), footEl = $('[data-pfoot]', win);
    var vals = $$('[data-pct-val]', win), bars = $$('[data-pct-bar]', win);
    var at = 0, timer = null, userTook = false, hover = false;
    var select = function (i) {
      at = i;
      buttons.forEach(function (b, n) { b.classList.toggle('is-active', n === i); b.setAttribute('aria-pressed', String(n === i)); });
      var p = players[i];
      nameEl.textContent = p.n; footEl.textContent = p.f;
      p.p.forEach(function (v, n) { vals[n].textContent = v; bars[n].style.width = v + '%'; });
    };
    buttons.forEach(function (b, n) {
      b.addEventListener('click', function () { userTook = true; stop(); select(n); });
    });
    var start = function () {
      if (timer || userTook || reduceMotion) return;
      timer = setInterval(function () {
        if (hover) return;
        var next = (at + 1) % players.length;
        select(next);
        if (next === 0) { userTook = true; stop(); } // one pass through the shortlist, then rest on the top match
      }, 3400);
    };
    var stop = function () { if (timer) { clearInterval(timer); timer = null; } };
    win.addEventListener('mouseenter', function () { hover = true; });
    win.addEventListener('mouseleave', function () { hover = false; });
    onScreen(win, function (vis) { if (vis) start(); else stop(); }, { threshold: 0.4 });
    // Bars grow in the first time the window is seen.
    if (!reduceMotion) {
      bars.forEach(function (b) { b.dataset.w = b.style.width; b.style.width = '0'; });
      once(win, function () { bars.forEach(function (b) { b.style.width = b.dataset.w; }); }, 0.35);
    }
  });

  /* Progress lines that fill as you scroll past them ------------------ */
  $$('[data-path]').forEach(function (path) {
    if (reduceMotion) return;
    path.style.setProperty('--progress', '0');
    var update = function () {
      var r = path.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
      path.style.setProperty('--progress', p.toFixed(3));
    };
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; update(); });
    }, { passive: true });
    update();
  });

  /* Platform sub-navigation highlights the section you're in ---------- */
  var subnav = $('[data-subnav]');
  if (subnav) {
    var links = $$('a', subnav);
    var targets = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
    var mark = function () {
      var best = -1;
      targets.forEach(function (t, n) { if (t && t.getBoundingClientRect().top < 200) best = n; });
      links.forEach(function (a, n) { if (n === best) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    };
    window.addEventListener('scroll', function () { requestAnimationFrame(mark); }, { passive: true });
    mark();
  }

  /* Tracking replay ---------------------------------------------------- */
  var trkSvg = $('[data-tracking-pitch]');
  if (trkSvg) {
    var NS = 'http://www.w3.org/2000/svg';
    var gPlayers = $('.trk-players', trkSvg), ball = $('.trk-ball', trkSvg), trail = $('.trk-trail', trkSvg);
    var log = $('[data-trk-events]');
    var logItems = log ? $$('li', log) : [];
    var btn = $('[data-trk-toggle]');
    var K = [
      { t: 0.0, b: [25, 44] }, { t: 1.1, b: [40, 36] }, { t: 2.2, b: [54, 22] }, { t: 3.5, b: [74, 8] },
      { t: 4.6, b: [87, 11] }, { t: 5.5, b: [95, 31] }, { t: 6.0, b: [105.6, 35] }, { t: 8.2, b: [105.6, 35] }
    ];
    var EV = [1.1, 2.2, 3.5, 4.6, 5.5, 6.0, 6.05];
    var LOOP = 9.2;
    var US = { 1: [6, 34], 5: [25, 24], 4: [25, 44], 3: [38, 8], 2: [38, 60], 6: [40, 34], 10: [52, 22], 8: [52, 46], 11: [68, 10], 7: [68, 58], 9: [74, 34] };
    var OPP = { 1: [99, 34], 2: [80, 15], 3: [82, 28], 4: [82, 40], 5: [80, 53], 6: [66, 13], 7: [67, 27], 8: [67, 41], 9: [66, 55], 10: [52, 28], 11: [53, 42] };
    var HOLD = { 0: 4, 1: 6, 2: 10, 3: 3, 4: 3, 5: 9 };
    var OV = {
      u3: [[40, 8], [50, 8], [63, 7], null, null, [86, 12], [86, 14], [86, 14]],
      u9: [[72, 34], [74, 33], [77, 32], [82, 30], [88, 31], null, [97, 33], [97, 33]],
      u11: [null, null, [72, 14], [78, 18], [84, 22], [90, 25], [92, 26], [92, 26]],
      u7: [null, null, null, [80, 52], [88, 48], [94, 42], [96, 40], [96, 40]],
      u10: [null, null, null, [66, 22], [76, 24], [82, 30], [83, 31], [83, 31]],
      u8: [null, null, null, [66, 44], [74, 42], [80, 40], [80, 40], [80, 40]],
      o2: [null, null, null, [80, 10], [86, 12], [89, 14], [90, 15], [90, 15]],
      o3: [null, null, null, null, [90, 27], [96, 30], [97, 32], [97, 32]],
      o4: [null, null, null, null, [90, 37], [95, 37], [96, 38], [96, 38]],
      o1: [null, null, null, null, null, [101, 33], [103.6, 34.6], [103.6, 34.6]],
      o6: [null, null, null, [74, 12], [80, 14], [82, 17], [82, 17], [82, 17]]
    };
    var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
    var frames = K.map(function (k, i) {
      var f = {}, bx = k.b[0], by = k.b[1];
      Object.keys(US).forEach(function (n) {
        var base = US[n], o = OV['u' + n] && OV['u' + n][i];
        var p = o || (n === '1' ? [base[0] + (bx - 50) * 0.08, base[1]] : [base[0] + (bx - 50) * 0.3, base[1] + (by - 34) * 0.2]);
        if (HOLD[i] === +n) p = [bx - 0.9, by];
        f['u' + n] = [clamp(p[0], 1, 104), clamp(p[1], 1, 67)];
      });
      Object.keys(OPP).forEach(function (n) {
        var base = OPP[n], o = OV['o' + n] && OV['o' + n][i];
        var p = o || (n === '1' ? [base[0], base[1] + (by - 34) * 0.1] : [base[0] + (bx - 50) * 0.32, base[1] + (by - 34) * 0.32]);
        f['o' + n] = [clamp(p[0], 1, 104.5), clamp(p[1], 1, 67)];
      });
      return f;
    });
    var dots = {};
    Object.keys(frames[0]).forEach(function (id) {
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', '1.35');
      c.setAttribute('class', id.charAt(0) === 'u' ? 'trk-us' : 'trk-opp');
      gPlayers.appendChild(c);
      dots[id] = c;
    });
    var ease = function (x) { return x * x * (3 - 2 * x); };
    var render = function (t) {
      var i = 0;
      while (i < K.length - 2 && t > K[i + 1].t) i++;
      var a = K[i], b = K[i + 1];
      var p = clamp((t - a.t) / (b.t - a.t), 0, 1), e = ease(p);
      Object.keys(dots).forEach(function (id) {
        var A = frames[i][id], B = frames[i + 1][id];
        dots[id].setAttribute('cx', (A[0] + (B[0] - A[0]) * e).toFixed(2));
        dots[id].setAttribute('cy', (A[1] + (B[1] - A[1]) * e).toFixed(2));
      });
      var bp = i === 5 ? p * p : p;
      var bx = a.b[0] + (b.b[0] - a.b[0]) * bp, by = a.b[1] + (b.b[1] - a.b[1]) * bp;
      ball.setAttribute('cx', bx.toFixed(2));
      ball.setAttribute('cy', by.toFixed(2));
      var d = 'M' + K[0].b[0] + ' ' + K[0].b[1];
      for (var j = 1; j <= i; j++) d += 'L' + K[j].b[0] + ' ' + K[j].b[1];
      trail.setAttribute('d', d + 'L' + bx.toFixed(2) + ' ' + by.toFixed(2));
      logItems.forEach(function (li, n) { li.classList.toggle('is-on', t >= EV[n]); });
    };
    if (log) log.setAttribute('data-live', '');
    if (reduceMotion) {
      render(K[K.length - 1].t);
    } else {
      var running = true, visible = false, t0 = null, tNow = 0, raf = null;
      var loop = function (ts) {
        if (t0 === null) t0 = ts - tNow * 1000;
        tNow = (ts - t0) / 1000;
        if (tNow > LOOP) { t0 = ts; tNow = 0; }
        render(Math.min(tNow, K[K.length - 1].t));
        trkSvg.style.opacity = tNow > LOOP - 0.5 ? String(Math.max(0.25, (LOOP - tNow) * 2)) : '';
        raf = requestAnimationFrame(loop);
      };
      var syncRun = function () {
        if (running && visible && raf === null) { t0 = null; raf = requestAnimationFrame(loop); }
        if ((!running || !visible) && raf !== null) { cancelAnimationFrame(raf); raf = null; }
      };
      render(0);
      if (btn) {
        btn.hidden = false;
        btn.addEventListener('click', function () {
          running = !running;
          $('[data-label]', btn).textContent = running ? 'Pause' : 'Play';
          btn.firstElementChild.className = running ? 'icon-pause' : 'icon-play';
          syncRun();
        });
      }
      onScreen(trkSvg, function (vis) { visible = vis; syncRun(); }, { threshold: 0.3 });
    }
  }

  /* Sample report: shots map <-> table -------------------------------- */
  $$('[data-shots]').forEach(function (root) {
    var hot = function (el, on) {
      if (!el) return;
      $$('[data-shot="' + el.getAttribute('data-shot') + '"]', root).forEach(function (n) { n.classList.toggle('is-hot', on); });
    };
    ['mouseover', 'focusin'].forEach(function (ev) { root.addEventListener(ev, function (e) { hot(e.target.closest('[data-shot]'), true); }); });
    ['mouseout', 'focusout'].forEach(function (ev) { root.addEventListener(ev, function (e) { hot(e.target.closest('[data-shot]'), false); }); });
  });

  /* Sortable tables -------------------------------------------------- */
  $$('table[data-sortable]').forEach(function (table) {
    var ths = $$('th', table);
    $$('th button', table).forEach(function (button) {
      button.addEventListener('click', function () {
        var th = button.closest('th');
        var idx = ths.indexOf(th);
        var dir = th.getAttribute('aria-sort') === 'descending' ? 'ascending' : 'descending';
        ths.forEach(function (h) { h.removeAttribute('aria-sort'); });
        th.setAttribute('aria-sort', dir);
        var body = table.tBodies[0];
        Array.prototype.slice.call(body.rows).sort(function (a, b) {
          var x = parseFloat(a.cells[idx].textContent), y = parseFloat(b.cells[idx].textContent);
          return dir === 'ascending' ? x - y : y - x;
        }).forEach(function (r) { body.appendChild(r); });
      });
    });
  });

  /* Contact form ------------------------------------------------------ */
  var form = $('[data-form]');
  if (form) {
    var params = new URLSearchParams(window.location.search);
    var topic = params.get('topic');
    if (topic) { var r = $('[data-topic="' + topic + '"]', form); if (r) r.checked = true; }
    var hint = $('[data-hint-access]', form);
    var syncHint = function () { if (hint) hint.hidden = !$('[data-topic="access"]', form).checked; };
    form.addEventListener('change', syncHint);
    syncHint();
    var status = $('[data-status]', form), submit = $('[data-submit]', form);
    var done = function (email) {
      var box = document.createElement('div');
      box.className = 'form-done';
      box.setAttribute('tabindex', '-1');
      box.innerHTML = '<h2 class="h3">Request sent</h2><p></p>';
      box.querySelector('p').textContent = email
        ? 'Thanks. We’ll reply to ' + email + ' within two working days.'
        : 'Thanks. We’ll reply within two working days.';
      form.parentNode.replaceChild(box, form);
      box.focus();
    };
    if (params.get('sent')) { done(''); }
    else {
      form.addEventListener('submit', function (e) {
        if (!window.fetch || !window.FormData) return;
        e.preventDefault();
        var email = form.elements.email.value;
        status.classList.remove('is-error');
        status.textContent = 'Sending…';
        submit.disabled = true;
        fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
          .then(function (res) { if (!res.ok) throw new Error(res.status); done(email); })
          .catch(function () {
            status.textContent = 'Your request didn’t send. Check your connection and try again, or email contact@innoraze.com.';
            status.classList.add('is-error');
            submit.disabled = false;
          });
      });
    }
  }

  /* Settings-driven features: analytics, chat, booking ------------------ */
  var cfg = window.INNORAZE || {};
  var loadScript = function (src, attrs) {
    return new Promise(function (resolve, reject) {
      var sc = document.createElement('script');
      sc.src = src; sc.async = true;
      if (attrs) Object.keys(attrs).forEach(function (k) { sc.setAttribute(k, attrs[k]); });
      sc.onload = resolve; sc.onerror = reject;
      document.head.appendChild(sc);
    });
  };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  // Visitor numbers: Cloudflare Web Analytics sets no cookies.
  if (cfg.cloudflareToken) {
    loadScript('https://static.cloudflareinsights.com/beacon.min.js', { 'data-cf-beacon': JSON.stringify({ token: cfg.cloudflareToken }) }).catch(function () {});
  }

  // Live chat: our own button; Crisp only loads once someone asks to chat.
  var chatBtn = $('[data-chat]');
  if (chatBtn && cfg.crispWebsiteId) {
    var badge = $('.chat-launch__badge', chatBtn);
    var crispReady = null;
    var bootCrisp = function () {
      if (crispReady) return crispReady;
      window.$crisp = window.$crisp || [];
      window.CRISP_WEBSITE_ID = cfg.crispWebsiteId;
      window.$crisp.push(['safe', true]);
      window.$crisp.push(['do', 'chat:hide']);
      window.$crisp.push(['on', 'chat:opened', function () { chatBtn.hidden = true; chatBtn.classList.remove('is-loading'); badge.hidden = true; }]);
      window.$crisp.push(['on', 'chat:closed', function () { window.$crisp.push(['do', 'chat:hide']); chatBtn.hidden = false; }]);
      window.$crisp.push(['on', 'message:received', function () { if (!chatBtn.hidden) badge.hidden = false; }]);
      crispReady = loadScript('https://client.crisp.chat/l.js');
      store.set('iz-chat', '1');
      return crispReady;
    };
    chatBtn.hidden = false;
    chatBtn.addEventListener('click', function () {
      chatBtn.classList.add('is-loading');
      bootCrisp().then(function () {
        window.$crisp.push(['do', 'chat:show']);
        window.$crisp.push(['do', 'chat:open']);
      }).catch(function () { window.location.href = '/contact'; });
    });
    // Someone who has chatted before keeps their conversation, so replies reach them.
    if (store.get('iz-chat') === '1') bootCrisp().catch(function () {});
  }

  // Call booking: [data-book] buttons open the Calendly calendar inside our own frame.
  // BOOKING-START
  if (cfg.calendlyUrl) {
    $$('[data-book-block]').forEach(function (b) { b.hidden = false; });
    var bk = null;
    var bkSub = '30 minutes with the Innoraze team';
    var bkSrc = function () {
      return cfg.calendlyUrl + (cfg.calendlyUrl.indexOf('?') > -1 ? '&' : '?') +
        'embed_domain=' + encodeURIComponent(location.hostname || 'innoraze.com') +
        '&embed_type=Inline&hide_event_type_details=1&hide_gdpr_banner=1&primary_color=ff6a1a';
    };
    var bkBuild = function () {
      var d = document.createElement('dialog');
      d.className = 'booking';
      d.setAttribute('aria-labelledby', 'booking-title');
      d.innerHTML =
        '<div class="booking__bar">' +
          '<svg class="booking__mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#123b2c"/><path d="M7.5 24.5V11.5a13 13 0 0 1 13 13z" fill="#ff6a1a"/></svg>' +
          '<div class="booking__head"><h2 class="booking__title" id="booking-title">Book a call</h2>' +
          '<p class="booking__sub">' + bkSub + '</p></div>' +
          '<button class="booking__close" type="button" aria-label="Close">' +
            '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" fill="none"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="booking__body">' +
          '<div class="booking__wait"><span class="booking__dots" aria-hidden="true"><i></i><i></i><i></i></span>' +
          '<p class="booking__slow" hidden>The calendar is taking a while. You can also <a href="/contact" data-no-book>send us a request</a>.</p></div>' +
        '</div>';
      document.body.appendChild(d);
      var b = {
        d: d, body: $('.booking__body', d), slow: $('.booking__slow', d),
        title: $('.booking__title', d), sub: $('.booking__sub', d),
        frame: null, ready: false, booked: false, timer: 0
      };
      var downOutside = false;
      d.addEventListener('pointerdown', function (e) { downOutside = e.target === d; });
      d.addEventListener('click', function (e) { if (e.target === d && downOutside) bkClose(); });
      d.addEventListener('cancel', function (e) { e.preventDefault(); bkClose(); });
      d.addEventListener('close', function () {
        d.classList.remove('is-closing');
        document.documentElement.classList.remove('is-modal');
        if (b.booked) bkReset();
      });
      $('.booking__close', d).addEventListener('click', bkClose);
      return b;
    };
    var bkShow = function () {
      if (!bk || bk.ready) return;
      bk.ready = true; clearTimeout(bk.timer);
      bk.body.classList.add('is-ready');
    };
    var bkLoad = function () {
      var f = document.createElement('iframe');
      f.className = 'booking__frame';
      f.title = 'Calendar for booking a call';
      f.src = bkSrc();
      // Calendly tells us when its page is drawn; this is only a backstop.
      f.addEventListener('load', function () { setTimeout(bkShow, 6000); });
      bk.timer = setTimeout(function () { if (!bk.ready) bk.slow.hidden = false; }, 12000);
      bk.body.appendChild(f);
      bk.frame = f;
    };
    var bkReset = function () {
      if (bk.frame) bk.frame.remove();
      bk.frame = null; bk.ready = false; bk.booked = false;
      bk.body.classList.remove('is-ready');
      bk.d.style.removeProperty('--bk-h');
      bk.slow.hidden = true;
      bk.title.textContent = 'Book a call';
      bk.sub.innerHTML = bkSub;
    };
    var bkOpen = function () {
      if (!bk) bk = bkBuild();
      if (bk.d.open) return;
      if (!bk.frame) bkLoad();
      document.documentElement.classList.add('is-modal');
      bk.d.showModal();
    };
    var bkClose = function () {
      var d = bk && bk.d;
      if (!d || !d.open || d.classList.contains('is-closing')) return;
      if (reduceMotion) { d.close(); return; }
      d.classList.add('is-closing');
      setTimeout(function () { d.close(); }, 200);
    };
    window.addEventListener('message', function (e) {
      if (!bk || e.origin !== 'https://calendly.com' || !e.data || typeof e.data.event !== 'string') return;
      var ev = e.data.event;
      if (ev === 'calendly.page_height') {
        // Fit the frame to each step of the calendar, so it never hangs half empty.
        var h = parseInt(e.data.payload && e.data.payload.height, 10);
        if (h > 300) { bk.d.style.setProperty('--bk-h', h + 'px'); bkShow(); }
        return;
      }
      if (ev === 'calendly.event_scheduled') {
        bk.booked = true;
        bk.title.textContent = 'You’re booked';
        bk.sub.textContent = 'The invite is on its way to your inbox.';
      }
      bkShow();
    });
    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('[data-book]');
      if (!trigger || trigger.hasAttribute('data-no-book') || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (typeof HTMLDialogElement !== 'function') return;
      e.preventDefault();
      bkOpen();
    });
  }
  // BOOKING-END

  /* Expected goals explorer (methodology page) ------------------------- */
  var xgSvg = $('[data-xg]');
  if (xgSvg) {
    var marker = $('.xg-marker', xgSvg), cone = $('.xg-cone', xgSvg);
    var outVal = $('[data-xg-value]'), outDetail = $('[data-xg-detail]'), outPlain = $('[data-xg-plain]');
    var xgAt = function (u, v) {
      var d = Math.hypot(u - 34, v);
      var a = Math.abs(Math.atan2(-v, 37.66 - u) - Math.atan2(-v, 30.34 - u));
      if (a > Math.PI) a = 2 * Math.PI - a;
      var z = 0.248 + 1.6 * Math.min(a, 0.9) - 0.1931 * d;
      return { xg: Math.min(0.95, Math.max(0.01, 1 / (1 + Math.exp(-z)))), d: d, a: a };
    };
    var plain = function (x) {
      if (x >= 0.5) return 'Scored more often than not.';
      if (x >= 0.095) return 'Scored about ' + Math.round(x * 10) + ' time' + (Math.round(x * 10) === 1 ? '' : 's') + ' in 10.';
      if (x >= 0.015) return 'Scored about ' + Math.max(1, Math.round(x * 100)) + ' times in 100.';
      return 'Scored about once in 100 tries, or less.';
    };
    var place = function (u, v) {
      u = Math.max(0, Math.min(68, u)); v = Math.max(0.3, Math.min(39, v));
      var r = xgAt(u, v);
      marker.setAttribute('cx', u.toFixed(2)); marker.setAttribute('cy', v.toFixed(2));
      marker.setAttribute('r', (1 + Math.sqrt(r.xg) * 2.6).toFixed(2));
      cone.setAttribute('d', 'M' + u.toFixed(2) + ' ' + v.toFixed(2) + 'L30.34 0L37.66 0Z');
      outVal.textContent = r.xg.toFixed(2);
      outDetail.textContent = r.d.toFixed(1) + ' m from goal, ' + Math.round(r.a * 180 / Math.PI) + '° of the goal in view';
      outPlain.textContent = plain(r.xg);
    };
    var toPitch = function (e) {
      var pt = xgSvg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      var q = pt.matrixTransform(xgSvg.getScreenCTM().inverse());
      return [q.x, q.y];
    };
    var dragging = false;
    xgSvg.addEventListener('pointerdown', function (e) { dragging = true; var q = toPitch(e); place(q[0], q[1]); try { xgSvg.setPointerCapture(e.pointerId); } catch (er) {} });
    xgSvg.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'mouse' || dragging) { var q = toPitch(e); place(q[0], q[1]); }
    });
    xgSvg.addEventListener('pointerup', function () { dragging = false; });
    $$('[data-xg-spot]').forEach(function (b) {
      b.addEventListener('click', function () {
        var c = b.getAttribute('data-xg-spot').split(',').map(Number);
        $$('[data-xg-spot]').forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
        place(c[0], c[1]);
      });
    });
    place(34, 11);
  }
})();
