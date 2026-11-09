#!/usr/bin/env node
// Batch 6: combat actions, input, misc (filled + sticker). These stand for actions or UI meanings
// (attack, ranged, skill, ammo count, objective, checkpoint, random, controls), not items.
//   node scripts/draw-batch-6.mjs            → writes icons/filled + icons/sticker
//   node scripts/draw-batch-6.mjs <outDir>   → writes <outDir>/… (for trying changes)
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { P, circle, rrect, poly, star, rotate, rectPts, offsetPoly, raised, recess, groove, slashed, SOFT, writeIcons } from './draw-lib.mjs';

const OUT = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'icons');
const icons = {};

// ── sword parts, drawn pointing up, then scaled/rotated about (cx, cy) ──
// long: a longer blade and shorter hilt (for crossed swords, so they cross mid-blade and stay clear)
function swordParts(deg, { k = 1, cx = 12, cy = 12.25, dx = 0, dy = 0, alt = false, long = false, axis = null } = {}) {
  const T = (pts) => rotate(pts.map(([x, y]) => [cx + k * (x - cx), cy + k * (y - cy)]), deg, cx, cy).map(([x, y]) => [x + dx, y + dy]);
  // long (crossed swords): slimmer blade (3.2 wide) so two of them still read as two at 16–24px
  const L = long ? { tip: 1.4, bw: 1.6, end: 15.2, guard: 15.6, gw: 7.4, grip: 17.8, gripH: 2.6, pom: 21.6, pomR: 1.3 } : { tip: 2, bw: 2, end: 13.6, guard: 14, gw: 10.4, grip: 16.4, gripH: 3.6, pom: 21, pomR: 1.5 };
  const [px, py] = T([[12, L.pom]])[0];
  if (axis) axis.push(...T([[12, L.tip], [12, L.pom]]), L.bw * k);
  return [
    { solid: poly(T([[12, L.tip], [12 + L.bw, L.tip + 2.4], [12 + L.bw, L.end], [12 - L.bw, L.end], [12 - L.bw, L.tip + 2.4]])), alt },
    { solid: poly(T(rectPts(12 - L.gw / 2, L.guard, L.gw, 2.2, 1.1))), alt },
    { solid: poly(T(rectPts(10.9, L.grip, 2.2, L.gripH))), alt },
    { solid: circle(px, py, L.pomR * k), alt },
  ];
}

// ── sword: attack ──
icons.sword = {
  materials: 'steel',
  parts: swordParts(45, { k: 1.2 }),
  shine: (() => { const [a, b] = rotate([[11.3, 4.4], [11.3, 9]], 45, 12, 12.25); return `M${a[0].toFixed(2)} ${a[1].toFixed(2)}L${b[0].toFixed(2)} ${b[1].toFixed(2)}`; })(),
};

// ── swords: battle / PvP (filled: one X silhouette; sticker: the front sword sits on the back one) ──
// Filled: the back blade is cut around the front one (like the off-slash gap), so the X reads as two swords.
{
  const front = [];
  const back = swordParts(-45, { k: 1, cy: 10.6, dy: 0.6, long: true }); // dy 0.6: the cut back blade moves the weight down; this re-centres it
  const fore = swordParts(45, { k: 1, cy: 10.6, dy: 0.6, long: true, axis: front });
  const [a, b, bw] = front;
  icons.swords = {
    materials: 'steel',
    stack: true,
    parts: [
      ...back.map((p, i) => (i === 0 ? { ...p, stickerOnly: true } : p)),
      { solid: slashed(back[0].solid, { a, b, half: bw + 1 + SOFT }), filledOnly: true },
      ...fore,
    ],
    shine: 'M15.6 4.8l-1.6 1.6',
  };
}

// ── bow-arrow: ranged attack. The bow's belly faces the target and the arrow points away from the string. ──
// The bow sits 0.8 further left and the head starts at x 18, so the bow's apex (outer edge x 16.5) and the
// arrowhead's base keep a ~0.8 gap instead of touching.
icons['bow-arrow'] = {
  materials: 'steel',
  parts: [
    { line: 'M8.4 3Q21.8 12 8.4 21' },
    { line: 'M8.4 3V21', w: 1.4 },
    { line: 'M4.6 12H18.6' },
    { solid: poly([[18, 8.6], [22, 12], [18, 15.4]]) },
    { line: 'M3.2 9.6 5 12 3.2 14.4', w: 2 },
  ],
  shine: 'M9.8 4.4 11.6 5.8',
};

