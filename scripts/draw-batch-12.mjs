#!/usr/bin/env node
// Batch 12: stage results and status effects (filled + sticker). Shared rules in draw-lib.mjs.
//   star-empty, star-half, poison, stun, stat-up, stat-down, revive, loading
//   node scripts/draw-batch-12.mjs            → writes icons/filled + icons/sticker
//   node scripts/draw-batch-12.mjs <outDir>   → writes <outDir>/… (for trying changes)
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { P, circle, poly, starPts, star, offsetPoly, clipPlanes, pathToPolys, HEART_RED, recess, fillRole, UP, writeIcons } from './draw-lib.mjs';

const OUT = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'icons');
const icons = {};
const rad = (d) => (d * Math.PI) / 180;
const toD = (pts) => 'M' + pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L');

// ── star-empty / star-half: rating slots (★★☆), the star's counterparts to heart-empty / heart-half ──
// Same star as `star` so a row of full, half and empty stars lines up.
// Filled: the star with a star-shaped hole (half: the hole only on the right).
// Sticker: a star frame with a dark hollow; the frame is the material's shadow tone so full stars stay brighter.
{
  const pts = starPts(12, 12.7, 9.8, 4.9);
  const STAR = poly(pts);
  // Filled: the same star (same soft stroke, so the same silhouette) with a star-shaped hole.
  // The soft stroke also runs round the hole and covers 0.7 of it, so a hole inset by 1 leaves a 2.4 frame.
  const holePts = pathToPolys(offsetPoly(pts, -1))[0].pts;
  const hole = poly(holePts);
  const rightHole = poly(clipPlanes(holePts, [(p) => p[0] - 11.3])); // visible edge lands on x = 12
  const hollowPts = pathToPolys(offsetPoly(pts, -2.3))[0].pts;
  const rightHollow = poly(clipPlanes(hollowPts, [(p) => p[0] - 12.9]));
  icons['star-empty'] = {
    materials: 'gold',
    parts: [{ solid: `${STAR} ${hole}`, evenodd: true, filledOnly: true }, { solid: STAR, stickerOnly: true }],
    detail: () => [`  <path d="${STAR}" ${fillRole('shadow')}${UP}/>`, recess(poly(hollowPts), 'outline')],
    shine: 'M10.6 7.6 9.8 9.6',
  };
  icons['star-half'] = {
    materials: 'gold',
    parts: [{ solid: `${STAR} ${rightHole}`, evenodd: true, filledOnly: true }, { solid: STAR, stickerOnly: true }],
    // right half repainted as the empty slot: frame in the shadow tone, hollow in the outline tone
    detail: () => [
      `  <path d="${poly(clipPlanes(pts, [(p) => p[0] - 12]))}" ${fillRole('shadow')}${UP}/>`,
      recess(rightHollow, 'outline'),
    ],
    shine: 'M10.6 7.6 9.8 9.6',
  };
}

// ── poison: poisoned status. A venom drop with a skull's eyes and nose (the usual poison mark is a skull;
//    the drop keeps it apart from `skull`, the eyes keep it apart from `droplet`). Green by default. ──
{
  const drop = 'M12 2.6C12 2.6 5 10 5 14.4a7 7 0 0 0 14 0C19 10 12 2.6 12 2.6z';
  const eyes = (g) => [circle(9.3, 13.6, 1.75 + g), circle(14.7, 13.6, 1.75 + g)];
  const nose = (g) => poly([[12, 16.2 - g], [13.1 + g, 18.3 + g * 0.6], [10.9 - g, 18.3 + g * 0.6]]);
  icons.poison = {
    materials: 'poison',
    parts: [{ solid: drop, cut: (g) => [...eyes(g), nose(g * 0.6)] }],
    detail: () => [...eyes(0).map((d) => recess(d, 'outline')), recess(nose(0), 'outline')],
    shine: 'M8.2 9.4 9.6 7.4',
  };
}

