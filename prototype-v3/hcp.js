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

  /* ---------- field flight: photo cards spawn large and wide around the frame and recede into depth ----------
     A still camera, a constant speed and a seamless loop: each card wraps its own life value, staggered evenly.
     Golden-angle ring placement keeps the middle clear for the copy; the cursor swings near cards more than far ones.
     Photos alternate between two formats, 13:9 and 9:13. */
  const people = $('#people'), field = $('#hp-field'), copy = $('.hp-gal-text', people);
  const WIDE = 13 / 9, TALL = 9 / 13;
  /* [file, format, horizontal focus of the crop]; the order makes tall and wide cards follow one another */
  const PHOTOS = [['o1', TALL, .5], ['o6', WIDE, .5], ['o3', TALL, .6], ['o7', WIDE, .5], ['o2', TALL, .4], ['o8', WIDE, .5], ['o4', TALL, .52], ['o9', WIDE, .5]];
  const FF = { cycle: 6, camZ: 2.8, zNear: .85, zFar: -1.05, k: 1.3 * 1.2, spreadX: 1.62, spreadY: 1, ringMin: .58,
    size: .27, radius: .06, fadeIn: .18, holdTo: .4, arrive: 2.2, swing: .17, depth: 1.8, ease: .075 };
  const frac = n => n - Math.floor(n);
  const sprites = PHOTOS.map(([name, ratio, fx]) => {                       // the crop is made once, off screen
    const img = new Image(), c = document.createElement('canvas'), s = { c, ratio, ready: false };
    img.onload = () => {
      const iw = img.naturalWidth, ih = img.naturalHeight, sw = Math.min(iw, ih * ratio), sh = sw / ratio;
      c.width = ratio > 1 ? 936 : 648; c.height = ratio > 1 ? 648 : 936;
      const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
      g.drawImage(img, (iw - sw) * fx, (ih - sh) / 2, sw, sh, 0, 0, c.width, c.height);
      s.ready = true; if (reduce) drawField();
    };
    img.src = `${IMG}${name}.jpg`;
    return s;
  });
  const N = PHOTOS.length;
  const flyers = sprites.map((s, i) => {
    const ang = frac(.11 + i * .6180339887498949) * Math.PI * 2;
    const band = (((i * 5) % N) + frac(.37 + i * .7548776662466927)) / N, rad = FF.ringMin + (1 - FF.ringMin) * band;
    return { s: sprites[(i * 3) % N], x: Math.cos(ang) * rad * FF.spreadX, y: Math.sin(ang) * rad * FF.spreadY, offset: i / N };
  });
  const ctx = field.getContext('2d');
  let fw = 0, fh = 0, textBox = null, elapsed = reduce ? 1.5 : 0, tPrev = 0, ffRaf = 0;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  function layoutField() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    fw = people.clientWidth; fh = people.clientHeight;
    field.width = Math.round(fw * dpr); field.height = Math.round(fh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingQuality = 'high';
    const pad = 24 * U;
    textBox = { l: copy.offsetLeft - pad, t: copy.offsetTop - pad, r: copy.offsetLeft + copy.offsetWidth + pad, b: copy.offsetTop + copy.offsetHeight + pad };
    drawField();
  }
  function drawField() {
    if (!fw) return;
    ctx.clearRect(0, 0, fw, fh);
    const shorter = Math.min(fw, fh), portrait = fh > fw, arrive = reduce ? 1 : smooth(elapsed / FF.arrive);
    flyers.map(c => ({ c, life: frac(elapsed / FF.cycle + c.offset) }))
      .sort((a, b) => b.life - a.life)                                 // far cards first, near ones on top
      .forEach(({ c, life }) => {
        const z = FF.zNear + (FF.zFar - FF.zNear) * life, p = FF.k / (FF.camZ - z);
        let alpha = smooth(life / FF.fadeIn) * (1 - smooth((life - FF.holdTo) / (1 - FF.holdTo))) * arrive;
        const size = FF.size * shorter * p, w = size * Math.sqrt(c.s.ratio), h = size / Math.sqrt(c.s.ratio);   // both formats cover the same area
        const follow = FF.swing * Math.pow(p, FF.depth) * shorter;
        const x = fw / 2 + c.x * p * shorter * (portrait ? .62 : 1) - mouse.x * follow - w / 2;
        const y = fh / 2 + c.y * p * shorter * (portrait ? 1.8 : 1) - mouse.y * follow - h / 2;
        if (textBox) {                                                 // a card drifting behind the copy thins out, so the text stays readable
          const ix = Math.max(0, Math.min(x + w, textBox.r) - Math.max(x, textBox.l)), iy = Math.max(0, Math.min(y + h, textBox.b) - Math.max(y, textBox.t));
          alpha *= 1 - .86 * smooth(ix * iy / (w * h) * 1.6);
        }
        if (!c.s.ready || alpha < .004) return;
        ctx.save(); ctx.globalAlpha = alpha; ctx.beginPath();
        const r = Math.min(w, h) * FF.radius;
        if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
        ctx.clip(); ctx.drawImage(c.s.c, x, y, w, h); ctx.restore();
      });
  }
  function fieldFrame(now) {
    const dt = tPrev ? Math.min(.05, (now - tPrev) / 1000) : 0; tPrev = now;
    elapsed += dt;
    mouse.x += (mouse.tx - mouse.x) * FF.ease; mouse.y += (mouse.ty - mouse.y) * FF.ease;
    drawField();
    ffRaf = requestAnimationFrame(fieldFrame);
  }
  people.addEventListener('pointermove', e => {
    if (reduce) return;
    const r = people.getBoundingClientRect();
    mouse.tx = (e.clientX - r.left) / r.width * 2 - 1; mouse.ty = (e.clientY - r.top) / r.height * 2 - 1;
  });
  people.addEventListener('pointerleave', () => { mouse.tx = 0; mouse.ty = 0; });
  new IntersectionObserver(en => {                                     // runs only while the block is on screen
    const on = en[en.length - 1].isIntersecting;
    if (on && !reduce && !ffRaf) { tPrev = 0; ffRaf = requestAnimationFrame(fieldFrame); }
    else if (!on && ffRaf) { cancelAnimationFrame(ffRaf); ffRaf = 0; }
  }).observe(people);
  new ResizeObserver(layoutField).observe(people);
  new ResizeObserver(layoutField).observe(copy);

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
