#!/usr/bin/env node
// Batch 4: currency and rewards (filled + sticker). Default material: gold for currency/rewards,
// steel for devices and time. Shared rules live in draw-lib.mjs.
//   node scripts/draw-batch-4.mjs            → writes icons/filled + icons/sticker
//   node scripts/draw-batch-4.mjs <outDir>   → writes <outDir>/… (for trying changes)
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { P, circle, rrect, poly, star, starPts, rotate, bandPoly, offsetPoly, raised, recess, groove, fillRole, UP, writeIcons } from './draw-lib.mjs';

const OUT = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'icons');
const icons = {};
const growRect = (x, y, w, h, r) => (g) => rrect(x - g, y - g, w + 2 * g, h + 2 * g, r + g);

// ── gem: cut diamond (premium currency). Steel reads as diamond; swap material for ruby/emerald. ──
{
  const G = [[6.6, 5.4], [17.4, 5.4], [21.2, 10.4], [12, 21.6], [2.8, 10.4]];
  icons.gem = {
    materials: 'steel',
    parts: [{ solid: poly(G), cut: (g) => [
      rrect(3.7, 9.8 - g, 16.6, 1.2 + 2 * g, 0.01),
      bandPoly([[8.6, 12.4], [11.2, 18.4]], 0.6 + g), bandPoly([[15.4, 12.4], [12.8, 18.4]], 0.6 + g)] }],
    detail: () => [recess(poly([[6.6, 5.4], [17.4, 5.4], [21.2, 10.4], [2.8, 10.4]]), 'light'), recess(poly([[12, 10.4], [21.2, 10.4], [12, 21.6]]), 'shadow')],
    shine: 'M7.6 6.8 6 8.8',
  };
}

// ── zap: energy bolt ──
icons.zap = {
  materials: 'gold',
  parts: [{ solid: poly([[13.8, 2.6], [4.8, 13.6], [11, 13.6], [10, 21.4], [19.2, 10.2], [12.9, 10.2]]) }],
  shine: 'M11.6 5.8 8.4 9.8',
};

// ── star ──
icons.star = { materials: 'gold', parts: [{ solid: star(12, 12.7, 9.8, 4.9) }], shine: 'M10.6 7.6 9.8 9.6' };

// ── crown: three points with balls + band ──
icons.crown = {
  materials: 'gold',
  parts: [
    { solid: poly([[3.4, 7.1], [8, 11.3], [12, 4.1], [16, 11.3], [20.6, 7.1], [19, 15.5], [5, 15.5]]) },
    { solid: [circle(3.4, 6.5, 1.4), circle(12, 3.5, 1.4), circle(20.6, 6.5, 1.4)].join(' '), sharp: true },
    { solid: rrect(5, 17.7, 14, 2.6, 1.3) },
  ],
  shine: 'M6.4 10.7l.8 3',
};

// ── key: bow + shaft + teeth, diagonal ──
{
  const R = (pts) => rotate(pts, -45);
  const [bx, by] = R([[5.6, 12]])[0];
  const shaft = poly(R([[9.4, 10.6], [22.4, 10.6], [22.4, 15.6], [19.4, 15.6], [19.4, 13.4], [17.8, 13.4], [17.8, 16.2], [15.6, 16.2], [15.6, 13.4], [9.4, 13.4]]));
  icons.key = {
    materials: 'gold',
    parts: [{ solid: circle(bx, by, 4.4), cut: (g) => [circle(bx, by, 1.9 + g)] }, { solid: shaft }],
    detail: () => [recess(circle(bx, by, 1.9), 'outline')],
    shine: `M${P(bx, by, 3.1, 160)}A3.1 3.1 0 0 1 ${P(bx, by, 3.1, 215)}`,
  };
}

