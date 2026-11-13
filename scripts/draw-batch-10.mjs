#!/usr/bin/env node
// Batch 10: gameplay and HUD (filled + sticker), the last 14 to 128. Shared rules in draw-lib.mjs.
//   node scripts/draw-batch-10.mjs            → writes icons/filled + icons/sticker
//   node scripts/draw-batch-10.mjs <outDir>   → writes <outDir>/… (for trying changes)
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { P, circle, rrect, poly, rotate, rectPts, bandPoly, offsetPoly, crescent, clipPlanes, pathToPolys, HEART_RED, raised, recess, groove, fillRole, UP, writeIcons } from './draw-lib.mjs';

const OUT = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'icons');
const icons = {};
const toD = (pts) => 'M' + pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L');

// heart (same path as the core heart); the filled heart draws it with a 2-wide soft stroke
const HEART = 'M12 20.4C10.9 20.4 3 15.6 3 9.6A5.1 5.1 0 0 1 12 6.7A5.1 5.1 0 0 1 21 9.6C21 15.6 13.1 20.4 12 20.4z';
const heartParts = (extra = {}) => ({ solid: HEART, ...extra });

// ── heart-crack: the heart split along a zigzag ──
{
  const crack = [[12, 4], [10.4, 9.6], [13.4, 13], [10.8, 16.4], [12, 23]];
  const heartPts = pathToPolys(HEART)[0].pts;
  const half = 0.7 + 1; // half the gap + the 2-wide soft stroke
  // each crack segment, between its two y's, keeps what lies left (or right) of the segment line
  const piece = (side) => crack.slice(0, -1).map((a, i) => {
    const b = crack[i + 1], [dx, dy] = [b[0] - a[0], b[1] - a[1]], L = Math.hypot(dx, dy);
    const s = (p) => side * (dx * (p[1] - a[1]) - dy * (p[0] - a[0])) / L - half;
    const pts = clipPlanes(heartPts, [(p) => p[1] - a[1], (p) => b[1] - p[1], s]);
    return pts.length > 2 ? poly(pts) : '';
  }).join(' ');
  icons['heart-crack'] = {
    fixed: HEART_RED,
    // both styles use the two halves: in the sticker the outline fills the gap, so the crack
    // runs dark from edge to edge instead of fading into the shading at 16px
    parts: [{ solid: `${piece(1)} ${piece(-1)}`, soft: 2 }],
    shine: 'M6.6 8.4 5.6 9.8',
  };
}

// ── heart-plus: extra life (plus cut into the heart) ──
{
  const plus = [[10.7, 8.6], [13.3, 8.6], [13.3, 11.2], [15.9, 11.2], [15.9, 13.8], [13.3, 13.8], [13.3, 16.4], [10.7, 16.4], [10.7, 13.8], [8.1, 13.8], [8.1, 11.2], [10.7, 11.2]];
  icons['heart-plus'] = {
    fixed: HEART_RED,
    parts: [{ solid: HEART, cut: (g) => [offsetPoly(plus, g)], soft: 2 }],
    detail: () => [...raised(poly(plus))],
    shine: 'M6.6 8.4 5.6 9.8',
  };
}

// ── heart-empty / heart-half: health-bar slots (Zelda-style hearts) ──
// Filled: the heart's outline at the 2.8 line weight (half: plus the left half solid).
// Sticker: same outline; the empty part is a dark wine "container", the full part the heart's red.
{
  const EMPTY = ['#b77b91', '#472436', '#683b50', '#a56780', '#dca6ba'];
  // the heart pulled in a little so the 2.8 ring's outer edge matches the filled heart's (path + 1)
  const inner = pathToPolys(HEART)[0].pts.map(([x, y]) => [12 + (x - 12) * 0.955, 13.2 + (y - 13.2) * 0.955]);
  const ring = poly(inner);
  const leftHalf = poly(clipPlanes(inner, [(p) => 12 - p[0]]));
  const rightOf = (pts) => poly(clipPlanes(pts, [(p) => p[0] - 12]));
  const heartPts = pathToPolys(HEART)[0].pts;
  icons['heart-empty'] = {
    fixed: EMPTY,
    parts: [{ line: ring, filledOnly: true }, { solid: HEART, stickerOnly: true }],
    shine: 'M6.6 8.4 5.6 9.8',
  };
  icons['heart-half'] = {
    fixed: HEART_RED,
    parts: [{ line: ring, filledOnly: true }, { solid: leftHalf, sharp: true, filledOnly: true }, { solid: HEART, stickerOnly: true }],
    // right half repainted as empty: its shadow where the shadow sits, its face where the face sits
    detail: () => [
      `  <path d="${rightOf(heartPts)}" fill="${EMPTY[1]}"/>`,
      `  <path d="${rightOf(heartPts)}" fill="${EMPTY[2]}"${UP}/>`,
      `  <path d="M12 6.7A5.1 5.1 0 0 1 21 9.6C21 15.6 13.1 20.4 12 20.4" fill="none" stroke="${EMPTY[0]}" stroke-width="1.5" stroke-linecap="round"/>`,
    ],
    shine: 'M6.6 8.4 5.6 9.8',
  };
}

