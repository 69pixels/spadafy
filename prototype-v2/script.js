/* Spadafy — Homepage prototype v2
   Scroll-driven scenes. Every scene reads its progress from its own wrapper rect,
   so sections can be reordered or resized without touching the timeline maths. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeIO = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const root = document.documentElement;
  const mqMobile = matchMedia('(max-width: 820px)');
  const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');

  let W = 0, H = 0, U = 1, lastW = 0;

  /* ---------- units ---------- */
  function setUnits(force) {
    const w = root.clientWidth;
    const h = window.innerHeight;
    // On phones the toolbar changes innerHeight while scrolling — only re-measure height on width change.
    if (!force && w === lastW && mqMobile.matches) return false;
    lastW = w; W = w; H = h; U = w / 1920;
    root.style.setProperty('--u', U + 'px');
    root.style.setProperty('--vh', H + 'px');
    return true;
  }

  /* ---------- word splitting for grey → white fill ---------- */
  function splitWords(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        const s = document.createElement('span');
        s.className = 'w'; s.textContent = part;
        frag.appendChild(s);
      });
      node.parentNode.replaceChild(frag, node);
    });
    const words = $$('.w', el);
    const pre = parseInt(el.dataset.prefilled || '0', 10);
    words.slice(0, pre).forEach(w => w.classList.add('on'));
    return { el, words, pre, last: -1 };
  }
  const fills = {};
  $$('.fill').forEach(el => { fills[el.dataset.fill] = splitWords(el); });
  function setFill(f, t) {
    if (!f) return;
    const n = f.words.length;
    const count = Math.round(clamp(t) * n);
    if (count === f.last) return;
    f.last = count;
    f.words.forEach((w, i) => w.classList.toggle('on', i < Math.max(count, f.pre)));
  }
  function setFillSequence(list, t) { // several elements filled as one continuous sentence
    const total = list.reduce((s, f) => s + f.words.length, 0);
    let left = t * total;
    list.forEach(f => { const n = f.words.length; setFill(f, n ? clamp(left / n) : 1); left -= n; });
  }

  /* ---------- helpers ---------- */
  const sceneProgress = (el, offset = 0) => {
    const r = el.getBoundingClientRect();
    const range = r.height - offset - H;
    return { r, s: clamp(-r.top - offset, 0, Math.max(0, range)), range: Math.max(1, range) };
  };

  /* =========================================================
     NAV
     ========================================================= */
  const nav = $('.nav');
  const pill = $('.nav-pill');
  const panel = $('#nav-panel');
  const closeBtn = $('.np-close');
  let navOpen = false;

  function setNavState() {
    const state = navOpen ? 'open' : (window.scrollY > 24 ? 'collapsed' : 'default');
    if (nav.dataset.state !== state) nav.dataset.state = state;
  }
  function openNav() {
    navOpen = true; panel.hidden = false;
    pill.setAttribute('aria-expanded', 'true');
    setNavState();
    setTimeout(() => closeBtn.focus({ preventScroll: true }), 50);
  }
  function closeNav(returnFocus = true) {
    if (!navOpen) return;
    navOpen = false;
    pill.setAttribute('aria-expanded', 'false');
    setNavState();
    setTimeout(() => { if (!navOpen) panel.hidden = true; }, 700);
    if (returnFocus && window.scrollY > 24) pill.focus({ preventScroll: true });
  }
  pill.addEventListener('click', openNav);
  closeBtn.addEventListener('click', () => closeNav());
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNav(); });
  document.addEventListener('pointerdown', e => { if (navOpen && !panel.contains(e.target) && !pill.contains(e.target)) closeNav(false); });
  $$('a', panel).forEach(a => a.addEventListener('click', () => closeNav(false)));

  // Live Seattle clock in the opened menu
  const clock = $('.np-clock');
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: clock.dataset.tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const tick = () => { clock.textContent = fmt.format(new Date()); };
  tick(); setInterval(tick, 1000);

  /* =========================================================
     1–2. HERO + INTRO
     ========================================================= */
  const hero = $('.s-hero');
  const heroBg = $('.hi-bg');
  const mask = $('.intro-mask');
  const maskImg = $('.intro-mask-img');
  const introLabel = $('.intro-label');

  function renderIntro() {
    const hr = hero.getBoundingClientRect();
    if (hr.bottom < -10 || hr.top > H) return;

    // Text 1 and text 2 fill as they travel up the screen
    const t1 = $('[data-fill="intro1"]').getBoundingClientRect();
    const t2 = $('[data-fill="intro2"]').getBoundingClientRect();
    setFill(fills.intro1, (H * .92 - t1.top) / (H * .5));
    const f2 = (H * .92 - t2.top) / (H * .5);
    setFill(fills.intro2, f2);

    // Mask: a window in the charcoal panel that "tears" it open onto the fixed image
    const mr = mask.getBoundingClientRect();
    const br = heroBg.getBoundingClientRect();
    const m = easeOut(clamp((H * 1.0 - mr.top) / (H * .6)));
    const fullW = mr.width, fullH = mr.height;
    const startW = mqMobile.matches ? fullW * .4 : 409 * U;
    const startH = mqMobile.matches ? fullH * .4 : 234 * U;
    const w = lerp(startW, fullW, m), h = lerp(startH, fullH, m);
    const side = (fullW - w) / 2;
    const rad = mqMobile.matches ? 20 : 32 * U;
    mask.style.clipPath = `inset(0px ${side}px ${fullH - h}px ${side}px round ${rad}px)`;
    maskImg.style.width = br.width + 'px';
    maskImg.style.height = br.height + 'px';
    maskImg.style.transform = `translate3d(${br.left - mr.left}px, ${br.top - mr.top}px, 0)`;
  }

  /* =========================================================
     3. TEAM — vertical scroll drives a horizontal track
     ========================================================= */
  const team = $('.s-team');
  const teamTrack = $('.team-track');
  let teamTravel = 0, teamDelay = 0;
  function layoutTeam() {
    const margin = mqMobile.matches ? 16 : 40 * U;
    teamTravel = Math.max(0, teamTrack.scrollWidth - (W - margin * 2));
    teamDelay = H * .45;            // the block settles before the people start moving
    team.style.height = (H + teamDelay + teamTravel * 1.25 + H * .3) + 'px';
  }
  function renderTeam() {
    const { r, s } = sceneProgress(team);
    if (r.bottom < 0 || r.top > H) return;
    const k = clamp((s - teamDelay) / Math.max(1, teamTravel * 1.25));
    const x = easeIO(k) * .15 * teamTravel + k * .85 * teamTravel; // soft start and stop
    teamTrack.style.transform = `translate3d(${-x}px,0,0)`;
  }

  /* =========================================================
     4. BREAK — pink card rises, fills, pins to the lower half
     ========================================================= */
  const brk = $('.s-break');
  const brkCard = $('.break-card');
  // rise distance stays the same (≈0.63 screen); after the card settles only a short hold before the block leaves
  const BRK_RISE = .63, BRK_HOLD = .12;
  function layoutBreak() { brk.style.height = (H * (1 + BRK_RISE + BRK_HOLD)) + 'px'; }
  function renderBreak() {
    const { r, s, range } = sceneProgress(brk);
    if (r.bottom < 0 || r.top > H) return;
    const p = s / range;
    const cs = getComputedStyle(brkCard);
    const contentH = $('.break-title', brkCard).offsetHeight + $('.break-text', brkCard).offsetHeight + parseFloat(cs.rowGap || 0) + parseFloat(cs.paddingTop) * 2;
    const finalTop = Math.min(H * .5, H - contentH);
    // card starts rising while the section is still sliding in
    const enter = clamp((H - r.top) / H); // 0 → 1 as section arrives
    const rise = easeOut(clamp(s / (H * BRK_RISE)));
    const y = r.top > 0 ? lerp(H, lerp(H, finalTop, .12), enter) : lerp(lerp(H, finalTop, .12), finalTop, rise);
    brkCard.style.transform = `translate3d(0,${y}px,0)`;
    // fill follows the card with a short delay, at a pace close to the Intro text:
    // title starts once the card is ~25% up, body follows and completes as the card settles
    const rise01 = clamp((H - y) / Math.max(1, H - finalTop));
    setFill(fills.breakTitle, (rise01 - .25) / .5);
    setFill(fills.breakText, (rise01 - .45) / .55);
  }

  /* =========================================================
     5. GREEN FLAGS — every card stacks (the last one too), then the block leaves
     ========================================================= */
  const flagsSec = $('.s-flags');
  const flagsTitle = $('.flags-title');
  const flagEls = $$('.flag');
  let fl = {};
  function layoutFlags() {
    const mobile = mqMobile.matches;
    const pad = mobile ? 96 : 160 * U;          // section top padding
    const gapT = mobile ? 32 : 64 * U;           // title → first card
    const stackTop = mobile ? 64 : 80 * U;       // first card's resting top
    const step = mobile ? 100 : 88 * U;           // visible header of a stacked card
    const cardH = flagEls[0].offsetHeight;
    const start = pad + flagsTitle.offsetHeight + gapT;
    const last = flagEls.length - 1;
    const travel = Math.max(0, start + last * cardH - (stackTop + last * step));
    const hold = H * .35;
    const k = .77;                                // section scroll length −23%: cards stack a bit faster
    fl = { pad, start, stackTop, step, cardH, travel, hold, k };
    flagsSec.style.height = (H + (travel + hold) * k) + 'px';
  }
  // Card maps play while their card is open (mostly uncovered and on screen)
  const flagMaps = flagEls.map(el => {
    const m = $('.flag-map', el);
    return m && window.FlagMap ? window.FlagMap.mount(m) : null;
  });
  function renderFlags() {
    const { r, s } = sceneProgress(flagsSec);
    if (r.bottom < 0 || r.top > H) { flagMaps.forEach(m => m && m.setOpen(false)); return; }
    const c = Math.min(s / fl.k, fl.travel);
    flagsTitle.style.transform = `translate3d(0,${fl.pad - c}px,0)`;
    const ys = flagEls.map((el, i) => {
      const natural = fl.start + i * fl.cardH - c;
      const y = Math.max(fl.stackTop + i * fl.step, natural);
      el.style.transform = `translate3d(0,${y}px,0)`;
      return y;
    });
    const stageTop = Math.max(r.top, Math.min(0, r.bottom - H));
    flagMaps.forEach((m, i) => {
      if (!m) return;
      const top = stageTop + ys[i];
      const bottom = Math.min(top + fl.cardH, i < ys.length - 1 ? stageTop + ys[i + 1] : Infinity);
      m.setOpen(Math.min(bottom, H) - Math.max(top, 0) >= fl.cardH * .6);
    });
  }

  /* =========================================================
     6–7. BREAK SERVICES → SERVICES
     ========================================================= */
  const svc = $('.s-services');
  const svStage = $('.sv-stage');
  const svTarget = $('.sv-target');
  const svFrame = $('.sv-frame');
  const svBreakImg = $('.sv-break-img');
  const svMedia = $('.sv-media');
  const svUi = $('.sv-ui');
  const svCopy = $('.sv-copy');
  const svCards = $('.sv-cards');
  const svCol = $('.sv-cards-col');
  const svNum = $('.sv-num');
  const svImgs = $$('img', svMedia);
  // S mark: the two starting strokes grow along the outline (dotted), then the fill
  // grows from the same strokes, then the dotted line turns solid.
  const smPath = $('#sm-path');
  const smLine = $$('.sm-ml');
  const smFill = $$('.sm-mf');
  const smDots = $('.sm-dots');
  const smSolid = $('.sm-solid');
  const SM_L = smPath.getTotalLength();
  const nearest = (x, y) => {
    let best = 0, bd = Infinity;
    for (let i = 0; i <= 600; i++) {
      const l = SM_L * i / 600, pt = smPath.getPointAtLength(l);
      const d = (pt.x - x) ** 2 + (pt.y - y) ** 2;
      if (d < bd) { bd = d; best = l; }
    }
    return best;
  };
  const SM_SEEDS = [nearest(229, 16.6), nearest(2, 104.4)]; // top-right and bottom-left strokes from the storyboard
  function setDash(els, len) {
    els.forEach((el, i) => {
      if (len < .05) { el.style.visibility = 'hidden'; return; }
      el.style.visibility = 'visible';
      el.setAttribute('stroke-dasharray', `${len} ${SM_L - len}`);
      el.setAttribute('stroke-dashoffset', String(-(SM_SEEDS[i] - len / 2)));
    });
  }
  // Fill runs along the spine of the S: from the top-right end and the bottom-left end, meeting in the middle bar.
  const smSpine = $('#sm-spine');
  const SP_L = smSpine.getTotalLength();
  function setSpine(els, t) {
    const len = t * SP_L / 2 + (t >= 1 ? 2 : 0);
    els.forEach((el, i) => {
      if (len < .05) { el.style.visibility = 'hidden'; return; }
      el.style.visibility = 'visible';
      el.setAttribute('stroke-dasharray', `${len} ${SP_L + 10}`);
      el.setAttribute('stroke-dashoffset', i === 0 ? '0' : String(-(SP_L - len)));
    });
  }
  function renderMark(q) {
    const line = easeIO(clamp(q / .48));
    const fill = easeIO(clamp((q - .4) / .5));
    const solid = clamp((q - .88) / .12);
    const max = SM_L * .62;
    setDash(smLine, line * max);
    setSpine(smFill, fill);
    smDots.setAttribute('opacity', String(1 - solid));
    smSolid.setAttribute('opacity', String(solid));
  }
  // 6 services, 4 visuals in the design: service 3 keeps visual 2, service 5 keeps visual 4.
  const VISUAL = [1, 2, 2, 4, 4, 6];
  let sv = {};
  let svActive = 0;

  function layoutServices() {
    const t = { left: svTarget.offsetLeft, top: svTarget.offsetTop, width: svTarget.offsetWidth, height: svTarget.offsetHeight };
    [svMedia, svUi].forEach(el => Object.assign(el.style, { left: t.left + 'px', top: t.top + 'px', width: t.width + 'px', height: t.height + 'px' }));
    const mobile = mqMobile.matches;
    if (mobile) {
      const top = t.top + t.height + 12;
      Object.assign(svCards.style, { top: top + 'px', height: (H - top - 12) + 'px', overflow: 'hidden' });
    } else {
      Object.assign(svCards.style, { top: '0px', height: '100%', overflow: 'visible' });
    }
    const cards = $$('.sv-card', svCol);
    const gap = parseFloat(getComputedStyle(svCol).rowGap || 0);
    const colH = svCol.scrollHeight;
    const step = cards[0].offsetHeight + gap;
    const imgH = svBreakImg.offsetHeight || W * 1512 / 1920;
    const A = Math.max(0, imgH - H);            // how far the tall image can travel
    const AL = Math.max(H * 1.3, A * 3);         // scroll spent on it — copy drifts down slowly
    const B = H * .8;
    const C = H * .5;
    const D = mobile ? Math.max(step, colH - svCards.offsetHeight) : step * (cards.length - 1);
    const E = H * .35;
    sv = { t, A, AL, B, C, D, E, step, colBase: mobile ? 0 : t.top, mobile, rad: mobile ? 16 : 24 * U };
    svc.style.height = (H + AL + B + C + D + E) + 'px';
  }

  function setService(i) {
    if (i === svActive) return;
    svActive = i;
    svNum.textContent = String(i);
    const v = i ? VISUAL[i - 1] : 0;
    svImgs.forEach(img => img.classList.toggle('is-on', +img.dataset.svc === v));
  }

  function renderServices() {
    const { r, s } = sceneProgress(svc);
    if (r.bottom < 0 || r.top > H) return;
    const { t, A, AL, B, C, D } = sv;

    // A — parallax: image scrolls to its end, the copy drifts down to its bottom (slower than the page)
    const a = clamp(s / AL);
    const copyH = svCopy.offsetHeight;
    const topStart = sv.mobile ? 72 : 48 * U;
    const bottomEnd = H - (sv.mobile ? 32 : 40 * U) - copyH;
    svBreakImg.style.transform = `translate3d(0,${-A * a}px,0)`;

    // B — copy fades, the image is framed into the services container
    const b = clamp((s - AL) / B);
    const bf = easeIO(b);
    const copyFade = clamp(b / .35);
    svCopy.style.transform = `translate3d(0,${lerp(topStart, bottomEnd, easeIO(a)) - copyFade * 40 * (sv.mobile ? 1 : U)}px,0)`;
    svCopy.style.opacity = String(1 - copyFade);
    const inset = { top: t.top * bf, left: t.left * bf, right: (W - t.left - t.width) * bf, bottom: (H - t.top - t.height) * bf };
    svFrame.style.clipPath = `inset(${inset.top}px ${inset.right}px ${inset.bottom}px ${inset.left}px round ${sv.rad * bf}px)`;
    // first service visual fades in only after the frame has finished closing in (start of C)
    svMedia.style.opacity = String(clamp((s - AL - B) / (C * .4)));
    const uiOn = clamp((b - .7) / .3);
    svUi.style.opacity = String(uiOn);
    svUi.style.pointerEvents = uiOn > .5 ? 'auto' : 'none';

    // C — cards arrive from the right column; D — they scroll, the visual follows
    const c = easeOut(clamp((s - AL - B) / C));
    const d = clamp(s - AL - B - C, 0, D);
    const enterFrom = sv.mobile ? svCards.offsetHeight + 20 : H + 20;
    const y = lerp(enterFrom, sv.colBase, c) - d;
    svCol.style.transform = `translate3d(0,${y}px,0)`;
    const idx = b < .45 ? 0 : 1 + Math.min(5, Math.round((d / Math.max(1, D)) * 5));
    setService(idx);
    renderMark(b < .7 ? 0 : clamp(d / Math.max(1, D)));
  }

  /* =========================================================
     9. CARE — three scenes crossfade while pinned
     ========================================================= */
  const care = $('.s-care');
  const careImgs = $$('.care-img', care);
  const careTexts = $$('.care-text', care);
  function layoutCare() { care.style.height = (H * 3.4) + 'px'; }
  function renderCare() {
    const { r, s, range } = sceneProgress(care);
    if (r.bottom < 0 || r.top > H) return;
    const x = clamp(s / range) * (careImgs.length - 1) * 1.15 - .075; // short hold at both ends
    const w = .32;
    const unit = sv.mobile ? 1 : U;
    careImgs.forEach((img, i) => {
      if (i === 0) { img.style.opacity = '1'; img.style.transform = `scale(${1 + .04 * clamp(x)})`; return; }
      const op = clamp((x - (i - .5)) / w + .5);
      img.style.opacity = String(op);
      img.style.transform = `scale(${1.08 - .08 * easeOut(op)})`;
    });
    careTexts.forEach((el, i) => {
      const dist = x - i;
      const op = clamp(1 - (Math.abs(dist) - .28) / .16);
      el.style.opacity = String(op);
      el.style.transform = `translate3d(0,${clamp(-dist, -1, 1) * 60 * unit}px,0)`;
      el.setAttribute('aria-hidden', op < .5 ? 'true' : 'false');
    });
  }

  /* =========================================================
     10. TESTIMONIALS — timer + arrows + bars
     ========================================================= */
  const TESTIMONIALS = [
    { role: 'IT Director', org: 'Denver, CO based Health System', quote: ['Spadafy helped us get a clear picture of what was really happening in our VDI environment.', 'Their team identified issues we had been chasing for months and gave us a practical roadmap to improve performance and stability.'] },
    { role: 'VP of Infrastructure', org: '', quote: ['What stood out was that Spadafy didn’t just hand us a design and walk away.', 'They helped us architect the solution, implement it, and continue to support the environment as an extension of our internal team.'] },
    { role: 'Director of End User Computing', org: '', quote: ['Spadafy understands the entire VDI stack, not just one product.', 'They were able to look across the desktop, applications, profiles, storage, and infrastructure to improve the overall user experience.'] }
  ];
  const DURATION = 7000;
  const tCard = $('.t-card');
  const tBarsEl = $('.t-bars');
  const tQuote = $('.t-quote');
  const tAuthor = $('.t-author');
  const tRole = $('.t-role');
  const tOrg = $('.t-org');
  const bars = TESTIMONIALS.map((t, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 't-bar'; b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', `Testimonial ${i + 1} of ${TESTIMONIALS.length}: ${t.role}`);
    b.innerHTML = '<i></i>';
    b.addEventListener('click', () => goTo(i));
    tBarsEl.appendChild(b);
    return b;
  });
  let tIndex = 0, tVisible = false, tFocus = false, tSwapping = false;
  tBarsEl.style.setProperty('--t-dur', DURATION + 'ms');

  function syncPlay() {
    tBarsEl.style.setProperty('--t-play', tVisible && !tFocus ? 'running' : 'paused');
  }
  function paintBars(i) {
    bars.forEach((b, j) => {
      b.classList.remove('is-active');
      b.classList.toggle('is-done', j < i);
      b.setAttribute('aria-selected', String(j === i));
    });
    if (mqReduce.matches) { bars[i].classList.add('is-done'); return; }
    void bars[i].offsetWidth;                // restart the CSS fill
    bars[i].classList.add('is-active');
  }
  function paintTestimonial(i) {
    const t = TESTIMONIALS[i];
    tRole.textContent = t.role;
    tOrg.textContent = t.org;
    tQuote.innerHTML = t.quote.map(q => `<p>${q}</p>`).join('');
  }
  function goTo(i) {
    i = (i + TESTIMONIALS.length) % TESTIMONIALS.length;
    if (tSwapping) return;
    paintBars(i);                            // bar starts filling immediately — no gap
    if (i === tIndex) return;
    tIndex = i;
    if (mqReduce.matches) { paintTestimonial(i); return; }
    tSwapping = true;
    tQuote.className = 't-quote is-leaving'; tAuthor.className = 't-author is-leaving';
    setTimeout(() => {
      paintTestimonial(i);
      tQuote.className = 't-quote is-entering';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        tQuote.className = 't-quote is-in'; tAuthor.className = 't-author is-in';
        tSwapping = false;
      }));
    }, 320);
  }
  bars.forEach((b, j) => b.querySelector('i').addEventListener('animationend', () => {
    if (j === tIndex && !mqReduce.matches) goTo(tIndex + 1);
  }));
  $$('.t-arrow').forEach(btn => btn.addEventListener('click', () => goTo(tIndex + +btn.dataset.dir)));
  tCard.addEventListener('focusin', () => { tFocus = true; syncPlay(); });
  tCard.addEventListener('focusout', () => { tFocus = false; syncPlay(); });
  new IntersectionObserver(([e]) => { tVisible = e.isIntersecting; syncPlay(); }, { threshold: .35 }).observe(tCard);
  paintTestimonial(0);
  paintBars(0);
  syncPlay();

  /* =========================================================
     11. HEALTH CHECK — steps glide in from the right, one after another
     ========================================================= */
  const hcSteps = $$('.hc-step');
  const hcList = $('.hc-steps');
  const hcCur = hcSteps.map(() => null);
  const hcTarget = hcSteps.map(() => 0);
  let hcRaf = 0;
  function renderHealth() {
    const r = hcList.getBoundingClientRect();
    if (r.bottom < -H * .2 || r.top > H * 1.3) return;
    hcSteps.forEach((el, i) => {
      // each step travels over ~80% of a screen of scrolling, starting a little after the previous one
      const top = r.top + el.offsetTop - hcList.offsetTop;
      const t = clamp((H * 1.05 - top - i * H * .07) / (H * .8));
      const o = sv.mobile ? W * (.55 + i * .1) : (1200 + i * 120) * U;
      hcTarget[i] = o * (1 - easeIO(t));
    });
    if (!hcRaf) hcRaf = requestAnimationFrame(hcStep);
  }
  function hcStep() {
    hcRaf = 0;
    let moving = false;
    hcSteps.forEach((el, i) => {
      if (hcCur[i] === null || mqReduce.matches) hcCur[i] = hcTarget[i];
      else hcCur[i] += (hcTarget[i] - hcCur[i]) * .12;   // inertia keeps the glide soft
      if (Math.abs(hcTarget[i] - hcCur[i]) > .3) moving = true; else hcCur[i] = hcTarget[i];
      el.style.transform = `translate3d(${hcCur[i]}px,0,0)`;
    });
    if (moving) hcRaf = requestAnimationFrame(hcStep);
  }

  /* =========================================================
     13. INTRO TO NEXT PAGE — preview grows to fill the screen
     ========================================================= */
  const next = $('.s-next');
  const nextCard = $('.next-card');
  const nextTitle = $('.next-title');
  const nextShade = $('.next-shade');
  let leaving = false, leaveTimer = 0;
  function layoutNext() {
    const pad = parseFloat(getComputedStyle(next).paddingTop);
    next.style.height = (pad + H * 2.6) + 'px';
  }
  function renderNext() {
    const pad = parseFloat(getComputedStyle(next).paddingTop);
    const { r, s, range } = sceneProgress(next, pad);
    if (r.bottom < 0 || r.top > H) return;
    const p = s / range;
    const mobile = sv.mobile;
    const w0 = mobile ? W * .58 : 431 * U, h0 = mobile ? W * .82 : 600 * U;
    const w1 = mobile ? W * .86 : 1261 * U, h1 = mobile ? W * .62 : 714 * U;
    const r0 = mobile ? 36 : 60 * U;
    let w, h, rad;
    if (p < .45) { const k = easeIO(p / .45); w = lerp(w0, w1, k); h = lerp(h0, h1, k); rad = r0; }
    else { const k = easeIO(clamp((p - .45) / .45)); w = lerp(w1, W, k); h = lerp(h1, H, k); rad = lerp(r0, 0, k); }
    nextCard.style.width = w + 'px';
    nextCard.style.height = h + 'px';
    nextCard.style.borderRadius = rad + 'px';
    const fs0 = mobile ? 40 : 64 * U, fs1 = mobile ? 72 : 140 * U;
    const titleOp = p < .3 ? 1 - clamp((p - .1) / .2) : clamp((p - .7) / .2);
    nextTitle.style.opacity = String(titleOp);
    nextTitle.style.fontSize = (p < .5 ? fs0 : fs1) + 'px';
    nextTitle.style.lineHeight = p < .5 ? '.9' : '.84';
    nextShade.style.opacity = String(clamp((p - .6) / .3));

    if (p >= .995 && !leaving) {
      clearTimeout(leaveTimer);
      leaveTimer = setTimeout(() => {
        const again = sceneProgress(next, pad);
        if (again.s / again.range >= .995) { leaving = true; window.location.href = 'tech.html'; }
      }, 450);
    }
  }
  window.addEventListener('pageshow', () => { leaving = false; });

  /* =========================================================
     LOOP
     ========================================================= */
  function layout(force) {
    setUnits(force);
    sv.mobile = mqMobile.matches;
    layoutTeam(); layoutBreak(); layoutFlags(); layoutServices(); layoutCare(); layoutNext();
    render();
  }
  function render() {
    setNavState();
    renderIntro(); renderTeam(); renderBreak(); renderFlags(); renderServices(); renderCare(); renderHealth(); renderNext();
  }
  let raf = 0;
  window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; render(); }); }, { passive: true });
  let rz = 0;
  window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => layout(!mqMobile.matches), 120); });
  window.addEventListener('load', () => layout(true));
  svBreakImg.addEventListener('load', () => layout(true));
  if (document.fonts) document.fonts.ready.then(() => layout(true));
  layout(true);
})();
