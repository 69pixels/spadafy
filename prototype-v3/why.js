/* Why Spadafy? — section options.
   Each [data-light] scene pins; its letters run the Services intro wave:
   dim → a flash of the bright colour → the final colour, all tied to scroll. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = innerWidth, H = innerHeight, U = W / 1920;

  const lenis = (!reduce && window.Lenis) ? new Lenis({ lerp: 0.09, smoothWheel: true }) : null;
  if (lenis) { const tick = t => { lenis.raf(t); requestAnimationFrame(tick); }; requestAnimationFrame(tick); }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const t = $(a.getAttribute('href')); if (!t) return;
    e.preventDefault();
    const y = t.getBoundingClientRect().top + scrollY;
    lenis ? lenis.scrollTo(y, { duration: 1.4 }) : scrollTo({ top: y, behavior: 'smooth' });
  }));

  /* split every [data-w] run into letters, kept inside word spans so lines only break between words */
  function split(seg, into) {
    const parts = seg.textContent.split(/(\s+)/);
    seg.textContent = '';
    parts.forEach(part => {
      if (!part) return;
      if (/^\s+$/.test(part)) { seg.appendChild(document.createTextNode(' ')); return; }
      const w = document.createElement('span');
      w.className = 'w'; w.style.display = 'inline-block';
      for (const ch of part) {
        const l = document.createElement('span');
        l.className = 'l'; l.textContent = ch;
        w.appendChild(l); into.push(l);
      }
      seg.appendChild(w);
    });
  }

  const LIT = 6, HOLD = 4, ORANGE = 10;
  const scenes = $$('[data-light]').map(sec => {
    const letters = [];
    $$('[data-w]', sec).forEach(seg => split(seg, letters));
    return { sec, letters, state: letters.map(() => -1), last: -1 };
  });

  function progress(el) {
    const r = el.getBoundingClientRect(), stageH = H - 16 * U;
    return clamp((8 * U - r.top) / Math.max(1, r.height - stageH));
  }
  function renderScene(s) {
    const r = s.sec.getBoundingClientRect();
    if (r.bottom < -50 || r.top > H + 50) return;
    const p = reduce ? 1 : clamp((progress(s.sec) - .08) / .8);
    const k = Math.round(p * 4000);
    if (k === s.last) return;
    s.last = k;
    const pos = p * (s.letters.length + LIT + HOLD + ORANGE);
    for (let i = 0; i < s.letters.length; i++) {
      const t = pos - i;
      const lit = clamp(t / LIT), o = smooth((t - LIT - HOLD) / ORANGE);
      const key = Math.round(lit * 100) * 1000 + Math.round(o * 100);
      if (key === s.state[i]) continue;
      s.state[i] = key;
      const l = s.letters[i];
      l.style.opacity = lit >= 1 ? '1' : `calc(var(--dim) + ${lit.toFixed(3)} * (1 - var(--dim)))`;
      l.style.setProperty('--o', (o * 100).toFixed(0) + '%');
    }
  }
  function render() { scenes.forEach(renderScene); }
  function layout() { W = innerWidth; H = innerHeight; U = W / 1920; scenes.forEach(s => s.last = -1); render(); }

  let ticking = false;
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; render(); }); } }, { passive: true });
  addEventListener('resize', layout);
  layout();
})();
