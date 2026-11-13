#!/usr/bin/env node
// Batch 3: menu and screen icons (filled + sticker), drawn with the shared rules in draw-lib.mjs.
//   node scripts/draw-batch-3.mjs            → writes icons/filled + icons/sticker
//   node scripts/draw-batch-3.mjs <outDir>   → writes <outDir>/… (for trying changes)
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { f, P, circle, rrect, poly, star, raised, recess, groove, writeIcons } from './draw-lib.mjs';

const OUT = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'icons');
const icons = {};
const growRect = (x, y, w, h, r) => (g) => rrect(x - g, y - g, w + 2 * g, h + 2 * g, r + g);

// ── backpack: body + handle + front pocket (a 1.2 gap ring in the filled style) ──
{
  const pocketOut = [7.4, 12.4, 9.2, 6.4, 2], pocketIn = [8.6, 13.6, 6.8, 4.0, 1];
  icons.backpack = {
    parts: [
      { solid: rrect(5, 6.8, 14, 14.2, 3.6), cut: (g) => [rrect(...pocketOut.slice(0, 2).map((v) => v - g), pocketOut[2] + 2 * g, pocketOut[3] + 2 * g, pocketOut[4] + g),
        rrect(pocketIn[0] + g, pocketIn[1] + g, pocketIn[2] - 2 * g, pocketIn[3] - 2 * g, Math.max(0.2, pocketIn[4] - g))] },
      { line: 'M9.4 6.9V5.8a2.6 2.6 0 0 1 5.2 0V6.9' },
    ],
    detail: [groove(rrect(8, 13, 8, 5.2, 1.6))],
    shine: 'M7 9.4v2.4',
  };
}

// ── map: three folded panels (crisp paper: no soft corners) ──
{
  const A = poly([[3, 6], [8.4, 3.3], [8.4, 18.3], [3, 21]]);
  const B = poly([[9.6, 3.3], [14.4, 5.7], [14.4, 20.7], [9.6, 18.3]]);
  const C = poly([[15.6, 5.7], [21, 3], [21, 18], [15.6, 20.7]]);
  icons.map = {
    parts: [{ solid: A, sharp: true }, { solid: B, sharp: true }, { solid: C, sharp: true }],
    detail: [recess(B)],
    shine: 'M4.5 8.2v3.6',
  };
}

// ── quest: scroll (two rolls + paper with two text lines) ──
{
  const seams = [[5.2, 6.8, 13.6, 1, 0.4], [5.2, 16.2, 13.6, 1, 0.4]];
  const lines = [[8, 9.5, 8, 1.7, 0.6], [8, 13, 6, 1.7, 0.6]];
  icons.quest = {
    parts: [
      { solid: [rrect(4, 3, 16, 3.8, 1.9), rrect(6, 5, 12, 14, 0.6), rrect(4, 17.2, 16, 3.8, 1.9)].join(' '),
        cut: (g) => [...seams, ...lines].map((r) => growRect(...r)(g)) },
    ],
    detail: [recess(rrect(8, 9.5, 8, 1.7, 0.6), 'outline'), recess(rrect(8, 13, 6, 1.7, 0.6), 'outline'), groove('M5.8 7.3H18.2', 1), groove('M5.8 16.7H18.2', 1)],
    shine: 'M6 4.4h3',
  };
}

// ── trophy: cup + loop handles + stem + base, star on the cup ──
// Handles are thin loops (1.8) that stand off the cup, so the hole in each stays open in the filled style.
// The star is small enough to leave room for the shine at the rim's left.
{
  const cup = 'M6.8 3.8H17.2V9.2a5.2 5.2 0 0 1 -10.4 0z';
  icons.trophy = {
    parts: [
      { solid: cup, cut: (g) => [star(12, 9.2, 2.6 + 1.5 * g, 1.2 + 0.8 * g)] },
      { line: 'M6.8 5.4H3.7V7.2a4 4 0 0 0 3.7 4', w: 1.8 },
      { line: 'M17.2 5.4H20.3V7.2a4 4 0 0 1 -3.7 4', w: 1.8 },
      { solid: rrect(10.9, 14, 2.2, 4.2, 0.4) },
      { solid: rrect(7.4, 18, 9.2, 3, 1.2) },
    ],
    detail: [...raised(star(12, 9.2, 2.6, 1.2))],
    shine: 'M8.3 5.3v1.2',
  };
}

// ── leaderboard: podium (wide, low steps) with the winner's star above ──
{
  const one = rrect(11.2, 11.2, 1.6, 4.6, 0.8);
  icons.leaderboard = {
    parts: [
      { solid: star(12, 5.2, 3.8, 1.75), sharp: true },
      { solid: rrect(2.8, 13, 5.6, 7.2, 1), sharp: true },
      { solid: rrect(9.2, 9.6, 5.6, 10.6, 1), cut: [one], sharp: true },
      { solid: rrect(15.6, 14.6, 5.6, 5.6, 1), sharp: true },
    ],
    detail: [...raised(one)],
    shine: 'M4.4 14.6v2', // on the left step: the middle one carries the raised 1
  };
}

