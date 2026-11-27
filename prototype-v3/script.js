/* =========================================================
   Spadafy — Homepage prototype v3 (desktop)
   Scenes: a tall track with a sticky stage inside; progress 0..1 drives the frame.
   ========================================================= */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
  const easeIO = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const root = document.documentElement;

  /* Lenis smooth scroll (native scroll position is kept, so sticky scenes and scroll events keep working) */
  const lenis = (!reduce && window.Lenis) ? new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true }) : null;
  if (lenis) {
    window.lenis = lenis;
    const tick = t => { lenis.raf(t); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }
  const scrollTo = (y, smooth = true) => {
    if (lenis) lenis.scrollTo(y, { duration: 1.4, immediate: !smooth });
    else window.scrollTo({ top: y, behavior: smooth ? 'smooth' : 'auto' });
  };
  /* in-page links (#about, #cta, ...) glide with Lenis */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.dataset.svc !== undefined) return;
    const id = a.getAttribute('href');
    const target = id === '#top' ? document.body : $(id);
    if (!target) return;
    e.preventDefault();
    scrollTo(id === '#top' ? 0 : target.getBoundingClientRect().top + window.scrollY);
  });
  let W = 1920, H = 1080, U = 1;
  function setUnits() {
    W = root.clientWidth; H = window.innerHeight; U = W / 1920;
    root.style.setProperty('--u', U + 'px');
    root.style.setProperty('--vh', H + 'px');
  }

  /* progress of a sticky scene: 0 when the stage pins, 1 when it releases */
  function sceneProgress(el, stageH = H - 16 * U, top = 8 * U) {
    const r = el.getBoundingClientRect();
    const range = Math.max(1, r.height - stageH);
    return clamp((top - r.top) / range);
  }
  const inView = el => { const r = el.getBoundingClientRect(); return r.bottom > -50 && r.top < H + 50; };


  /* =========================================================
     HERO — the body slides over it
     ========================================================= */
  /* logo strip: a second copy makes the -50% loop seamless and endless */
  const logoTrack = $('.logos-track'), logoSet = $('.logos-set');
  const logoCopy = logoSet.cloneNode(true);
  logoCopy.setAttribute('aria-hidden', 'true');
  $$('img', logoCopy).forEach(i => { i.alt = ''; });
  logoTrack.appendChild(logoCopy);

  const hero = $('.hero'), heroText = $('.hero-text'), body = $('#body');
  const heroCover = document.createElement('div');
  heroCover.className = 'hero-cover'; hero.appendChild(heroCover);
  function renderHero() {
    const top = body.getBoundingClientRect().top;
    const p = clamp(1 - top / H);
    heroText.style.transform = `translateY(${(-p * 90 * U).toFixed(1)}px)`;
    heroCover.style.opacity = (p * .6).toFixed(3);
    body.style.setProperty('--bg', smooth(p).toFixed(3));
    hero.style.visibility = top < -4 ? 'hidden' : 'visible';
  }

  /* =========================================================
     SERVICES — a pinned window: intro scrolls away inside it, then panels slide sideways
     ========================================================= */
  const svTop = $('.sv-top'), svTrack = $('.sv-track'), svWin = $('#sv-window'), svCol = $('#sv-col'), svRail = $('#sv-rail');
    let svD = 0, svB = 0, svWide = false;                           // intro distance, sideways distance (px)
  function layoutServices() {
    svD = svRail.offsetTop;
    svB = H * 1.5;
    svTrack.style.height = (H - 16 * U + svD + svB) + 'px';
  }
  function railX(b) {                             // 0..1: hold on Core VDI, slide, hold on Beyond VDI
    return easeIO((b - .15) / .7);
  }
  function renderServices() {
    if (!inView(svTrack)) return;
    const sc = 8 * U - svTrack.getBoundingClientRect().top;      // px scrolled since the window pinned
    const wide = sc >= svD - 1;
    if (wide !== svWide) { svWide = wide; svTop.style.visibility = wide ? 'hidden' : ''; svWin.style.clipPath = wide ? `inset(0 ${-W}px 0 ${-W}px round ${60 * U}px)` : ''; }
    svCol.style.transform = `translateY(${(-clamp(sc / svD) * svD).toFixed(1)}px)`;
    const b = clamp((sc - svD) / svB);
    svRail.style.transform = `translateX(${(-railX(b) * (svWin.clientWidth + 8 * U)).toFixed(1)}px)`;
  }
  function scrollToService(k) {
    const top = svTrack.getBoundingClientRect().top + window.scrollY;
    const b = [0, .92][k];
    scrollTo(top - 8 * U + svD + (k === 0 ? 2 : b * svB));
  }

  /* =========================================================
     ABOUT — text rolls like a drum
     ========================================================= */
  const about = $('#about'), drum = $('#drum');
  const LINES = ['That means helping your organization', 'design, implement, operate and modernize', 'the environments your employees rely on',
                 'every day, from A to Z, improving', 'end-user experience so that everything', 'simply works as it should.'];
  const dl = LINES.map(t => { const d = document.createElement('div'); d.className = 'dl'; d.textContent = t; drum.appendChild(d); return d; });
  let drumCur = 0, drumTarget = 0, drumRaf = 0;
  function drawDrum(p) {
    const R = 360 * U, step = .34;
    dl.forEach((el, i) => {
      const d = i - p, a = d * step;
      if (Math.abs(a) > 1.45) { el.style.opacity = '0'; return; }
      const s = Math.cos(a), y = R * Math.sin(a);
      el.style.opacity = Math.pow(s, 1.6).toFixed(3);
      el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0) scale(1, ${s.toFixed(3)})`;
      el.style.filter = `blur(${((1 - s) * 18 * U).toFixed(2)}px)`;
    });
  }
  function drumStep() {
    drumCur += (drumTarget - drumCur) * (reduce ? 1 : .2);
    if (Math.abs(drumTarget - drumCur) < .002) drumCur = drumTarget;
    drawDrum(drumCur);
    drumRaf = drumCur === drumTarget ? 0 : requestAnimationFrame(drumStep);
  }
  function renderAbout() {
    if (!inView(about)) return;
    const p = sceneProgress(about);
    drumTarget = clamp(p / .85) * (LINES.length - 1);
    if (!drumRaf) drumRaf = requestAnimationFrame(drumStep);
  }

  /* =========================================================
     GREEN FLAGS — the hovered card opens, the others fold
     ========================================================= */
  const flags = $$('.fl');
  /* every card has its own animated map; it plays while its card is open and the row is on screen */
  const flagMaps = flags.map(el => { const m = $('.flag-map', el); return m && window.FlagMap ? window.FlagMap.mount(m) : null; });
  const flagRow = $('#fl-row');
  let flagOpen = 0, flagOn = false;
  const syncMaps = () => flagMaps.forEach((m, n) => m && m.setOpen(flagOn && n === flagOpen));
  new IntersectionObserver(es => { flagOn = es[0].isIntersecting; syncMaps(); }, { threshold: .5 }).observe(flagRow);
  const openFlag = i => { flags.forEach((el, n) => el.classList.toggle('is-open', n === i)); flagOpen = i; syncMaps(); };
  let flagTimer = 0;
  flags.forEach((el, i) => {
    el.addEventListener('pointerenter', () => { clearTimeout(flagTimer); flagTimer = setTimeout(() => openFlag(i), 70); });
    el.addEventListener('pointerleave', () => clearTimeout(flagTimer));
    ['focus', 'click'].forEach(ev => el.addEventListener(ev, () => { clearTimeout(flagTimer); openFlag(i); }));
  });

  /* =========================================================
     TEAM — mouse drag (touch and trackpads scroll natively), with the "← Drag →" pill following the pointer
     ========================================================= */
  const teamView = $('#team-view');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
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
    return () => view.classList.toggle('can-drag', max() > 2);
  }
  function dragHint(scroller, host) {
    const hint = document.createElement('span');
    hint.className = 'drag-hint'; hint.setAttribute('aria-hidden', 'true');
    hint.innerHTML = '<span class="drag-hint-pill"><span class="dh-l">←</span>Drag<span class="dh-r">→</span></span>';
    host.appendChild(hint);
    let hx = 0, hy = 0, htx = 0, hty = 0, hintOn = false;
    const hintTarget = e => { const r = host.getBoundingClientRect(); htx = e.clientX - r.left; hty = e.clientY - r.top; };
    const hintTick = () => {
      if (!hintOn) return;
      hx = reduce ? htx : lerp(hx, htx, .25); hy = reduce ? hty : lerp(hy, hty, .25);
      hint.style.transform = `translate(${hx.toFixed(1)}px, ${hy.toFixed(1)}px)`;
      requestAnimationFrame(hintTick);
    };
    scroller.addEventListener('pointerenter', e => {
      if (e.pointerType !== 'mouse' || !finePointer.matches || !scroller.classList.contains('can-drag')) return;
      hintTarget(e); hx = htx; hy = hty;
      if (!hintOn) { hintOn = true; requestAnimationFrame(hintTick); }
      hint.classList.add('is-on'); scroller.classList.add('has-hint');
    });
    scroller.addEventListener('pointermove', e => { if (hintOn) hintTarget(e); });
    scroller.addEventListener('pointerleave', () => { hintOn = false; hint.classList.remove('is-on'); scroller.classList.remove('has-hint'); });
  }
  const syncTeam = dragScroll(teamView, () => $$('.member', teamView));
  dragHint(teamView, teamView.parentElement);

  /* =========================================================
     CARE — the photo shrinks into a frame while the title leaves upward; then three slides swap in place
     ========================================================= */
  const care = $('#care');
  const careFrame = $('#care-frame'), careTitle = $('.care-title'), careCaps = $('#care-caps'), careShade = $('.care-shade');
  const ci = $$('.ci'), caps = $$('.care-cap');
  const seg = (p, a, b) => easeIO((p - a) / (b - a));
  const mixR = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) });
  let careK = [], careT = [], careDy = 0;
  function layoutCare() {
    const SW = W - 16 * U, SH = H - 16 * U;
    careDy = (SH - 1064 * U) / 2;                         // design is 1904 x 1064; taller or shorter windows centre it
    const R = (x, y, w, h) => ({ x: x * U, y: y * U + careDy, w: w * U, h: h * U });
    careK = [{ x: 0, y: 0, w: SW, h: SH }, R(668, 236, 568, 592)];   // full block -> final 568 x 592 frame (same centre, so all four sides move together)
    careT = [452 * U + careDy, -230 * U + careDy];                    // title top: centred -> gone upward
    careCaps.style.bottom = (SH / 2 - 487 * U) + 'px';               // captions sit 45px above the bottom edge of the 1064 design stage
  }
  function renderCare() {
    if (!inView(care)) return;
    const p = sceneProgress(care);
    const t = clamp((p - .04) / .46);                      // 0..1, linear in scroll: the frame follows the wheel, no steps
    const r = mixR(careK[0], careK[1], t);
    careFrame.style.left = r.x.toFixed(1) + 'px'; careFrame.style.top = r.y.toFixed(1) + 'px';
    careFrame.style.width = r.w.toFixed(1) + 'px'; careFrame.style.height = r.h.toFixed(1) + 'px';
    careShade.style.opacity = (1 - clamp(t / .4)).toFixed(3);
    careTitle.style.transform = `translate3d(-50%, ${lerp(careT[0], careT[1], clamp(t / .8)).toFixed(1)}px, 0)`;
    const ct = clamp((t - .5) / .5);
    careCaps.style.opacity = clamp((t - .5) / .25).toFixed(3);
    careCaps.style.transform = `translateY(${lerp(60 * U, -191 * U, ct).toFixed(1)}px)`;
    ci[1].style.opacity = seg(p, .60, .66).toFixed(3);
    ci[2].style.opacity = seg(p, .80, .86).toFixed(3);
    const a0 = 1 - seg(p, .60, .64);
    const a1 = seg(p, .62, .66) * (1 - seg(p, .80, .84));
    const a2 = seg(p, .82, .86);
    [a0, a1, a2].forEach((a, i) => { caps[i].style.opacity = a.toFixed(3); caps[i].style.transform = `translateY(${((1 - a) * 12 * U).toFixed(1)}px)`; });
  }

  /* =========================================================
     TESTIMONIALS — pagination
     ========================================================= */
  const TESTIMONIALS = [
    { role: 'IT Director', org: 'Denver, CO based Health System', tags: ['Health Check', 'VDI Managed solution', 'IGEL UML'], quote: ['Spadafy helped us get a clear picture of what was really happening in our VDI environment.', 'Their team identified issues we had been chasing for months and gave us a practical roadmap to improve performance and stability.'] },
    { role: 'VP of Infrastructure', org: 'Pacific Northwest Regional Health Network', tags: ['VDI Infrastructure', 'VDI Managed Services'], quote: ['What stood out was that Spadafy didn’t just hand us a design and walk away.', 'They helped us architect the solution, implement it, and continue to support the environment as an extension of our internal team.'] },
    { role: 'Director of End User Computing', org: 'Midwest Multi-Hospital Health System', tags: ['Health Check', 'VDI Infrastructure'], quote: ['Spadafy understands the entire VDI stack, not just one product.', 'They were able to look across the desktop, applications, profiles, storage, and infrastructure to improve the overall user experience.'] }
  ];
  const tDots = $('#t-dots'), tTags = $('#t-tags'), tRole = $('#t-role'), tOrg = $('#t-org'), tQuote = $('#t-quote');
  let tCur = -1, tTimers = [];
  const dotEls = TESTIMONIALS.map((t, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 't-dot'; b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', `Testimonial ${i + 1} of ${TESTIMONIALS.length}: ${t.role}`);
    b.addEventListener('click', () => showT(i)); tDots.appendChild(b); return b;
  });
  function showT(i) {
    i = clamp(i, 0, TESTIMONIALS.length - 1);
    if (i === tCur) return;
    tCur = i;
    const t = TESTIMONIALS[i];
    tTimers.forEach(clearTimeout); tTimers = [];
    dotEls.forEach((b, n) => { b.classList.toggle('is-on', n === i); b.setAttribute('aria-selected', String(n === i)); });
    tRole.textContent = t.role; tOrg.textContent = t.org;
    tTags.innerHTML = '';
    t.tags.forEach((tag, n) => {
      const li = document.createElement('li'); li.textContent = tag; li.style.setProperty('--d', (n * 70) + 'ms'); tTags.appendChild(li);
      if (reduce) li.classList.add('on'); else requestAnimationFrame(() => requestAnimationFrame(() => li.classList.add('on')));
    });
    tQuote.innerHTML = '';
    const words = [];
    t.quote.forEach(par => {
      const p = document.createElement('p');
      par.split(' ').forEach((word, n, arr) => {
        const s = document.createElement('span'); s.className = 'w'; s.textContent = word; p.appendChild(s);
        if (n < arr.length - 1) p.appendChild(document.createTextNode(' '));
        words.push(s);
      });
      tQuote.appendChild(p);
    });
    words.forEach((w, n) => { if (reduce) w.classList.add('on'); else tTimers.push(setTimeout(() => w.classList.add('on'), 120 + n * 28)); });
  }
  showT(0);

  /* =========================================================
     SMALL REVEALS — fade + rise, staggered, once
     ========================================================= */
  const REVEAL = [
    ['.sv-intro-main > *', 120, 0], ['.sv-intro-note', 0, 250],
    ['.flags .h2', 0, 0], ['.fl-row', 0, 100], ['.fl-partners', 0, 300],
    ['.team-title', 0, 0], ['.btn-orange', 0, 200], ['.member', 70, 0],
    ['.t-side', 0, 0], ['.t-main', 0, 150],
    ['.hc-head > *', 120, 0], ['.hc-cards li', 130, 0], ['.hc-btn', 0, 200],
    ['.ct-left', 0, 0], ['.ct-form', 0, 150]
  ];
  /* hero extras reveal on load (not via the observer: the strip sits in the hero's bottom margin) */
  const heroReveal = ['.hero h1', '.hero-text p', '.logos'].map((sel, i) => {
    const el = $(sel);
    el.classList.add('rv'); el.style.setProperty('--d', (i * 220) + 'ms');
    return el;
  });
  const showHero = () => heroReveal.forEach(el => el.classList.add('in'));
  const io = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .15, rootMargin: '0px 0px -6% 0px' });
  REVEAL.forEach(([sel, step, base]) => $$(sel).forEach((el, i) => { el.classList.add('rv'); el.style.setProperty('--d', Math.min(base + i * step, 700) + 'ms'); io.observe(el); }));

  /* =========================================================
     INTRO — the S film, then the curtain lifts (first visit only)
     ========================================================= */
  const intro = $('#intro'), film = $('#intro-video');
  let introDone = false;
  function endIntro() {
    if (introDone) return;
    introDone = true;
    intro.classList.add('is-out');
    setTimeout(showHero, 450);
    setTimeout(() => {
      intro.classList.add('is-gone');
      root.classList.remove('is-loading');
      if (lenis) lenis.start();
      layout();                                        // scrollbar is back: re-measure the width
      setTimeout(layout, 120);
    }, 1150);
  }
  /* the film opens the first visit only: coming from another page of the site (or reloading) skips it */
  if (reduce || !intro || !film || root.classList.contains('no-intro')) {
    if (intro) intro.classList.add('is-gone');
    showHero();
  } else {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    root.classList.add('is-loading');
    if (lenis) lenis.stop();
    film.playbackRate = 1.3;
    film.addEventListener('loadedmetadata', () => { film.playbackRate = 1.3; });
    const pace = () => {
      if (introDone) return;
      const t = film.currentTime;
      if (t >= 2.35 && film.playbackRate < 2.5) film.playbackRate = 2.6;
      if (t >= 4.35) { endIntro(); return; }
      requestAnimationFrame(pace);
    };
    requestAnimationFrame(pace);
    film.addEventListener('timeupdate', () => { if (film.currentTime >= 4.35) endIntro(); });
    film.addEventListener('ended', endIntro);
    film.addEventListener('error', () => setTimeout(endIntro, 400));
    const p = film.play();
    if (p && p.catch) p.catch(() => setTimeout(endIntro, 1200));
    setTimeout(endIntro, 7000);                       // safety net
    const skip = () => { if (!introDone && film.currentTime > 1) endIntro(); };
    window.addEventListener('wheel', skip, { passive: true });
    window.addEventListener('touchmove', skip, { passive: true });
    window.addEventListener('keydown', skip);
  }

  /* =========================================================
     LOOP
     ========================================================= */
  function layout() {
    setUnits();
    const stage = H - 16 * U;
    about.style.height = (stage + H * .7) + 'px';          // half the scroll it had (1.4 screens)
    care.style.height = (stage + H * 4.2) + 'px';
    syncTeam();
    layoutServices();
    layoutCare();
    render();
  }
  function render() {
    renderHero(); renderServices(); renderAbout(); renderCare();
  }
  let ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => { ticking = false; render(); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', layout);
  /* the scrollbar appearing or vanishing changes the width without a resize event */
  if (window.ResizeObserver) new ResizeObserver(() => { if (root.clientWidth !== W) layout(); }).observe(root);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  layout();
})();
