/* =========================================================
   Spadafy — the seam between pages (from the navigation sketch "4 · Inside Out")
   At the end of a page it lifts and uncovers a preview of the next one.
     1. The scroll stops there (the spacer ends), so trackpad inertia cannot fly past.
     2. Once the input rests, the spacer grows; more scrolling now enlarges the preview.
     3. At full screen the preview matches the next page's hero, and that page opens.
   A page asks for it with <body data-next="services | about | health">. Load after the page script.
   ========================================================= */
(() => {
  'use strict';
  /* each entry repeats the hero of that page, in design px at 1920 (title measured from its bottom-left).
     Change a hero's photo, headline or position there, and change it here too. */
  const PAGES = {
    services: {
      href: 'services.html', name: 'Services', img: 'assets/services/hero.jpg', at: '100% 50%', zoom: 1.2, shade: .3, fade: 256, blur: true,
      title: 'VDI is our core, and we’ve got everything else that your desktops covered.',
      size: 80, rest: 64, line: 1, track: 0, width: 1253, left: 80, bottom: 192
    },
    about: {
      href: 'about.html', name: 'About', img: 'assets/img/about-hero.jpg', at: '100% 50%', zoom: 1.2, shade: .2, fade: 256, blur: true,
      title: 'Great technology.<br>Better people.', eyebrow: { text: 'We take this personally.', bottom: 355 },
      size: 144, rest: 104, line: .9, track: -.02, width: 1046, left: 80, bottom: 80
    },
    health: {
      href: 'health-check.html', name: 'Health Check', img: 'assets/hc/hero.png', at: '50% 50%', zoom: 1, shade: .2, fade: 400, blur: false,
      title: 'Free<br>Health Check?',
      size: 144, rest: 104, line: .9, track: -.02, width: 1027, left: 80, bottom: 444
    }
  };
  const page = PAGES[document.body.dataset.next], main = document.querySelector('main');
  if (!page || !main) return;

  const LIFT = .46;        /* how far the page lifts, share of the screen height */
  const GROW = .9;         /* scroll needed to open the next page, in screen heights */
  const REST = 220;        /* ms without input that counts as "the gesture is over" */
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = v => Math.max(0, Math.min(1, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  root.classList.add('has-seam');
  const under = document.createElement('div');
  under.className = 'seam-under';
  under.innerHTML = `<p>Spadafy © ${new Date().getFullYear()}</p>`;
  const card = document.createElement('a');
  card.className = 'seam';
  card.href = page.href;
  card.setAttribute('aria-label', `Next page: ${page.name}`);
  card.innerHTML = `<img src="${page.img}" alt="" style="object-position:${page.at}">
    <span class="seam-shade" style="background:rgba(0,0,0,${page.shade})"></span>
    <span class="seam-fade${page.blur ? ' is-blur' : ''}"></span>
    <span class="seam-veil"></span>
    <span class="seam-top"><span class="seam-name">${page.name}</span><span class="seam-hint">Keep scrolling to open ↓</span></span>
    ${page.eyebrow ? `<span class="seam-eyebrow">${page.eyebrow.text}</span>` : ''}
    <span class="seam-title">${page.title}</span>
    <span class="seam-bar" aria-hidden="true"><i></i></span>`;
  const space = document.createElement('div');
  space.setAttribute('aria-hidden', 'true');
  main.after(space);
  document.body.append(under, card);
  const next = document.createElement('link');
  next.rel = 'prefetch'; next.href = page.href;
  document.head.appendChild(next);
  const word = document.querySelector('.nav-word');

  let armed = false;       /* the seam has let go: scrolling now opens the next page */
  let forced = false;      /* the card was clicked: open without scrolling */
  let leaving = false, lastInput = 0, grown = 0, end = 0, lift = 0;

  function measure() {
    end = Math.max(0, main.offsetTop + main.offsetHeight - innerHeight);
    lift = innerHeight * LIFT;
    space.style.height = lift + (armed ? innerHeight * GROW : 0) + 'px';
    if (window.lenis) window.lenis.resize();
  }
  new ResizeObserver(measure).observe(main);
  addEventListener('resize', measure);

  const touched = e => { lastInput = performance.now(); if (leaving && e.cancelable) e.preventDefault(); };
  addEventListener('wheel', touched, { passive: false });
  addEventListener('touchmove', touched, { passive: false });
  addEventListener('scroll', () => { lastInput = performance.now(); }, { passive: true, capture: true });

  card.addEventListener('click', e => {
    if (reduce || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault(); forced = true;
  });

  function open() {
    leaving = true;
    try { sessionStorage.setItem('spadafy-seam', '1'); } catch (e) { /* the next page just loads */ }
    location.assign(page.href);
    setTimeout(() => { if (leaving) back(); }, 6000);          /* the page never came */
  }
  /* returning with the Back button: put the page where its own content ends */
  function back() {
    leaving = armed = forced = false; grown = 0;
    measure();
    if (window.lenis) window.lenis.scrollTo(end, { immediate: true, force: true }); else window.scrollTo(0, end);
  }
  addEventListener('pageshow', e => { if (e.persisted) back(); });

  const typing = () => !!(document.activeElement && document.activeElement.matches('input, textarea, select'));

  function frame() {
    const u = root.clientWidth / 1920, W = root.clientWidth, H = innerHeight, y = window.scrollY;
    const menuOpen = root.classList.contains('menu-on');
    const edge = end + lift;

    /* the seam holds until the gesture is over, and takes hold again if you scroll back up */
    if (!reduce && !leaving) {
      if (!armed && !menuOpen && !typing() && y >= edge - 2 && performance.now() - lastInput > REST) { armed = true; measure(); }
      else if (armed && !forced && y < edge - 40) { armed = false; measure(); }
    }
    const goal = forced ? 1 : armed ? clamp((y - edge) / (H * GROW)) : 0;
    if (!leaving) grown += (goal - grown) * (forced ? .09 : .18);
    if (!leaving && goal >= .995 && grown >= .992) { grown = 1; open(); }

    /* nothing to draw until the end of the page is in sight */
    const near = y > end - 4 && !menuOpen;
    under.style.visibility = card.style.visibility = near ? 'visible' : 'hidden';
    card.inert = !near || (y < end + 80 * u && grown < .01);
    const g = grown * grown * (3 - 2 * grown);
    if (near) {
      const s = card.style;
      s.zIndex = g > .002 ? 3 : 0;
      s.width = lerp(W - 96 * u, W, g) + 'px';
      s.height = lerp(lift - 104 * u, H, g) + 'px';
      s.transform = `translate(${lerp(48 * u, 0, g)}px, ${lerp(H - lift + 24 * u, 0, g)}px)`;
      s.borderRadius = lerp(60 * u, 0, g) + 'px';
      s.setProperty('--g', g);
      s.setProperty('--zoom', lerp(1, page.zoom, g));
      s.setProperty('--size', lerp(page.rest, page.size, g));
      s.setProperty('--left', lerp(56, page.left, g));
      s.setProperty('--bottom', lerp(58, page.bottom, g));
      s.setProperty('--fade', page.fade);
      s.setProperty('--line', page.line);
      s.setProperty('--track', page.track + 'em');
      s.setProperty('--width', (page.width / page.size) + 'em');
      if (page.eyebrow) s.setProperty('--eyebrow', page.eyebrow.bottom);
    }
    /* the S makes half a turn on the way over: it reads the same when it arrives */
    if (word) word.style.rotate = g > .001 ? `${g * 180}deg` : '';
    requestAnimationFrame(frame);
  }
  measure();
  requestAnimationFrame(frame);
})();
