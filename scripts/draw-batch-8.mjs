#!/usr/bin/env node
// Batch 8: the last essentials to 100 — off-states, up/down, hint, tap, rotate device, edit/delete,
// level grid, clock (filled + sticker). Shared rules in draw-lib.mjs.
//   node scripts/draw-batch-8.mjs            → writes icons/filled + icons/sticker
//   node scripts/draw-batch-8.mjs <outDir>   → writes <outDir>/… (for trying changes)
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { P, LW, SOFT, circle, rrect, poly, rotate, rectPts, bandPoly, slashed, offSlash, recess, groove, writeIcons } from './draw-lib.mjs';

const OUT = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'icons');
const icons = {};

// ── "off" icons: the on-shape with a slash. Filled: the shape is cut around the slash.
//    Sticker: the whole shape, then a red slash on top (like volume-x / music-off). ──
const SLASH = 'M3.4 3.4L20.6 20.6';
const halfSoft = LW / 2 + 1 + SOFT / 2, halfSharp = LW / 2 + 1;
function offIcon(shapes, { shine } = {}) {
  return {
    stack: true,
    parts: [
      ...shapes.map((s) => ({ ...s, solid: s.solid, stickerOnly: true })),
      ...shapes.map((s) => ({ solid: slashed(s.whole ?? s.solid, { half: s.sharp ? halfSharp : halfSoft }), sharp: s.sharp, evenodd: s.evenodd, filledOnly: true })),
      { line: SLASH, filledOnly: true },
    ],
    detail: offSlash,
    shine,
  };
}

// bell (same geometry as bell in batch 3)
const BELL = 'M12 3.4C8.6 3.4 6.2 6 6.2 9.4V12.6L4.6 15.2A1 1 0 0 0 5.4 16.8H18.6A1 1 0 0 0 19.4 15.2L17.8 12.6V9.4C17.8 6 15.4 3.4 12 3.4z';
const CLAPPER = 'M9.8 19.2a2.2 2.2 0 0 0 4.4 0z';
// shine sits on the dome right of the slash so it never touches the red line (moved in Penpot, 2026-11-09)
icons['bell-off'] = offIcon([{ solid: BELL }, { solid: CLAPPER }], { shine: 'M9.9 5.6C10.4 5.1 11 4.8 11.7 4.7' });

// vibrate (same geometry as vibrate in batch 2)
const zig = (x0, x1) => `M${x0} 7.8L${x1} 10L${x0} 12.2L${x1} 14.4L${x0} 16.6`;
{
  const off = offIcon([{ solid: rrect(7.6, 3.4, 8.8, 17.2, 2.2) }], { shine: 'M9.3 5.6h1.4' });
  // zigzags are lines: cut them by turning each into its own thin band, then slash it
  for (const [a, b] of [[4.6, 3.1], [19.4, 20.9]]) {
    off.parts.unshift({ line: zig(a, b), w: 2.4, stickerOnly: true });
    const pts = zig(a, b).slice(1).split('L').map((p) => p.split(' ').map(Number));
    off.parts.push({ solid: slashed(bandPoly(pts, 1.2), { half: halfSharp }), sharp: true, filledOnly: true });
  }
  icons['vibrate-off'] = off;
}

// eye (same geometry as eye in batch 7; the iris ring is a hole, grown for the soft stroke)
{
  const almond = 'M2.2 12C4.8 7.4 8.2 5.4 12 5.4S19.2 7.4 21.8 12C19.2 16.6 15.8 18.6 12 18.6S4.8 16.6 2.2 12z';
  const g = SOFT / 2;
  icons['eye-off'] = offIcon([{ solid: almond, whole: `${almond} ${circle(12, 12, 4.4 + g)} ${circle(12, 12, 2.6 - g)}`, evenodd: true }], { shine: 'M3.9 10.9C4.4 10.3 4.9 9.8 5.5 9.4' }); // shine kept left of the slash
  icons['eye-off'].detail = () => [recess(circle(12, 12, 4.4), 'outline'), recess(circle(12, 12, 2.6), 'base'), ...offSlash()];
}

// ── minimize: exit fullscreen (corners turned inward) ──
icons.minimize = {
  parts: [{ line: 'M8.6 3.6V8.6H3.6' }, { line: 'M15.4 3.6V8.6H20.4' }, { line: 'M15.4 20.4V15.4H20.4' }, { line: 'M8.6 20.4V15.4H3.6' }],
  shine: 'M8 4.4v1.4',
};

// ── arrow-up / arrow-down: the block arrow from batch 2, turned ──
{
  const left = [[2.9, 12], [11, 4.4], [11, 8.6], [20.4, 8.6], [20.4, 15.4], [11, 15.4], [11, 19.6]];
  icons['arrow-up'] = { parts: [{ solid: poly(rotate(left, 90)) }], shine: 'M7.6 8.4 9.6 6.3' };
  icons['arrow-down'] = { parts: [{ solid: poly(rotate(left, -90)) }], shine: 'M10.3 5v1.4' };
}