// ── ammo: three bullets ──
{
  const bullet = (x) => `M${x - 1.9} 9.6C${x - 1.9} 6.4 ${x} 3.4 ${x} 3.4S${x + 1.9} 6.4 ${x + 1.9} 9.6V17.8H${x - 1.9}z`;
  icons.ammo = {
    materials: 'gold',
    parts: [6, 12, 18].flatMap((x) => [{ solid: bullet(x) }, { solid: rrect(x - 2.2, 19.4, 4.4, 1.8, 0.5), sharp: true }]),
    shine: 'M10.7 8.4v3',
  };
}

// ── target: objective / bullseye (was target-arrow; it has no arrow, so the Lucide name fits) ──
icons.target = {
  materials: 'steel',
  parts: [{ solid: circle(12, 12, 9.4), cut: [circle(12, 12, 7), circle(12, 12, 5.4), circle(12, 12, 3.4), circle(12, 12, 1.8)], sharp: true }],
  detail: () => [groove(circle(12, 12, 6.2), 1.6), groove(circle(12, 12, 2.6), 1.6)],
  shine: `M${P(12, 12, 8.2, 200)}A8.2 8.2 0 0 1 ${P(12, 12, 8.2, 232)}`,
};

// ── magic-wand: skill / cast (steel stick, gold star) ──
icons['magic-wand'] = {
  materials: 'steel gold',
  parts: [{ line: 'M3.4 20.6L11.4 12.6' }, { solid: star(15.2, 8.8, 6, 2.8), alt: true }],
  shine: 'M14 6.2l.6 -1.4',
};

// ── dice: random / roll ──
{
  const pips = [[8, 8], [16, 8], [12, 12], [8, 16], [16, 16]];
  icons.dice = {
    materials: 'steel',
    parts: [{ solid: rrect(3.4, 3.4, 17.2, 17.2, 3.6), cut: (g) => pips.map(([x, y]) => circle(x, y, 1.7 + g)) }],
    detail: () => [recess(pips.map(([x, y]) => circle(x, y, 1.7)).join(' '), 'outline')],
    shine: 'M5.4 9V6.6a1.4 1.4 0 0 1 1.2 -1.2',
  };
}

// ── playing-card: a tilted card with a spade ──
{
  const R = (pts) => rotate(pts, 10, 12, 12);
  const card = R(rectPts(6.2, 3.4, 11.6, 17.2, 1.8));
  const spade = R([[12, 6.8], [15, 9.8], [16.4, 11.8], [16.2, 13.4], [15, 14.4], [13.6, 14.4], [12.6, 13.8], [13.4, 16.8], [10.6, 16.8], [11.4, 13.8], [10.4, 14.4], [9, 14.4], [7.8, 13.4], [7.6, 11.8], [9, 9.8]]);
  icons['playing-card'] = {
    materials: 'steel',
    parts: [{ solid: poly(card), cut: (g) => [offsetPoly(spade, g)] }],
    detail: () => [recess(poly(spade), 'outline')],
    shine: (() => { const [a, b] = R([[7.8, 6.4], [7.8, 9]]); return `M${a[0].toFixed(2)} ${a[1].toFixed(2)}L${b[0].toFixed(2)} ${b[1].toFixed(2)}`; })(),
  };
}

// ── flag: checkpoint ──
icons.flag = {
  materials: 'steel',
  parts: [{ line: 'M6.6 21V3.6' }, { solid: 'M8.4 4H20L17 8.8L20 13.6H8.4z' }],
  shine: 'M9.8 5.6h3',
};