// ── treasure-chest: domed lid + body + lock plate with keyhole ──
{
  const plate = rrect(10, 9.2, 4, 5, 1);
  icons['treasure-chest'] = {
    materials: 'gold',
    parts: [
      // filled: lid and body stop short of the lock plate (0.6 visible gap after the soft stroke), so the plate
      // stands apart and the chest reads as a locked chest at 16–24px; the straps stay sticker-only (they'd leave slivers).
      { solid: 'M3.8 10.4V8.6a4.6 4.6 0 0 1 4.6 -4.6H15.6a4.6 4.6 0 0 1 4.6 4.6V10.4z', stickerOnly: true },
      { solid: 'M3.8 10.4V8.6a4.6 4.6 0 0 1 4.6 -4.6H15.6a4.6 4.6 0 0 1 4.6 4.6V10.4H16V10.2a3 3 0 0 0 -3 -3H11a3 3 0 0 0 -3 3V10.4z', filledOnly: true },
      { solid: rrect(3.8, 12.6, 16.4, 7.6, 1.4), cut: (g) => [rrect(6.6 - g, 12.6, 1.2 + 2 * g, 7.6, 0.01), rrect(16.2 - g, 12.6, 1.2 + 2 * g, 7.6, 0.01)], stickerOnly: true },
      { solid: 'M5.2 12.6H8V13.2a3 3 0 0 0 3 3H13a3 3 0 0 0 3 -3V12.6H18.8a1.4 1.4 0 0 1 1.4 1.4V18.8a1.4 1.4 0 0 1 -1.4 1.4H5.2a1.4 1.4 0 0 1 -1.4 -1.4V14a1.4 1.4 0 0 1 1.4 -1.4z', filledOnly: true },
      { solid: plate, cut: (g) => [circle(12, 11.5, 0.9 + g)], filledOnly: true },
    ],
    detail: () => [groove('M7.2 13.2V19.6M16.8 13.2V19.6', 1.2), recess(plate, 'light'), recess(circle(12, 11.5, 0.9), 'outline')],
    shine: 'M5 9.2V8.4a3.4 3.4 0 0 1 1.6 -2.8',
  };
}

// ── gift: lid + box (crisp), ribbon shown by gaps (filled) or in gold (sticker), bow on top ──
{
  const bowL = 'M12 8.4C9.6 8.4 6.4 7.8 6.4 5.6C6.4 4 8 3.2 9.4 3.9C10.8 4.6 12 6.6 12 8.4z';
  const bowR = 'M12 8.4C14.4 8.4 17.6 7.8 17.6 5.6C17.6 4 16 3.2 14.6 3.9C13.2 4.6 12 6.6 12 8.4z';
  const ribbonCuts = (y, h) => [rrect(9.8, y, 1.2, h, 0.01), rrect(13, y, 1.2, h, 0.01)];
  icons.gift = {
    materials: 'steel gold',
    parts: [
      { solid: rrect(3, 8.4, 18, 4.2, 1.2), cut: ribbonCuts(8.4, 4.2), sharp: true },
      { solid: rrect(4.4, 13.8, 15.2, 7, 1.2), cut: ribbonCuts(13.8, 7), sharp: true },
      { solid: bowL, alt: true }, { solid: bowR, alt: true },
    ],
    detail: () => [recess(`${rrect(10.4, 8.4, 3.2, 4.2, 0.01)} ${rrect(10.4, 13.8, 3.2, 7, 0.01)}`, 'alt-base')],
    shine: 'M4.4 9.8h2.4',
  };
}

// ── calendar-check: daily reward ──
{
  const check = [[8, 14.8], [10.8, 17.6], [16.2, 12]];
  icons['calendar-check'] = {
    materials: 'steel',
    parts: [
      { solid: rrect(3.8, 5, 16.4, 15.8, 2.2), cut: (g) => [rrect(3.8, 8.8 - g, 16.4, 1.2 + 2 * g, 0.01), bandPoly(check, 1.2 + g)] },
      { line: 'M8 2.8V6.2' }, { line: 'M16 2.8V6.2' },
    ],
    detail: () => [groove('M4.4 9.4H19.6', 1.2), ...raised(bandPoly(check, 1.2))],
    shine: 'M5 6.8h2',
  };
}

