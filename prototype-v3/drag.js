/* Spadafy — drag rows. Any [data-drag] scroller gets mouse drag-to-scroll (touch and trackpads
   scroll natively) and the "← Drag →" pill trailing the pointer while it's over the row.
   Same behaviour as the homepage team row (script.js); used by the Related services cards. */
(() => {
  'use strict';
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

  function dragScroll(view) {
    const items = () => Array.from(view.children);
    let drag = null, dragged = false;
    const step = () => { const it = items(); return it.length > 1 ? it[1].offsetLeft - it[0].offsetLeft : view.clientWidth; };
    const max = () => view.scrollWidth - view.clientWidth;
    view.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || max() <= 2) return;
      drag = { x: e.clientX, left: view.scrollLeft, moved: false, id: e.pointerId };
    });
    view.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 4) { drag.moved = true; view.classList.add('is-drag'); view.setPointerCapture(drag.id); }
      if (drag.moved) view.scrollLeft = drag.left - dx;
    });
    const end = () => {
      if (!drag) return;
      const moved = drag.moved, from = drag.left;
      drag = null;
      if (!moved) return;
      dragged = true; setTimeout(() => { dragged = false; }, 0);
      // settle on the nearest card in the direction of the drag
      const s = step(), raw = view.scrollLeft / s;
      const i = view.scrollLeft > from ? Math.ceil(raw - .15) : Math.floor(raw + .15);
      const left = clamp(i * s, 0, max());
      view.scrollTo({ left, behavior: reduce ? 'auto' : 'smooth' });
      const release = () => view.classList.remove('is-drag');
      if (reduce || Math.abs(view.scrollLeft - left) < 2) release();
      else { let t = 0; const done = () => { clearTimeout(t); view.removeEventListener('scrollend', done); release(); }; view.addEventListener('scrollend', done); t = setTimeout(done, 700); }
    };
    view.addEventListener('pointerup', end);
    view.addEventListener('pointercancel', end);
    view.addEventListener('lostpointercapture', end);
    view.addEventListener('dragstart', e => e.preventDefault());
    // a drag must not also open the card it started on
    view.addEventListener('click', e => { if (dragged) { e.preventDefault(); e.stopPropagation(); } }, true);
    return () => view.classList.toggle('can-drag', max() > 2);
  }

  function dragHint(scroller, host) {
    const hint = document.createElement('span');
    hint.className = 'drag-hint'; hint.setAttribute('aria-hidden', 'true');
    hint.innerHTML = '<span class="drag-hint-pill"><span class="dh-l">←</span>Drag<span class="dh-r">→</span></span>';
    host.appendChild(hint);
    let hx = 0, hy = 0, htx = 0, hty = 0, on = false;
    const target = e => { const r = host.getBoundingClientRect(); htx = e.clientX - r.left; hty = e.clientY - r.top; };
    const tick = () => {
      if (!on) return;
      hx = reduce ? htx : lerp(hx, htx, .25); hy = reduce ? hty : lerp(hy, hty, .25);
      hint.style.transform = `translate(${hx.toFixed(1)}px, ${hy.toFixed(1)}px)`;
      requestAnimationFrame(tick);
    };
    scroller.addEventListener('pointerenter', e => {
      if (e.pointerType !== 'mouse' || !finePointer.matches || !scroller.classList.contains('can-drag')) return;
      target(e); hx = htx; hy = hty;
      if (!on) { on = true; requestAnimationFrame(tick); }
      hint.classList.add('is-on'); scroller.classList.add('has-hint');
    });
    scroller.addEventListener('pointermove', e => { if (on) target(e); });
    scroller.addEventListener('pointerleave', () => { on = false; hint.classList.remove('is-on'); scroller.classList.remove('has-hint'); });
  }

  const syncs = $$('[data-drag]').map(view => { const sync = dragScroll(view); dragHint(view, view.parentElement); return sync; });
  const sync = () => syncs.forEach(f => f());
  sync();
  addEventListener('resize', sync);
  addEventListener('load', sync);
})();
