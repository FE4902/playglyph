#!/usr/bin/env node
// Batch 9: system and menu utilities (filled + sticker). Shared rules in draw-lib.mjs.
//   node scripts/draw-batch-9.mjs            → writes icons/filled + icons/sticker
//   node scripts/draw-batch-9.mjs <outDir>   → writes <outDir>/… (for trying changes)
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { P, LW, circle, rrect, poly, rotate, bandPoly, offsetPoly, slashed, offSlash, raised, recess, groove, writeIcons } from './draw-lib.mjs';

const OUT = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'icons');
const icons = {};
const arcPts = (cx, cy, r, a0, a1, n = 12) => [...Array(n + 1)].map((_, i) => {
  const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
});

// ── log-in: arrow going into a door (mirror of log-out) ──
icons['log-in'] = {
  parts: [
    { solid: poly([[20.2, 3.2], [12.8, 4.8], [12.8, 19.2], [20.2, 20.8]]), cut: (g) => [circle(15, 12.4, 1.15 + g)] },
    { line: 'M2.8 12H6.6' },
    { solid: poly([[5.6, 7.2], [10.2, 12], [5.6, 16.8]]) },
  ],
  detail: () => [recess(circle(15, 12.4, 1.15))],
  shine: 'M14.2 6v3',
};

// ── cloud: cloud save (cloud with an up arrow) ──
{
  const C = 'M6.8 18A4 4 0 0 1 6.4 10.1A6 6 0 0 1 16.4 9A4.5 4.5 0 0 1 16.4 18z';
  const arrow = [[11.6, 9.8], [14.6, 12.8], [12.8, 12.8], [12.8, 16], [10.4, 16], [10.4, 12.8], [8.6, 12.8]];
  icons.cloud = {
    parts: [{ solid: C, cut: (g) => [offsetPoly(arrow, g)] }],
    detail: () => [...raised(poly(arrow))],
    shine: 'M5.4 13a2.6 2.6 0 0 1 1.2 -1.8',
  };
}

// ── wifi-off: offline (wifi with a red slash in the sticker, a cut slash in the filled style) ──
{
  const cx = 12, cy = 18;
  const arcs = [arcPts(cx, cy, 5.4, 225, 315), arcPts(cx, cy, 10.2, 222, 318)];
  const toD = (pts) => 'M' + pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L');
  const half = LW / 2 + 1;
  icons['wifi-off'] = {
    stack: true,
    parts: [
      ...arcs.map((pts) => ({ line: toD(pts), stickerOnly: true })),
      { solid: circle(cx, cy, 1.8), sharp: true, stickerOnly: true },
      ...arcs.map((pts) => ({ solid: slashed(bandPoly(pts, LW / 2), { half }), sharp: true, filledOnly: true })),
      { solid: slashed(circle(cx, cy, 1.8), { half }), sharp: true, filledOnly: true },
      { line: 'M3.4 3.4L20.6 20.6', filledOnly: true },
    ],
    detail: offSlash,
    shine: 'M4.3 9.9C4.7 9.6 5.1 9.3 5.5 9.1', // on the outer arc's left piece, clear of the slash
  };
}

// ── camera: screenshot ──
icons.camera = {
  parts: [
    { solid: rrect(2.6, 7, 18.8, 13.4, 2.4), cut: (g) => [circle(12, 13.6, 4.4 + g), circle(12, 13.6, 2.4 - g)] },
    { solid: poly([[8, 7.4], [9.6, 4.2], [14.4, 4.2], [16, 7.4]]) },
  ],
  detail: () => [recess(circle(12, 13.6, 4.4), 'outline'), recess(circle(12, 13.6, 2.4), 'base')],
  shine: 'M4.6 10v2.4',
};

// ── keyboard ──
{
  const keys = [];
  for (const y of [8, 11.4]) for (const x of [4.4, 7.9, 11.4, 14.9, 18.4]) keys.push([x, y, 2.2, 2.2, 0.6]);
  keys.push([7.4, 14.8, 9.2, 2.2, 1]);
  icons.keyboard = {
    parts: [{ solid: rrect(2.2, 5.2, 19.6, 13.6, 2.2), cut: (g) => keys.map(([x, y, w, h, r]) => rrect(x - g, y - g, w + 2 * g, h + 2 * g, r + g)) }],
    detail: () => [recess(keys.map((k) => rrect(...k)).join(' '), 'outline')],
    shine: 'M4 6.8h2.4',
  };
}

// ── mouse ──
icons.mouse = {
  parts: [{ solid: rrect(6, 2.6, 12, 18.8, 6), cut: (g) => [rrect(10.9 - g, 5.6 - g, 2.2 + 2 * g, 4.4 + 2 * g, 1.1 + g)] }],
  detail: () => [recess(rrect(10.9, 5.6, 2.2, 4.4, 1.1), 'outline')],
  shine: 'M8 7.4a4 4 0 0 1 1.4 -2.4',
};