// ── monitor-play: watch an ad ──
{
  const tri = [[9.8, 7.2], [15.8, 10.4], [9.8, 13.6]];
  icons['monitor-play'] = {
    materials: 'steel',
    parts: [
      { solid: rrect(3.4, 4.4, 17.2, 11.8, 2.2), cut: (g) => [offsetPoly(tri, g)] },
      { solid: rrect(10.6, 16.2, 2.8, 3.2, 0.01) },
      { solid: rrect(7.2, 19.2, 9.6, 2, 1) },
    ],
    detail: () => [recess(rrect(5, 6, 14, 8.8, 1)), ...raised(poly(tri))],
    shine: 'M4.4 9.4V6.8',
  };
}

// ── ticket: notched ticket with perforation and a star ──
{
  const body = 'M4.2 5.8H19.8a1.6 1.6 0 0 1 1.6 1.6V9.8a2.2 2.2 0 0 0 0 4.4V16.6a1.6 1.6 0 0 1 -1.6 1.6H4.2a1.6 1.6 0 0 1 -1.6 -1.6V14.2a2.2 2.2 0 0 0 0 -4.4V7.4a1.6 1.6 0 0 1 1.6 -1.6z';
  const dashes = [[15.2, 7.6, 1.2, 2.2, 0.6], [15.2, 10.9, 1.2, 2.2, 0.6], [15.2, 14.2, 1.2, 2.2, 0.6]];
  icons.ticket = {
    materials: 'gold',
    parts: [{ solid: body, cut: (g) => [...dashes.map((d) => growRect(...d)(g)), offsetPoly(starPts(9.2, 12.2, 3.4, 1.55), g)] }],
    detail: () => [groove('M15.8 8.2v1M15.8 11.5v1M15.8 14.8v1', 1.2), ...raised(star(9.2, 12.2, 3.4, 1.55))],
    shine: 'M4.4 7.6h2.4',
  };
}

// ── badge-percent: sale rosette with % ──
{
  const pct = (g) => [circle(8.8, 8.8, 1.7 + g), circle(15.2, 15.2, 1.7 + g), bandPoly([[15.6, 8.4], [8.4, 15.6]], 0.9 + g)];
  icons['badge-percent'] = {
    materials: 'gold',
    parts: [{ solid: star(12, 12, 9.8, 8.3, 8), cut: pct }],
    detail: () => [...raised(pct(0).join(' '))],
    shine: `M${P(12, 12, 7.6, 200)}A7.6 7.6 0 0 1 ${P(12, 12, 7.6, 232)}`,
  };
}

// ── hourglass: timer / cooldown / limited-time ──
{
  const glass = 'M7.2 6.8H16.8C16.8 9.8 13.4 10.8 13.4 12S16.8 14.2 16.8 17.2H7.2C7.2 14.2 10.6 13.2 10.6 12S7.2 9.8 7.2 6.8z';
  icons.hourglass = {
    materials: 'steel gold',
    parts: [
      { solid: rrect(5, 2.8, 14, 2.6, 1.3), sharp: true },
      { solid: glass },
      { solid: rrect(5, 18.6, 14, 2.6, 1.3), sharp: true },
    ],
    detail: () => [
      `  <path d="M9.2 8.2H14.8C14.4 9.4 12.8 10 12 10.6C11.2 10 9.6 9.4 9.2 8.2z" ${fillRole('alt-light')}${UP}/>`,
      `  <path d="M12 13.8C13.6 14.6 15.2 15.2 15.4 16.4H8.6C8.8 15.2 10.4 14.6 12 13.8z" ${fillRole('alt-base')}${UP}/>`,
    ],
    shine: 'M6.6 3.8h2.4',
  };
}

writeIcons(icons, OUT);