// ── infinity: unlimited ──
icons.infinity = {
  parts: [{ line: 'M12 12C10.3 9.6 9 8.2 7 8.2a3.8 3.8 0 0 0 0 7.6C9 15.8 10.3 14.4 12 12C13.7 9.6 15 8.2 17 8.2a3.8 3.8 0 0 1 0 7.6C15 15.8 13.7 14.4 12 12z' }],
  shine: 'M4.8 10.4a2.6 2.6 0 0 1 1.2 -1',
};

// ── rocket: boost (steel body, lava flame), pointing up-right ──
{
  const R = (pts) => rotate(pts, 45);
  const body = [];
  for (let i = 0; i <= 10; i++) { const t = i / 10; body.push([12 + 4.2 * Math.sin(Math.PI * t * 0.5) * (1 - 0.15 * t), 2.6 + 13.4 * t * t]); }
  const bodyPts = [[12, 2.6], ...[...Array(9)].map((_, i) => { const t = (i + 1) / 10; return [12 + 4.1 * Math.sin((Math.PI / 2) * Math.min(1, t * 1.6)), 2.6 + 13.6 * t]; }), [16, 16.2], [8, 16.2], ...[...Array(9)].map((_, i) => { const t = 1 - (i + 1) / 10; return [12 - 4.1 * Math.sin((Math.PI / 2) * Math.min(1, t * 1.6)), 2.6 + 13.6 * t]; })];
  void body;
  icons.rocket = {
    materials: 'steel lava',
    parts: [
      { solid: poly(R(bodyPts)), cut: (g) => [circle(...R([[12, 8.6]])[0], 1.9 + g)] },
      { solid: poly(R([[8.2, 11.4], [4.8, 14.8], [5.2, 18.2], [8.4, 15.8]])) },
      { solid: poly(R([[15.8, 11.4], [19.2, 14.8], [18.8, 18.2], [15.6, 15.8]])) },
      { solid: poly(R([[9.4, 18.2], [14.6, 18.2], [12, 22.8]])), alt: true }, // wide enough that the flame's face shows inside its outline
    ],
    detail: () => [recess(circle(...R([[12, 8.6]])[0], 1.9), 'outline')],
    shine: (() => { const [a, b] = R([[10.2, 6], [9.6, 10]]); return toD([a, b]); })(),
  };
}

// ── magnet: U magnet with marked tips (red in the sticker) ──
{
  const U = 'M4 3.4H9.4V12A2.6 2.6 0 0 0 14.6 12V3.4H20V12A8 8 0 0 1 4 12z';
  const tips = [rrect(4, 3.4, 5.4, 3.4, 0.01), rrect(14.6, 3.4, 5.4, 3.4, 0.01)];
  icons.magnet = {
    parts: [{ solid: U, cut: [rrect(4, 6.8, 5.4, 1.2, 0.01), rrect(14.6, 6.8, 5.4, 1.2, 0.01)], sharp: true }],
    detail: () => [`  <path d="${tips.join(' ')}" fill="#e33e4a"${UP}/>`, groove('M4.4 7.4H9M15 7.4H19.6', 1.2)],
    shine: 'M5.4 9v3',
  };
}

// ── clover: luck (four heart leaves meeting at the center, green) ──
{
  // each leaf: the heart scaled down, tip toward the center, pushed out a little so a gap cross shows
  const leaf = (deg) => {
    const pts = pathToPolys(HEART)[0].pts.map(([x, y]) => [12 + (x - 12) * 0.5, 12 - 1.1 + (y - 20.4) * 0.5]);
    return poly(rotate(pts, deg, 12, 12));
  };
  icons.clover = {
    materials: 'poison',
    parts: [0, 90, 180, 270].map((d) => ({ solid: leaf(d), sharp: true })).concat([{ line: 'M14.2 14.2Q17 17.8 20 19.8', w: 2.2 }]),
    shine: 'M9.2 5.6 8.6 6.6',
  };
}

// ── map-pin ──
icons['map-pin'] = {
  parts: [{ solid: 'M12 21.4C12 21.4 4.6 14.4 4.6 9.6a7.4 7.4 0 0 1 14.8 0C19.4 14.4 12 21.4 12 21.4z', cut: (g) => [circle(12, 9.6, 2.8 + g)] }],
  detail: () => [recess(circle(12, 9.6, 2.8), 'outline')],
  shine: 'M6.8 7.6a5.6 5.6 0 0 1 1.8 -2.4',
};

// ── move: four arrows ──
icons.move = {
  parts: [
    { line: 'M12 6V18M6 12H18' },
    { solid: [poly([[12, 2.4], [15.4, 6.2], [8.6, 6.2]]), poly([[12, 21.6], [8.6, 17.8], [15.4, 17.8]]), poly([[2.4, 12], [6.2, 8.6], [6.2, 15.4]]), poly([[21.6, 12], [17.8, 15.4], [17.8, 8.6]])].join(' ') },
  ],
  shine: 'M11.2 5v1',
};

