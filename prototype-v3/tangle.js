/* Technology can be complicated — three scroll animations for the same two lines.
   A: the untangle words + a cable that pulls straight, then the letter wave.
   B: the S-melt displacement filter resolving to sharp text, then the Services letter wave.
   C: a depth zoom through a cloud of jargon, then the outro's growing card with word masks. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
  const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
  const easeIn = t => Math.pow(clamp(t), 3);
  const easeIO = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
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

  function progress(el) {
    const r = el.getBoundingClientRect(), stageH = H - 16 * U;
    return clamp((8 * U - r.top) / Math.max(1, r.height - stageH));
  }
  const inView = el => { const r = el.getBoundingClientRect(); return r.bottom > -50 && r.top < H + 50; };
  let seed = 11;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

  /* the Services letter wave: dim → flash colour → final colour, driven by p (0..1) */
  const LIT = 6, HOLD = 4, COL = 10;
  function splitWave(seg) {
    const letters = [];
    const parts = seg.textContent.split(/(\s+)/); seg.textContent = '';
    parts.forEach(part => {
      if (!part) return;
      if (/^\s+$/.test(part)) { seg.appendChild(document.createTextNode(' ')); return; }
      const w = document.createElement('span'); w.style.display = 'inline-block';
      for (const ch of part) { const l = document.createElement('span'); l.className = 'l'; l.textContent = ch; w.appendChild(l); letters.push(l); }
      seg.appendChild(w);
    });
    return letters;
  }
  function wave(letters, p) {
    const pos = p * (letters.length + LIT + HOLD + COL);
    letters.forEach((l, i) => {
      const t = pos - i, lit = clamp(t / LIT), o = smooth((t - LIT - HOLD) / COL);
      l.style.opacity = lit >= 1 ? '1' : `calc(var(--dim) + ${lit.toFixed(3)} * (1 - var(--dim)))`;
      l.style.setProperty('--o', (o * 100).toFixed(0) + '%');
    });
  }

  /* =========================================================
     A — UNTANGLE THE CABLE
     ========================================================= */
  const A = { sec: $('#opt-a') };
  A.stage = $('.tg-a', A.sec); A.svg = $('.tga-cable', A.sec); A.path = $('.tga-path', A.sec);
  A.plugA = $('.tga-plug-a', A.sec); A.plugB = $('.tga-plug-b', A.sec); A.count = $('.tga-count', A.sec);
  A.l1 = $('.tga-l1', A.sec);
  A.chars = (() => {
    const txt = A.l1.textContent; A.l1.textContent = '';
    return [...txt].map(ch => {
      if (ch === ' ') { A.l1.appendChild(document.createTextNode(' ')); return null; }
      const s = document.createElement('span'); s.className = 'c'; s.textContent = ch; A.l1.appendChild(s);
      return { el: s, rx: rnd(), ry: rnd(), r: (rnd() - .5) * 220, s: .6 + rnd() * .7, dx: 0, dy: 0 };
    }).filter(Boolean);
  })();
  A.wave = splitWave($('.tga-l2 [data-w]', A.sec));
  const NPTS = 280;
  function layoutA() {
    const sw = A.stage.clientWidth, sh = A.stage.clientHeight;
    A.sw = sw; A.sh = sh;
    A.svg.setAttribute('viewBox', `0 0 ${sw} ${sh}`);
    const cx = sw * .5, cy = sh * .5, x0 = 80 * U, x1 = sw - 80 * U, yLine = sh * .56;
    A.straight = []; A.knot = [];
    for (let i = 0; i < NPTS; i++) {
      const t = i / (NPTS - 1), xs = lerp(x0, x1, t);
      A.straight.push([xs, yLine]);
      const e = Math.pow(Math.sin(Math.PI * t), .5);              // ends stay put, the middle knots up
      const kx = cx + (t - .5) * sw * .34 + 170 * U * Math.sin(2 * Math.PI * 5 * t) + 60 * U * Math.cos(2 * Math.PI * 11 * t);
      const ky = cy + 230 * U * Math.sin(2 * Math.PI * 4 * t + 1) + 90 * U * Math.cos(2 * Math.PI * 9 * t);
      A.knot.push([lerp(xs, kx, e), lerp(yLine, ky, e)]);
    }
    /* letters scatter over the knot: offset from where each letter sits in the line */
    A.chars.forEach(c => {
      c.el.style.transform = '';
      const x = A.l1.offsetLeft + c.el.offsetLeft + c.el.offsetWidth / 2, y = A.l1.offsetTop + c.el.offsetTop + c.el.offsetHeight / 2;
      c.dx = cx + (c.rx - .5) * sw * .62 - x;
      c.dy = cy + (c.ry - .5) * sh * .6 - y;
    });
  }
  function renderA() {
    if (!inView(A.sec)) return;
    const p = reduce ? 1 : progress(A.sec);
    const k = easeIO((p - .06) / .52);
    let d = '';
    for (let i = 0; i < NPTS; i++) {
      const s = A.straight[i], n = A.knot[i];
      /* a little leftover wobble that settles last, so the pull feels physical */
      const wob = Math.sin(i * .21 + p * 30) * 14 * U * (1 - k) * k * 4;
      const x = lerp(n[0], s[0], k), y = lerp(n[1], s[1], k) + wob;
      d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
      if (i === 0) { A.plugA.setAttribute('cx', x); A.plugA.setAttribute('cy', y); }
      if (i === NPTS - 1) { A.plugB.setAttribute('cx', x); A.plugB.setAttribute('cy', y); }
    }
    A.path.setAttribute('d', d);
    A.count.textContent = String(Math.round(14 * (1 - k))).padStart(2, '0');
    const n = A.chars.length;
    A.chars.forEach((c, i) => {
      const q = easeOut((p - .08 - (i / n) * .28) / .3), m = 1 - q;
      c.el.style.transform = `translate3d(${(c.dx * m).toFixed(1)}px, ${(c.dy * m).toFixed(1)}px, 0) rotate(${(c.r * m).toFixed(1)}deg) scale(${lerp(c.s, 1, q).toFixed(3)})`;
      c.el.style.filter = m > .02 ? `blur(${(m * 5 * U).toFixed(2)}px)` : '';
    });
    wave(A.wave, reduce ? 1 : clamp((p - .58) / .34));
  }

  /* =========================================================
     B — SIGNAL THROUGH THE NOISE
     ========================================================= */
  const B = { sec: $('#opt-b') };
  B.wrap = $('.tgb-l1-wrap', B.sec); B.disp = $('#tgb-disp'); B.turb = $('#tgb-turb');
  B.count = $('.tgb-count', B.sec); B.bar = $('.tgb-bar i', B.sec);
  B.wave = splitWave($('.tgb-l2 [data-w]', B.sec));
  function renderB() {
    if (!inView(B.sec)) return;
    const p = reduce ? 1 : progress(B.sec);
    const n = 1 - smooth((p - .05) / .48);                        // noise: 1 → 0
    B.disp.setAttribute('scale', (n * 110 * U).toFixed(1));
    B.turb.setAttribute('baseFrequency', `${(.008 + p * .01).toFixed(4)} ${(.05 - p * .02).toFixed(4)}`);
    const up = smooth((p - .55) / .15);
    B.wrap.style.filter = n > .005 ? `blur(${(n * 5 * U).toFixed(2)}px) url(#tgb-noise)` : '';
    B.wrap.style.opacity = ((.35 + .65 * (1 - n)) * (1 - up * .72)).toFixed(3);
    B.wrap.style.transform = `translateY(${(-up * 80 * U).toFixed(1)}px) scale(${(1 + n * .04 - up * .04).toFixed(3)})`;
    B.count.textContent = Math.round(n * 100) + '%';
    B.bar.style.transform = `scaleX(${n.toFixed(3)})`;
    wave(B.wave, reduce ? 1 : clamp((p - .6) / .34));
  }

  /* =========================================================
     C — PAST THE JARGON, TO THE PEOPLE
     ========================================================= */
  const C = { sec: $('#opt-c') };
  C.stage = $('.tg-c', C.sec); C.cloud = $('.tgc-cloud', C.sec); C.l1 = $('.tgc-l1', C.sec);
  C.card = $('.tgc-card', C.sec); C.img = $('.tgc-card > img', C.sec); C.tags = $$('.tgc-tags li', C.sec);
  C.words = $$('.tgc-l2 span', C.sec).map(s => { const b = document.createElement('b'); b.textContent = s.textContent; s.textContent = ''; s.appendChild(b); return b; });
  const JARGON = ['VDI', 'AVD', 'Citrix', 'Omnissa Horizon', 'FSLogix', 'GPO', 'IGEL UMS', 'MFA', 'SSO', 'Latency', 'Golden images', 'Autoscaling',
    'Session hosts', 'Profile containers', 'Imprivata', 'Badge tap', 'Hybrid join', 'Intune', 'Patching', 'Licensing', 'Bandwidth', 'Thin clients',
    'Load balancing', 'Hypervisor', 'Entra ID', 'Conditional access', 'Logon times', 'Print drivers', 'App layering', 'Disaster recovery'];
  const DOTS = ['var(--orange)', 'var(--pink)', 'var(--green)', 'var(--charcoal-40)', 'var(--charcoal-40)'];
  seed = 23;
  C.chips = JARGON.map((t, i) => {
    const li = document.createElement('li'); li.textContent = t; li.style.setProperty('--dc', DOTS[i % DOTS.length]); C.cloud.appendChild(li);
    const a = (i / JARGON.length) * Math.PI * 2 + rnd() * .5;
    return { el: li, a, r: .66 + rnd() * .4, z: .25 + rnd() * .75, ph: rnd() * 6 };
  });
  function layoutC() {
    C.sw = C.stage.clientWidth; C.sh = C.stage.clientHeight;
    C.stage.style.setProperty('--sw', C.sw + 'px'); C.stage.style.setProperty('--sh', C.sh + 'px');
  }
  function renderC() {
    if (!inView(C.sec)) return;
    const p = reduce ? 1 : progress(C.sec);
    const k = clamp((p - .04) / .4);                               // the camera pushes through the cloud
    C.chips.forEach(c => {
      const f = 1 + easeIn(k) * (2 + c.z * 7);
      const drift = Math.sin(p * 8 + c.ph) * 14 * U;
      const x = Math.cos(c.a) * c.r * C.sw * .44 * f, y = Math.sin(c.a) * c.r * C.sh * .44 * f + drift;
      const s = (.55 + c.z * .5) * Math.pow(f, .8);
      c.el.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${s.toFixed(3)})`;
      c.el.style.opacity = ((.45 + c.z * .55) * (1 - smooth((f - 2.2) / 2.5))).toFixed(3);
      const bl = (1 - c.z) * 2.2 * U + Math.max(0, f - 1.4) * 2.5 * U;  // far chips soft, near chips blur as they pass
      c.el.style.filter = bl > .3 ? `blur(${bl.toFixed(2)}px)` : '';
    });
    const kp = easeIn(clamp((k - .35) / .65));
    C.l1.style.transform = `translate(-50%, -50%) scale(${(1 + kp * 2.4).toFixed(3)})`;
    C.l1.style.opacity = (1 - smooth((k - .55) / .4)).toFixed(3);
    C.l1.style.filter = kp > .02 ? `blur(${(kp * 18 * U).toFixed(2)}px)` : '';
    /* the card: a small portrait window that opens up to fill the stage */
    const g = easeIO((p - .4) / .32);
    const w = lerp(C.sw * .16, C.sw, g), h = lerp(C.sh * .4, C.sh, g);
    C.card.style.width = w.toFixed(1) + 'px'; C.card.style.height = h.toFixed(1) + 'px';
    C.card.style.borderRadius = (lerp(30, 60, g) * U).toFixed(1) + 'px';
    C.card.style.opacity = smooth((p - .36) / .06).toFixed(3);
    C.img.style.transform = `translate(${lerp(-60, -50, g).toFixed(2)}%, ${lerp(-44, -50, g).toFixed(2)}%) scale(${lerp(1.25, 1, g).toFixed(3)})`;   // keep her face in the small window
    C.words.forEach((b, i) => {
      const q = easeOut((p - .72 - i * .016) / .12);
      b.style.transform = `translateY(${((1 - q) * 110).toFixed(1)}%)`;
    });
    C.tags[0].parentElement.style.opacity = smooth((p - .86) / .05).toFixed(3);
    C.tags.forEach((li, i) => {
      const q = easeOut((p - .86 - i * .04) / .08);
      li.style.opacity = q.toFixed(3);
      li.style.transform = `translateY(${((1 - q) * -24 * U).toFixed(1)}px)`;
    });
  }

  function render() { renderA(); renderB(); renderC(); }
  function layout() { W = innerWidth; H = innerHeight; U = W / 1920; layoutA(); layoutC(); render(); }
  let ticking = false;
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; render(); }); } }, { passive: true });
  addEventListener('resize', layout);
  document.fonts && document.fonts.ready.then(layout);
  layout();
})();
