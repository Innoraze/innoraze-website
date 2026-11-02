(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var onScreen = function (el, cb, threshold) {
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    new IntersectionObserver(function (entries) { cb(entries[0].isIntersecting); }, { threshold: threshold || 0 }).observe(el);
  };

  /* Header ------------------------------------------------------------ */
  var header = $('[data-header]');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
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

  /* Hero: the match replays in the report ----------------------------- */
  var hero = $('.hero-window');
  var clock = $('[data-clock]');
  if (hero) {
    var played = false;
    var play = function () {
      if (played) return;
      played = true;
      hero.classList.add('is-played');
      if (reduceMotion || !clock) return;
      var start = null, delay = 400, length = 2600;
      var tick = function (t) {
        if (start === null) start = t;
        var p = (t - start - delay) / length;
        if (p < 0) clock.textContent = '0\u2019';
        else if (p < 1) clock.textContent = Math.floor(p * 90) + '\u2019';
        else { clock.textContent = 'Full time'; return; }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () {
      onScreen(hero, function (vis) { if (vis) play(); }, 0.2);
    });
  }

  /* Tabs (matchweek and sample report) -------------------------------- */
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
    root._select = select;
    root._tabs = tabs;
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab, false); root.dispatchEvent(new CustomEvent('tabs:user')); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') next = tabs[0];
        if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); select(next, true); root.dispatchEvent(new CustomEvent('tabs:user')); }
      });
    });
  });

  /* Matchweek: plays through the week until someone takes over ------- */
  var week = $('[data-week]');
  if (week && week._select && !reduceMotion) {
    var ctrl = $('[data-week-toggle]', week);
    var userPaused = false, inView = false, hovering = false;
    var sync = function () { week.classList.toggle('is-paused', userPaused || !inView || hovering); };
    var setCtrl = function () {
      $('[data-label]', ctrl).textContent = userPaused ? 'Play tour' : 'Pause tour';
      ctrl.firstElementChild.className = userPaused ? 'icon-play' : 'icon-pause';
      ctrl.setAttribute('aria-label', userPaused ? 'Play the matchweek tour' : 'Pause the matchweek tour');
    };
    ctrl.hidden = false;
    setCtrl();
    week.classList.add('is-auto', 'is-paused');
    week.addEventListener('animationend', function (e) {
      if (e.animationName !== 'week-progress' || !week.classList.contains('is-auto')) return;
      var tabs = week._tabs;
      var i = tabs.indexOf(e.target);
      week._select(tabs[(i + 1) % tabs.length], false);
    });
    week.addEventListener('tabs:user', function () { week.classList.remove('is-auto', 'is-paused'); ctrl.hidden = true; });
    ctrl.addEventListener('click', function () { userPaused = !userPaused; setCtrl(); sync(); });
    var panelArea = $$('.week__panel', week);
    panelArea.forEach(function (p) {
      p.addEventListener('mouseenter', function () { hovering = true; sync(); });
      p.addEventListener('mouseleave', function () { hovering = false; sync(); });
    });
    onScreen(week, function (vis) { inView = vis; sync(); }, 0.35);
  }

  /* Tracking replay -------------------------------------------------- */
  var trkSvg = $('[data-tracking-pitch]');
  if (trkSvg) {
    var NS = 'http://www.w3.org/2000/svg';
    var gPlayers = $('.trk-players', trkSvg), ball = $('.trk-ball', trkSvg), trail = $('.trk-trail', trkSvg);
    var log = $('[data-trk-events]');
    var logItems = log ? $$('li', log) : [];
    var btn = $('[data-trk-toggle]');
    // Keyframes: time (s), ball position, and the players who leave the shape.
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
      var f = {};
      var bx = k.b[0], by = k.b[1];
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
      gPlayers.parentNode.style.opacity = '';
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
      onScreen(trkSvg, function (vis) { visible = vis; syncRun(); }, 0.3);
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
    var hint = $('[data-hint-report]', form);
    var syncHint = function () { if (hint) hint.hidden = !$('[data-topic="report"]', form).checked; };
    form.addEventListener('change', syncHint);
    syncHint();
    var status = $('[data-status]', form), submit = $('[data-submit]', form);
    var done = function (email) {
      var box = document.createElement('div');
      box.className = 'form-done';
      box.setAttribute('tabindex', '-1');
      box.innerHTML = '<h2 class="h3">Request sent</h2><p></p>';
      box.querySelector('p').textContent = email
        ? 'Thanks. We’ll reply to ' + email + ' within one working day.'
        : 'Thanks. We’ll reply within one working day.';
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
})();
