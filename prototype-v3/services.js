/* =========================================================
   Spadafy — Services page (desktop)
   Same motion principles as the other pages: Lenis scroll, nav states, the body
   slides over a sticky hero, staggered reveals. Two pinned scenes are driven by
   scroll progress (the goat card growing to full screen); the intro, timeline and cards play once.
   With reduced motion, html.anim is never set and every section shows its final state.
   ========================================================= */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
  const easeOut = t => { t = clamp(t); return 1 - Math.pow(1 - t, 3); };
  const easeIO = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  /* Lenis smooth scroll */
  const lenis = (!reduce && window.Lenis) ? new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true }) : null;
  if (lenis) {
    window.lenis = lenis;
    const tick = t => { lenis.raf(t); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }
  const scrollTo = y => { if (lenis) lenis.scrollTo(y, { duration: 1.4 }); else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' }); };
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id === '#') { e.preventDefault(); return; }
    const target = id === '#top' ? document.body : $(id);
    if (!target) return;
    e.preventDefault();
    scrollTo(id === '#top' ? 0 : target.getBoundingClientRect().top + window.scrollY - 8 * U);
  });

  let W = 1920, H = 1080, U = 1;
  function setUnits() {
    W = root.clientWidth; H = window.innerHeight; U = W / 1920;
    root.style.setProperty('--u', U + 'px');
    root.style.setProperty('--vh', H + 'px');
  }
  const near = el => { const r = el.getBoundingClientRect(); return r.bottom > -50 && r.top < H + 50; };

  /* horizontal scroller: mouse drag that settles on a card (touch and trackpads scroll natively).
     Returns a sync() that marks whether there is anything to scroll. */
  function dragScroll(view, items) {
    let drag = null, quietUntil = 0;
    const hush = ms => { quietUntil = Math.max(quietUntil, performance.now() + ms); };
    const step = () => { const it = items(); return it.length > 1 ? it[1].offsetLeft - it[0].offsetLeft : view.clientWidth; };
    const max = () => view.scrollWidth - view.clientWidth;
    view.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || max() <= 2) return;
      drag = { x: e.clientX, left: view.scrollLeft, moved: false, id: e.pointerId };
    });
    view.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 4) { drag.moved = true; view.classList.add('is-drag'); view.setPointerCapture(drag.id); }
      if (drag.moved) view.scrollLeft = drag.left - dx;
    });
    const end = () => {
      if (!drag) return;
      const moved = drag.moved, from = drag.left;
      drag = null;
      if (!moved) return;
      hush(350);
      /* settle on the nearest card in the drag direction, then hand back to scroll snapping */
      const s = step(), raw = view.scrollLeft / s;
      const i = view.scrollLeft > from ? Math.ceil(raw - .15) : Math.floor(raw + .15);
      const left = clamp(i * s, 0, max());
      view.scrollTo({ left, behavior: reduce ? 'auto' : 'smooth' });
      const release = () => view.classList.remove('is-drag');
      if (reduce || Math.abs(view.scrollLeft - left) < 2) release();
      else { let t = 0; const done = () => { clearTimeout(t); view.removeEventListener('scrollend', done); release(); }; view.addEventListener('scrollend', done); t = setTimeout(done, 700); }
    };
    view.addEventListener('pointerup', end);
    view.addEventListener('pointercancel', end);
    view.addEventListener('lostpointercapture', end);
    view.addEventListener('dragstart', e => e.preventDefault());
    /* the row is for dragging: a click right after a drag, or while the row is still gliding (trackpad swipe,
       snap or settle), must not open a card. Only a click on a row at rest opens one */
    view.addEventListener('scroll', () => hush(150), { passive: true });
    view.addEventListener('click', e => {
      if (performance.now() < quietUntil || drag) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    return () => view.classList.toggle('can-drag', max() > 2);
  }
  const scrollers = [];

  /* "← Drag →" pill that trails the pointer over a draggable row (mouse and trackpad only, when there is something to drag).
     It lives in `host` right after the row, so css can react to the row's .is-drag */
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  function dragHint(view, host) {
    const hint = document.createElement('span');
    hint.className = 'drag-hint'; hint.setAttribute('aria-hidden', 'true');
    hint.innerHTML = '<span class="drag-hint-pill"><span class="dh-l">←</span>Drag<span class="dh-r">→</span></span>';
    host.appendChild(hint);
    let hx = 0, hy = 0, htx = 0, hty = 0, on = false;
    const target = e => { const r = host.getBoundingClientRect(); htx = e.clientX - r.left; hty = e.clientY - r.top; };
    const tick = () => {
      if (!on) return;
      hx = reduce ? htx : lerp(hx, htx, .25); hy = reduce ? hty : lerp(hy, hty, .25);
      hint.style.transform = `translate(${hx.toFixed(1)}px, ${hy.toFixed(1)}px)`;
      requestAnimationFrame(tick);
    };
    view.addEventListener('pointerenter', e => {
      if (e.pointerType !== 'mouse' || !finePointer.matches || !view.classList.contains('can-drag')) return;
      target(e); hx = htx; hy = hty;
      if (!on) { on = true; requestAnimationFrame(tick); }
      hint.classList.add('is-on'); view.classList.add('has-hint');
    });
    view.addEventListener('pointermove', e => { if (on) target(e); });
    view.addEventListener('pointerleave', () => { on = false; hint.classList.remove('is-on'); view.classList.remove('has-hint'); });
  }


  /* =========================================================
     HERO — sticky; the body slides over it and dims it
     ========================================================= */
  const hero = $('.hero'), heroText = $('.hero-text'), body = $('#body');
  const heroCover = document.createElement('div');
  heroCover.className = 'hero-cover'; hero.appendChild(heroCover);
  function renderHero() {
    const top = body.getBoundingClientRect().top;
    const p = clamp(1 - top / H);
    heroText.style.transform = reduce ? '' : `translateY(${(-p * 90 * U).toFixed(1)}px)`;
    heroCover.style.opacity = (p * .6).toFixed(3);
    body.style.setProperty('--bg', smooth((p - .75) / .2).toFixed(3));
    hero.style.visibility = top < -4 ? 'hidden' : 'visible';
  }

  /* =========================================================
     1. INTRO — letters light up one after another: gray → a flash of white → orange.
        It plays by itself, start to finish, as soon as the statement nears the middle of the screen
     ========================================================= */
  const intro = $('#s-intro');
  const introText = $('.si-text', intro);
  const letters = [];
  $$('[data-w]', intro).forEach(seg => {
    const parts = seg.textContent.split(/(\s+)/);
    seg.textContent = '';
    parts.forEach(part => {
      if (!part) return;
      if (/^\s+$/.test(part)) { seg.appendChild(document.createTextNode(' ')); return; }
      const w = document.createElement('span');     /* letters sit in a word span, so lines still only break between words */
      w.className = 'w';
      for (const ch of part) {
        const l = document.createElement('span');
        l.className = 'l'; l.textContent = ch;
        w.appendChild(l); letters.push(l);
      }
      seg.appendChild(w);
    });
  });
  /* the lightning wave, in letters: each one brightens to white over LIT, stays white for HOLD, then turns orange over ORANGE.
     So a short white edge runs ahead of the orange through the whole statement */
  const LIT = 6, HOLD = 4, ORANGE = 10, INTRO_MS = 1700;
  const introState = letters.map(() => -1);
  let introT0 = -1;
  function setIntro(p) {
    const pos = p * (letters.length + LIT + HOLD + ORANGE);
    for (let i = 0; i < letters.length; i++) {
      const t = pos - i;
      const lit = clamp(t / LIT), o = smooth((t - LIT - HOLD) / ORANGE);
      const key = Math.round(lit * 100) * 1000 + Math.round(o * 100);
      if (key === introState[i]) continue;          /* only touch letters whose look changed */
      introState[i] = key;
      letters[i].style.opacity = (.15 + .85 * lit).toFixed(2);
      letters[i].style.setProperty('--o', (o * 100).toFixed(0) + '%');
    }
  }
  function introTick(now) {
    const p = clamp((now - introT0) / INTRO_MS);
    setIntro(p);
    if (p < 1) requestAnimationFrame(introTick);
  }
  function renderIntro() {
    if (reduce || introT0 >= 0) return;
    const r = introText.getBoundingClientRect();
    if (r.top + r.height / 2 > H * .62) return;     /* not near the middle yet */
    introT0 = performance.now();
    requestAnimationFrame(introTick);
  }

  /* =========================================================
     2. THE WHOLE PACKAGE — one draggable row with every group's cards;
        the toggle follows the scroll and jumps to a group on click
     ========================================================= */
  const tabsRoot = $('[data-tabs]');
  const tabList = $('.tabs-list', tabsRoot), tabPanels = $('.tabs-panels', tabsRoot);
  const TAB_ICON = { core: 'tab-ic-core', beyond: 'tab-ic-beyond' };
  const row = document.createElement('div');
  row.className = 'pk-row'; row.id = 'pk-row'; row.tabIndex = 0;
  row.setAttribute('role', 'region'); row.setAttribute('aria-label', 'Services');
  const thumb = document.createElement('span');
  thumb.className = 'tabs-thumb'; thumb.setAttribute('aria-hidden', 'true');
  tabList.appendChild(thumb);
  const groups = (window.SERVICE_TABS || []).map((t, i) => {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'tab'; btn.id = 'tab-' + t.id;
    btn.setAttribute('aria-controls', row.id);
    btn.innerHTML = `<span class="tab-ic ${TAB_ICON[t.id] || 'tab-ic-core'}" aria-hidden="true"></span>`;
    btn.appendChild(document.createTextNode(t.label));
    tabList.appendChild(btn);
    const cards = (t.cards.length ? t.cards : [null, null, null]).map((c, j) => {
      const el = document.createElement(c ? 'a' : 'div');
      el.className = 'pk-card' + (c ? '' : ' is-empty');
      el.dataset.group = t.id;
      if (c) {
        el.href = c.href;
        el.innerHTML = `<img class="pk-img" src="${c.img}" alt="" draggable="false"><h3 class="h4 pk-title"></h3><span class="pk-info"><p class="t24"></p></span>`;
        $('.pk-title', el).innerHTML = [].concat(c.title).map(s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')).join('<br>');
        $('.pk-info p', el).textContent = c.text;
      } else {
        el.innerHTML = '<p class="t24">Content coming soon</p>';
        if (j) el.setAttribute('aria-hidden', 'true');
      }
      row.appendChild(el);
      return el;
    });
    return { id: t.id, accent: t.accent || 'orange', btn, cards, index: i };
  });
  tabPanels.appendChild(row);
  scrollers.push(dragScroll(row, () => $$('.pk-card', row)));

  let current = null, lockUntil = 0;
  function placeThumb(instant) {
    if (!current) return;
    thumb.classList.toggle('is-instant', !!instant);
    thumb.style.setProperty('--tx', current.btn.offsetLeft + 'px');
    thumb.style.setProperty('--tw', current.btn.offsetWidth + 'px');
    if (instant) { void thumb.offsetWidth; thumb.classList.remove('is-instant'); }
  }
  function setCurrent(g, instant) {
    if (!g || g === current) return;
    const prev = current;
    current = g;
    groups.forEach(x => { x.btn.setAttribute('aria-current', String(x === g)); x.btn.tabIndex = x === g ? 0 : -1; });
    tabList.style.setProperty('--accent', `var(--${g.accent})`);
    placeThumb(instant);
    /* the icon of the group you arrive at plays its little move (not on first load) */
    if (prev && !reduce) {
      const ic = $('.tab-ic', g.btn);
      ic.classList.remove('is-pop'); void ic.offsetWidth; ic.classList.add('is-pop');
    }
  }
  const groupLeft = g => g.cards[0].offsetLeft - groups[0].cards[0].offsetLeft;
  /* a group becomes current once you've scrolled past the previous group's last card
     (its first card crosses the half-card mark); the row's end always belongs to the last group */
  function syncCurrent() {
    if (!groups.length || performance.now() < lockUntil) return;
    const mark = row.scrollLeft + groups[0].cards[0].offsetWidth / 2;
    let g = groups[0];
    groups.forEach(x => { if (groupLeft(x) <= mark) g = x; });
    if (row.scrollLeft >= row.scrollWidth - row.clientWidth - 2) g = groups[groups.length - 1];
    setCurrent(g);
  }
  let rowTicking = false;
  row.addEventListener('scroll', () => {
    if (rowTicking) return; rowTicking = true;
    requestAnimationFrame(() => { rowTicking = false; syncCurrent(); });
  }, { passive: true });
  row.addEventListener('scrollend', () => { lockUntil = 0; syncCurrent(); });
  function goGroup(g, focus) {
    setCurrent(g);
    if (focus) g.btn.focus();
    /* hold the toggle on the chosen group while the row glides past the others */
    lockUntil = reduce ? 0 : performance.now() + 900;
    row.scrollTo({ left: Math.min(groupLeft(g), row.scrollWidth - row.clientWidth), behavior: reduce ? 'auto' : 'smooth' });
  }
  groups.forEach(g => {
    g.btn.addEventListener('click', () => goGroup(g));
    g.btn.addEventListener('keydown', e => {
      const n = groups.length, keys = { ArrowRight: 1, ArrowLeft: -1 };
      if (e.key in keys) { e.preventDefault(); goGroup(groups[(g.index + keys[e.key] + n) % n], true); }
      else if (e.key === 'Home') { e.preventDefault(); goGroup(groups[0], true); }
      else if (e.key === 'End') { e.preventDefault(); goGroup(groups[n - 1], true); }
    });
  });
  setCurrent(groups[0], true);

  dragHint(row, tabPanels);

  /* =========================================================
     3. TIMELINE → CARDS → BUTTON — one sequence, once, on enter
     ========================================================= */
  const choose = $('#choose'), tl = $('[data-timeline]', choose), mx = $('[data-matrix]', choose);
  /* the green line crosses the track at an even pace; each step starts the moment it reaches that step's marker */
  const LINE = 1800, STEP0 = 150;
  tl.style.setProperty('--line', LINE + 'ms');
  const tlTrack = $('.tl-track', tl);
  const reach = cell => STEP0 + LINE * cell.offsetLeft / tlTrack.offsetWidth;
  let seqEnd = LINE;
  $$('.tl-cell', tl).forEach((cell, i) => {
    const d = Math.round(reach(cell));
    $('.tl-mark', cell).style.setProperty('--d', d + 'ms');
    const tick = $('.tl-tick', cell);                 /* ticks sit mid-column, so they light as the line passes them */
    tick.style.setProperty('--d', Math.round(STEP0 + LINE * (cell.offsetLeft + tick.offsetLeft) / tlTrack.offsetWidth) + 'ms');
    const step = $$('.tl-step', tl)[i];
    [$('h3', step), $('p', step), ...$$('.tl-tags li', step)].forEach((el, j) => {
      el.classList.add('sq'); el.style.setProperty('--d', (d + 60 + j * 90) + 'ms');
      seqEnd = Math.max(seqEnd, d + 60 + j * 90 + 600);
    });
  });
  const tableAt = seqEnd + 100;
  const mxCards = $$('.mx-card', mx);
  mxCards.forEach((c, i) => { c.classList.add('sq'); c.style.setProperty('--d', (tableAt + 150 + i * 140) + 'ms'); });
  const cta = $('.choose-cta', choose);
  cta.classList.add('sq'); cta.style.setProperty('--d', (tableAt + 150 + mxCards.length * 140 + 300) + 'ms');

  /* =========================================================
     4. TRUST — count-up stats and the case-study carousel
     ========================================================= */
  const fmt = n => n.toLocaleString('en-US');
  function countUp(el) {
    const to = +el.dataset.count, suffix = el.dataset.suffix || '', t0 = performance.now(), dur = 1600;
    const step = now => {
      const k = easeOut((now - t0) / dur);
      el.textContent = fmt(Math.round(to * k)) + suffix;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const counters = $$('[data-count]');
  if (!reduce) counters.forEach(el => { el.textContent = '0' + (el.dataset.suffix || ''); });

  const view = $('.cs-view'), track = $('[data-cases]');
  (window.CASE_STUDIES || []).forEach((c, i, all) => {
    const li = document.createElement('li');
    li.className = 'cs-card';
    li.setAttribute('aria-roledescription', 'slide');
    li.setAttribute('aria-label', `${i + 1} of ${all.length}`);
    li.innerHTML = `<img src="${c.img}" alt="">
      <div class="cs-head"><span class="case-tag"></span><h3 class="h6"></h3></div>
      <div class="cs-foot"><div class="cs-panel"><dl class="case-rows">
        <div><dt>The problem</dt><dd></dd></div><div><dt>What we did</dt><dd></dd></div><div><dt>The result</dt><dd></dd></div>
      </dl></div></div>`;
    $('.case-tag', li).textContent = 'Case • ' + c.sector;
    $('h3', li).textContent = c.title;
    const dds = $$('dd', li);
    dds[0].textContent = c.problem; dds[1].textContent = c.did; dds[2].textContent = c.result;
    track.appendChild(li);
  });
  const cards = $$('.cs-card', track);
  const cardStep = () => cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : view.clientWidth;
  const maxScroll = () => view.scrollWidth - view.clientWidth;
  const go = dir => {
    const s = cardStep(), i = Math.round(view.scrollLeft / s) + dir;
    view.scrollTo({ left: clamp(i * s, 0, maxScroll()), behavior: reduce ? 'auto' : 'smooth' });
  };
  view.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); go(e.key === 'ArrowRight' ? 1 : -1); }
  });
  scrollers.push(dragScroll(view, () => cards));
  dragHint(view, $('.trust-row'));

  /* =========================================================
     5. LAYERS → GOAT CARD GROWS TO FULL SCREEN — pinned at the bottom of the block, tied to scroll.
        .lay-final starts as exactly the goat card's rectangle (clip-path), covers everything as it grows, the goat
        drifts to the centre and leaves, then the line and button come in
     ========================================================= */
  const lay = $('#layers');
  const layCard = $('.lay-goat', lay), layPin = $('.lay-pin', lay), lfGoat = $('.lf-goat', layPin);
  const lfTitle = $('.lf-title', layPin), lfCta = $('.lf-cta', layPin), lfCopy = $('.lf-copy', layPin);
  const GOAT_W = 191.997, GOAT_H = 237.746, GOAT_BIG = 299.066 / 191.997;   /* Figma 2177:3651 → 2177:4412 */
  let layGeo = null, layLen = 0, layLast = -1;
  function layoutLayers() {
    if (reduce) return;
    const stageH = H - 16 * U, ch = 368 * U;
    layLen = .9 * H;                                 /* scroll spent pinned */
    /* the card's cell plus the room to travel: the pin sticks when the card's bottom reaches the screen's bottom */
    lay.style.setProperty('--lt', (layLen - 8 * U).toFixed(0) + 'px');
    /* fractional widths (offsetLeft/offsetWidth round), so the pin meets the block's edges exactly */
    const lr = lay.getBoundingClientRect(), cr = layCard.getBoundingClientRect();
    const w = lr.width, l = cr.left - lr.left, cw = cr.width;
    lay.style.setProperty('--lw', w.toFixed(2) + 'px'); lay.style.setProperty('--ll', l.toFixed(2) + 'px');
    lay.style.setProperty('--lwh', (layCard.offsetTop + ch + 120 * U).toFixed(0) + 'px');   /* white ends under the grid, with its bottom padding */
    /* in the pin's own coordinates: the card is its bottom-right rectangle */
    layGeo = { w, stageH, ch, l, t: stageH - ch, r: w - l - cw, b: 0, cx: l + cw / 2, cy: stageH - ch / 2, r0: 40 * U, r1: 60 * U };
  }
  function renderLayers() {
    if (reduce || !layGeo || !near(lay)) return;
    const g = layGeo;
    const pinned = 8 * U - (lay.getBoundingClientRect().top + layCard.offsetTop + g.ch - g.stageH);   /* scroll since the card reached the bottom of the screen */
    const p = clamp(pinned / layLen);
    const k = Math.round(p * 2000);
    if (k === layLast) return;
    layLast = k;
    /* the card holds for a moment (its neighbours scroll away), then .05 → .5 it grows to the whole stage */
    const e = smooth((p - .05) / .45);
    layPin.style.clipPath = `inset(${lerp(g.t, 0, e).toFixed(1)}px ${lerp(g.r, 0, e).toFixed(1)}px ${lerp(g.b, 0, e).toFixed(1)}px ${lerp(g.l, 0, e).toFixed(1)}px round ${lerp(g.r0, g.r1, e).toFixed(1)}px)`;
    /* the goat grows and glides from the card's centre to the screen's, then fades out */
    const x = lerp(g.cx, g.w / 2, e), y = lerp(g.cy, g.stageH / 2, e), sc = lerp(1, GOAT_BIG, e);
    lfGoat.style.transform = `translate(${(x - GOAT_W * U / 2).toFixed(1)}px, ${(y - GOAT_H * U / 2).toFixed(1)}px) rotate(4.53deg) scale(${sc.toFixed(4)})`;
    lfGoat.style.opacity = (1 - smooth((p - .3) / .17)).toFixed(3);
    /* then the line, then the button */
    const kt = easeOut((p - .5) / .14), kb = easeOut((p - .58) / .12);
    lfCopy.style.visibility = kt <= 0 ? 'hidden' : 'visible';
    lfTitle.style.opacity = kt.toFixed(3); lfTitle.style.transform = kt >= 1 ? '' : `translateY(${((1 - kt) * 40 * U).toFixed(1)}px)`;
    lfCta.style.opacity = kb.toFixed(3); lfCta.style.transform = kb >= 1 ? '' : `translateY(${((1 - kb) * 24 * U).toFixed(1)}px)`;
  }

  /* =========================================================
     FAQ — one open at a time
     ========================================================= */
  const qas = $$('.qa');
  function setQA(qa, open) {
    qa.classList.toggle('is-open', open);
    $('.qa-q', qa).setAttribute('aria-expanded', String(open));
    const a = $('.qa-a', qa);
    a.hidden = false;
    a.setAttribute('aria-hidden', String(!open));
  }
  qas.forEach((qa, i) => {
    const q = $('.qa-q', qa), a = $('.qa-a', qa);
    a.id = 'qa-' + i; q.setAttribute('aria-controls', a.id);
    setQA(qa, qa.classList.contains('is-open'));
    q.addEventListener('click', () => {
      const open = !qa.classList.contains('is-open');
      qas.forEach(o => { if (o !== qa) setQA(o, false); });
      setQA(qa, open);
    });
  });

  /* contact form: prototype only */
  const form = $('.ct-form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = $('.send span', form);
    btn.textContent = 'Thanks! We’ll be in touch';
    setTimeout(() => { btn.textContent = 'Send message'; }, 2600);
  });

  /* =========================================================
     ON-ENTER — fade-up reveals, the choose sequence, count-up
     ========================================================= */
  const REVEAL = [
    ['.sv-package .v-head > *', 120, 0], ['.tabs-list', 0, 200], ['.tabs-panels', 0, 300], ['.also > *', 120, 0],
    ['.sv-layers .v-head > *', 120, 0], ['.lay', 70, 0],
    ['.sv-choose .v-head > *', 120, 0],
    ['.trust-head > *', 120, 0], ['.stats > div', 90, 0], ['.cs-view', 0, 150], ['.trust-logos', 0, 0],
    ['.brains-top .h2', 0, 0], ['.brains li', 90, 0],
    ['.v-faq .h2', 0, 0], ['.qa', 60, 0],
    ['.sz-head > *', 120, 0], ['.sz-chips li', 50, 0], ['.sz-card', 90, 0], ['.sz-cta', 0, 0],
    ['.v-head > *', 120, 0], ['.ct-points li', 110, 0], ['.fields > *', 60, 0], ['.legal', 0, 400]
  ];
  const heroReveal = ['.sv-hero h1', '.sv-hero-btns', '.sv-hero-row p'].map((sel, i) => {
    const el = $(sel);
    el.classList.add('rv'); el.style.setProperty('--d', (i * 180) + 'ms');
    return el;
  });
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add('in'); io.unobserve(en.target);
  }), { threshold: .15, rootMargin: '0px 0px -6% 0px' });
  REVEAL.forEach(([sel, step, base]) => $$(sel).forEach((el, i) => {
    if (el.classList.contains('rv')) return;
    el.classList.add('rv'); el.style.setProperty('--d', Math.min(base + i * step, 700) + 'ms'); io.observe(el);
  }));
  requestAnimationFrame(() => setTimeout(() => heroReveal.forEach(el => el.classList.add('in')), 120));

  const onceIO = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    onceIO.unobserve(en.target);
    if (en.target === tl) [choose, tl, mx].forEach(el => el.classList.add('is-in'));
    else if (!reduce) $$('[data-count]', en.target).forEach(countUp);
  }), { threshold: .3 });
  onceIO.observe(tl);
  onceIO.observe($('.stats'));

  /* =========================================================
     LOOP
     ========================================================= */
  function layout() {
    setUnits();
    layoutLayers();
    layLast = -1;
    scrollers.forEach(s => s());
    placeThumb(true);
    syncCurrent();
    render();
  }
  function render() { renderHero(); renderIntro(); renderLayers(); }
  let ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => { ticking = false; render(); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', layout);
  if (window.ResizeObserver) new ResizeObserver(() => { if (root.clientWidth !== W) layout(); }).observe(root);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  layout();
})();
