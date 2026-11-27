/* =========================================================
   Spadafy — navigation (Figma section 2557:7621 "Menu")
   One header for every page. The pill shows the whole logo at the top of a page and only
   the S once you scroll. Services and Footnotes push the page down and open underneath it.

   Each page provides <header class="nav" id="nav" data-…> and loads this before its own script:
     data-home    where the logo goes          (default index.html)
     data-health  where "Health Check" goes    (default health-check.html)
     data-cta     where "Let's talk" goes      (default #contact)
     data-active  services | about | health    (the current section)
     data-cta-form  present when the CTA also opens the page's form
   A link to another page plays a short hand-over: the page dips, the logo folds to the S, the S
   turns over into the goat; on the next page it turns back into the S and unfolds.
   ========================================================= */
(() => {
  'use strict';
  const header = document.getElementById('nav');
  const main = document.querySelector('main');
  if (!header || !main) return;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const unit = () => root.clientWidth / 1920;

  const cfg = {
    home: header.dataset.home || 'index.html',
    health: header.dataset.health || 'health-check.html',
    cta: header.dataset.cta || '#contact',
    active: header.dataset.active || ''
  };
  const ICON = 'assets/nav/';

  /* ---------- content ---------- */
  /* one photo per service, the same ones as on the Services page (services-data.js).
     Vendor Partners has no card there, so it uses its page hero. */
  const PREVIEWS = {
    overview: { title: 'Services', img: ICON + 'preview-overview.jpg' },
    managed: { title: 'VDI Managed Services', img: 'assets/services/card-managed.jpg', at: '50% 30%' },
    infra: { title: 'VDI Infrastructure', img: 'assets/services/card-infra.jpg' },
    sso: { title: 'Healthcare SSO and Authentication', img: 'assets/services/card-sso.jpg' },
    cloud: { title: 'Hybrid Cloud & Infrastructure Modernization', img: 'assets/services/hero.jpg' },
    vendors: { title: 'Vendor Partners', img: 'assets/img/hero.jpg' }
  };
  /* each item opens its own page; the preview photo is that page's hero */
  const GROUPS = [
    ['Core VDI', [['managed', 'VDI Managed Services', 'vdi-managed-services.html'], ['infra', 'VDI Infrastructure', 'vdi-infrastructure.html']]],
    ['Beyond VDI', [['sso', 'Healthcare SSO and Authentication', 'healthcare-sso.html'], ['cloud', 'Hybrid Cloud &amp; Infrastructure Modernization', 'hybrid-cloud.html'], ['vendors', 'Vendor Partners', 'vendor-partners.html']]]
  ];
  /* no profile or terms URLs yet: href "#" does nothing until they are filled in */
  const SOCIALS = [['LinkedIn', '#'], ['X / Twitter', '#'], ['Youtube', '#']];
  const FINE = [['Privacy Policy', 'privacy-policy.html', ''], ['Terms of Use', '#', ''], ['Cookies settings', 'privacy-policy.html#cookies', 'data-cookie-settings']];

  /* heart: three clicks change the line and the colour, the fourth releases the goats */
  const NOTES = [
    ['Led by engineers, driven by results.', ''],
    ['No goats were harmed in the making of this site.', 'orange'],
    ['Fine, one goat was harmed. We don’t talk about it.', 'pink'],
    ['Relax, he’s fine. We cloned him from the golden image.', 'green'],
    ['Maybe a few too many times.', '']
  ];

  /* ---------- header ---------- */
  const current = key => cfg.active === key ? ' aria-current="page"' : '';
  const caret = '<span class="nav-caret" aria-hidden="true"></span>';
  header.innerHTML = `<div class="nav-pill">
    <a class="nav-logo" href="${cfg.home}" aria-label="Spadafy — home">
      <span class="nav-word"><img src="${ICON}logo-full.svg" width="225.273" height="28" alt=""></span>
      <span class="nav-coin" aria-hidden="true"><span class="nav-coin-flip" data-face="s">
        <span class="nav-coin-face nav-coin-front"><span class="nav-coin-s"><img src="${ICON}logo-full.svg" width="225.273" height="28" alt=""></span></span>
        <span class="nav-coin-face nav-coin-back"><img src="${ICON}goat-white.svg" alt=""></span>
      </span></span>
    </a>
    <nav class="nav-links" aria-label="Main">
      <button class="nav-item" type="button" data-menu="services" aria-expanded="false" aria-controls="menu-services"${current('services')}>Services ${caret}</button>
      <a class="nav-item" href="about.html"${current('about')}>About</a>
      <a class="nav-item" href="${cfg.health}"${current('health')}>Health Check</a>
      <button class="nav-item" type="button" data-menu="footnotes" aria-expanded="false" aria-controls="menu-footnotes">Footnotes ${caret}</button>
    </nav>
    <a class="nav-cta" href="${cfg.cta}"${'ctaForm' in header.dataset ? ' data-open-form' : ''}>Let’s talk</a>
  </div>`;

  /* ---------- the layer under the page ---------- */
  const column = (title, links) => `<div class="mn-group"><p class="mn-label">${title}</p><ul class="mn-list">${links}</ul></div>`;
  const menu = document.createElement('div');
  menu.className = 'menu';
  menu.innerHTML = `
    <section class="menu-panel ms" id="menu-services" aria-label="Services" inert>
      <div class="ms-intro">
        <div>
          <p class="mn-label">Services overview</p>
          <a class="ms-lead" href="services.html" data-preview="overview">From the first assessment to<br>everyday support</a>
        </div>
        <a class="ms-explore" href="services.html" data-preview="overview">Explore services</a>
      </div>
      <div class="ms-links">${GROUPS.map(([title, items]) => column(title, items.map(([key, label, href]) =>
        `<li><a class="mn-link" href="${href}" data-preview="${key}">${label}</a></li>`).join(''))).join('')}</div>
      <div class="ms-preview" aria-hidden="true"><p class="ms-title"></p></div>
    </section>
    <section class="menu-panel mf" id="menu-footnotes" aria-label="Footnotes" inert>
      <div class="mf-body">
        <div class="mf-cols">
          <div class="mf-hello">
            <div>
              <p class="mn-label">Say hello</p>
              <a class="mf-mail" href="mailto:hello@spadafy.com">hello@spadafy.com</a>
            </div>
            <address class="mf-address">8228 Fairway Dr NE<br>Seattle, WA 98115</address>
          </div>
          <div class="mf-pair">
            ${column('Connect', SOCIALS.map(([l, h]) => `<li><a class="mn-link" href="${h}">${l}</a></li>`).join(''))}
            ${column('Fine print', FINE.map(([l, h, attr]) => `<li><a class="mn-link" href="${h}" ${attr}>${l}</a></li>`).join(''))}
          </div>
        </div>
        <p class="mf-about">Spadafy is your first and last VDI partner, helping you assess, design, run and support the digital workspace your people rely on. Behind the deep expertise are humans who listen first and keep things simple: big brains, no ego.</p>
      </div>
      <div class="mf-base">
        <img class="mf-logo" src="${ICON}fn-logo.svg" width="258" height="32" alt="Spadafy">
        <div class="mf-line">
          <div class="mf-note"><p data-year></p><p data-now></p></div>
          <div class="mf-note mf-egg"><p data-note aria-live="polite">${NOTES[0][0]}</p><button class="mf-heart" type="button" aria-label="A little footnote"><span></span></button></div>
        </div>
      </div>
    </section>`;
  header.after(menu);

  const pill = $('.nav-pill', header);
  const buttons = $$('[data-menu]', header);
  const panels = { services: $('#menu-services', menu), footnotes: $('#menu-footnotes', menu) };
  /* design heights: where the page's top edge lands */
  const DEPTH = { services: 616, footnotes: 716 };

  /* ---------- Seattle date line ---------- */
  const seattle = options => new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', ...options }).format(new Date());
  function tick() {
    $('[data-year]', menu).textContent = `Spadafy © ${seattle({ year: 'numeric' })}`;
    $('[data-now]', menu).textContent = `${seattle({ weekday: 'long', month: 'long', day: 'numeric' })} · ${seattle({ hour: 'numeric', minute: '2-digit' })} in Seattle`;
  }
  tick(); setInterval(tick, 15000);

  /* ---------- logo: whole at the top, only the S once scrolled ---------- */
  const setScrolled = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  setScrolled();
  /* arrived through the seam: the S unfolds into the whole logo */
  if (root.classList.contains('from-seam') && !reduce) {
    header.classList.add('no-anim', 'is-small'); void header.offsetWidth; header.classList.remove('no-anim');
    setTimeout(() => header.classList.remove('is-small'), 450);
  }

  /* ---------- open / close: the page slides down off the menu ---------- */
  const SPEED = 6.6, LAG = .085;           /* a critically damped spring behind a short low-pass: soft start, no bounce */
  const PULL = 360, REST = 300, GRACE = 450, AT_LEAST = 160;   /* scroll needed to close (px), pause that forgets it, quiet time after opening, shortest gesture (ms) */
  const HOP = 200;                         /* how far the page dips on its way to another page */
  let open = null, openY = 0, openedAt = 0, depth = 0, eased = 0, speed = 0, raf = 0, last = 0;
  let override = null;                     /* a depth set by the page hand-over, instead of the menu's */
  let pull = 0, pullStart = 0, pullAt = 0, relax = 0, quick = false, leaving = false;

  function goal() {
    if (override !== null) return override;
    if (!open) return 0;
    const u = unit();
    /* while you scroll, the page gives a little before the menu lets go */
    return Math.min(DEPTH[open] * u, innerHeight - 64 * u) - pull * .3 * u;
  }
  /* back in place: remove every trace, and let the page redraw anything it measured meanwhile */
  function settle() {
    depth = eased = speed = 0;
    main.style.transform = main.style.clipPath = '';
    Object.values(panels).forEach(el => el.classList.remove('is-on'));
    if (!root.classList.contains('menu-on')) return;
    root.classList.remove('menu-on');
    requestAnimationFrame(() => window.dispatchEvent(new Event('scroll')));
  }
  function draw() {
    if (depth <= .5 && !open && !override) { settle(); return; }
    const u = unit(), k = Math.min(1, depth / (240 * u));
    /* the clip follows the scroll position, so the rounded top edge is always the top of what you were reading */
    const top = Math.max(0, window.scrollY - main.offsetTop);
    main.style.transform = `translate3d(0, ${depth.toFixed(2)}px, 0)`;
    main.style.clipPath = `inset(${top}px ${(8 * u * k).toFixed(2)}px 0 ${(8 * u * k).toFixed(2)}px round ${(60 * u * k).toFixed(2)}px ${(60 * u * k).toFixed(2)}px 0 0)`;
  }
  function frame(now) {
    const dt = Math.min(.1, Math.max(0, (now - last) / 1000)), n = Math.max(1, Math.ceil(dt * 120)), h = dt / n;
    last = now;
    const target = goal(), pace = quick ? 11 : SPEED, lag = quick ? .045 : LAG;     /* closed by scrolling: get out of the way sooner */
    for (let i = 0; i < n; i++) {
      eased += (target - eased) * (1 - Math.exp(-h / lag));
      speed += (pace * pace * (eased - depth) - 2 * pace * speed) * h;
      depth = Math.max(0, depth + speed * h);
    }
    const done = Math.abs(target - depth) < .4 && Math.abs(target - eased) < .4 && Math.abs(speed) < 3;
    if (done) { depth = eased = target; speed = 0; if (override === 0) override = null; }
    draw();
    raf = done ? 0 : requestAnimationFrame(frame);
  }
  function animate() {
    if (reduce) { depth = eased = goal(); if (override === 0) override = null; draw(); return; }
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }

  function showPanel(key) {
    Object.entries(panels).forEach(([name, el]) => el.classList.toggle('is-on', name === key));
  }
  function setOpen(key) {
    if (key === open || leaving) return;
    if (key) {
      /* end any smooth-scroll glide, or it would carry the page away from under the menu */
      if (!open && window.lenis) window.lenis.scrollTo(window.scrollY, { immediate: true, force: true });
      openY = window.scrollY; openedAt = performance.now();
      root.classList.add('menu-on');
      showPanel(key);                      /* on close the panel stays, so the page slides back over it */
    }
    open = key; override = null; pull = 0; quick = false; clearTimeout(relax);
    buttons.forEach(b => b.setAttribute('aria-expanded', String(b.dataset.menu === key)));
    Object.entries(panels).forEach(([name, el]) => { el.inert = name !== key; });
    if (!key) showPreview(null);
    root.classList.toggle('menu-open', !!key);
    animate();
  }
  /* close with no animation, for clicks that scroll the page: it must be back in place first */
  function snapShut() {
    if (!open && !depth) return;
    setOpen(null);
    cancelAnimationFrame(raf); raf = 0; override = null; settle();
  }

  buttons.forEach(b => b.addEventListener('click', () => setOpen(open === b.dataset.menu ? null : b.dataset.menu)));

  /* capture phase: runs before the pages' own anchor handlers */
  document.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (a && a.getAttribute('href') === '#' && menu.contains(a)) { e.preventDefault(); return; }
    if (!open) return;
    if (main.contains(e.target)) { e.preventDefault(); e.stopPropagation(); setOpen(null); return; }
    if (!a) return;
    if (a.hasAttribute('data-cookie-settings')) { setOpen(null); return; }
    const href = a.getAttribute('href');
    if (href.startsWith('mailto:')) return;
    /* a link to the page you are on goes to its top instead of reloading */
    if (menu.contains(a) && a.pathname === location.pathname && !a.hash) {
      e.preventDefault(); snapShut(); window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      return;
    }
    if (href.startsWith('#')) snapShut();
  }, true);

  document.addEventListener('keydown', e => {
    if (!open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      const b = buttons.find(x => x.dataset.menu === open);
      setOpen(null); b.focus({ preventScroll: true });
      return;
    }
    const typing = e.target.closest('input, textarea, select, button, a');
    if (!typing && ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) { e.preventDefault(); setOpen(null); }
  });

  /* scrolling closes the menu only once it is clearly meant: a light touch just nudges the page */
  function scrollIntent(e, amount) {
    const now = performance.now(), swallow = () => { if (e.cancelable) e.preventDefault(); e.stopImmediatePropagation(); };
    if (leaving) { swallow(); return; }
    if (!open) return;                     /* nothing is held back once the menu is closing */
    const panel = e.target.closest && e.target.closest('.menu-panel');
    if (panel && panel.scrollHeight > panel.clientHeight + 1) { e.stopImmediatePropagation(); return; }   /* a short window: the panel scrolls */
    swallow();
    if (now - openedAt < GRACE) return;
    if (now - pullAt > REST) { pull = 0; pullStart = now; }
    pullAt = now;
    pull = Math.min(PULL, pull + Math.min(amount, 90));
    clearTimeout(relax);
    relax = setTimeout(() => { pull = 0; if (open) animate(); }, REST);
    if (pull >= PULL && now - pullStart >= AT_LEAST) { setOpen(null); quick = true; } else animate();
  }
  addEventListener('wheel', e => {
    const amount = Math.abs(e.deltaY) * (e.deltaMode === 1 ? 16 : 1);
    if (amount) scrollIntent(e, amount);
  }, { capture: true, passive: false });
  let touchY = 0;
  addEventListener('touchstart', e => { touchY = e.touches[0].clientY; }, { passive: true });
  addEventListener('touchmove', e => {
    const y = e.touches[0].clientY, amount = Math.abs(y - touchY) * 2;
    touchY = y;
    scrollIntent(e, amount);
  }, { capture: true, passive: false });
  /* Runs before the pages' own scroll handlers. While the page is off its place they would measure it
     wrongly, so they wait; settle() sends one more scroll event when it is home. Dragging the
     scrollbar closes the menu too, after a real move. */
  addEventListener('scroll', e => {
    setScrolled();
    if (!depth && !open) return;
    if (open && Math.abs(window.scrollY - openY) > 120) setOpen(null);
    draw();
    if (depth > .5) e.stopImmediatePropagation();
  }, { capture: true, passive: true });
  addEventListener('resize', () => { if (open) animate(); });

  /* ---------- from page to page: the coin flips to the goat and back ---------- */
  const KEY = 'spadafy-nav';
  const flip = $('.nav-coin-flip', header);
  const later = (ms, fn) => setTimeout(fn, ms);
  const instantly = fn => { header.classList.add('no-anim'); fn(); void header.offsetWidth; header.classList.remove('no-anim'); };
  /* The turn shows one face at a time: away until it is edge-on, swap, back from the other edge.
     (Two faces stacked in 3D showed through each other in some browsers.) */
  const FOLD = 470, AWAY = 260, BACK = 340;
  const show = face => { flip.getAnimations().forEach(a => a.cancel()); flip.dataset.face = face; };
  const swing = (from, to, duration, easing) => flip.animate([{ transform: `rotateY(${from}deg)` }, { transform: `rotateY(${to}deg)` }], { duration, easing, fill: 'forwards' });
  function turn(face) {
    show(flip.dataset.face);
    swing(0, 90, AWAY, 'cubic-bezier(.5, 0, 1, .6)');
    later(AWAY, () => { show(face); swing(-90, 0, BACK, 'cubic-bezier(0, .4, .5, 1)'); });
  }
  /* back to the plain logo, wherever the turn got to */
  const plainLogo = () => instantly(() => { header.classList.remove('is-coin', 'is-small'); show('s'); });
  const store = {
    take() { try { const v = JSON.parse(sessionStorage.getItem(KEY)); sessionStorage.removeItem(KEY); return v && Date.now() - v.t < 8000 ? v : null; } catch (e) { return null; } },
    put(v) { try { sessionStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* private mode: the next page just loads */ } }
  };

  function leave(url) {
    leaving = true;
    if (!open) {                           /* no menu open: the page dips onto plain charcoal */
      if (window.lenis) window.lenis.scrollTo(window.scrollY, { immediate: true, force: true });
      showPanel(null); root.classList.add('menu-on');
    }
    override = open ? goal() : HOP * unit();
    root.classList.add('nav-fx', 'nav-leaving');
    animate();
    /* 1. the wordmark folds away; 2. the S turns into the goat */
    const fold = header.classList.contains('is-scrolled') ? 120 : FOLD;
    header.classList.add('is-small');
    later(fold, () => { if (!leaving) return; header.classList.add('is-coin'); turn('goat'); });
    later(fold + AWAY + BACK + 160, () => { store.put({ t: Date.now(), depth: override / unit() }); location.assign(url); });
    later(6000, () => { if (leaving) restore(); });     /* the page never came: give this one back */
  }
  function restore() {
    leaving = false; override = null;
    root.classList.remove('nav-leaving', 'nav-arriving');
    plainLogo();
    snapShut(); store.take();
  }
  /* the goat turns back into the S, then the wordmark unfolds */
  function flipBack() {
    turn('s');
    later(AWAY + BACK + 40, () => {
      if (leaving) return;
      header.classList.remove('is-coin');
      later(60, () => { if (!leaving) header.classList.remove('is-small'); });
    });
  }
  function arrive(state) {
    instantly(() => { header.classList.add('is-small', 'is-coin'); show('goat'); });
    /* whatever happens, the logo comes back */
    later(4000, () => { if (!leaving && header.classList.contains('is-coin')) plainLogo(); });
    /* wait for the page's own script to lay itself out before moving the page */
    const start = () => requestAnimationFrame(() => requestAnimationFrame(() => {
      override = depth = eased = Math.max(0, state.depth * unit());
      root.classList.add('menu-on');
      draw();
      root.classList.add('nav-fx');
      root.classList.remove('nav-arriving');
      later(140, () => { if (override !== null) { override = 0; animate(); } });
      later(420, flipBack);
    }));
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
  }

  /* any plain click on a link to another page of this site */
  addEventListener('click', e => {
    if (reduce || leaving || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download') || a.getAttribute('href').startsWith('#')) return;
    if (a.protocol !== location.protocol || a.host !== location.host || a.pathname === location.pathname) return;
    e.preventDefault();
    leave(a.href);
  });
  addEventListener('pageshow', e => { if (e.persisted) restore(); });
  const arriving = store.take();
  if (arriving && !reduce) arrive(arriving); else root.classList.remove('nav-arriving');

  /* ---------- Services: the picture follows the link you point at ---------- */
  const preview = $('.ms-preview', menu), previewTitle = $('.ms-title', menu);
  const images = {};
  function showPreview(key) {
    preview.classList.toggle('is-on', !!key);
    $$('.is-hot', panels.services).forEach(el => el.classList.remove('is-hot'));
    if (!key) return;
    $$(`[data-preview="${key}"]`, panels.services).forEach(el => el.classList.add('is-hot'));
    if (!images[key]) {
      const img = images[key] = new Image();
      img.src = PREVIEWS[key].img; img.alt = '';
      img.style.objectPosition = PREVIEWS[key].at || '50% 50%';
      preview.insertBefore(img, previewTitle);
      void img.offsetWidth;                /* so the first appearance fades in too */
    }
    let z = 0;
    Object.values(images).forEach(i => { z = Math.max(z, +i.style.zIndex || 0); });
    Object.values(images).forEach(i => i.classList.toggle('is-on', i === images[key]));
    images[key].style.zIndex = z + 1;
    previewTitle.textContent = PREVIEWS[key].title;
  }
  /* only the words and the button react; a short grace lets the pointer cross the gaps between links */
  let hideTimer = 0;
  const point = key => { clearTimeout(hideTimer); showPreview(key); };
  const unpoint = () => { clearTimeout(hideTimer); hideTimer = setTimeout(() => showPreview(null), 220); };
  $$('[data-preview]', panels.services).forEach(a => {
    a.addEventListener('pointerenter', () => point(a.dataset.preview));
    a.addEventListener('pointerleave', unpoint);
    a.addEventListener('focus', () => point(a.dataset.preview));
    a.addEventListener('blur', unpoint);
  });

  /* ---------- the heart and the goats ---------- */
  const heart = $('.mf-heart', menu), note = $('[data-note]', menu), egg = $('.mf-egg', menu);
  let step = 0;
  function setNote(i) {
    step = i;
    note.textContent = NOTES[i][0];
    egg.dataset.tone = NOTES[i][1];
    if (!reduce) note.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'ease-out' });
  }
  /* stickers from the Figma frame "Запускаем коз": [kind, centre x, centre y, Figma matrix m00 m01 m10 m11].
     Some of them are mirrored in the design, so the whole matrix is kept, not just an angle. */
  const TILT = [.96, .279, -.279, .96], LEAN = [.918, .398, -.398, .918], FLIP = [-.912, -.411, -.411, .912], SWAY = [.941, .338, -.338, .941];
  const GOATS = [
    ['pink', 841, 59, TILT], ['pink', 728, 459, TILT], ['pink', 1349, 274, TILT], ['pink', 240, 187, LEAN],
    ['green', 178, -103, [1, 0, 0, 1]], ['green', 1114, 81, FLIP], ['green', 1679, 76, FLIP], ['green', 418, 533, FLIP], ['green', 1203, 514, [-1, .027, .027, 1]],
    ['white', 519, -77, [.997, -.079, .079, .997]], ['white', 658, 215, SWAY], ['white', 1018, 335, SWAY], ['white', 1583, 330, SWAY], ['white', 1389, 31, SWAY], ['white', 1954, 26, SWAY]
  ];
  /* a Figma matrix, undoing the one already baked into the exported file, as a CSS transform */
  const place = ([a, b, c, d], [e, f, g, h] = [1, 0, 0, 1]) =>
    `matrix(${a * e + b * f}, ${c * e + d * f}, ${a * g + b * h}, ${c * g + d * h}, 0, 0)`;
  /* drawn size of each file and the rotation already baked into it */
  const ART = {
    pink: { src: ICON + 'goat-pink.png', w: 270, h: 281.5, baked: TILT },
    green: { src: ICON + 'goat-green.png', w: 213, h: 218 },
    white: { src: ICON + 'goat-white.svg', w: 120.739, h: 149.508 }
  };
  Object.values(ART).forEach(a => { new Image().src = a.src; });
  function releaseGoats() {
    const u = unit(), layer = document.createElement('div');
    layer.className = 'goats'; layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
    let longest = 0;
    [0, 900].forEach((wave, w) => GOATS.forEach(([kind, x, y, matrix], i) => {
      const art = ART[kind], img = new Image();
      img.src = art.src; img.alt = '';
      const cx = w ? (x + 330) % 1920 : x, pose = place(matrix, art.baked);
      Object.assign(img.style, { width: art.w * u + 'px', height: art.h * u + 'px', left: (cx - art.w / 2) * u + 'px', top: (y - art.h / 2) * u + 'px' });
      layer.appendChild(img);
      if (reduce) { img.style.transform = pose; return; }
      const from = -(950 * u), to = innerHeight + 350 * u, drift = (i % 2 ? 1 : -1) * (14 + i % 5 * 5);
      const duration = 2600 + (i * 173) % 900, delay = wave + (i * 97) % 450;
      longest = Math.max(longest, duration + delay);
      img.animate(
        [{ transform: `translateY(${from}px) rotate(${-drift}deg) ${pose}` }, { transform: `translateY(${to}px) rotate(${drift}deg) ${pose}` }],
        { duration, delay, easing: 'cubic-bezier(.35, .1, .65, .9)', fill: 'both' }
      );
    }));
    /* the goats have left: the first line returns */
    setTimeout(() => { layer.remove(); setNote(0); }, reduce ? 2500 : longest + 60);
  }
  heart.addEventListener('click', () => {
    if (step === NOTES.length - 1) return;           // the goats are still falling
    setNote(step + 1);
    if (step === NOTES.length - 1) releaseGoats();
  });

  window.SpadafyMenu = { open: setOpen, close: () => setOpen(null), isOpen: () => !!open, pill };
})();
