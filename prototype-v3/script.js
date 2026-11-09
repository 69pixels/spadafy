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
     NAV
     ========================================================= */
  const nav = $('#nav');
  const PANELS = {
    services: {
      title: 'Services', text: 'From the first assessment to everyday support.',
      items: [['VDI Managed Services', 0], ['Free VDI Health Check', '#cta'], ['VDI Infrastructure', 0], ['Healthcare SSO and Authentication', 1],
              ['IGEL Endpoint Solutions', 1], ['Nerdio Solutions', 1], ['Hybrid Cloud & Infrastructure Modernization', 2], ['Vendor Partners', 2]]
    },
    index: {
      title: 'Index', text: 'Jump to any part of this page.',
      items: [['Services', '#services'], ['About', '#about'], ['Our green flags', '#flags'], ['Team', '#team'],
              ['What we care about', '#care'], ['Testimonials', '#testimonials'], ['Free health check', '#cta'], ['All services', 'services.html']]
    }
  };
  const npTitle = $('[data-np-title]'), npText = $('[data-np-text]'), npGrid = $('[data-np-grid]');
  const panelBtns = $$('[data-panel]', nav);
  let openKey = null, openAtY = 0;

  function fillPanel(key) {
    const p = PANELS[key];
    npTitle.textContent = p.title; npText.textContent = p.text;
    npGrid.innerHTML = '';
    p.items.forEach(([label, href]) => {
      const li = document.createElement('li'), a = document.createElement('a');
      a.textContent = label; a.href = typeof href === 'number' ? '#services' : href;
      if (typeof href === 'number') a.dataset.svc = href;
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
  npGrid.addEventListener('click', e => {
    const a = e.target.closest('a[data-svc]');
    if (!a) return;
    e.preventDefault(); openKey = null; setNav(); scrollToService(+a.dataset.svc);
  });
  document.addEventListener('click', e => {
    if (!openKey) return;
    if (!e.target.closest('.nav-box') || e.target.closest('.np-grid a, .np-view')) { openKey = null; setNav(); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && openKey) { openKey = null; setNav(); } });

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
  const SV_AT = [0, .5, 1];                       // rail progress that centres each panel
  let svD = 0, svB = 0, svWide = false;                           // intro distance, sideways distance (px)
  function layoutServices() {
    svD = svRail.offsetTop;
    svB = H * 2.4;
    svTrack.style.height = (H - 16 * U + svD + svB) + 'px';
  }
  function railX(b) {                             // 0..2 with holds on every panel
    return easeIO((b - .12) / .34) + easeIO((b - .54) / .34);
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
    const b = [.04, .5, .96][k];
    scrollTo(top - 8 * U + svD + (k === 0 ? 2 : 0) + (k === 0 ? 0 : b * svB));
  }

  /* =========================================================
     ABOUT — text rolls like a drum
     ========================================================= */
  const about = $('#about'), drum = $('#drum');
  const LINES = ['That means helping', 'your organization design,', 'implement, operate', 'and modernize', 'the environments', 'your employees rely on',
                 'every day, from A to Z,', 'improving end-user', 'experience so that', 'everything simply works', 'as it should.'];
  const dl = LINES.map(t => { const d = document.createElement('div'); d.className = 'dl'; d.textContent = t; drum.appendChild(d); return d; });
  let drumCur = 0, drumTarget = 0, drumRaf = 0;
  function drawDrum(p) {
    const R = 520 * U, step = .34;
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
    drumCur += (drumTarget - drumCur) * (reduce ? 1 : .14);
    if (Math.abs(drumTarget - drumCur) < .002) drumCur = drumTarget;
    drawDrum(drumCur);
    drumRaf = drumCur === drumTarget ? 0 : requestAnimationFrame(drumStep);
  }
  function renderAbout() {
    if (!inView(about)) return;
    const p = sceneProgress(about);
    drumTarget = clamp(p / .9) * (LINES.length - 1);
    if (!drumRaf) drumRaf = requestAnimationFrame(drumStep);
  }

  /* =========================================================
     TEAM — controls
     ========================================================= */
  const track = $('#team-track'), tPrev = $('#team-prev'), tNext = $('#team-next');
  const members = $$('.member', track);
  let tIdx = 0;
  function teamMax() { return Math.max(0, 80 + members.length * 312 + (members.length - 1) * 8 - (1904 - 80)); }
  function teamSteps() { return Math.ceil(teamMax() / 320); }
  function setTeam(i) {
    tIdx = clamp(i, 0, teamSteps());
    track.style.setProperty('--tx', -Math.min(tIdx * 320, teamMax()));
    tPrev.disabled = tIdx === 0; tNext.disabled = tIdx === teamSteps();
  }
  tPrev.addEventListener('click', () => setTeam(tIdx - 1));
  tNext.addEventListener('click', () => setTeam(tIdx + 1));
  setTeam(0);

  /* =========================================================
     CARE — blur clears, then three slides fade
     ========================================================= */
  const care = $('#care');
  const ci = $$('.ci'), careTitle = $('.care-title'), careGrad = $('.care-grad'), caps = $$('.care-cap');
  function renderCare() {
    if (!inView(care)) return;
    const p = sceneProgress(care);
    const k = easeIO((p - .10) / .24);
    ci[0].style.filter = k < .995 ? `blur(${(50 * U * (1 - k)).toFixed(2)}px)` : 'none';
    ci[0].style.transform = k < .995 ? `scale(${(1.12 - .12 * k).toFixed(4)})` : 'none';
    careTitle.style.opacity = (1 - clamp((p - .10) / .14)).toFixed(3);
    careGrad.style.opacity = clamp((p - .30) / .08).toFixed(3);
    ci[1].style.opacity = easeIO((p - .50) / .12).toFixed(3);
    ci[2].style.opacity = easeIO((p - .80) / .12).toFixed(3);
    const a0 = clamp((p - .30) / .08) * (1 - clamp((p - .50) / .05));
    const a1 = clamp((p - .57) / .05) * (1 - clamp((p - .80) / .05));
    const a2 = clamp((p - .87) / .05);
    [a0, a1, a2].forEach((a, i) => { caps[i].style.opacity = a.toFixed(3); caps[i].style.transform = `translateY(${((1 - a) * 12 * U).toFixed(1)}px)`; });
  }

  /* =========================================================
     TESTIMONIALS — pagination
     ========================================================= */
  const TESTIMONIALS = [
    { role: 'IT Director', org: 'Denver, CO based Health System', quote: ['Spadafy helped us get a clear picture of what was really happening in our VDI environment.', 'Their team identified issues we had been chasing for months and gave us a practical roadmap to improve performance and stability.'] },
    { role: 'VP of Infrastructure', org: '', quote: ['What stood out was that Spadafy didn’t just hand us a design and walk away.', 'They helped us architect the solution, implement it, and continue to support the environment as an extension of our internal team.'] },
    { role: 'Director of End User Computing', org: '', quote: ['Spadafy understands the entire VDI stack, not just one product.', 'They were able to look across the desktop, applications, profiles, storage, and infrastructure to improve the overall user experience.'] }
  ];
  const tBars = $('#t-bars'), tRole = $('#t-role'), tOrg = $('#t-org'), tQuote = $('#t-quote'), tPrevB = $('#t-prev'), tNextB = $('#t-next');
  let tCur = -1, tTimers = [];
  const barEls = TESTIMONIALS.map((t, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 't-bar'; b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', `Testimonial ${i + 1} of ${TESTIMONIALS.length}: ${t.role}`);
    b.innerHTML = '<i></i>'; b.addEventListener('click', () => showT(i)); tBars.appendChild(b); return b;
  });
  function showT(i) {
    i = clamp(i, 0, TESTIMONIALS.length - 1);
    if (i === tCur) return;
    tCur = i;
    const t = TESTIMONIALS[i];
    tTimers.forEach(clearTimeout); tTimers = [];
    barEls.forEach((b, n) => { b.classList.toggle('is-on', n === i); b.setAttribute('aria-selected', String(n === i)); });
    tRole.textContent = t.role; tOrg.textContent = t.org;
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
    tPrevB.disabled = i === 0; tNextB.disabled = i === TESTIMONIALS.length - 1;
  }
  tPrevB.addEventListener('click', () => showT(tCur - 1));
  tNextB.addEventListener('click', () => showT(tCur + 1));
  showT(0);

  /* =========================================================
     OUTRO — the card grows to fill the screen, then we land on Services
     ========================================================= */
  const next = $('#s-next'), nextCard = $('.next-card'), nextTitle = $('.next-title'), nextShade = $('.next-shade');
  let leaving = false, leaveTimer = 0;
  function renderNext() {
    const r = next.getBoundingClientRect();
    if (r.bottom < 0 || r.top > H) return;
    const pad = 200 * U, range = Math.max(1, r.height - pad - H);
    const p = clamp(-(r.top + pad) / range);
    const w0 = 431 * U, h0 = 600 * U, w1 = 1261 * U, h1 = 714 * U, r0 = 60 * U;
    let w, h, rad;
    if (p < .45) { const k = easeIO(p / .45); w = lerp(w0, w1, k); h = lerp(h0, h1, k); rad = r0; }
    else { const k = easeIO((p - .45) / .45); w = lerp(w1, W, k); h = lerp(h1, H, k); rad = lerp(r0, 0, k); }
    nextCard.style.width = w + 'px'; nextCard.style.height = h + 'px'; nextCard.style.borderRadius = rad + 'px';
    nextTitle.style.opacity = String(p < .3 ? 1 - clamp((p - .1) / .2) : clamp((p - .7) / .2));
    nextTitle.style.fontSize = (p < .5 ? 64 * U : 140 * U) + 'px';
    nextTitle.style.lineHeight = p < .5 ? '.9' : '.84';
    nextShade.style.opacity = String(clamp((p - .6) / .3));
    if (p >= .995 && !leaving) {
      clearTimeout(leaveTimer);
      leaveTimer = setTimeout(() => {
        const q = next.getBoundingClientRect();
        if (clamp(-(q.top + pad) / range) >= .995) { leaving = true; window.location.href = 'services.html'; }
      }, 450);
    }
  }
  window.addEventListener('pageshow', () => { leaving = false; });

  /* =========================================================
     SMALL REVEALS — fade + rise, staggered, once
     ========================================================= */
  const REVEAL = [
    ['.sv-intro-main > *', 120, 0], ['.sv-intro-note', 0, 250],
    ['.flags-left h2', 0, 0], ['.flags-right li', 110, 0],
    ['.team-head .h3', 0, 0], ['.btn-orange', 0, 200], ['.member', 70, 0], ['.pager', 0, 300],
    ['.break-text > *', 140, 0],
    ['.t-top > *', 120, 0], ['.t-pager', 0, 300],
    ['.cta-eyebrow', 0, 0], ['.cta-pink h2', 0, 120], ['.cta-steps li', 130, 0]
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
     INTRO — the S film, then the curtain lifts (every load / refresh)
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
  if (reduce || !intro || !film) {
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
    about.style.height = (stage + H * 4.25) + 'px';
    care.style.height = (stage + H * 4.4) + 'px';
    next.style.height = (200 * U + H * 2.6) + 'px';
    setTeam(tIdx);
    layoutServices();
    render();
  }
  function render() {
    setNav(); renderHero(); renderServices(); renderAbout(); renderCare(); renderNext();
  }
  let ticking = false;
  function onScroll() {
    if (openKey && Math.abs(window.scrollY - openAtY) > 400) openKey = null;
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
