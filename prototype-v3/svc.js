/* =========================================================
   Spadafy — service pages (desktop). Same motion as the VDI Managed Services page:
   Lenis scroll, the body slides over a sticky hero, staggered reveals,
   module index that follows the scroll.
   Every part is optional, so one script serves all the service pages.
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
  const here = location.pathname.split('/').pop() || 'index.html';

  /* Lenis smooth scroll */
  const lenis = (!reduce && window.Lenis) ? new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true }) : null;
  if (lenis) {
    window.lenis = lenis;
    const tick = t => { lenis.raf(t); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }
  let W = 1920, H = 1080, U = 1, MOB = false;
  const scrollTo = y => { if (lenis) lenis.scrollTo(y, { duration: 1.4 }); else window.scrollTo({ top: y, behavior: 'smooth' }); };
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id === '#') { e.preventDefault(); return; }
    const target = id === '#top' ? document.body : $(id);
    if (!target) return;
    e.preventDefault();
    scrollTo(id === '#top' ? 0 : target.getBoundingClientRect().top + window.scrollY - 100 * U);
  });
  function setUnits() {
    /* phones (< 768px) are drawn on a 390 grid, everything else on the 1920 grid */
    W = root.clientWidth; H = window.innerHeight; MOB = W < 768; U = W / (MOB ? 390 : 1920);
    root.classList.toggle('is-mob', MOB);
    root.style.setProperty('--u', U + 'px');
    root.style.setProperty('--vh', H + 'px');
  }

  /* =========================================================
     HERO — sticky; the body slides over it and dims it
     ========================================================= */
  const hero = $('.hero'), heroText = $('.hero-text'), body = $('#body');
  let heroCover = null;
  if (hero) { heroCover = document.createElement('div'); heroCover.className = 'hero-cover'; hero.appendChild(heroCover); }
  function renderHero() {
    if (!hero || !body) return;
    const top = body.getBoundingClientRect().top;
    const p = clamp(1 - top / H);
    heroText.style.transform = `translateY(${(-p * 90 * U).toFixed(1)}px)`;
    heroCover.style.opacity = (p * .6).toFixed(3);
    body.style.setProperty('--bg', smooth((p - .75) / .2).toFixed(3));
    hero.style.visibility = top < -4 ? 'hidden' : 'visible';
  }

  /* =========================================================
     MODULES — the sticky index marks the module you're reading
     ========================================================= */
  const modLinks = $$('.sv-mods-nav a');
  const mods = modLinks.map(a => $(a.getAttribute('href')));
  function renderMods() {
    if (!mods.length) return;
    let on = -1;
    mods.forEach((m, i) => { if (m && m.getBoundingClientRect().top < H * .45) on = i; });
    modLinks.forEach((a, i) => a.classList.toggle('on', i === on));
  }

  /* =========================================================
     FAQ — one open at a time (only on pages that have one)
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

  /* contact form: prototype only, with plain validation messages */
  const form = $('.ct-form');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = $('.send span', form);
    const missing = $$('[required]', form).filter(f => !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value)));
    $$('.field', form).forEach(f => f.classList.remove('bad'));
    if (missing.length) {
      missing.forEach(f => f.closest('.field').classList.add('bad'));
      missing[0].focus();
      btn.textContent = missing.some(f => f.type === 'email' && f.value.trim()) ? 'Check the email address' : 'Please fill in the required fields';
      setTimeout(() => { btn.textContent = form.dataset.send || 'Send message'; }, 2600);
      return;
    }
    btn.textContent = 'Thanks! An engineer will be in touch';
    setTimeout(() => { btn.textContent = form.dataset.send || 'Send message'; }, 3200);
  });

  /* =========================================================
     SMALL REVEALS — fade + rise, staggered, once
     ========================================================= */
  const REVEAL = [
    ['.v-head > *', 120, 0], ['.back-list li', 110, 0], ['.get', 0, 0], ['.step', 110, 0], ['.sv-mods-head > *', 100, 0], ['.sv-mod', 0, 0],
    ['.sv-diag-top > *', 120, 0], ['.sv-tier', 120, 0], ['.sv-flow > li', 110, 0], ['.sv-shift .h2', 0, 0], ['.sv-shift-card', 110, 0], ['.sv-shift-notes p', 120, 0], ['.sv-notes p', 120, 0],
    ['.sv-tbl-wrap', 0, 100], ['.sv-foot', 0, 0],
    ['.v-faq .h2', 0, 0], ['.qa', 60, 0],
    ['.v-related .h3', 0, 0],
    ['.ct-scope-l', 0, 0], ['.ct-scope li', 50, 100], ['.fields > *', 60, 0], ['.legal', 0, 400]
  ];
  const heroReveal = ['.hero .vh-sub', '.hero h1', '.hero-text .vh-main > .t24', '.vh-btns', '.vh-platforms'].map(s => $(s)).filter(Boolean);
  heroReveal.forEach((el, i) => { el.classList.add('rv'); el.style.setProperty('--d', (i * 160) + 'ms'); });
  const io = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  REVEAL.forEach(([sel, step, base]) => $$(sel).forEach((el, i) => { el.classList.add('rv'); el.style.setProperty('--d', Math.min(base + i * step, 700) + 'ms'); io.observe(el); }));
  /* related cards sit in a sideways row: the ones past the edge never intersect, so the row reveals as a whole */
  const rowIo = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    $$('.rel', en.target).forEach(el => el.classList.add('in'));
    rowIo.unobserve(en.target);
  }), { threshold: .15, rootMargin: '0px 0px -6% 0px' });
  $$('.rel-cards').forEach(row => { $$('.rel', row).forEach((el, i) => { el.classList.add('rv'); el.style.setProperty('--d', Math.min(i * 110, 330) + 'ms'); }); rowIo.observe(row); });
  requestAnimationFrame(() => setTimeout(() => heroReveal.forEach(el => el.classList.add('in')), 120));

  /* =========================================================
     FIRST BLOCK — the Services intro wave: letters light up one after another,
     flash, then settle. Plays once, by itself, as the statement nears the middle of the screen
     ========================================================= */
  const wave = $('.sv-wave'), waveLead = $('.sv-glance-p');
  const wLetters = [];
  if (wave) {
    const splitInto = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 1) { splitInto(n); return; }   // <em> keeps its letters inside it
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'w';
          for (const ch of part) { const l = document.createElement('span'); l.className = 'l'; l.textContent = ch; w.appendChild(l); wLetters.push(l); }
          frag.appendChild(w);
        });
        n.replaceWith(frag);
      });
    };
    splitInto(wave);
    if (!reduce) { wave.classList.add('anim'); if (waveLead) waveLead.classList.add('wv'); }
  }
  const W_LIT = 6, W_HOLD = 4, W_TO = 10, W_MS = 1900;
  const wState = wLetters.map(() => -1);
  let wT0 = -1;
  function setWave(p) {
    const pos = p * (wLetters.length + W_LIT + W_HOLD + W_TO);
    for (let i = 0; i < wLetters.length; i++) {
      const t = pos - i, lit = clamp(t / W_LIT), o = smooth((t - W_LIT - W_HOLD) / W_TO);
      const key = Math.round(lit * 100) * 1000 + Math.round(o * 100);
      if (key === wState[i]) continue;
      wState[i] = key;
      wLetters[i].style.opacity = (.15 + .85 * lit).toFixed(2);
      wLetters[i].style.setProperty('--o', (o * 100).toFixed(0) + '%');
    }
  }
  function waveTick(now) {
    const p = clamp((now - wT0) / W_MS);
    setWave(p);
    if (p > .55 && waveLead) waveLead.classList.add('in');
    if (p < 1) requestAnimationFrame(waveTick);
  }
  function renderWave() {
    if (!wave || reduce || wT0 >= 0) return;
    const r = wave.getBoundingClientRect();
    if (r.top + r.height / 2 > H * .62) return;
    wT0 = performance.now();
    requestAnimationFrame(waveTick);
  }

  /* =========================================================
     LOOP
     ========================================================= */
  function layout() {
    setUnits();
    render();
  }
  function render() { renderHero(); renderMods(); renderWave(); }
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