// ── stun: stunned / dizzy. Three stars circling on an orbit. The orbit is drawn
//    only between the stars so nothing overlaps (no cut-outs needed in the filled style). ──
{
  const cx = 12.2, cy = 12, rx = 6.5, ry = 6.5, tilt = 0;
  const at = (deg) => {
    const a = rad(deg), t = rad(tilt), x = rx * Math.cos(a), y = ry * Math.sin(a);
    return [cx + x * Math.cos(t) - y * Math.sin(t), cy + x * Math.sin(t) + y * Math.cos(t)];
  };
  // [angle on the orbit, outer radius]: three equal stars a third of a turn apart, big enough to stay stars at 16px;
  // the short arcs between them read as motion
  const stars = [[75, 4.2], [195, 4.2], [315, 4.2]].map(([a, R]) => ({ c: at(a), R }));
  // orbit points that keep clear of every star, split into runs
  const clear = (p) => stars.every(({ c, R }) => Math.hypot(p[0] - c[0], p[1] - c[1]) > R * 0.72 + 1.5);
  const runs = [];
  let run = null;
  for (let d = 75; d <= 435; d += 3) {
    const p = at(d);
    if (clear(p)) (run ??= []).push(p);
    else if (run) { runs.push(run); run = null; }
  }
  if (run) runs.push(run);
  icons.stun = {
    materials: 'gold',
    parts: [
      ...runs.filter((r) => r.length > 2).map((r) => ({ line: toD(r), w: 2, outline: 1.8 })),
      ...stars.map(({ c, R }) => ({ solid: star(c[0], c[1], R, R * 0.5) })),
    ],
    shine: (() => { const [x, y] = stars[1].c; return `M${(x - 1.1).toFixed(2)} ${(y - 1.2).toFixed(2)}l-0.4 0.9`; })(),
  };
}

// ── stat-up / stat-down: buff and debuff. Two stacked chevrons (level-up is an arrow in a disc, arrow-up a block arrow).
//    Green and red by default (poison / lava materials), so they still follow a material theme. ──
{
  const W = 2.8;            // band thickness
  const D = W * Math.SQRT2; // the same, measured vertically at the apex
  const chevron = (t) => [[12, t], [20.4, t + 8.4], [20.4 - W / Math.SQRT2, t + 8.4 + W / Math.SQRT2], [12, t + D], [3.6 + W / Math.SQRT2, t + 8.4 + W / Math.SQRT2], [3.6, t + 8.4]];
  const up = [chevron(2.9), chevron(10.1)];
  const flip = (pts) => pts.map(([x, y]) => [x, 24 - y]);
  icons['stat-up'] = {
    materials: 'poison',
    parts: up.map((c) => ({ solid: poly(c) })),
    shine: 'M8.6 6.6 6.8 8.4',
  };
  icons['stat-down'] = {
    materials: 'lava',
    parts: up.map((c) => ({ solid: poly(flip(c)) })).reverse(),
    shine: 'M6.4 4.6 8 6.2',
  };
}

// ── revive: come back to life / continue. A small heart inside a turning arrow, in the heart's red
//    (heart-plus is healing: a cross in the heart). ──
{
  const HEART = 'M12 20.4C10.9 20.4 3 15.6 3 9.6A5.1 5.1 0 0 1 12 6.7A5.1 5.1 0 0 1 21 9.6C21 15.6 13.1 20.4 12 20.4z';
  const c = [12, 13], R = 7.8;
  const small = poly(pathToPolys(HEART)[0].pts.map(([x, y]) => [c[0] + (x - 12) * 0.48, c[1] + 0.3 + (y - 12.8) * 0.48]));
  icons.revive = {
    fixed: HEART_RED,
    parts: [
      // the arc runs counter-clockwise from the top round to the left; the arrowhead at the top points back
      { line: `M${P(c[0], c[1], R, 215)}A${R} ${R} 0 1 0 ${P(c[0], c[1], R, 280)}`, w: 2.4 },
      { solid: poly([[13.5, 2.5], [8.9, 5.3], [13.5, 8.1]]) },
      { solid: small, soft: 1.4 },
    ],
    shine: 'M6.2 9.8 7.2 8.2',
  };
}

// ── loading: waiting / in progress. Three quarters of a ring with round ends (restart has an arrowhead,
//    power a bar). The drawing is still; spin it in CSS or on the canvas. ──
icons.loading = {
  parts: [{ line: `M${P(12, 12, 8.4, 270)}A8.4 8.4 0 1 1 ${P(12, 12, 8.4, 180)}`, w: 3.2 }],
  shine: 'M17.2 6.2 18.4 7.6',
};

writeIcons(icons, OUT);
