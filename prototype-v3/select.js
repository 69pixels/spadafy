/* Spadafy — custom dropdown for .field-select. The native <select> stays in the form (hidden,
   kept in sync) so the value still submits; a button + listbox replaces it on screen.
   Keyboard: Enter/Space/↓ open, ↑↓ Home End move, Enter/Space pick, Esc/Tab close, letters jump. */
(() => {
  'use strict';
  const CHECK = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.9 9.7l3.66 3.65 7.32-7.27" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
  let uid = 0;

  document.querySelectorAll('.field-select').forEach(label => {
    const sel = label.querySelector('select'); if (!sel) return;
    const n = ++uid;
    // a <label> would forward clicks on the list to the hidden select, so the wrapper becomes a div
    const box = document.createElement('div');
    box.className = label.className + ' csel';
    if (label.hasAttribute('style')) box.setAttribute('style', label.getAttribute('style'));
    while (label.firstChild) box.appendChild(label.firstChild);
    label.replaceWith(box);
    // the page's reveal was watching the old <label>: take over its fade-in
    if (box.classList.contains('rv') && !box.classList.contains('in')) {
      const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { box.classList.add('in'); io.disconnect(); } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
      io.observe(box);
    }
    const name = box.querySelector('.sr-only');
    if (name) name.id = name.id || `csel-l${n}`;
    sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true');

    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'csel-btn';
    btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', `csel-list${n}`);
    if (name) btn.setAttribute('aria-labelledby', `${name.id} csel-v${n}`);
    btn.innerHTML = `<span id="csel-v${n}"></span>`;
    const val = btn.firstChild;

    const list = document.createElement('ul');
    list.className = 'csel-list'; list.id = `csel-list${n}`; list.setAttribute('data-lenis-prevent', ''); list.setAttribute('role', 'listbox'); list.tabIndex = -1;
    if (name) list.setAttribute('aria-labelledby', name.id);
    const opts = [...sel.options].map((o, i) => {
      const li = document.createElement('li');
      li.className = 'csel-opt'; li.id = `csel-o${n}-${i}`; li.setAttribute('role', 'option'); li.style.setProperty('--i', i);
      li.innerHTML = `<span></span>${CHECK}`; li.firstChild.textContent = o.textContent;
      list.appendChild(li);
      return li;
    });
    box.insertBefore(btn, sel);
    document.body.appendChild(list);

    let active = -1, open = false, typed = '', typedT = 0;
    // under the field, or over it when the window has more room above; follows the field while open
    const place = () => {
      const r = box.getBoundingClientRect(), gap = 8 * (r.width / 500), need = list.scrollHeight;
      const below = innerHeight - r.bottom - gap, above = r.top - gap;
      const up = below < need && above > below;
      list.classList.toggle('up', up);
      list.style.left = r.left + 'px'; list.style.width = r.width + 'px';
      list.style.maxHeight = Math.max(160, (up ? above : below) - 12) + 'px';
      list.style.top = up ? Math.max(8, r.top - gap - Math.min(need, above - 12)) + 'px' : (r.bottom + gap) + 'px';
      if (r.bottom < 0 || r.top > innerHeight) hide(false);
    };
    const sync = () => {
      val.textContent = sel.options[sel.selectedIndex]?.textContent || '';
      opts.forEach((li, i) => li.setAttribute('aria-selected', String(i === sel.selectedIndex)));
    };
    const setActive = i => {
      active = Math.max(0, Math.min(opts.length - 1, i));
      opts.forEach((li, k) => li.classList.toggle('is-active', k === active));
      list.setAttribute('aria-activedescendant', opts[active].id);
      const li = opts[active], top = li.offsetTop, bot = top + li.offsetHeight;
      if (top < list.scrollTop) list.scrollTop = top - 8; else if (bot > list.scrollTop + list.clientHeight) list.scrollTop = bot - list.clientHeight + 8;
    };
    const show = () => {
      if (open) return; open = true;
      place();
      box.classList.add('is-open'); list.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true');
      addEventListener('scroll', place, { passive: true }); addEventListener('resize', place);
      setActive(sel.selectedIndex);
      list.focus({ preventScroll: true });
    };
    const hide = (refocus = true) => {
      if (!open) return; open = false;
      box.classList.remove('is-open'); list.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false');
      removeEventListener('scroll', place); removeEventListener('resize', place);
      opts.forEach(li => li.classList.remove('is-active'));
      if (refocus) btn.focus({ preventScroll: true });
    };
    const pick = i => {
      if (i !== sel.selectedIndex) { sel.selectedIndex = i; sel.dispatchEvent(new Event('change', { bubbles: true })); }
      sync(); hide();
    };

    btn.addEventListener('click', () => (open ? hide() : show()));
    btn.addEventListener('keydown', e => {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); show(); }
    });
    list.addEventListener('keydown', e => {
      const k = e.key;
      if (k === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
      else if (k === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
      else if (k === 'Home') { e.preventDefault(); setActive(0); }
      else if (k === 'End') { e.preventDefault(); setActive(opts.length - 1); }
      else if (k === 'Enter' || k === ' ') { e.preventDefault(); pick(active); }
      else if (k === 'Escape') { e.preventDefault(); hide(); }
      else if (k === 'Tab') { hide(false); }
      else if (k.length === 1) {               // type-ahead
        clearTimeout(typedT); typed += k.toLowerCase(); typedT = setTimeout(() => { typed = ''; }, 600);
        const i = opts.findIndex(li => li.textContent.toLowerCase().startsWith(typed));
        if (i > -1) setActive(i);
      }
    });
    list.addEventListener('pointermove', e => { const li = e.target.closest('.csel-opt'); if (li) setActive(opts.indexOf(li)); });
    list.addEventListener('click', e => { const li = e.target.closest('.csel-opt'); if (li) pick(opts.indexOf(li)); });
    document.addEventListener('pointerdown', e => { if (open && !box.contains(e.target) && !list.contains(e.target)) hide(false); });
    sel.addEventListener('change', sync);
    sel.form?.addEventListener('reset', () => setTimeout(sync, 0));
    sync();
  });
})();
