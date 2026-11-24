/* Spadafy — Health Check page: nav, smooth scroll, hero, cursor mask, 3-step forms, CTA that opens into the form */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const IMG = 'assets/hc/';

  let H = innerHeight, U = 1, W = root.clientWidth;
  function setUnits() { W = root.clientWidth; U = W / 1920; H = innerHeight; root.style.setProperty('--u', U + 'px'); root.style.setProperty('--vh', H + 'px'); }
  setUnits();

  /* smooth scroll + anchors */
  const lenis = (!reduce && window.Lenis) ? new Lenis({ lerp: 0.09, smoothWheel: true }) : null;
  if (lenis) { const tick = t => { lenis.raf(t); requestAnimationFrame(tick); }; requestAnimationFrame(tick); }
  const scrollToY = y => lenis ? lenis.scrollTo(y, { duration: 1.4 }) : window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  const goTo = el => scrollToY(el === document.body ? 0 : el.getBoundingClientRect().top + window.scrollY - 8 * U);
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const id = a.getAttribute('href'); if (id === '#') { e.preventDefault(); return; }
    const t = id === '#top' ? document.body : $(id); if (!t) return;
    e.preventDefault(); goTo(t);
    if (a.hasAttribute('data-open-form')) setTimeout(() => cta.open(), reduce ? 0 : 900);
  });

  /* NAV */
  const nav = $('#nav');
  const PANELS = {
    services: { title: 'Services', text: 'From the first assessment to everyday support.',
      items: [['VDI Managed Services', 'vdi-managed-services.html'], ['Free VDI Health Check', '#top'], ['VDI Infrastructure', 'vdi-infrastructure.html'], ['Healthcare SSO and Authentication', 'healthcare-sso.html'], ['Hybrid Cloud & Infrastructure Modernization', 'hybrid-cloud.html'], ['Vendor Partners', 'vendor-partners.html']] },
    index: { title: 'Index', text: 'Jump to any part of this page.', items: $$('[data-idx]').map(el => [el.dataset.idx, '#' + el.id]) }
  };
  const npTitle = $('[data-np-title]'), npText = $('[data-np-text]'), npGrid = $('[data-np-grid]');
  const panelBtns = $$('[data-panel]', nav);
  let openKey = null;
  function fillPanel(k) {
    const p = PANELS[k]; npTitle.textContent = p.title; npText.textContent = p.text; npGrid.innerHTML = '';
    p.items.slice(0, 8).forEach(([l, h]) => { const li = document.createElement('li'), a = document.createElement('a'); a.textContent = l; a.href = h; li.appendChild(a); npGrid.appendChild(li); });
  }
  function setNav() {
    const s = openKey ? 'open' : (scrollY > 24 ? 'collapsed' : 'default');
    if (nav.dataset.state !== s) nav.dataset.state = s;
    $('#nav-panel').setAttribute('aria-hidden', openKey ? 'false' : 'true');
    panelBtns.forEach(b => b.setAttribute('aria-expanded', String(b.dataset.panel === openKey)));
  }
  panelBtns.forEach(b => b.addEventListener('click', e => { e.stopPropagation(); const k = b.dataset.panel; if (openKey === k) openKey = null; else { openKey = k; fillPanel(k); } setNav(); }));
  document.addEventListener('click', e => { if (openKey && (!e.target.closest('.nav-box') || e.target.closest('.np-grid a, .np-view'))) { openKey = null; setNav(); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && openKey) { openKey = null; setNav(); } });

  /* HERO: the body slides over it */
  const hero = $('.hero'), heroText = $('#hp-hero-text'), body = $('#body');
  function renderHero() {
    const top = body.getBoundingClientRect().top, p = clamp(1 - top / H);
    heroText.style.transform = `translateY(${(-p * 90 * U).toFixed(1)}px)`;
    body.style.setProperty('--bg', smooth(p).toFixed(3));
    hero.style.visibility = top < -4 ? 'hidden' : 'visible';
  }

  /* reveals */
  const io = new IntersectionObserver(en => en.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15 });
  $$('.rv').forEach(el => io.observe(el));

  /* break: the statement plays by itself, letter by letter, once it nears the middle of the screen (as the Services intro) */
  const brk = $('#break'), brkBlock = $('.hp-break', brk), brkText = $('h2', brk);
  const letters = [];
  if (!reduce) {
    $$('[data-w]', brk).forEach(seg => {
      const parts = seg.textContent.split(/(\s+)/);
      seg.textContent = '';
      parts.forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { seg.appendChild(document.createTextNode(' ')); return; }
        const w = document.createElement('span'); w.className = 'w';
        for (const ch of part) { const l = document.createElement('span'); l.className = 'l'; l.textContent = ch; w.appendChild(l); letters.push(l); }
        seg.appendChild(w);
      });
    });
    brkBlock.classList.add('anim');
  }
  const LIT = 6, HOLD = 4, FINAL = 10, BRK_MS = 1700;
  const brkState = letters.map(() => -1);
  let brkT0 = -1;
  function setBreak(p) {
    const pos = p * (letters.length + LIT + HOLD + FINAL);
    for (let i = 0; i < letters.length; i++) {
      const t = pos - i, lit = clamp(t / LIT), o = smooth((t - LIT - HOLD) / FINAL);
      const key = Math.round(lit * 100) * 1000 + Math.round(o * 100);
      if (key === brkState[i]) continue;
      brkState[i] = key;
      letters[i].style.opacity = (.15 + .85 * lit).toFixed(2);
      letters[i].style.setProperty('--o', (o * 100).toFixed(0) + '%');
    }
  }
  function brkTick(now) { const p = clamp((now - brkT0) / BRK_MS); setBreak(p); if (p < 1) requestAnimationFrame(brkTick); }
  function renderBreak() {
    if (reduce || brkT0 >= 0) return;
    const r = brkText.getBoundingClientRect();
    if (r.top + r.height / 2 > H * .62) return;
    brkT0 = performance.now(); requestAnimationFrame(brkTick);
  }

  /* cursor mask: a soft sharp circle follows the pointer, eased (radial-gradient mask: works in Firefox too) */
  const tech = $('#picture'), mask = $('#hp-mask');
  let mx = 1487, my = 562, tx = 1487, ty = 562, mRaf = 0;      // circle centre, design px (from the Figma mask position)
  function drawMask() {
    const g = `radial-gradient(circle at ${(mx * U).toFixed(1)}px ${(my * U).toFixed(1)}px, #000 0, #000 ${170 * U}px, rgba(0,0,0,.5) ${296 * U}px, rgba(0,0,0,0) ${430 * U}px)`;
    mask.style.webkitMaskImage = g; mask.style.maskImage = g;
  }
  function maskStep() {
    mx += (tx - mx) * (reduce ? 1 : .09); my += (ty - my) * (reduce ? 1 : .09);
    drawMask();
    mRaf = (Math.abs(tx - mx) + Math.abs(ty - my) > .3) ? requestAnimationFrame(maskStep) : 0;
  }
  tech.addEventListener('pointermove', e => {
    const r = tech.getBoundingClientRect();
    tx = (e.clientX - r.left) / U; ty = (e.clientY - r.top) / U;
    if (!mRaf) mRaf = requestAnimationFrame(maskStep);
  });
  drawMask();

  /* ---------- orbit sphere: photo cards on a flattened sphere around the centred copy ----------
     Fibonacci distribution, billboards with depth (scale 0.42 -> 1, opacity 0.3 -> 1), perspective camera (fov 40),
     idle turn 50 s, bob 6px / 4 s, staggered entrance, drag to spin and tilt with momentum, hover freezes and lifts a card.
     Cards of different sizes; cards that pass behind the copy fade and blur, cards in front of it turn glassy so it stays readable. */
  const orbit = $('#hp-orbit'), people = $('#people'), copy = $('.hp-gal-text', people);
  const DEFS = [                                     // [photo, object-position, zoom, width] (design px); every card is 16:9
    ['o1', '48% 30%', 1.15, 230], ['o2', '40% 35%', 1, 270], ['o3', '52% 28%', 1.2, 210], ['o4', '50% 38%', 1.05, 250],
    ['o6', '50% 50%', 1, 290], ['o7', '60% 50%', 1, 220], ['o8', '50% 45%', 1, 260], ['o9', '50% 55%', 1.15, 200],
    ['o1', '75% 85%', 1.9, 240], ['o2', '80% 86%', 2.4, 200], ['o3', '10% 45%', 1.9, 280], ['o4', '96% 45%', 1.9, 210],
    ['o6', '88% 25%', 1.9, 250], ['o7', '75% 35%', 1.8, 270], ['o8', '48% 48%', 1.9, 220], ['o9', '50% 14%', 2.2, 260]
  ];
  const N = DEFS.length, GOLD = Math.PI * (3 - Math.sqrt(5));
  const cards = DEFS.map((df, i) => {
    const [ph, pos, zoom, w] = df, hgt = Math.round(w * 9 / 16);
    const el = document.createElement('div'); el.className = 'hp-card3';
    el.style.width = `calc(${w} * var(--u))`; el.style.height = `calc(${hgt} * var(--u))`;
    const img = document.createElement('img'); img.src = `assets/hc/${ph}.jpg`; img.alt = ''; img.draggable = false;
    img.style.objectPosition = pos; img.style.transformOrigin = pos; img.style.transform = `scale(${zoom})`; el.appendChild(img);
    orbit.appendChild(el);
    const y = 1 - 2 * (i + .5) / N, rr = Math.sqrt(1 - y * y);
    return { el, w, h: hgt, d: [rr * Math.cos(i * GOLD), y, rr * Math.sin(i * GOLD)], phase: Math.random() * 6.28, hover: 0, hot: false, hold: null, pos: [0, 0, 0], i };
  });
  let yaw = 0, pitch = 0, yawV = 0, drag = false, lastX = 0, lastY = 0, lastT = 0, orbitOn = false, tPrev = 0, tStart = 0;
  let RX = 0, RY = 0, RZ = 0, CAM = 1, TR = null;
  function layoutOrbit() {
    const w = people.clientWidth, h = people.clientHeight;
    CAM = h / 2 / Math.tan(20 * Math.PI / 180);
    RX = Math.min(w * .36, h * .8); RY = RX * .6; RZ = (RX + RY) / 2;
    const fits = () => { for (let s = 0; s < 48; s++) { const a = s / 48 * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
      for (const k of cards) { const x = k.d[0] * c - k.d[2] * sn, z = k.d[0] * sn + k.d[2] * c, f = CAM / (CAM - z * RZ), sc = (.42 + .58 * (z + 1) / 2) * f;
        if (Math.abs(k.d[1] * RY * f) + k.h * U * sc / 2 > h / 2 - 16 || Math.abs(x * RX * f) + k.w * U * sc / 2 > w / 2 - 16) return false; } } return true; };
    for (let g = 0; g < 40 && !fits(); g++) { RX *= .95; RY *= .95; RZ *= .95; }
    const a = copy.getBoundingClientRect(), b = people.getBoundingClientRect(), pad = 36 * U;
    TR = { l: a.left - b.left - pad, r: a.right - b.left + pad, t: a.top - b.top - pad, b: a.bottom - b.top + pad };
  }
  cards.forEach(c => {
    c.el.addEventListener('pointerenter', () => { if (!drag) { c.hot = true; c.hold = c.pos.slice(); } });
    c.el.addEventListener('pointerleave', () => { c.hot = false; });
  });
  orbit.addEventListener('pointerdown', e => { drag = true; lastX = e.clientX; lastY = e.clientY; lastT = performance.now(); yawV = 0; orbit.classList.add('is-drag'); cards.forEach(c => { c.hot = false; }); });
  addEventListener('pointermove', e => {
    if (!drag) return;
    const now = performance.now(), dx = e.clientX - lastX, dy = e.clientY - lastY, dt = Math.max(1, now - lastT) / 1000;
    yaw += dx * .006; pitch = clamp(pitch + dy * .006, -.436, .436);
    yawV = clamp(dx * .006 / dt, -6, 6); lastX = e.clientX; lastY = e.clientY; lastT = now;
  });
  addEventListener('pointerup', () => { drag = false; orbit.classList.remove('is-drag'); });
  const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
  function orbitFrame(t) {
    if (!orbitOn) return;
    const now = t / 1000, dt = Math.min(.05, tPrev ? now - tPrev : .016); tPrev = now;
    if (!tStart) tStart = now;
    if (!drag) { yaw += (reduce ? 0 : Math.PI * 2 / 50) * dt + yawV * dt; yawV *= Math.exp(-dt / .7); pitch += (0 - pitch) * (1 - Math.exp(-dt / 1.1)); }
    const cx = people.clientWidth / 2, cy = people.clientHeight / 2, cp = Math.cos(pitch), sp = Math.sin(pitch), cyw = Math.cos(yaw), syw = Math.sin(yaw);
    cards.forEach(c => {
      c.hover += ((c.hot ? 1 : 0) - c.hover) * Math.min(1, dt / (c.hot ? .4 : .6) * 2.2);
      const hh = c.hover * c.hover * (3 - 2 * c.hover);
      // tilt about X, then yaw about Y
      let x = c.d[0] * RX, y = c.d[1] * RY, z = c.d[2] * RZ;
      const y1 = y * cp - z * sp, z1 = y * sp + z * cp;
      const x2 = x * cyw + z1 * syw, z2 = -x * syw + z1 * cyw;
      c.pos = [x2, y1, z2];
      let px = x2, py = y1, pz = z2;
      if (c.hold && hh > 0) { px += (c.hold[0] - px) * hh; py += (c.hold[1] - py) * hh; pz += (c.hold[2] - pz) * hh; }
      if (!c.hot && hh < .001) c.hold = null;
      const zn = clamp(pz / RZ, -1, 1);
      const bob = reduce ? 0 : Math.sin(now * Math.PI * 2 / 4 + c.phase) * 6 * U;
      const zc = pz + 40 * U * hh, f = CAM / (CAM - zc);
      const depthS = .42 + .58 * (zn + 1) / 2, depthO = .3 + .7 * (zn + 1) / 2;
      const en = reduce ? 1 : easeOut((now - tStart - c.i * .12) / .6);
      const sc = depthS * f * (1 + .15 * hh) * (.7 + .3 * en);
      const sx = cx + px * f, sy = cy + (py + bob) * f;
      // overlap with the copy: back cards fade and blur behind it, front cards turn glassy
      let ov = 0;
      if (TR) {
        const hw = c.w * U * sc / 2, hh2 = c.h * U * sc / 2;
        const ix = Math.max(0, Math.min(sx + hw, TR.r) - Math.max(sx - hw, TR.l)), iy = Math.max(0, Math.min(sy + hh2, TR.b) - Math.max(sy - hh2, TR.t));
        ov = clamp(ix * iy / (4 * hw * hh2));
      }
      const back = zn < .05;
      let op = depthO + (1 - depthO) * hh;
      op *= back ? 1 - .88 * ov * (1 - hh) : 1 - .62 * ov * (1 - hh);
      const blur = ((1 - (zn + 1) / 2) * 1.6 + (back ? 3.2 * ov : 0)) * (1 - hh) * U;
      c.el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -50%) scale(${sc.toFixed(3)})`;
      c.el.style.opacity = (clamp(op) * en).toFixed(3);
      c.el.style.filter = blur > .05 ? `blur(${blur.toFixed(2)}px)` : 'none';
      c.el.style.zIndex = hh > .05 ? 60 : (zn >= .05 ? 45 + Math.round(zn * 10) : 10 + Math.round((zn + 1) * 12));
      c.el.style.boxShadow = `0 ${((10 + 8 * hh) * U).toFixed(1)}px ${((26 + 14 * hh) * U).toFixed(1)}px rgba(0,0,0,${((.14 + .22 * hh) * (.4 + .6 * (zn + 1) / 2)).toFixed(2)})`;
    });
    requestAnimationFrame(orbitFrame);
  }
  new IntersectionObserver(en => {
    const on = en[0].isIntersecting;
    if (on && !orbitOn) { layoutOrbit(); orbitOn = true; tPrev = 0; requestAnimationFrame(orbitFrame); } else if (!on) { orbitOn = false; tStart = 0; }
  }, { threshold: .15 }).observe(people);
  addEventListener('resize', () => { if (orbitOn) layoutOrbit(); });
  new ResizeObserver(() => { if (orbitOn) layoutOrbit(); }).observe(copy);

  /* ---------- forms ---------- */
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const REQ = `<img src="${IMG}ic-req.svg" alt="">`;
  const LEGAL = '<p class="hp-legal">By pressing send you agree with our <a href="#">Privacy Policy</a> and <a href="#">Terms of Use</a></p>';
  const opts = (name, list) => list.map(v => `<label class="hp-opt"><input type="radio" name="${name}" value="${v}"><span>${v}</span></label>`).join('');
  function formHTML(kind) {
    const f = (n, ph, extra = '') => `<label class="field"><span class="sr-only">${ph} (required)</span><input name="${n}" placeholder="${ph}" required ${extra}>${REQ}</label>`;
    const fields = kind === 'hero'
      ? `<div class="hp-row">${f('name', 'Name', 'autocomplete="name"')}${f('company', 'Company', 'autocomplete="organization"')}</div>${f('email', 'Email', 'type="email" autocomplete="email"')}`
      : `${f('name', 'Name', 'autocomplete="name"')}${f('company', 'Company', 'autocomplete="organization"')}${f('email', 'Email', 'type="email" autocomplete="email"')}`;
    const intro = kind === 'hero'
      ? 'Let’s start your Health Check' : 'Let’s start your<br>Health Check';
    const introP = kind === 'hero'
      ? 'Tell us a little about your environment first. Once we review what you’ve shared, we will reach out to understand the next step.'
      : 'Tell us a little about your environment first.<br>Once we review what you’ve shared, we will reach out to understand the next step.';
    return `
    <form class="hp-pane" novalidate data-p="0">
      <div class="hp-top"><h3 class="hp-q">${intro}</h3><p class="hp-p20">${introP}</p></div>
      <div class="hp-bot"><div class="hp-form-body"><div class="hp-fields">${fields}</div>
        <button class="hp-btn hp-btn-orange hp-btn-wide" type="button" data-next>Continue <img src="${IMG}ic-arrow-ur-24.svg" alt=""></button></div>${LEGAL}</div>
    </form>
    <form class="hp-pane" novalidate data-p="1" aria-hidden="true">
      <div class="hp-top"><h3 class="hp-q">How are you running today?</h3></div>
      <div class="hp-bot"><div class="hp-form-body">
        <div class="hp-fields" style="gap:calc(32 * var(--u))">
          <fieldset class="hp-group"><legend class="hp-p16">Platform</legend><div class="hp-opts">${opts('platform', ['Citrix', 'Omnissa Horizon', 'Azure Virtual Desktop', 'Windows 365', 'Something else'])}</div></fieldset>
          <fieldset class="hp-group"><legend class="hp-p16">Roughly how many users?</legend><div class="hp-opts">${opts('users', ['Under 500', '500-2k', '2k-10k', '10k+'])}</div></fieldset>
        </div>
        <div class="hp-nav"><button class="hp-btn-back" type="button" data-back aria-label="Back"><img src="${IMG}ic-arrow-left.svg" alt=""></button><button class="hp-btn hp-btn-orange hp-btn-wide" type="button" data-next>Continue <img src="${IMG}ic-arrow-ur-24.svg" alt=""></button></div></div>${LEGAL}</div>
    </form>
    <form class="hp-pane" novalidate data-p="2" aria-hidden="true">
      <div class="hp-top"><h3 class="hp-q">Last one. Anything we should know?</h3></div>
      <div class="hp-bot"><div class="hp-form-body">
        <label class="hp-area"><span class="sr-only">Anything we should know</span><textarea name="note" placeholder="Slow logons, a migration coming up, a gut feeling…"></textarea></label>
        <div class="hp-nav"><button class="hp-btn-back" type="button" data-back aria-label="Back"><img src="${IMG}ic-arrow-left.svg" alt=""></button><button class="hp-btn hp-btn-orange hp-btn-wide hp-btn-ur" type="submit">Request free Health Check <img src="${IMG}ic-arrow-ur-24-w.svg" alt=""></button></div></div>${LEGAL}</div>
    </form>`;
  }
  const STEPS = ['About', 'Environment', 'Details'];
  function validate(pane) {
    let ok = true, first = null;
    $$('input[required]', pane).forEach(inp => {
      const bad = !inp.value.trim() || (inp.type === 'email' && !EMAIL.test(inp.value.trim()));
      inp.closest('.field').classList.toggle('is-err', bad);
      if (bad && !first) first = inp; if (bad) ok = false;
    });
    if (first) first.focus();
    return ok;
  }
  document.addEventListener('input', e => { const f = e.target.closest('.field'); if (f) f.classList.remove('is-err'); });

  function initForm(card, onDone) {
    $('.hp-panes', card).innerHTML = formHTML(card.dataset.hpForm);
    const steps = $('.hp-steps', card);
    steps.innerHTML = STEPS.map((s, i) => `<li><span class="hp-sn">${i + 1}<i><img src="${IMG}ic-step-done.svg" alt=""></i></span>${s}</li>`).join('');
    const panes = $$('.hp-pane', card), items = $$('li', steps);
    let cur = 0;
    const show = (n, focus) => {
      cur = n;
      panes.forEach((p, i) => { p.setAttribute('aria-hidden', String(i !== n)); p.classList.toggle('is-past', i < n); });
      items.forEach((li, i) => { li.classList.toggle('is-on', i === n); li.classList.toggle('is-ok', i < n); });
      if (focus) { const f = panes[n].querySelector('input:not([type=radio]), textarea'); if (f) setTimeout(() => f.focus({ preventScroll: true }), 380); }
    };
    $$('[data-next]', card).forEach(b => b.addEventListener('click', () => { if (validate(panes[cur])) show(cur + 1, true); }));
    $$('[data-back]', card).forEach(b => b.addEventListener('click', () => show(cur - 1)));
    panes.forEach(p => p.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'radio' && cur < 2) { e.preventDefault(); if (validate(panes[cur])) show(cur + 1, true); } }));
    panes[2].addEventListener('submit', e => {
      e.preventDefault();
      const name = $('input[name="name"]', panes[0]).value.trim().split(/\s+/)[0] || '';
      $$('[data-name]', card.closest('section')).forEach(n => { n.textContent = name ? ', ' + name : ''; });
      items.forEach(li => { li.classList.remove('is-on'); li.classList.add('is-ok'); });
      onDone();
    });
    panes[0].addEventListener('submit', e => e.preventDefault());
    panes[1].addEventListener('submit', e => e.preventDefault());
    show(0);
    return { reset: () => show(0) };
  }

  /* hero form: the card turns green with the sheep */
  const heroCard = $('#hp-hero-card');
  initForm(heroCard, () => heroCard.classList.add('is-done'));

  /* CTA: Talk to us → the block opens into the form → applied → success */
  const ctaEl = $('#cta'), ctaCard = $('.hp-cta-card'), ctaBtn = $('#hp-cta-btn');
  const cta = {
    set(s) { ctaEl.dataset.state = s; ctaCard.setAttribute('aria-hidden', String(s !== 'open')); if (s === 'open') ctaCard.removeAttribute('inert'); else ctaCard.setAttribute('inert', ''); },
    open() { if (ctaEl.dataset.state === 'closed') { this.set('open'); const f = $('input[name="name"]', ctaCard); setTimeout(() => f && f.focus({ preventScroll: true }), reduce ? 0 : 900); } },
    close() { this.set('closed'); }
  };
  cta.set('closed');
  initForm($('#hp-cta-card'), () => cta.set('done'));
  ctaBtn.addEventListener('click', () => { if (ctaEl.dataset.state === 'closed') cta.open(); else if (ctaEl.dataset.state === 'open') cta.close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && ctaEl.dataset.state === 'open' && !openKey) cta.close(); });

  function render() { setNav(); renderHero(); renderBreak(); }
  addEventListener('scroll', render, { passive: true });
  if (lenis) lenis.on('scroll', render);
  addEventListener('resize', () => { setUnits(); render(); });
  render();
})();
