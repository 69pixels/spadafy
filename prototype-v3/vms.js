/* =========================================================
   Spadafy — VDI Managed Services page (desktop)
   Same motion principles as the homepage: Lenis scroll, nav states,
   the body slides over a sticky hero, staggered reveals, outro card.
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
    /* the dark body fill behind the blocks shows up only once they cover ~80% of the screen */
    body.style.setProperty('--bg', smooth((p - .75) / .2).toFixed(3));
    hero.style.visibility = top < -4 ? 'hidden' : 'visible';
  }

  /* =========================================================
     PROOF — slow parallax on the photo
     ========================================================= */
  const proof = $('.v-proof'), proofBg = $('.proof-bg');
  function renderProof() {
    const r = proof.getBoundingClientRect();
    if (r.bottom < 0 || r.top > H) return;
    const p = clamp((H - r.top) / (H + r.height));            // 0 entering → 1 leaving
    proofBg.style.transform = `translateY(${((p - .5) * 80 * U).toFixed(1)}px) scale(1.08)`;
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

  /* who-runs-it rings: tooltip follows the hovered / focused segment */
  $$('[data-pie]').forEach(pie => {
    const tip = $('.pie-tip', pie);
    const show = seg => { tip.textContent = seg.dataset.label; pie.classList.add('is-tip'); };
    const hide = () => pie.classList.remove('is-tip');
    /* the tooltip rides just above the cursor */
    const follow = e => {
      const r = pie.getBoundingClientRect();
      pie.style.setProperty('--tx', (e.clientX - r.left).toFixed(1) + 'px');
      pie.style.setProperty('--ty', (e.clientY - r.top).toFixed(1) + 'px');
    };
    const centre = () => { pie.style.setProperty('--tx', '50%'); pie.style.setProperty('--ty', '0px'); };
    $$('.pie-seg', pie).forEach(seg => {
      seg.addEventListener('pointerenter', e => { follow(e); show(seg); });
      seg.addEventListener('pointermove', follow);
      seg.addEventListener('pointerleave', hide);
      seg.addEventListener('focus', () => { centre(); show(seg); });
      seg.addEventListener('blur', hide);
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
     SMALL REVEALS — fade + rise, staggered, once
     ========================================================= */
  const REVEAL = [
    ['.v-familiar > p:first-child', 0, 0], ['.fam-cards li', 110, 0], ['.fam-answer', 0, 0],
    ['.v-head > *', 120, 0], ['.cmp', 0, 150], ['.models-cta', 0, 200],
    ['.back-list li', 110, 0], ['.layers', 0, 100], ['.layers li', 80, 200], ['.layers-foot > *', 150, 0],
    ['.get', 0, 0], ['.step', 110, 0],
    ['.proof-head > *', 120, 0], ['.case', 0, 200],
    ['.v-faq .h2', 0, 0], ['.qa', 60, 0],
    ['.v-related .h3', 0, 0],
    ['.ct-points li', 110, 0], ['.fields > *', 60, 0], ['.legal', 0, 400]
  ];
  const heroReveal = ['.hero h1', '.hero-text .t24', '.vh-btns', '.vh-platforms'].map((sel, i) => {
    const el = $(sel);
    el.classList.add('rv'); el.style.setProperty('--d', (i * 180) + 'ms');
    return el;
  });
  const io = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .15, rootMargin: '0px 0px -6% 0px' });
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
     LOOP
     ========================================================= */
  function layout() {
    setUnits();
    render();
  }
  function render() { renderHero(); renderProof(); }
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
