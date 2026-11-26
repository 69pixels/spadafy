/* =========================================================
   Spadafy — About page (desktop)
   Same motion principles as the homepage / VMS page: Lenis scroll, nav states,
   the body slides over a sticky hero, pinned scenes, staggered reveals, outro card.
   ========================================================= */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
  const easeIO = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const easeOut = t => { t = clamp(t); return 1 - Math.pow(1 - t, 3); };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  /* Lenis smooth scroll */
  const lenis = (!reduce && window.Lenis) ? new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true }) : null;
  if (lenis) {
    window.lenis = lenis;
    const tick = t => { lenis.raf(t); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }
  const scrollTo = y => { if (lenis) lenis.scrollTo(y, { duration: 1.4 }); else window.scrollTo({ top: y, behavior: 'smooth' }); };
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
  /* progress of a sticky scene: 0 when the stage pins, 1 when it releases */
  function sceneProgress(el, stageH = H - 16 * U, top = 8 * U) {
    const r = el.getBoundingClientRect();
    return clamp((top - r.top) / Math.max(1, r.height - stageH));
  }
  const inView = el => { const r = el.getBoundingClientRect(); return r.bottom > -50 && r.top < H + 50; };

  /* =========================================================
     NAV — default → collapsed after 24px → open panel
     ========================================================= */
  const nav = $('#nav');
  const PANELS = {
    services: {
      title: 'Services', text: 'From the first assessment to everyday support.',
      items: [['VDI Managed Services', 'vdi-managed-services.html'], ['Free VDI Health Check', 'health-check.html'],
              ['VDI Infrastructure', 'vdi-infrastructure.html'], ['Healthcare SSO and Authentication', 'healthcare-sso.html'],
              ['IGEL Endpoint Solutions', 'igel-endpoint-solutions.html'], ['Nerdio Solutions', 'nerdio-solutions.html'],
              ['Hybrid Cloud & Infrastructure Modernization', 'hybrid-cloud.html'], ['Vendor Partners', 'vendor-partners.html']]
    },
    index: {
      title: 'Index', text: 'Jump to any part of this page.',
      items: [['Who we are', '#intro'], ['Great engineers', '#untangle'], ['Very Damn Invested', '#vdi'], ['Our team', '#team'],
              ['Why Spadafy?', '#name'], ['Our point of view', '#pov'], ['Health check', '#health-check'], ['Let’s talk', '#contact']]
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
    heroText.style.transform = `translateY(${(-p * 90 * U).toFixed(1)}px)`;
    heroCover.style.opacity = (p * .6).toFixed(3);
    body.style.setProperty('--bg', smooth((p - .75) / .2).toFixed(3));
    hero.style.visibility = top < -4 ? 'hidden' : 'visible';
  }

  /* =========================================================
     UNTANGLE — a cloud of jargon flies past the camera, the headline
     zooms through, and a small photo window opens to fill the stage
     ========================================================= */
  const easeIn = t => Math.pow(clamp(t), 3);
  let seed = 23;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const untangle = $('#untangle');
  const C = { sec: untangle };
  C.stage = $('.ut-stage', C.sec); C.cloud = $('.tgc-cloud', C.sec); C.l1 = $('.tgc-l1', C.sec);
  C.card = $('.tgc-card', C.sec); C.img = $('.tgc-card > img', C.sec); C.para = $('.tgc-p', C.sec);
  C.words = $$('.tgc-l2 span', C.sec).map(s => { const b = document.createElement('b'); b.textContent = s.textContent; s.textContent = ''; s.appendChild(b); return b; });
  /* the chip layout from Figma 2409:864: [label, left, top, opacity, dot size, dot colour] on a 1904 × 1064 stage.
     Nothing overlaps at rest, and the zoom below scales positions and sizes by the same factor, so nothing overlaps in flight either. */
  const O = 'var(--orange)', P = 'var(--pink)', G = 'var(--green)';
  const JARGON = [
    ['Bandwidth', 419.1, 84, .72, 10.8, O], ['Hypervisor', 1037, 100, .8, 10.8, O], ['Thin clients', 731, 105, 1, 12, P],
    ['Intune', 321.1, 180, .8, 10.8, G], ['Licensing', 572.1, 190, .8, 10.8, P], ['Load balancing', 1281, 60, .7, 9.6, G],
    ['Entra ID', 1147, 206, .65, 8.4, P], ['Conditional access', 1506, 161, .9, 10.8, O], ['Patching', 453.7, 276, .65, 9.6, O],
    ['Hybrid join', 138, 228, .6, 8.4, P], ['Badge tap', 157.5, 358, 1, 12, O, 'sm'], ['Logon time', 1392.1, 318, .78, 10.8, P],
    ['Print drivers', 1596, 347, 1, 12, G], ['VDI', 1618, 673, .75, 9.6, O], ['App layering', 1579.2, 506, .75, 9.6, P],
    ['Imprivata', 100.5, 572, 1, 12, G], ['File containers', 196, 915, .7, 8.4, P], ['Disaster recovery', 1015, 748, .8, 9.6, O],
    ['AVD', 1378, 625, .62, 8.4, P], ['Autoscaling', 123.1, 672, .9, 10.8, P], ['Session hosts', 517, 760, .85, 10.8, G],
    ['Golden images', 251.6, 800, .9, 10.8, O], ['Latency', 476, 848, .95, 12, P], ['SSO', 699, 903, 1, 12, G],
    ['IGEL UMS', 941, 850, .65, 8.4, P], ['FSLogix', 1248, 842, 1, 12, O], ['Citrix', 1438, 778, 1, 12, G],
    ['Omnissa Horizon', 1499, 875, .7, 8.4, P], ['GPO', 1162, 951, .9, 10.8, O]
  ];
  C.chips = JARGON.map(([t, x, y, op, ds, dc, cls]) => {
    const li = document.createElement('li'); li.textContent = t; if (cls) li.className = cls;
    li.style.setProperty('--x', (x / 1904 * 100).toFixed(3) + '%'); li.style.setProperty('--y', (y / 1064 * 100).toFixed(3) + '%');
    li.style.setProperty('--op', op); li.style.setProperty('--ds', ds); li.style.setProperty('--dc', dc);
    C.cloud.appendChild(li);
    return { el: li, op, dx: 0, dy: 0, mx: 0, my: 0, ms: 0, tx: 0, ty: 0, ts: 0 };
  });
  function layoutUntangle() {
    C.sw = C.stage.clientWidth; C.sh = C.stage.clientHeight;
    C.stage.style.setProperty('--sw', C.sw + 'px'); C.stage.style.setProperty('--sh', C.sh + 'px');
    /* each chip's offset from the stage centre, measured at rest */
    C.chips.forEach(c => { c.dx = c.el.offsetLeft + c.el.offsetWidth / 2 - C.sw / 2; c.dy = c.el.offsetTop + c.el.offsetHeight / 2 - C.sh / 2; });
  }
  /* the zoom and the magnet share one transform */
  C.f = 1; C.k = 0;
  function chipMove(c) {
    const f = C.f;
    c.el.style.transform = `translate3d(${(c.dx * (f - 1) + c.mx).toFixed(1)}px, ${(c.dy * (f - 1) + c.my).toFixed(1)}px, 0) scale(${(f * (1 + c.ms)).toFixed(4)})`;
  }
  /* MAGNET — on hover the chips within reach lean towards the cursor (closer = stronger), then ease back.
     Only while the cloud is at rest, and only with a real mouse */
  const MAG_R = 280, MAG_PULL = 18, MAG_GROW = .06;
  let magOn = false, magX = 0, magY = 0, magRaf = 0;
  function magTick() {
    const r = C.stage.getBoundingClientRect();
    const live = magOn && C.k < .02;
    let moving = false;
    C.chips.forEach(c => {
      c.tx = c.ty = c.ts = 0;
      if (live) {
        const cx = C.sw / 2 + c.dx, cy = C.sh / 2 + c.dy;
        const vx = magX - r.left - cx, vy = magY - r.top - cy, dist = Math.hypot(vx, vy), R = MAG_R * U;
        if (dist < R) {
          const s = Math.pow(1 - dist / R, 2);
          const pull = Math.min(dist, MAG_PULL * U) * s;
          c.tx = dist ? vx / dist * pull : 0; c.ty = dist ? vy / dist * pull : 0; c.ts = MAG_GROW * s;
        }
      }
      c.mx += (c.tx - c.mx) * .16; c.my += (c.ty - c.my) * .16; c.ms += (c.ts - c.ms) * .16;
      if (Math.abs(c.tx - c.mx) > .05 || Math.abs(c.ty - c.my) > .05 || Math.abs(c.ts - c.ms) > .0005) moving = true;
      else { c.mx = c.tx; c.my = c.ty; c.ms = c.ts; }
      chipMove(c);
    });
    magRaf = moving || live ? requestAnimationFrame(magTick) : 0;
  }
  const wakeMag = () => { if (!magRaf) magRaf = requestAnimationFrame(magTick); };
  if (!reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    C.stage.addEventListener('pointermove', e => { magOn = true; magX = e.clientX; magY = e.clientY; wakeMag(); });
    C.stage.addEventListener('pointerleave', () => { magOn = false; wakeMag(); });
  }
  function renderUntangle() {
    if (!inView(C.sec)) return;
    const p = reduce ? 1 : sceneProgress(C.sec);
    const k = clamp((p - .04) / .4);                               // the camera pushes through the cloud
    const f = 1 + easeIn(k) * 6;                                   // one zoom factor for every chip: the layout scales, nothing crosses
    C.f = f; C.k = k;
    C.chips.forEach(c => {
      chipMove(c);
      c.el.style.opacity = (c.op * (1 - smooth((f - 1.8) / 2.2))).toFixed(3);
      const bl = Math.max(0, f - 1.5) * 2.4 * U;                    // they soften as they rush past
      c.el.style.filter = bl > .3 ? `blur(${bl.toFixed(2)}px)` : '';
    });
    /* the headline zooms a little slower, so it stays inside the opening between the chips */
    const fl = 1 + (f - 1) * .55;
    C.l1.style.transform = `translate(-50%, -50%) scale(${fl.toFixed(3)})`;
    C.l1.style.opacity = (1 - smooth((k - .55) / .4)).toFixed(3);
    const lb = Math.max(0, fl - 1.3) * 6 * U;
    C.l1.style.filter = lb > .3 ? `blur(${lb.toFixed(2)}px)` : '';
    /* the card: a small portrait window that opens up to fill the stage */
    const g = easeIO((p - .4) / .32);
    const w = lerp(C.sw * .16, C.sw, g), h = lerp(C.sh * .4, C.sh, g);
    C.card.style.width = w.toFixed(1) + 'px'; C.card.style.height = h.toFixed(1) + 'px';
    C.card.style.borderRadius = (lerp(30, 60, g) * U).toFixed(1) + 'px';
    C.card.style.opacity = smooth((p - .36) / .06).toFixed(3);
    C.img.style.transform = `translate(${lerp(-54, -50, g).toFixed(2)}%, ${lerp(-44, -50, g).toFixed(2)}%) scale(${lerp(1.25, 1, g).toFixed(3)})`;   // keep the faces in the small window
    C.words.forEach((b, i) => {
      const q = easeOut((p - .72 - i * .016) / .12);
      b.style.transform = `translateY(${((1 - q) * 110).toFixed(1)}%)`;
    });
    const pq = easeOut((p - .82) / .12);                             // the paragraph follows the headline
    C.para.style.opacity = pq.toFixed(3);
    C.para.style.transform = `translateY(${((1 - pq) * 32 * U).toFixed(1)}px)`;
  }


  /* =========================================================
     VDI — the three letters open up into Very Damn Invested,
     "We’re" rises in above, then the copy and the sticker land
     ========================================================= */
  const vdi = $('#vdi'), vdiWord = $('.vdi-word'), vdiWere = $('.vdi-were > span'), vdiCopy = $('.vdi-copy'), vdiGoat = $('.vdi-goat');
  const vws = $$('.vw', vdiWord).map(vw => ({ el: vw, rest: $('.vw-rest', vw), inner: $('.vw-rest > span', vw), nat: 0 }));
  const backOut = t => { t = clamp(t); const s = 1.7; return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); };
  let vdiGap = 0;
  function layoutVdi() {
    vws.forEach(v => { v.rest.style.width = 'auto'; v.nat = v.inner.offsetWidth; });
    vdiGap = 200 * U * .22;                                        // a word space at 200px
  }
  function renderVdi() {
    if (!inView(vdi)) return;
    const p = reduce ? 1 : sceneProgress(vdi);
    const k = easeIO((p - .08) / .42);                            // V D I → Very Damn Invested
    vws.forEach((v, i) => {
      v.rest.style.width = (v.nat * k).toFixed(1) + 'px';
      v.inner.style.opacity = clamp(k * 1.6 - .2).toFixed(3);
      v.el.style.marginRight = (i < vws.length - 1 ? vdiGap * k : 0).toFixed(1) + 'px';
    });
    const q = easeOut((p - .48) / .16);                            // We’re
    vdiWere.style.transform = `translateY(${((1 - q) * 115).toFixed(1)}%)`;
    const c = easeOut((p - .6) / .14);                             // the copy
    vdiCopy.style.opacity = c.toFixed(3);
    vdiCopy.style.transform = `translateY(${((1 - c) * 24 * U).toFixed(1)}px)`;
    const g = clamp((p - .64) / .16);                              // the sticker slaps on with a little overshoot
    const gs = backOut(g);
    vdiGoat.style.opacity = clamp(g * 3).toFixed(3);
    vdiGoat.style.transform = `translateY(${((1 - gs) * 80 * U).toFixed(1)}px) rotate(${((1 - gs) * -24).toFixed(2)}deg) scale(${(.6 + gs * .4).toFixed(3)})`;
  }

  /* =========================================================
     HORIZONTAL SCENES — values, definitions, health-check steps
     ========================================================= */
  const hsScenes = $$('[data-hs]').map(sec => ({ sec, rail: $('.hs-rail', sec), view: $('.hs-view', sec), travel: 0 }));
  function layoutHs(stage) {
    hsScenes.forEach(s => {
      s.rail.style.transform = '';
      s.travel = Math.max(0, s.rail.scrollWidth - s.view.clientWidth);
      s.sec.style.height = (stage + s.travel * 1.1 + H * .5) + 'px';
    });
  }
  function renderHs() {
    hsScenes.forEach(s => {
      if (!inView(s.sec)) return;
      const p = reduce ? 0 : clamp((sceneProgress(s.sec) - .12) / .76);
      s.rail.style.transform = `translate3d(${(-s.travel * p).toFixed(1)}px,0,0)`;
    });
  }

  /* =========================================================
     WHY SPADAFY — the story lifts away, then each word melts into the
     next (blur + alpha threshold): SPADAFY → Spadafied → SPADAFY (noun) → Better work → Better S tech
     ========================================================= */
  const morph = $('#name'), moA = $('#mo-a'), moB = $('#mo-b'), moK = $('#mo-k'), moSub = $('.mo-sub'), moDots = $$('.mo-dots li');
  const moIn = $$('.mo-in');
  const MO = [
    ['SPADAFY', ''], ['Spadafied<span class="mo-ast">*</span>', '(action)'],
    ['SPADAFY<span class="mo-ast">*</span>', '(noun)'], ['Better work', ''],
    ['<span>Better</span><i class="mo-s"></i><span>tech</span>', '']
  ];
  let moI = -1;
  function moBlur(f) { return Math.min(8 / Math.max(f, .001) - 8, 100) * U; }
  function renderMorph() {
    if (!inView(morph)) return;
    const p = reduce ? 1 : sceneProgress(morph);
    /* 1 — the story along the bottom lifts, blurs and fades */
    const out = smooth((p - .04) / .12);
    moIn.forEach((el, n) => {
      const o = smooth((p - .03 - n * .025) / .12);
      el.style.opacity = (1 - o).toFixed(3);
      el.style.transform = `translateY(${(-o * 60 * U).toFixed(1)}px)`;
      el.style.filter = o > .01 && o < .99 ? `blur(${(o * 14 * U).toFixed(2)}px)` : '';
      el.style.visibility = o >= 1 ? 'hidden' : '';
    });
    /* 2 — then each word melts into the next; the last one holds */
    const N = MO.length;
    const t = clamp((p - .18) / .62) * (N - 1);
    const i = Math.min(N - 2, Math.floor(t));
    let f = t - i;
    f = reduce ? (f > .5 ? 1 : 0) : easeIO(clamp((f - .2) / .6));   // hold each word, then melt
    if (i !== moI) { moI = i; moA.innerHTML = MO[i][0]; moB.innerHTML = MO[i + 1][0]; }
    moA.style.filter = `blur(${moBlur(1 - f).toFixed(2)}px)`;
    moA.style.opacity = Math.pow(1 - f, .4).toFixed(3);
    moB.style.filter = `blur(${moBlur(f).toFixed(2)}px)`;
    moB.style.opacity = Math.pow(f, .4).toFixed(3);
    moA.style.transform = `scale(${(1 + f * .08).toFixed(3)})`;
    moB.style.transform = `scale(${(.92 + f * .08).toFixed(3)})`;
    const cur = f < .5 ? i : i + 1;
    if (moK.dataset.i !== String(cur)) { moK.dataset.i = cur; moK.textContent = MO[cur][1]; }
    moK.parentElement.style.opacity = (Math.abs(f - .5) * 2).toFixed(3);
    /* the closing line comes up under "Better S tech" */
    const s = i === N - 2 ? smooth((f - .6) / .35) : 0;
    moSub.style.opacity = s.toFixed(3);
    moSub.style.transform = `translateX(-50%) translateY(${((1 - s) * 24 * U).toFixed(1)}px)`;
    moDots.forEach((d, n) => d.classList.toggle('on', n === cur));
    moDots[0].parentElement.style.opacity = out.toFixed(3);
  }

  /* =========================================================
     TEAM — the "Read more" pill follows the cursor over a photo;
     a click opens the bio drawer from the right
     ========================================================= */
  const tmCards = $$('#team .tm-card'), drawer = $('#tm-drawer');
  tmCards.forEach(card => {
    card.addEventListener('pointerenter', e => { card.classList.remove('tracking'); moveMore(card, e); requestAnimationFrame(() => card.classList.add('tracking')); });
    card.addEventListener('pointermove', e => moveMore(card, e));
    card.addEventListener('pointerleave', () => card.classList.remove('tracking'));
    card.addEventListener('click', () => openBio(card));
  });
  function moveMore(card, e) {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
    card.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
  }
  let tmFrom = null;
  function openBio(card) {
    const m = card.closest('.tm-m'), img = $('.tm-photo img', m), ph = $('.tm-ph', m);
    const box = $('.tmd-photo', drawer);
    box.innerHTML = img ? `<img src="${img.getAttribute('src')}" alt="Portrait of ${$('.tm-name', m).textContent}">` : `<span class="tm-ph" aria-hidden="true">${ph.textContent}</span>`;
    $('#tmd-name').textContent = $('.tm-name', m).textContent;
    $('#tmd-title').textContent = $('.tm-title', m).textContent;
    $('#tmd-bio').textContent = $('.tm-bio', m).textContent;
    tmFrom = card;
    drawer.classList.remove('out');
    drawer.showModal();
    /* focus the panel without letting the browser scroll it into view: it is still off-screen,
       about to slide in, and that scroll made the drawer jump */
    const panel = $('.tmd-panel', drawer);
    panel.focus({ preventScroll: true });
    drawer.scrollLeft = 0; drawer.scrollTop = 0; panel.scrollTop = 0;
    requestAnimationFrame(() => requestAnimationFrame(() => drawer.classList.add('on')));
  }
  function closeBio() {
    if (!drawer.open || drawer.classList.contains('out')) return;
    drawer.classList.add('out'); drawer.classList.remove('on');
    setTimeout(() => { drawer.close(); drawer.classList.remove('out'); }, reduce ? 0 : 460);
  }
  drawer.addEventListener('close', () => { if (tmFrom) tmFrom.focus({ preventScroll: true }); });
  /* hold the page still under the drawer without hiding the scrollbar: lenis.stop() clips the page's
     overflow, the scrollbar disappears, the page gets wider and every section re-lays out (the jump).
     Lenis ignores events from inside [data-lenis-prevent]; here we stop the native scroll from reaching the page. */
  const tmdPanel = $('.tmd-panel', drawer);
  function holdPage(e) {
    if (!tmdPanel.contains(e.target)) { e.preventDefault(); return; }
    const dy = e.deltaY || 0, top = tmdPanel.scrollTop, max = tmdPanel.scrollHeight - tmdPanel.clientHeight;
    if (max <= 0 || (dy < 0 && top <= 0) || (dy > 0 && top >= max - 1)) e.preventDefault();
  }
  drawer.addEventListener('wheel', holdPage, { passive: false });
  drawer.addEventListener('touchmove', e => { if (!tmdPanel.contains(e.target) || tmdPanel.scrollHeight <= tmdPanel.clientHeight) e.preventDefault(); }, { passive: false });
  drawer.addEventListener('cancel', e => { e.preventDefault(); closeBio(); });            // Esc slides it out too
  $('.tmd-close', drawer).addEventListener('click', closeBio);
  drawer.addEventListener('click', e => { if (e.target === drawer) closeBio(); });      // a click on the dimmed page closes it

  /* contact form: prototype only */
  const ctForm = $('.ct-form');
  if (ctForm) ctForm.addEventListener('submit', e => {
    e.preventDefault();
    const btn = $('.send span', ctForm);
    btn.textContent = 'Thanks! We’ll be in touch';
    setTimeout(() => { btn.textContent = 'Send message'; }, 2600);
  });

  /* =========================================================
     POINT OF VIEW — the photo settles as it comes in; the statement
     fills from grey to charcoal word by word
     ========================================================= */
  const pov = $('#pov'), povImg = $('.pov-img > img'), povLead = $('.pov-lead');
  const povWords = povLead.textContent.trim().split(/\s+/).map((w, i, all) => {
    const s = document.createElement('span'); s.className = 'w'; s.textContent = w;
    return s;
  });
  povLead.textContent = '';
  povWords.forEach((s, i) => { povLead.appendChild(s); if (i < povWords.length - 1) povLead.appendChild(document.createTextNode(' ')); });
  function renderRing() {
    const r = pov.getBoundingClientRect();
    if (r.bottom < 0 || r.top > H) return;
    const p = reduce ? 1 : clamp((H - r.top) / (H * 1.05));          // 0 as it enters → 1 once it fills the screen
    povImg.style.transform = `scale(${(1 + (1 - easeOut(p)) * .12).toFixed(4)})`;
    const n = povWords.length, pos = clamp((p - .3) / .62) * (n + 2);  // the fill runs through the words
    povWords.forEach((s, i) => s.style.setProperty('--k', clamp((pos - i) / 2).toFixed(3)));
  }

  /* =========================================================
     OUTRO — the card grows to fill the screen, then the Health Check opens
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
    nextTitle.style.fontSize = (p < .5 ? 56 * U : 140 * U) + 'px';
    nextTitle.style.lineHeight = p < .5 ? '.9' : '.84';
    nextShade.style.opacity = String(clamp((p - .6) / .3));
    if (p >= .995 && !leaving) {
      clearTimeout(leaveTimer);
      leaveTimer = setTimeout(() => {
        const q = next.getBoundingClientRect();
        if (clamp(-(q.top + pad) / range) >= .995) { leaving = true; window.location.href = nextCard.getAttribute('href'); }
      }, 450);
    }
  }
  window.addEventListener('pageshow', () => { leaving = false; });

  /* =========================================================
     INTRO — like the Services statement: once it nears the middle of the screen, a wave runs
     through the letters, gray → orange → charcoal, and the stats count up
     ========================================================= */
  const introSt = $('.ab-intro-st');
  const introLetters = [];
  introSt.textContent.trim().split(/\s+/).forEach((word, wi, all) => {
    const w = document.createElement('span');      /* letters sit in a word span, so lines only break between words */
    w.className = 'w';
    for (const ch of word) { const l = document.createElement('span'); l.className = 'l'; l.textContent = ch; w.appendChild(l); introLetters.push(l); }
    if (wi === 0) introSt.textContent = '';
    introSt.appendChild(w);
    if (wi < all.length - 1) introSt.appendChild(document.createTextNode(' '));
  });
  const I_ORANGE = 8, I_HOLD = 10, I_BLACK = 14, I_MS = 2000;
  const introKeys = introLetters.map(() => -1);
  function setIntroWave(p) {
    const pos = p * (introLetters.length + I_ORANGE + I_HOLD + I_BLACK);
    for (let i = 0; i < introLetters.length; i++) {
      const t = pos - i;
      const o = smooth(t / I_ORANGE), k = smooth((t - I_ORANGE - I_HOLD) / I_BLACK);
      const key = Math.round(o * 100) * 1000 + Math.round(k * 100);
      if (key === introKeys[i]) continue;
      introKeys[i] = key;
      introLetters[i].style.setProperty('--o', (o * 100).toFixed(0) + '%');
      introLetters[i].style.setProperty('--k', (k * 100).toFixed(0) + '%');
    }
  }
  const counts = $$('.ab-stat [data-count]').map(el => ({ el: $('.cnt-v', el), to: +el.dataset.count }));
  const fmt = n => Math.round(n).toLocaleString('en-US');
  let introT0 = -1;
  function introTick(now) {
    const t = now - introT0;
    const p = clamp(t / I_MS);
    setIntroWave(p);
    const c = easeOut(clamp((t - 500) / 1600));
    counts.forEach(({ el, to }) => { el.textContent = fmt(to * c); });
    if (p < 1 || c < 1) requestAnimationFrame(introTick);
    else introSt.classList.remove('anim');
  }
  if (!reduce) {
    introSt.classList.add('anim'); setIntroWave(0);
    counts.forEach(({ el }) => { el.textContent = '0'; });
  }
  function renderIntro() {
    if (reduce || introT0 >= 0) return;
    const r = introSt.getBoundingClientRect();
    if (r.top + r.height / 2 > H * .62) return;     /* not near the middle yet */
    introT0 = performance.now();
    requestAnimationFrame(introTick);
  }
  window.addEventListener('scroll', renderIntro, { passive: true });
  renderIntro();

  /* =========================================================
     SMALL REVEALS — fade + rise, staggered, once
     ========================================================= */
  const REVEAL = [
    ['.ab-intro-eye', 0, 0], ['.ab-intro-p', 0, 0], ['.ab-stat', 90, 120],
    ['.ab-name-story .v-head > *', 120, 0], ['.ab-name-copy > *', 140, 100], ['.hs-label', 0, 0], ['.ab-name-motto', 0, 0],
    ['.pov-h', 0, 0], ['.pov-eye', 0, 0], ['.pov-i', 120, 0], ['.tm-h', 0, 0], ['.tm-m', 50, 0], ['.tm-v', 120, 0],
    ['.hc-intro .v-head > *', 120, 0], ['.hc-foot > *', 120, 100],
    ['.sz-title', 0, 0], ['.sz-lead', 0, 120], ['.sz-chips li', 50, 200], ['.sz-card', 120, 0], ['.sz-cta', 0, 200], ['.stk', 200, 300],
    ['.v-contact .v-head > *', 120, 0], ['.ct-points li', 110, 0], ['.fields > *', 60, 0], ['.legal', 0, 400]
  ];
  const heroReveal = ['.ab-eyebrow', '.hero h1'].map((sel, i) => {
    const el = $(sel);
    el.classList.add('rv'); el.style.setProperty('--d', (i * 180) + 'ms');
    return el;
  });
  const io = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .15, rootMargin: '0px 0px -6% 0px' });
  REVEAL.forEach(([sel, step, base]) => $$(sel).forEach((el, i) => { el.classList.add('rv'); el.style.setProperty('--d', Math.min(base + i * step, 700) + 'ms'); io.observe(el); }));
  requestAnimationFrame(() => setTimeout(() => heroReveal.forEach(el => el.classList.add('in')), 120));

  /* =========================================================
     LOOP
     ========================================================= */
  function layout() {
    setUnits();
    const stage = H - 16 * U;
    untangle.style.height = (stage + H * 3.2) + 'px';
    layoutUntangle();
    vdi.style.height = (stage + H * 2.4) + 'px';
    layoutHs(stage);
    morph.style.height = (stage + H * 4.8) + 'px';
    next.style.height = (200 * U + H * 2.6) + 'px';
    layoutVdi();
    render();
  }
  function render() { setNav(); renderHero(); renderUntangle(); renderVdi(); renderHs(); renderMorph(); renderRing(); renderNext(); }
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
