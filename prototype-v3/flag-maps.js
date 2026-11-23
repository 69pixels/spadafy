/* Spadafy — animated dotted world maps for the Green Flags cards.
   Ported from globe/src/components/ui/dotted-world-map.tsx (no build step).
   FlagMap.mount(el) reads el.dataset.map ('desktops' | 'customers' | 'regions' | 'timeline')
   and returns { setOpen(bool) }. Each map plays through once: closing its card pauses it,
   reopening continues where it stopped, and once finished it holds the final frame. */
(() => {
  'use strict';

  const { width: MAP_W, height: MAP_H, bounds: MAP_BOUNDS, points: MAP_POINTS } = window.FLAG_MAP_POINTS;
  const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  const SVG_OPEN = `<svg class="fm-layer" viewBox="0 0 ${MAP_W} ${MAP_H}" aria-hidden="true">`;

  /* ---------- data (representative locations, not real customer data) ---------- */
  const REGION_BOXES = {
    europe: [
      { lat: [36, 72], lng: [-25, 40] },
      { lat: [45, 72], lng: [40, 60] },
    ],
    northAmerica: [
      { lat: [15, 84], lng: [-170, -52] },
      { lat: [7, 15], lng: [-93, -77] },    // Central America
      { lat: [59, 84], lng: [-52, -20] },   // Greenland
    ],
    asia: [
      { lat: [12, 45], lng: [39, 180] },
      { lat: [28, 45], lng: [34, 39] },     // Levant
      { lat: [45, 78], lng: [60, 180] },
      { lat: [5, 12], lng: [72, 92] },      // South India
      { lat: [-11, 12], lng: [92, 141] },   // South-East Asia
    ],
  };

  // Flag 001 — twinkling "desktops"
  const DESKTOPS = {
    seed: 40000, count: 280,
    weights: { northAmerica: .5, europe: .3, asia: .15, rest: .05 },
    durationMs: [2000, 4000],
  };

  // Flag 002 — hub and spokes from the HQ
  const CUSTOMERS = {
    hq: { lat: 39.9, lng: -83, label: 'HQ · USA' },
    destinations: [
      { lat: 45.5, lng: -75 },
      { lat: 51, lng: -114 },
      { lat: 19.4, lng: -99.1 },
      { lat: 4.7, lng: -74.1 },
      { lat: -23.5, lng: -46.6, label: 'LATAM' },
      { lat: 51.5, lng: -0.1, label: 'Europe' },
      { lat: 50.1, lng: 8.7 },
      { lat: 59.3, lng: 18.1 },
      { lat: 40.4, lng: -3.7 },
      { lat: 25.2, lng: 55.3, label: 'Middle East' },
      { lat: 19.1, lng: 72.9 },
      { lat: 1.35, lng: 103.8, label: 'APAC' },
      { lat: 35.7, lng: 139.7 },
      { lat: -33.9, lng: 151.2 },
    ],
    staggerMs: 250, drawMs: 800,
  };

  // Flag 003 — three connected delivery regions
  const REGIONS = {
    hubs: [
      { id: 'northAmerica', lat: 46, lng: -100, label: 'North America' },
      { id: 'europe', lat: 50, lng: 12, label: 'Europe' },
      { id: 'asia', lat: 40, lng: 95, label: 'Asia' },
    ],
    // lift bends the arc up (positive) or down (negative), relative to its length
    links: [
      { from: 'northAmerica', to: 'europe', lift: .25 },
      { from: 'europe', to: 'asia', lift: .25 },
      { from: 'asia', to: 'northAmerica', lift: -.2 },   // bows under Europe so the arcs read as a triangle
    ],
    tripMs: 6000,
  };

  // Flag 004 — growth over time
  const TIMELINE = {
    seed: 2011, count: 520, from: 2011, to: 2026, durationMs: 5000,
    weights: { northAmerica: .4, europe: .25, asia: .25, rest: .1 },
    phases: [
      { region: 'northAmerica', origin: { lat: 39.9, lng: -83 }, years: [2011, 2016] },
      { region: 'europe', origin: { lat: 51.5, lng: -0.1 }, years: [2015, 2019] },
      { region: 'asia', origin: { lat: 25.2, lng: 55.3 }, years: [2018, 2023] },
      { region: 'rest', origin: { lat: 39.9, lng: -83 }, years: [2021, 2025.5] },
    ],
  };

  /* ---------- geometry ---------- */
  const DOT_R = .3;
  const REGION_ORDER = Object.keys(REGION_BOXES);

  function regionOf({ lat, lng }) {
    for (const id of REGION_ORDER) {
      for (const b of REGION_BOXES[id]) {
        if (lat >= b.lat[0] && lat <= b.lat[1] && lng >= b.lng[0] && lng <= b.lng[1]) return id;
      }
    }
    return 'rest';
  }

  const DOTS = [];
  for (let i = 0; i < MAP_POINTS.length; i += 4) {
    const [x, y, lat, lng] = MAP_POINTS.slice(i, i + 4);
    DOTS.push({ x, y, lat, lng, region: regionOf({ lat, lng }) });
  }

  // Many circles as a single path — one DOM node instead of thousands
  const circlesPath = (pts, r = DOT_R) =>
    pts.map(({ x, y }) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`).join('');
  const BASE_PATH = circlesPath(DOTS);

  // Ellipsoidal Mercator, matching dotted-map's proj4 projection
  const WGS84_A = 6378137, WGS84_E = .0818191908426215;
  function project({ lat, lng }) {
    const phi = lat * Math.PI / 180;
    const es = WGS84_E * Math.sin(phi);
    const mx = WGS84_A * lng * Math.PI / 180;
    const my = WGS84_A * Math.log(Math.tan(Math.PI / 4 + phi / 2) * ((1 - es) / (1 + es)) ** (WGS84_E / 2));
    return {
      x: MAP_W * (mx - MAP_BOUNDS.xMin) / MAP_BOUNDS.xRange,
      y: MAP_H * (MAP_BOUNDS.yMax - my) / MAP_BOUNDS.yRange,
    };
  }

  // Quadratic arc; control point lifted above (or below) the midpoint, peak kept inside the map
  function arc(from, to, lift = .3) {
    const mx = (from.x + to.x) / 2, my = (from.y + to.y) / 2;
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const control = { x: mx, y: Math.max(my - dist * lift, 2 - my) };
    return { d: `M${from.x} ${from.y}Q${control.x} ${control.y} ${to.x} ${to.y}`, from, control, to };
  }
  function pointOnArc({ from, control, to }, t) {
    const u = 1 - t;
    return {
      x: u * u * from.x + 2 * u * t * control.x + t * t * to.x,
      y: u * u * from.y + 2 * u * t * control.y + t * t * to.y,
    };
  }

  function seededRandom(seed) {   // mulberry32
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Deterministic weighted sample of land dots, by region
  function sampleDots(count, weights, rand) {
    const picked = [];
    for (const region of Object.keys(weights)) {
      const pool = DOTS.filter(d => d.region === region);
      const n = Math.min(pool.length, Math.round(count * weights[region]));
      for (let i = 0; i < n; i++) {   // partial Fisher–Yates
        const j = i + Math.floor(rand() * (pool.length - i));
        [pool[i], pool[j]] = [pool[j], pool[i]];
        picked.push(pool[i]);
      }
    }
    return picked;
  }

  // Great-circle distance in radians
  function distance(a, b) {
    const r = Math.PI / 180;
    const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
    return 2 * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  // Per-element animation timing, read by the .fm-* classes in styles.css
  const timing = (delayMs, durMs) =>
    `--fm-delay:${Math.round(delayMs)}ms` + (durMs !== undefined ? `;--fm-dur:${Math.round(durMs)}ms` : '');
  const label = (at, text, cls = '', style = '') =>
    `<div class="fm-label ${cls}" style="left:${at.x / MAP_W * 100}%;top:${at.y / MAP_H * 100}%;${style}">${text}</div>`;

  /* ---------- 1. desktops — region-weighted dots twinkle on (CSS only) ---------- */
  const DESKTOP_DOTS = (() => {
    const rand = seededRandom(DESKTOPS.seed);
    const [minMs, maxMs] = DESKTOPS.durationMs;
    return sampleDots(DESKTOPS.count, DESKTOPS.weights, rand).map(d => {
      const durMs = minMs + rand() * (maxMs - minMs);
      return { ...d, durMs, delayMs: rand() * durMs };
    });
  })();

  function desktops(el) {
    el.insertAdjacentHTML('beforeend', `${SVG_OPEN}<g class="fm-fade fm-hl" style="${timing(0, 800)}">${
      DESKTOP_DOTS.map(d => `<circle cx="${d.x}" cy="${d.y}" r="${DOT_R * 1.15}" class="fm-twinkle" style="${timing(d.delayMs, d.durMs)}"/>`).join('')
    }</g></svg>`);
    return { totalMs: Math.max(...DESKTOP_DOTS.map(d => d.delayMs + d.durMs)) };
  }

  /* ---------- 2. customers — hub and spokes from the HQ (CSS only) ---------- */
  const HQ = project(CUSTOMERS.hq);
  const CUSTOMER_ARCS = CUSTOMERS.destinations.map(dest => {
    const to = project(dest);
    return { ...dest, to, arc: arc(HQ, to) };
  });
  const POP_MS = 450, PULSE_MS = 2400, PULSES = 2;   // keep in sync with .fm-pulse in styles.css
  const landAt = i => i * CUSTOMERS.staggerMs + CUSTOMERS.drawMs;

  function customers(el) {
    el.insertAdjacentHTML('beforeend', `${SVG_OPEN}<g class="fm-arcs">${
      CUSTOMER_ARCS.map((a, i) => `<path d="${a.arc.d}" pathLength="1" class="fm-draw" style="${timing(i * CUSTOMERS.staggerMs, CUSTOMERS.drawMs)}"/>`).join('')
    }</g><g class="fm-hl">${
      CUSTOMER_ARCS.map((a, i) => `<circle cx="${a.to.x}" cy="${a.to.y}" r=".55" class="fm-pop" style="${timing(landAt(i), POP_MS)}"/>`).join('')
    }
        <circle cx="${HQ.x}" cy="${HQ.y}" r=".9" class="fm-pulse" opacity="0"/>
        <circle cx="${HQ.x}" cy="${HQ.y}" r=".9"/>
      </g></svg>${
      CUSTOMER_ARCS.map((a, i) => a.label ? label(a.to, a.label, 'fm-fade fm-desk', timing(landAt(i), 400)) : '').join('')
    }${label(HQ, CUSTOMERS.hq.label)}`);
    return { totalMs: Math.max(landAt(CUSTOMER_ARCS.length - 1) + POP_MS, PULSE_MS * PULSES) };
  }

  /* ---------- 3. regions — three highlighted regions linked by arcs ---------- */
  const REGION_PATH = circlesPath(DOTS.filter(d => d.region !== 'rest'));
  const HUBS = REGIONS.hubs.map(h => ({ ...h, at: project(h) }));
  const hubAt = id => HUBS.find(h => h.id === id).at;
  const REGION_ARCS = REGIONS.links.map(({ from, to, lift }) => arc(hubAt(from), hubAt(to), lift));
  const REGION_DRAW_MS = 1200, REGION_STAGGER_MS = 300;
  const REGION_INTRO_MS = 600 + (REGION_ARCS.length - 1) * REGION_STAGGER_MS + REGION_DRAW_MS;
  const TRIP_STAGGER = .25;   // in trips

  function regions(el) {
    el.insertAdjacentHTML('beforeend', `${SVG_OPEN}
      <path d="${REGION_PATH}" class="fm-fade fm-hl" style="${timing(0, 800)}"/>
      <g class="fm-arcs">${REGION_ARCS.map((a, i) => `<path d="${a.d}" pathLength="1" class="fm-draw" style="${timing(600 + i * REGION_STAGGER_MS, REGION_DRAW_MS)}"/>`).join('')}</g>
      <g class="fm-hl">
        ${HUBS.map(h => `<circle cx="${h.at.x}" cy="${h.at.y}" r=".6"/>`).join('')}
        ${REGION_ARCS.map(a => `<circle class="fm-traveller" cx="${a.from.x}" cy="${a.from.y}" r=".5" opacity="0"/>`).join('')}
      </g></svg>${HUBS.map(h => label(h.at, h.label, 'fm-fade fm-desk', timing(400, 600))).join('')}`);
    const travellers = [...el.querySelectorAll('.fm-traveller')];

    // Once the arcs are drawn, one dot travels each arc a single time
    function frame(ms) {
      const t = (ms - REGION_INTRO_MS) / REGIONS.tripMs;
      REGION_ARCS.forEach((a, i) => {
        const p = t - i * TRIP_STAGGER;
        const on = p > 0 && p < 1;
        if (on) {
          const { x, y } = pointOnArc(a, p);
          travellers[i].setAttribute('cx', x);
          travellers[i].setAttribute('cy', y);
        }
        travellers[i].setAttribute('opacity', on ? Math.sin(Math.PI * p) : 0);
      });
    }
    return { totalMs: REGION_INTRO_MS + REGIONS.tripMs * (1 + (REGION_ARCS.length - 1) * TRIP_STAGGER), frame };
  }

  /* ---------- 4. timeline — dots light up year by year (CSS only) ---------- */
  const TIMELINE_DOTS = (() => {
    const dots = sampleDots(TIMELINE.count, TIMELINE.weights, seededRandom(TIMELINE.seed));
    const span = TIMELINE.to - TIMELINE.from;
    return TIMELINE.phases.flatMap(({ region, origin, years: [first, last] }) => {
      const inPhase = dots.filter(d => d.region === region);
      const dists = inPhase.map(d => distance(origin, d));
      const maxDist = Math.max(...dists, 1e-6);
      return inPhase.map((d, i) => {
        const startYear = first + (last - first) * dists[i] / maxDist;
        return { ...d, delayMs: (startYear - TIMELINE.from) / span * TIMELINE.durationMs };
      });
    });
  })();

  function timeline(el) {
    el.insertAdjacentHTML('beforeend', `${SVG_OPEN}<g class="fm-hl">${
      TIMELINE_DOTS.map(d => `<circle cx="${d.x}" cy="${d.y}" r="${DOT_R * 1.15}" class="fm-light" style="${timing(d.delayMs, 500)}"/>`).join('')
    }</g></svg>`);
    return { totalMs: Math.max(...TIMELINE_DOTS.map(d => d.delayMs)) + 500 };
  }

  /* ---------- mount ---------- */
  const VARIANTS = { desktops, customers, regions, timeline };

  // idle (not opened yet) → play (data-paused while closed) → static (finished, or reduced motion)
  function mount(el) {
    el.innerHTML = `${SVG_OPEN}<path d="${BASE_PATH}" class="fm-base"/></svg>`;
    const v = VARIANTS[el.dataset.map](el);
    let open = false, elapsed = 0, raf = 0;
    el.dataset.state = 'idle';

    function finish() {
      cancelAnimationFrame(raf);
      el.dataset.state = 'static';
      el.removeAttribute('data-paused');
      if (v.frame) v.frame(Infinity);
    }
    // Played time only advances while open, in step with the paused/running CSS animations
    function run() {
      let last = performance.now();
      const tick = now => {
        elapsed += now - last;
        last = now;
        if (elapsed >= v.totalMs) { finish(); return; }
        if (v.frame) v.frame(elapsed);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }
    function apply() {
      if (el.dataset.state === 'static') return;
      if (open) {
        el.removeAttribute('data-paused');
        el.dataset.state = 'play';
        run();
      } else if (el.dataset.state === 'play') {
        cancelAnimationFrame(raf);
        el.setAttribute('data-paused', '');
      }
    }
    if (mqReduce.matches) finish();
    mqReduce.addEventListener('change', () => { if (mqReduce.matches) finish(); });

    return {
      setOpen(next) {
        if (next === open) return;
        open = next;
        apply();
      },
    };
  }

  window.FlagMap = { mount };
})();