// ── lightbulb: hint (yellow carries the meaning → gold) ──
{
  const glint = [[8.4, 10.6], [8.8, 9], [9.8, 7.8]];
  icons.lightbulb = {
    materials: 'gold',
    parts: [
      { solid: 'M12 3.6a6.8 6.8 0 0 1 4.2 12.2V17.2H7.8V15.8A6.8 6.8 0 0 1 12 3.6z', cut: (g) => [bandPoly(glint, 0.6 + g)] },
      { solid: rrect(8.4, 18.4, 7.2, 1.8, 0.9), sharp: true },
      { solid: rrect(9.4, 20.8, 5.2, 1.6, 0.8), sharp: true },
    ],
    shine: 'M' + glint.map(([x, y]) => `${x} ${y}`).join('L'),
  };
}

// ── pointer: tap / touch (hand with the index finger up) ──
icons.pointer = {
  parts: [
    { solid: rrect(8.6, 2.2, 3.4, 11, 1.7) },
    { solid: 'M8.6 10.8V16C8.6 18.4 10.6 20 13 20H15.4C18 20 19.6 18 19.6 15.6V12a1.6 1.6 0 0 0 -3.2 0V11.2a1.6 1.6 0 0 0 -3.2 0V10.8a1.6 1.6 0 0 0 -3.2 0z' },
    { solid: 'M8.8 13.4L6.8 11.4a1.6 1.6 0 0 0 -2.3 2.2L8.8 17.8z' },
  ],
  shine: 'M10.2 4.2v2',
};

// ── rotate-device: an upright phone and one big turning arrow (two small arrows merged into
//    the phone at 16px and read as vibration) ──
{
  const R = 8, cx = 11, cy = 14;
  const end = [cx + R, cy];
  icons['rotate-device'] = {
    parts: [
      { solid: rrect(3.2, 5.4, 7, 14.6, 1.8), cut: (g) => [rrect(5.5 - g, 7 - g, 2.4 + 2 * g, 1 + 2 * g, 0.5 + g)] },
      { line: `M${P(cx, cy, R, -70)}A${R} ${R} 0 0 1 ${end[0]} ${end[1] - 0.6}` },
      { solid: poly([[end[0] - 3, end[1] - 1.2], [end[0] + 3, end[1] - 1.2], [end[0], end[1] + 2.8]]) },
    ],
    shine: 'M5 8.6v2.4',
  };
}

// ── trash-2: delete ──
{
  const slots = (g) => [rrect(9.4 - g, 12.2 - g, 1.2 + 2 * g, 6 + 2 * g, 0.6 + g), rrect(13.4 - g, 12.2 - g, 1.2 + 2 * g, 6 + 2 * g, 0.6 + g)];
  icons['trash-2'] = {
    parts: [
      { line: 'M9.6 5V3.8a1 1 0 0 1 1 -1h2.8a1 1 0 0 1 1 1V5', w: 2 },
      { solid: rrect(3.4, 5, 17.2, 2.8, 1.4), sharp: true },
      { solid: 'M5.6 9.6H18.4L17.3 19.4A2 2 0 0 1 15.3 21.2H8.7A2 2 0 0 1 6.7 19.4z', cut: slots },
    ],
    detail: () => [groove('M10 13v4.8M14 13v4.8', 1.2)],
    shine: 'M5 6.4h2.4',
  };
}

// ── pencil: edit / rename (tip down-left) ──
{
  const R = (pts) => rotate(pts, -45);
  icons.pencil = {
    parts: [
      { solid: poly(R([[1.2, 12], [6, 8.8], [6, 15.2]])), sharp: true },
      { solid: poly(R(rectPts(7.2, 8.8, 11, 6.4))), sharp: true },
      { solid: poly(R(rectPts(19.4, 8.8, 3.4, 6.4, 1.4))), sharp: true },
    ],
    shine: (() => { const [a, b] = R([[8.8, 10.2], [13.4, 10.2]]); return `M${a[0].toFixed(2)} ${a[1].toFixed(2)}L${b[0].toFixed(2)} ${b[1].toFixed(2)}`; })(),
  };
}

// ── layout-grid: level select ──
icons['layout-grid'] = {
  parts: [[3.4, 3.4], [12.8, 3.4], [3.4, 12.8], [12.8, 12.8]].map(([x, y]) => ({ solid: rrect(x, y, 7.8, 7.8, 2), sharp: true })),
  shine: 'M5 6.6V5.6a.6.6 0 0 1 .6 -.6',
};

// ── clock: time attack ──
{
  const hands = [[12, 5.8], [12, 12.4], [16.2, 15]];
  icons.clock = {
    parts: [{ solid: circle(12, 12, 9.6), cut: [bandPoly(hands, 1.3)], sharp: true }],
    detail: () => [recess(bandPoly(hands, 1.3), 'outline')],
    shine: `M${P(12, 12, 7.6, 200)}A7.6 7.6 0 0 1 ${P(12, 12, 7.6, 232)}`,
  };
}

writeIcons(icons, OUT);
