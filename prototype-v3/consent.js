/* =========================================================
   Spadafy — cookie consent
   Self-contained: include consent.css + this file on any page.

   - Nothing but strictly necessary storage runs until the visitor chooses.
   - "Reject all" is as easy as "Accept all": same size, same place, one click.
   - The choice is kept for 12 months (localStorage "spadafy-consent"), then asked again,
     or sooner if POLICY_VERSION changes.
   - Any element with [data-cookie-settings] reopens the settings.
   - Third-party tags wait until allowed. Mark them up like:
       <script type="text/plain" data-consent="analytics" data-src="https://…"></script>
     and they are switched on the moment that category is allowed.
   - Other code can read the choice:
       window.spadafyConsent.get()  → { analytics: bool, marketing: bool, ts } or null
       document.addEventListener('spadafy:consent', e => e.detail)
   ========================================================= */
(() => {
  'use strict';
  const KEY = 'spadafy-consent';
  const POLICY_VERSION = 1;
  const MAX_AGE = 365 * 24 * 60 * 60 * 1000;
  const POLICY_URL = 'privacy-policy.html';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CATS = [
    { id: 'necessary', title: 'Strictly necessary', text: 'Keeps the site working and remembers this choice. These can’t be switched off.', locked: true },
    { id: 'analytics', title: 'Analytics', text: 'Counts visits and shows us which pages are useful, so we can make them better. Aggregated, never sold.' },
    { id: 'marketing', title: 'Marketing', text: 'Measures our campaigns and lets us show relevant ads on other sites.' }
  ];

  /* ---------- storage ---------- */
  function read() {
    try {
      const c = JSON.parse(localStorage.getItem(KEY));
      if (!c || c.v !== POLICY_VERSION || Date.now() - c.ts > MAX_AGE) return null;
      return c;
    } catch (e) { return null; }
  }
  function save(choice) {
    const c = { v: POLICY_VERSION, ts: Date.now(), necessary: true, analytics: !!choice.analytics, marketing: !!choice.marketing };
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { /* private mode: the choice lasts this page view */ }
    apply(c);
    document.dispatchEvent(new CustomEvent('spadafy:consent', { detail: c }));
    return c;
  }
  /* switch on any tags the visitor has now allowed */
  function apply(c) {
    document.querySelectorAll('script[type="text/plain"][data-consent]').forEach(tag => {
      if (!c[tag.dataset.consent] || tag.dataset.done) return;
      const s = document.createElement('script');
      [...tag.attributes].forEach(a => { if (!['type', 'data-consent', 'data-src'].includes(a.name)) s.setAttribute(a.name, a.value); });
      if (tag.dataset.src) s.src = tag.dataset.src; else s.textContent = tag.textContent;
      tag.dataset.done = '1';
      tag.after(s);
    });
  }

  /* ---------- banner ---------- */
  const banner = document.createElement('section');
  banner.className = 'ck-banner';
  banner.setAttribute('aria-labelledby', 'ck-title');
  banner.setAttribute('aria-describedby', 'ck-text');
  banner.innerHTML = `
    <div class="ck-head">
      <span class="ck-mark" aria-hidden="true"></span>
      <h2 class="ck-title" id="ck-title">Cookies, your call.</h2>
    </div>
    <p class="ck-text" id="ck-text">We use strictly necessary cookies to run this site. With your OK, we’d also use analytics to see which pages help, and marketing cookies to measure our campaigns. <a href="${POLICY_URL}#cookies">Read our Privacy Policy</a>.</p>
    <div class="ck-btns">
      <button class="ck-btn" type="button" data-ck="reject">Reject all</button>
      <button class="ck-btn" type="button" data-ck="accept">Accept all</button>
    </div>
    <button class="ck-link" type="button" data-ck="settings">Choose what to allow</button>`;

  /* ---------- settings dialog ---------- */
  const dlg = document.createElement('dialog');
  dlg.className = 'ck-dialog';
  dlg.setAttribute('aria-labelledby', 'ck-d-title');
  dlg.setAttribute('data-lenis-prevent', '');
  dlg.innerHTML = `
    <form class="ck-panel" method="dialog">
      <button class="ck-close" type="button" data-ck="close" aria-label="Close cookie settings"></button>
      <h2 class="ck-d-title" id="ck-d-title">Cookie settings</h2>
      <p class="ck-d-text">Choose which cookies we can use. You can change this any time from the <a href="${POLICY_URL}#cookies">Privacy Policy</a>.</p>
      <ul class="ck-cats">
        ${CATS.map(c => `
        <li class="ck-cat">
          <div class="ck-cat-text">
            <h3 class="ck-cat-t" id="ck-${c.id}-t">${c.title}</h3>
            <p class="ck-cat-d" id="ck-${c.id}-d">${c.text}</p>
          </div>
          <label class="ck-switch">
            <input type="checkbox" role="switch" name="${c.id}" aria-labelledby="ck-${c.id}-t" aria-describedby="ck-${c.id}-d" ${c.locked ? 'checked disabled' : ''}>
            <span class="ck-track" aria-hidden="true"></span>
            <span class="ck-state" aria-hidden="true">${c.locked ? 'Always on' : ''}</span>
          </label>
        </li>`).join('')}
      </ul>
      <div class="ck-d-btns">
        <button class="ck-btn ck-btn-ghost" type="button" data-ck="reject">Reject all</button>
        <button class="ck-btn ck-btn-ghost" type="button" data-ck="save">Save my choices</button>
        <button class="ck-btn" type="button" data-ck="accept">Accept all</button>
      </div>
    </form>`;

  const inputs = () => [...dlg.querySelectorAll('input[name]:not([disabled])')];
  function syncStates() {
    inputs().forEach(i => { i.parentElement.querySelector('.ck-state').textContent = i.checked ? 'On' : 'Off'; });
  }
  function showBanner() {
    if (banner.isConnected && banner.classList.contains('on')) return;
    document.body.prepend(banner);
    requestAnimationFrame(() => requestAnimationFrame(() => banner.classList.add('on')));
  }
  function hideBanner() {
    if (!banner.isConnected) return;
    banner.classList.remove('on'); banner.classList.add('off');
    setTimeout(() => { banner.remove(); banner.classList.remove('off'); }, reduce ? 0 : 500);
  }
  let opener = null;
  function openSettings() {
    const c = read() || { analytics: false, marketing: false };
    inputs().forEach(i => { i.checked = !!c[i.name]; });
    syncStates();
    opener = document.activeElement;
    if (!dlg.isConnected) document.body.appendChild(dlg);
    dlg.showModal();
    requestAnimationFrame(() => requestAnimationFrame(() => dlg.classList.add('on')));
  }
  function closeSettings() {
    if (!dlg.open) return;
    dlg.classList.remove('on');
    setTimeout(() => { dlg.close(); if (opener && opener.focus) opener.focus({ preventScroll: true }); }, reduce ? 0 : 300);
  }
  function decide(kind) {
    if (kind === 'accept') save({ analytics: true, marketing: true });
    else if (kind === 'reject') save({ analytics: false, marketing: false });
    else if (kind === 'save') save(Object.fromEntries(inputs().map(i => [i.name, i.checked])));
    hideBanner(); closeSettings();
    toast(kind === 'accept' ? 'All cookies allowed.' : kind === 'reject' ? 'Only strictly necessary cookies.' : 'Your choices are saved.');
  }

  /* a small confirmation so the click visibly did something */
  const live = document.createElement('p');
  live.className = 'ck-toast'; live.setAttribute('role', 'status');
  let toastT = 0;
  function toast(msg) {
    if (!live.isConnected) document.body.appendChild(live);
    live.textContent = msg; live.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(() => live.classList.remove('on'), 2600);
  }

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-ck]');
    if (b) {
      const k = b.dataset.ck;
      if (k === 'settings') openSettings();
      else if (k === 'close') closeSettings();
      else decide(k);
      return;
    }
    if (e.target.closest('[data-cookie-settings]')) { e.preventDefault(); openSettings(); }
  });
  dlg.addEventListener('change', syncStates);
  dlg.addEventListener('cancel', e => { e.preventDefault(); closeSettings(); });
  dlg.addEventListener('click', e => { if (e.target === dlg) closeSettings(); });

  window.spadafyConsent = {
    get: () => { const c = read(); return c ? { analytics: c.analytics, marketing: c.marketing, ts: c.ts } : null; },
    open: openSettings,
    reset: () => { try { localStorage.removeItem(KEY); } catch (e) {} showBanner(); }
  };

  const start = () => { const c = read(); if (c) apply(c); else setTimeout(showBanner, reduce ? 0 : 700); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
