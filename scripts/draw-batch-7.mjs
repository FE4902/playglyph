#!/usr/bin/env node
// Batch 7: social + the missing controls (filled + sticker). Shared rules in draw-lib.mjs.
//   node scripts/draw-batch-7.mjs            → writes icons/filled + icons/sticker
//   node scripts/draw-batch-7.mjs <outDir>   → writes <outDir>/… (for trying changes)
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { P, circle, rrect, poly, crescent, raised, recess, writeIcons } from './draw-lib.mjs';

const OUT = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'icons');
const icons = {};

// A body is the top half of an ellipse standing on y = bottom.
const bodyHalfWidth = ({ cx, bottom, rx, ry }, y) => (y < bottom - ry ? null : rx * Math.sqrt(Math.max(0, 1 - ((bottom - y) / ry) ** 2)));
const bodyPath = (b) => `M${b.cx - b.rx} ${b.bottom}A${b.rx} ${b.ry} 0 0 1 ${b.cx + b.rx} ${b.bottom}z`;
/** The part of body `back` that shows to the right of body `front` grown by `gap`. */
function bodyBehind(back, front, gap) {
  const grown = { ...front, rx: front.rx + gap, ry: front.ry + gap, bottom: front.bottom + gap };
  const left = [], right = [];
  for (let i = 0; i <= 32; i++) {
    const y = back.bottom - back.ry + (back.ry * i) / 32;
    const hw = bodyHalfWidth(back, y);
    if (hw == null) continue;
    const fw = bodyHalfWidth(grown, y);
    const xl = Math.max(back.cx - hw, fw == null ? -Infinity : grown.cx + fw), xr = back.cx + hw;
    if (xl < xr) { left.push([xl, y]); right.push([xr, y]); }
  }
  return poly([...right, ...left.reverse()]);
}

// ── users: friends (front person + one behind, separated by a gap) ──
{
  const front = { cx: 9.2, bottom: 20, rx: 6.6, ry: 7.4 }, back = { cx: 16.4, bottom: 20, rx: 5.6, ry: 6.6 };
  icons.users = {
    parts: [
      { solid: crescent([16.4, 6.2, 3.4], [9.2, 7.6, 5.2]), sharp: true },
      { solid: bodyBehind(back, front, 1.2), sharp: true },
      { solid: circle(9.2, 7.6, 4), sharp: true },
      { solid: bodyPath(front), sharp: true },
    ],
    shine: `M${P(9.2, 7.6, 2.7, 200)}A2.7 2.7 0 0 1 ${P(9.2, 7.6, 2.7, 250)}`,
  };
}

// ── user-plus: add friend ──
icons['user-plus'] = {
  parts: [
    { solid: circle(8.8, 7.6, 4), sharp: true },
    { solid: bodyPath({ cx: 8.8, bottom: 20.6, rx: 6.8, ry: 7.4 }), sharp: true },
    { line: 'M18 5.4V11.4M15 8.4H21' },
  ],
  shine: `M${P(8.8, 7.6, 2.7, 200)}A2.7 2.7 0 0 1 ${P(8.8, 7.6, 2.7, 250)}`,
};

// ── message-circle: chat bubble with three dots ──
{
  const dots = (g) => [7.8, 12, 16.2].map((x) => circle(x, 10.6, 1.5 + g));
  icons['message-circle'] = {
    parts: [{ solid: rrect(2.8, 3.8, 18.4, 13.4, 5.4), cut: dots }, { solid: poly([[5.8, 15.4], [4.6, 20.6], [10.8, 16.8]]) }],
    detail: () => [recess(dots(0).join(' '), 'outline')],
    shine: 'M5.4 9a4 4 0 0 1 2 -3',
  };
}

// ── share-2: three nodes ──
icons['share-2'] = {
  parts: [
    { line: 'M16.2 5.8 5.4 12 16.2 18.2' },
    { solid: [circle(16.4, 5.6, 3.2), circle(5.2, 12, 3.2), circle(16.4, 18.4, 3.2)].join(' '), sharp: true },
  ],
  shine: `M${P(5.2, 12, 2, 200)}A2 2 0 0 1 ${P(5.2, 12, 2, 250)}`,
};

// ── thumbs-up: like ──
icons['thumbs-up'] = {
  parts: [
    { solid: rrect(2.4, 9.4, 3.4, 10.2, 1), sharp: true },
    { solid: 'M7.4 9.2L11 2.6C12.6 2.2 14 3.4 13.6 5.2L13 8.4H18.6C20 8.4 21 9.8 20.6 11.2L19 17.6C18.6 18.8 17.6 19.6 16.4 19.6H7.4z' },
  ],
  shine: 'M9 10.4v3',
};

// ── rewind / skip-back: mirrors of fast-forward / skip-forward ──
{
  const triL = (x) => poly([[x, 5.6], [x - 8, 12], [x, 18.4]]);
  icons.rewind = { parts: [{ solid: triL(21) }, { solid: triL(10.4) }], shine: 'M19 8.6v3.2' };
  icons['skip-back'] = {
    parts: [{ solid: poly([[20.4, 4.6], [9.8, 12], [20.4, 19.4]]) }, { solid: rrect(3.8, 4.6, 3.2, 14.8, 1.2) }],
    shine: 'M5 7v3',
  };
}

// ── undo-2: U-turn arrow ──
icons['undo-2'] = {
  parts: [{ line: 'M8.4 8.6H14.4a5 5 0 0 1 0 10H8.6' }, { solid: poly([[3.2, 8.6], [9, 4], [9, 13.2]]) }],
  shine: 'M10.4 8.6h2.4',
};

// ── power ──
icons.power = {
  parts: [{ line: `M${P(12, 12.6, 7.8, -55)}A7.8 7.8 0 1 1 ${P(12, 12.6, 7.8, 235)}` }, { line: 'M12 3V11.4' }],
  shine: `M${P(12, 12.6, 7.8, 160)}A7.8 7.8 0 0 1 ${P(12, 12.6, 7.8, 200)}`,
};

// ── plus / minus ──
icons.plus = { parts: [{ line: 'M12 4V20M4 12H20' }], shine: 'M11.4 5v1.6' };
icons.minus = { parts: [{ line: 'M4 12H20' }], shine: 'M5 11.4h1.6' };

// ── search: magnifier ──
icons.search = {
  parts: [{ line: circle(10.4, 10.4, 6.4) }, { line: 'M15.4 15.4 20.6 20.6', w: 3.4 }],
  shine: `M${P(10.4, 10.4, 6.4, 200)}A6.4 6.4 0 0 1 ${P(10.4, 10.4, 6.4, 240)}`,
};

// ── eye: view / show ──
{
  const almond = 'M2.2 12C4.8 7.4 8.2 5.4 12 5.4S19.2 7.4 21.8 12C19.2 16.6 15.8 18.6 12 18.6S4.8 16.6 2.2 12z';
  icons.eye = {
    parts: [{ solid: almond, cut: (g) => [circle(12, 12, 4.4 + g), circle(12, 12, 2.6 - g)] }],
    detail: () => [recess(circle(12, 12, 4.4), 'outline'), recess(circle(12, 12, 2.6), 'base')],
    shine: 'M5.6 10.4a8 8 0 0 1 2 -2',
  };
}

writeIcons(icons, OUT);
