/* =========================================================
   Spadafy — Services page (desktop)
   Same motion principles as the other pages: Lenis scroll, nav states, the body
   slides over a sticky hero, staggered reveals. Two pinned scenes are driven by
   scroll progress (intro words, S zoom → green); the timeline and table play once.
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
  const easeBack = t => { t = clamp(t); const c = 2.2; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
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
  /* progress of a pinned scene: 0 when the stage pins, 1 when it releases */
  function sceneProgress(el) {
    const r = el.getBoundingClientRect(), stageH = H - 16 * U;
    return clamp((8 * U - r.top) / Math.max(1, r.height - stageH));
  }
  const near = el => { const r = el.getBoundingClientRect(); return r.bottom > -50 && r.top < H + 50; };

  /* horizontal scroller: mouse drag that settles on a card (touch and trackpads scroll natively).
     Returns a sync() that marks whether there is anything to scroll. */
  function dragScroll(view, items) {
    let drag = null, dragged = false;
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
      dragged = true; setTimeout(() => { dragged = false; }, 0);
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
    /* a drag that ends over a card link must not open it */
    view.addEventListener('click', e => { if (dragged) { e.preventDefault(); e.stopPropagation(); } }, true);
    return () => view.classList.toggle('can-drag', max() > 2);
  }
  const scrollers = [];

  /* =========================================================
     NAV — default → collapsed after 24px → open panel
     ========================================================= */
  const nav = $('#nav');
  const PANELS = {
    services: {
      title: 'Services', text: 'From the first assessment to everyday support.',
      items: [['VDI Managed Services', 'vdi-managed-services.html'], ['Free VDI Health Check', 'free-vdi-health-check.html'],
              ['VDI Infrastructure', 'vdi-infrastructure.html'], ['Healthcare SSO and Authentication', 'healthcare-sso.html'],
              ['IGEL Endpoint Solutions', 'igel-endpoint-solutions.html'], ['Nerdio Solutions', 'nerdio-solutions.html'],
              ['Hybrid Cloud & Infrastructure Modernization', 'hybrid-cloud.html'], ['Vendor Partners', 'vendor-partners.html']]
    },
    index: {
      title: 'Index', text: 'Jump to any part of this page.',
      items: [['The whole package', '#package'], ['Layers we cover', '#layers'], ['Choose a service', '#choose'], ['Case studies', '#trust'],
              ['Big brains. No ego.', '#brains'], ['FAQ', '#faq'], ['Free Health Check', '#health-check'], ['Let’s talk', '#contact']]
    }
  };
  const npTitle = $('[data-np-title]'), npText = $('[data-np-text]'), npGrid = $('[data-np-grid]');
  const panelBtns = $$('[data-panel]', nav);
  let openKey = null, openAtY = 0;
  function fillPanel(key) {
    const p = PANELS[key];
    npTitle.textContent = p.title; npText.textContent = p.text; npGrid.innerHTML = '';
    p.items.forEach(([label, href]) => {
      const li = document.createElement('li'), a = document.createElement('a');
      a.textContent = label; a.href = href;
      li.appendChild(a); npGrid.appendChild(li);
    });
  }
  function setNav() {
    const state = openKey ? 'open' : (window.scrollY > 24 ? 'collapsed' : 'default');
    if (nav.dataset.state !== state) nav.dataset.state = state;
    $('#nav-panel').setAttribute('aria-hidden', openKey ? 'false' : 'true');
    panelBtns.forEach(b => b.setAttribute('aria-expanded', String(b.dataset.panel === openKey)));
  }
  function togglePanel(key) {
    if (openKey === key) openKey = null;
    else { openKey = key; fillPanel(key); openAtY = window.scrollY; }
    setNav();
  }
  panelBtns.forEach(b => b.addEventListener('click', e => { e.stopPropagation(); togglePanel(b.dataset.panel); }));
  document.addEventListener('click', e => {
    if (!openKey) return;
    if (!e.target.closest('.nav-box') || e.target.closest('.np-grid a, .np-view')) { openKey = null; setNav(); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && openKey) { openKey = null; setNav(); } });

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
     1. INTRO — words light up one after another with scroll
     ========================================================= */
  const intro = $('#s-intro');
  const words = [];
  $$('[data-w]', intro).forEach(seg => {
    const parts = seg.textContent.split(/(\s+)/);
    seg.textContent = '';
    parts.forEach(part => {
      if (!part) return;
      if (/^\s+$/.test(part)) { seg.appendChild(document.createTextNode(' ')); return; }
      const w = document.createElement('span');
      w.className = 'w'; w.textContent = part;
      seg.appendChild(w); words.push(w);
    });
  });
  const belief = $('.si-belief', intro);
  const beliefStart = words.indexOf($('.w', belief));
  let introLast = -1;
  function renderIntro() {
    if (reduce || !near(intro)) return;
    /* the reveal runs over 10%–85% of the pin, so the first and last words get a moment */
    const p = clamp((sceneProgress(intro) - .1) / .75);
    const k = Math.round(p * 1000);
    if (k === introLast) return;
    introLast = k;
    const pos = p * words.length;
    for (let i = 0; i < words.length; i++) {
      words[i].style.opacity = (.15 + .85 * clamp(pos - i)).toFixed(3);
    }
    belief.classList.toggle('is-lit', pos > beliefStart + .5);
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

  /* "← Drag →" pill that trails the pointer over the row (mouse and trackpad only, when there is something to drag) */
  const hint = document.createElement('span');
  hint.className = 'drag-hint'; hint.setAttribute('aria-hidden', 'true');
  hint.innerHTML = '<span class="drag-hint-pill"><span class="dh-l">←</span>Drag<span class="dh-r">→</span></span>';
  tabPanels.appendChild(hint);
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let hx = 0, hy = 0, htx = 0, hty = 0, hintOn = false;
  const hintTarget = e => { const r = tabPanels.getBoundingClientRect(); htx = e.clientX - r.left; hty = e.clientY - r.top; };
  const hintTick = () => {
    if (!hintOn) return;
    hx = reduce ? htx : lerp(hx, htx, .25); hy = reduce ? hty : lerp(hy, hty, .25);
    hint.style.transform = `translate(${hx.toFixed(1)}px, ${hy.toFixed(1)}px)`;
    requestAnimationFrame(hintTick);
  };
  row.addEventListener('pointerenter', e => {
    if (e.pointerType !== 'mouse' || !finePointer.matches || !row.classList.contains('can-drag')) return;
    hintTarget(e); hx = htx; hy = hty;
    if (!hintOn) { hintOn = true; requestAnimationFrame(hintTick); }
    hint.classList.add('is-on'); row.classList.add('has-hint');
  });
  row.addEventListener('pointermove', e => { if (hintOn) hintTarget(e); });
  row.addEventListener('pointerleave', () => { hintOn = false; hint.classList.remove('is-on'); row.classList.remove('has-hint'); });

  /* =========================================================
     3. TIMELINE → TABLE → BUTTON — one sequence, once, on enter
     ========================================================= */
  const choose = $('#choose'), tl = $('[data-timeline]', choose), mx = $('[data-matrix]', choose);
  const LINE = 1100, STEP0 = 350, STEP = 320;
  $$('.tl-cell', tl).forEach((cell, i) => {
    const d = STEP0 + i * STEP;
    $('.tl-dot', cell).style.setProperty('--d', d + 'ms');
    $$('.tl-tick', cell).forEach(t => t.style.setProperty('--d', d + 'ms'));
  });
  let seqEnd = 0;
  $$('.tl-step', tl).forEach((step, i) => {
    const d = STEP0 + i * STEP + 80;
    [$('h3', step), $('p', step), $('.tags', step)].forEach((el, j) => {
      el.classList.add('sq'); el.style.setProperty('--d', (d + j * 90) + 'ms');
      seqEnd = Math.max(seqEnd, d + j * 90 + 600, LINE);
    });
  });
  const tableAt = seqEnd + 100;
  $$('.mx-row', mx).forEach((row, i) => { row.classList.add('sq'); row.style.setProperty('--d', (tableAt + 150 + i * 140) + 'ms'); });
  const cta = $('.choose-cta', choose);
  cta.classList.add('sq'); cta.style.setProperty('--d', (tableAt + 150 + 5 * 140 + 400) + 'ms');
  mx.style.transitionDelay = tableAt + 'ms';

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

  const view = $('.cs-view'), track = $('[data-cases]'), prevBtn = $('[data-cs-prev]'), nextBtn = $('[data-cs-next]');
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
  function setPager() {
    prevBtn.disabled = view.scrollLeft < 4;
    nextBtn.disabled = view.scrollLeft > maxScroll() - 4;
  }
  const go = dir => {
    const s = cardStep(), i = Math.round(view.scrollLeft / s) + dir;
    view.scrollTo({ left: clamp(i * s, 0, maxScroll()), behavior: reduce ? 'auto' : 'smooth' });
  };
  prevBtn.addEventListener('click', () => go(-1));
  nextBtn.addEventListener('click', () => go(1));
  view.addEventListener('scroll', setPager, { passive: true });
  view.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); go(e.key === 'ArrowRight' ? 1 : -1); }
  });
  scrollers.push(dragScroll(view, () => cards));

  /* =========================================================
     5. S ZOOM → GREEN — pinned, every step tied to scroll
     ========================================================= */
  const zoom = $('#health-check');
  const zGreen = $('.sz-green', zoom), zS = $('.sz-s', zoom), zFitS = $('.sz-fit-s', zoom);
  const zTitle = $('.sz-title', zoom), zCards = $$('.sz-card', zoom), zCta = $('.sz-cta', zoom);
  const stk1 = $('.stk-1', zoom), stk2 = $('.stk-2', zoom);
  const fits = $$('.sz-fit', zoom);
  let zoomFull = 4;                                  /* scale at which the S's middle bar covers the stage */
  function layoutZoom() {
    const stageW = W - 16 * U, stageH = H - 16 * U;
    const fit = Math.min(1, stageH / (1080 * U), stageW / (1904 * U));
    fits.forEach(f => f.style.setProperty('--fit', fit.toFixed(4)));
    /* the bar (Figma 338→1566 × 417→663) is centred on the frame, so scaling from the centre keeps it covering */
    zoomFull = Math.max(stageH / (245.6 * U * fit), stageW / (1228 * U * fit)) * 1.08;
  }
  const show = (el, k, y = 40) => {
    el.style.opacity = k.toFixed(3);
    el.style.transform = k >= 1 ? '' : `translateY(${((1 - k) * y * U).toFixed(1)}px)`;
    el.style.visibility = k <= 0 ? 'hidden' : '';
  };
  const pop = (el, t, rot) => {
    const k = easeBack(t);
    el.style.opacity = clamp(t * 3).toFixed(3);
    el.style.transform = t >= 1 ? '' : `scale(${lerp(.6, 1, k).toFixed(4)}) rotate(${lerp(rot, 0, k).toFixed(2)}deg)`;
    el.style.visibility = t <= 0 ? 'hidden' : '';
  };
  let zoomLast = -1;
  function renderZoom() {
    if (reduce || !near(zoom)) return;
    const p = sceneProgress(zoom);
    const k = Math.round(p * 2000);
    if (k === zoomLast) return;
    zoomLast = k;
    /* 0 → .36: the S scales up from its centre; green fades in under it near the end, so no edge shows */
    const z = easeIO(p / .36);
    zS.style.transform = `scale(${lerp(1, zoomFull, z).toFixed(4)})`;
    zGreen.style.opacity = smooth((p - .27) / .09).toFixed(3);
    zFitS.style.visibility = p > .38 ? 'hidden' : 'visible';
    /* then the content, one piece after another */
    show(zTitle, easeOut((p - .4) / .1), 60);
    pop(stk1, (p - .5) / .08, -12);
    pop(stk2, (p - .56) / .08, 12);
    zCards.forEach((c, i) => show(c, easeOut((p - .63 - i * .05) / .08)));
    show(zCta, easeOut((p - .8) / .07), 24);
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
    layoutZoom();
    introLast = zoomLast = -1;
    setPager();
    scrollers.forEach(s => s());
    placeThumb(true);
    syncCurrent();
    render();
  }
  function render() { setNav(); renderHero(); renderIntro(); renderZoom(); }
  let ticking = false;
  function onScroll() {
    if (openKey && Math.abs(window.scrollY - openAtY) > 400) { openKey = null; }
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => { ticking = false; render(); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', layout);
  if (window.ResizeObserver) new ResizeObserver(() => { if (root.clientWidth !== W) layout(); }).observe(root);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  layout();
})();