// ── anvil (crafting) ──
icons.anvil = {
  parts: [{ solid: 'M7 5.3H21.2V8.3L17.6 10.3L15.4 12.3V14.5L18.6 16.3V18.7H5.4V16.3L8.6 14.5V12.3L7.6 10.5Q4.4 9.7 2.6 6.3Q4 5.3 7 5.3z' }],
  shine: 'M8 6.6h5',
};

// ── medal: ribbon straps + disc with a star ──
{
  const strapL = poly([[5.8, 2.6], [9.8, 2.6], [12.8, 7.2], [8.8, 7.2]]);
  const strapR = poly([[18.2, 2.6], [14.2, 2.6], [11.2, 7.2], [15.2, 7.2]]);
  const st = star(12, 14.9, 3.3, 1.5);
  icons.medal = {
    parts: [{ solid: strapL }, { solid: strapR }, { solid: circle(12, 14.8, 6.1), cut: [st], sharp: true }],
    detail: [...raised(st)],
    shine: `M${P(12, 14.8, 4.6, 196)}A4.6 4.6 0 0 1 ${P(12, 14.8, 4.6, 236)}`,
  };
}

// ── store: scalloped awning + shop with a door ──
{
  const awning = 'M3.4 8.4V5.4a2 2 0 0 1 2 -2H18.6a2 2 0 0 1 2 2V8.4' + 'a2.15 2.15 0 0 1 -4.3 0'.repeat(4) + 'z';
  icons.store = {
    parts: [
      { solid: awning },
      // door as a notch in the outline (a hole running past the edge would paint outside it)
      { solid: 'M5.8 12.8H18.2a1 1 0 0 1 1 1V20.6H14.6V16a1 1 0 0 0 -1 -1H10.4a1 1 0 0 0 -1 1V20.6H4.8V13.8a1 1 0 0 1 1 -1z' },
    ],
    detail: [recess(rrect(10.1, 15.7, 3.8, 4.9, 0.6))],
    shine: 'M5.2 5.4v1.8',
  };
}

// ── user: head + shoulders ──
icons.user = {
  parts: [{ solid: circle(12, 6.8, 4.3), sharp: true }, { solid: 'M4.6 20C4.6 15.4 7.8 12.8 12 12.8S19.4 15.4 19.4 20z' }],
  shine: `M${P(12, 6.8, 2.9, 200)}A2.9 2.9 0 0 1 ${P(12, 6.8, 2.9, 250)}`,
};

// ── save: floppy disk ──
{
  const shutter = [7.4, 5.8, 7.4, 3.8, 0.8], label = [7, 12.8, 10, 5.6, 1];
  icons.save = {
    parts: [{ solid: 'M5.6 3.6H16.6L20.4 7.4V18.4a2 2 0 0 1 -2 2H5.6a2 2 0 0 1 -2 -2V5.6a2 2 0 0 1 2 -2z', cut: (g) => [growRect(...shutter)(g), growRect(...label)(g)] }],
    detail: [recess(rrect(...shutter)), recess(rrect(...label), 'light')],
    shine: 'M5.4 6v2.6',
  };
}

// ── bell: notifications ──
icons.bell = {
  parts: [
    { solid: 'M12 3.4C8.6 3.4 6.2 6 6.2 9.4V12.6L4.6 15.2A1 1 0 0 0 5.4 16.8H18.6A1 1 0 0 0 19.4 15.2L17.8 12.6V9.4C17.8 6 15.4 3.4 12 3.4z' },
    { solid: 'M9.8 19.2a2.2 2.2 0 0 0 4.4 0z' },
  ],
  shine: 'M8.6 8.6a3.8 3.8 0 0 1 1.6 -2.4',
};

// ── mail: envelope with a flap (a V gap in the filled style) ──
{
  const k = 0.818, s = 0.575; // flap line direction (7.4, 5.2) normalized → normal components
  const band = (g) => {
    const h = 0.6 + g;
    return poly([[4.6 + s * h, 7.6 - k * h], [12, 12.8 - h / k], [19.4 - s * h, 7.6 - k * h], [19.4 + s * h, 7.6 + k * h], [12, 12.8 + h / k], [4.6 - s * h, 7.6 + k * h]]);
  };
  icons.mail = {
    parts: [{ solid: rrect(3, 5.4, 18, 13.2, 2), cut: (g) => [band(g)] }],
    detail: [groove('M4.6 7.6L12 12.8L19.4 7.6')],
    shine: 'M4.8 10.6v3',
  };
}

void f;
writeIcons(icons, OUT);
