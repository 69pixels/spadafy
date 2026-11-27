/* =========================================================
   Spadafy — legal pages: Lenis scroll, nav states, and the
   contents card that follows the section you are reading.
   ========================================================= */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  const lenis = (!reduce && window.Lenis) ? new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true }) : null;
  if (lenis) {
    window.lenis = lenis;
    const tick = t => { lenis.raf(t); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }
  let U = 1;
  function setUnits() { U = root.clientWidth / 1920; root.style.setProperty('--u', U + 'px'); root.style.setProperty('--vh', innerHeight + 'px'); }
  const scrollTo = y => { if (lenis) lenis.scrollTo(y, { duration: 1.2 }); else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' }); };
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id === '#') { e.preventDefault(); return; }
    const target = id === '#top' ? document.body : $(id);
    if (!target) return;
    e.preventDefault();
    scrollTo(id === '#top' ? 0 : target.getBoundingClientRect().top + window.scrollY - 100 * U);
    history.replaceState(null, '', id);
  });

  /* ---------- nav: default → collapsed after 24px → open panel ---------- */

  /* ---------- contents: highlight the section in view ---------- */
  const tocLinks = $$('.lg-toc-list a');
  const secs = tocLinks.map(a => $(a.getAttribute('href')));
  function setToc() {
    const line = innerHeight * .3;
    let cur = 0;
    secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top <= line) cur = i; });
    if (innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = secs.length - 1;   // at the very bottom
    tocLinks.forEach((a, i) => { a.classList.toggle('on', i === cur); if (i === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  }

  /* ---------- small reveals ---------- */
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .1 });
  $$('.lg-head > *, .lg-sec').forEach((el, i) => { el.classList.add('rv'); el.style.setProperty('--d', Math.min(i * 90, 360) + 'ms'); io.observe(el); });

  let ticking = false;
  function render() { setToc(); }
  window.addEventListener('scroll', () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => { ticking = false; render(); });
  }, { passive: true });
  window.addEventListener('resize', () => { setUnits(); render(); });
  setUnits(); render();
})();