// ── list ──
icons.list = {
  parts: [
    { solid: [circle(4.6, 6, 1.7), circle(4.6, 12, 1.7), circle(4.6, 18, 1.7)].join(' '), sharp: true },
    { line: 'M9.4 6H20.2M9.4 12H20.2M9.4 18H20.2' },
  ],
  shine: 'M9.8 5.4h2.4',
};

// ── book-open: codex ──
{
  const left = 'M10.7 6.6C8.8 5.2 6 4.8 2.8 5.2V18.8C6 18.4 8.8 18.8 10.7 20.2z';
  const right = 'M13.3 6.6C15.2 5.2 18 4.8 21.2 5.2V18.8C18 18.4 15.2 18.8 13.3 20.2z';
  icons['book-open'] = {
    parts: [{ solid: left }, { solid: right }],
    detail: () => [groove('M5 9.2C6.6 9 8 9.2 9 9.8M5 12.6C6.6 12.4 8 12.6 9 13.2M15 9.8C16 9.2 17.4 9 19 9.2M15 13.2C16 12.6 17.4 12.4 19 12.6', 1.1)],
    shine: 'M4.4 7.2v2',
  };
}

// ── palette: customize (paint dots are holes in the filled style, colors in the sticker) ──
{
  const body = 'M12 2.8C6.6 2.8 2.6 6.8 2.6 11.8C2.6 16.8 6.6 21 11.4 21C12.8 21 13.6 20 13.6 18.8C13.6 17.2 12.6 16.6 12.6 15.4C12.6 14.2 13.6 13.4 14.8 13.4H17C19.6 13.4 21.4 11.6 21.4 9.4C21.4 5.6 17.2 2.8 12 2.8z';
  const dots = [[7, 12.2], [7.8, 7.6], [12.2, 6], [16.6, 7.8]];
  const paint = ['#e33e4a', '#ffd45a', '#62ad24', '#4d8dff'];
  icons.palette = {
    parts: [{ solid: body, cut: (g) => dots.map(([x, y]) => circle(x, y, 1.6 + g)) }],
    detail: () => [recess(dots.map(([x, y]) => circle(x, y, 1.6)).join(' '), 'outline'), ...dots.map(([x, y], i) => `  <path d="${circle(x - 0.15, y - 0.2, 1.3)}" fill="${paint[i]}" transform="translate(-0.5 -0.6)"/>`)],
    shine: 'M5.2 15.6a6 6 0 0 0 1.4 2',
  };
}

// ── shirt: skins / outfits ──
icons.shirt = {
  parts: [{ solid: 'M8.4 3.4L3 6.4L4.8 11L7 10V20.6H17V10L19.2 11L21 6.4L15.6 3.4C15 5 13.6 5.8 12 5.8C10.4 5.8 9 5 8.4 3.4z' }],
  shine: 'M8.6 11.4v3',
};

// ── bar-chart: stats (rising bars; distinct from the leaderboard's podium) ──
icons['bar-chart'] = {
  parts: [
    { solid: rrect(2.8, 12.2, 4.6, 7.6, 1.2), sharp: true },
    { solid: rrect(8.9, 7.6, 4.6, 12.2, 1.2), sharp: true },
    { solid: rrect(15, 2.8, 4.6, 17, 1.2), sharp: true },
  ],
  shine: 'M4.2 13.6v2',
};

// ── compass: explore ──
{
  const needle = [[16.4, 7.6], [13.4, 13.4], [7.6, 16.4], [10.6, 10.6]];
  icons.compass = {
    parts: [{ solid: circle(12, 12, 9.6), cut: [poly(needle)], sharp: true }],
    detail: () => [
      `  <path d="${poly([[16.4, 7.6], [13.4, 13.4], [10.6, 10.6]])}" fill="#e33e4a" transform="translate(-0.5 -0.6)"/>`,
      recess(poly([[7.6, 16.4], [10.6, 10.6], [13.4, 13.4]]), 'shine'),
    ],
    shine: `M${P(12, 12, 7.6, 200)}A7.6 7.6 0 0 1 ${P(12, 12, 7.6, 232)}`,
  };
}

// ── zoom-in / zoom-out: the search magnifier with + / − ──
{
  const lens = [{ line: circle(10.4, 10.4, 6.4) }, { line: 'M15.4 15.4 20.6 20.6', w: 3.4 }];
  const shine = `M${P(10.4, 10.4, 6.4, 200)}A6.4 6.4 0 0 1 ${P(10.4, 10.4, 6.4, 225)}`;
  icons['zoom-in'] = { parts: [...lens, { line: 'M10.4 8V12.8M8 10.4H12.8', w: 2.2 }], shine };
  icons['zoom-out'] = { parts: [...lens, { line: 'M8 10.4H12.8', w: 2.2 }], shine };
}

void rotate;
writeIcons(icons, OUT);