// ── repeat: loop arrows ──
icons.repeat = {
  parts: [
    { line: 'M3.8 11.4V10a3.6 3.6 0 0 1 3.6 -3.6H16.4' },
    { line: 'M20.2 12.6V14a3.6 3.6 0 0 1 -3.6 3.6H7.6' },
    { solid: [poly([[15.8, 2.8], [20.6, 6.4], [15.8, 10]]), poly([[8.2, 14], [3.4, 17.6], [8.2, 21.2]])].join(' ') },
  ],
  shine: 'M5.2 9.4a2.4 2.4 0 0 1 1 -1.4',
};

// ── shuffle: two mirrored S-curves that cross in the middle, each ending in an arrowhead on the right.
//    The curve going down is cut where it passes under the other one (a clean gap, both sides equal). ──
{
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  // split a cubic at t → [first half, second half] (de Casteljau)
  const split = ([p0, p1, p2, p3], t) => {
    const a = lerp(p0, p1, t), b = lerp(p1, p2, t), c = lerp(p2, p3, t), d = lerp(a, b, t), e = lerp(b, c, t), m = lerp(d, e, t);
    return [[p0, a, d, m], [m, e, c, p3]];
  };
  const C = (q) => `M${q[0].map((v) => v.toFixed(2)).join(' ')}C${q.slice(1).map((p) => p.map((v) => v.toFixed(2)).join(' ')).join(' ')}`;
  // the curves finish their bend by x 11.6 and run straight (~5) into the heads, so the rising stroke
  // never meets a head at an angle (that blurred the top triangle into a leaf shape)
  const up = [[4.4, 17.6], [7.4, 17.6], [8.6, 6.4], [11.6, 6.4]];   // bottom-left → top-right
  const down = [[4.4, 6.4], [7.4, 6.4], [8.6, 17.6], [11.6, 17.6]]; // top-left → bottom-right
  const [downA] = split(down, 0.31), [, downB] = split(down, 0.69);
  icons.shuffle = {
    parts: [
      { line: `M2.8 17.6H4.4${C(up).replace(/^M[^C]*/, '')}H16.8`, w: 2, outline: 1.8 },
      { line: `M2.8 6.4H4.4${C(downA).replace(/^M[^C]*/, '')}`, w: 2, outline: 1.8 },
      { line: `${C(downB)}H16.8`, w: 2, outline: 1.8 },
      { solid: [poly([[15.2, 2.6], [21.5, 6.4], [15.2, 10.2]]), poly([[15.2, 13.8], [21.5, 17.6], [15.2, 21.4]])].join(' '), sharp: true, outline: 1.8 },
    ],
    shine: 'M3.6 5.8h1.6',
  };
}

// ── sun: day / light mode (gold) ──
{
  // pointed rays (a classic sun silhouette — line rays read as a gear once the sticker outline joins them)
  const ray = (a) => { const t = (a * Math.PI) / 180, c = Math.cos(t), s2 = Math.sin(t), n = [-s2, c];
    return poly([[12 + 6.6 * c + 1.7 * n[0], 12 + 6.6 * s2 + 1.7 * n[1]], [12 + 9.6 * c, 12 + 9.6 * s2], [12 + 6.6 * c - 1.7 * n[0], 12 + 6.6 * s2 - 1.7 * n[1]]]); };
  icons.sun = {
    materials: 'gold',
    parts: [{ solid: circle(12, 12, 4.8), sharp: true }, { solid: [...Array(8)].map((_, i) => ray(i * 45)).join(' ') }],
    shine: `M${P(12, 12, 3.2, 200)}A3.2 3.2 0 0 1 ${P(12, 12, 3.2, 250)}`,
  };
}

// ── moon: night / dark mode ──
icons.moon = {
  parts: [{ solid: crescent([13.2, 11.2, 8.8], [19, 6.4, 7]), sharp: true }],
  shine: 'M7.2 12.8a6.4 6.4 0 0 0 1.6 2.6',
};

// ── circle-check / circle-x: done / failed ──
{
  const check = [[7.4, 12.4], [10.6, 15.6], [16.8, 9]];
  const x = rotate([[10.7, 5.6], [13.3, 5.6], [13.3, 10.7], [18.4, 10.7], [18.4, 13.3], [13.3, 13.3], [13.3, 18.4], [10.7, 18.4], [10.7, 13.3], [5.6, 13.3], [5.6, 10.7], [10.7, 10.7]], 45);
  const disc = circle(12, 12, 9.6);
  const shine = `M${P(12, 12, 7.6, 200)}A7.6 7.6 0 0 1 ${P(12, 12, 7.6, 232)}`;
  icons['circle-check'] = { parts: [{ solid: disc, cut: [bandPoly(check, 1.4)], sharp: true }], detail: () => [...raised(bandPoly(check, 1.4))], shine };
  icons['circle-x'] = { parts: [{ solid: disc, cut: [poly(x)], sharp: true }], detail: () => [...raised(poly(x))], shine };
}

void rectPts; void fillRole;
writeIcons(icons, OUT);