// ── finish-flag: checkered (crisp cloth so the checks can touch its edge) ──
{
  const x0 = 8.4, y0 = 4, w = 13, h = 9.6, cw = w / 4, ch = h / 3;
  const checks = [];
  for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) if ((i + j) % 2) checks.push(rrect(x0 + i * cw, y0 + j * ch, cw, ch, 0.01));
  icons['finish-flag'] = {
    materials: 'steel',
    parts: [{ line: 'M6.2 21V3.6' }, { solid: rrect(x0, y0, w, h, 0.01), cut: checks, sharp: true }],
    detail: () => [recess(checks.join(' '), 'outline')],
    shine: 'M9.4 5.2h1.4',
  };
}

// ── gamepad: controller ──
{
  const plus = [[6.6, 8.6], [8.6, 8.6], [8.6, 10.6], [10.6, 10.6], [10.6, 12.6], [8.6, 12.6], [8.6, 14.6], [6.6, 14.6], [6.6, 12.6], [4.6, 12.6], [4.6, 10.6], [6.6, 10.6]];
  const cuts = (g) => [offsetPoly(plus, g), circle(15.8, 10, 1.15 + g), circle(18, 12.4, 1.15 + g)];
  icons.gamepad = {
    materials: 'steel',
    parts: [{ solid: 'M7.4 6H16.6C19.2 6 20.8 8.2 21.2 11L21.8 15.4C22.2 18 19.8 19.2 18.4 17.6L16.2 15.2H7.8L5.6 17.6C4.2 19.2 1.8 18 2.2 15.4L2.8 11C3.2 8.2 4.8 6 7.4 6z', cut: cuts }],
    detail: () => [recess(cuts(0).join(' '), 'outline')],
    shine: 'M5 8.6a3 3 0 0 1 1.8 -1.4',
  };
}

// ── joystick: arcade stick ──
icons.joystick = {
  materials: 'steel',
  parts: [{ solid: rrect(4.4, 14.4, 15.2, 5.4, 2) }, { line: 'M12 14.4V8.4' }, { solid: circle(12, 5.9, 4.2), sharp: true }],
  shine: `M${P(12, 5.9, 2.8, 200)}A2.8 2.8 0 0 1 ${P(12, 5.9, 2.8, 250)}`,
};

// ── dpad: directional pad ──
{
  const arrows = [[[12, 4.6], [13.7, 6.8], [10.3, 6.8]], [[12, 19.4], [10.3, 17.2], [13.7, 17.2]], [[4.6, 12], [6.8, 10.3], [6.8, 13.7]], [[19.4, 12], [17.2, 13.7], [17.2, 10.3]]];
  icons.dpad = {
    materials: 'steel',
    parts: [{ solid: poly([[8.8, 2.6], [15.2, 2.6], [15.2, 8.8], [21.4, 8.8], [21.4, 15.2], [15.2, 15.2], [15.2, 21.4], [8.8, 21.4], [8.8, 15.2], [2.6, 15.2], [2.6, 8.8], [8.8, 8.8]]), cut: (g) => arrows.map((t) => offsetPoly(t, g)) }],
    detail: () => [recess(arrows.map((t) => poly(t)).join(' '), 'outline')],
    shine: 'M10.4 4.2v2.4',
  };
}

// ── arrow-keys: four keycaps ──
{
  const keys = [[8.9, 5.2], [1.9, 12.2], [8.9, 12.2], [15.9, 12.2]];
  const arrow = (x, y, dir) => {
    const c = [x + 3.1, y + 3.1], s = 1.7;
    const t = { up: [[0, -s], [s, s * 0.7], [-s, s * 0.7]], down: [[0, s], [-s, -s * 0.7], [s, -s * 0.7]], left: [[-s, 0], [s * 0.7, -s], [s * 0.7, s]], right: [[s, 0], [-s * 0.7, s], [-s * 0.7, -s]] }[dir];
    return poly(t.map(([dx, dy]) => [c[0] + dx, c[1] + dy]));
  };
  const dirs = ['up', 'left', 'down', 'right'];
  icons['arrow-keys'] = {
    materials: 'steel',
    parts: keys.map(([x, y], i) => ({ solid: rrect(x, y, 6.2, 6.2, 1.5), cut: [arrow(x, y, dirs[i])], sharp: true })),
    detail: () => [recess(keys.map(([x, y], i) => arrow(x, y, dirs[i])).join(' '), 'outline')],
    shine: 'M10.3 6.6v1.6',
  };
}

writeIcons(icons, OUT);
