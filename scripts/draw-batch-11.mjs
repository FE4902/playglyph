#!/usr/bin/env node
// Batch 11: the four UI icons the AI usability test asked for and the set lacked —
// hammer (match-3 booster), send (chat), folder-open (load game), copy (codes, links).
//   node scripts/draw-batch-11.mjs            → writes icons/filled + icons/sticker
//   node scripts/draw-batch-11.mjs <outDir>   → writes <outDir>/… (for trying changes)
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { poly, rotate, rectPts, bandPoly, groove, writeIcons } from './draw-lib.mjs';

const OUT = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'icons');
const icons = {};
const toD = (pts) => 'M' + pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L');
/** Scale point lists about (12, 12) and move them so their combined box is centered, nudged by (dx, dy). */
const fit = (lists, k = 1, dx = 0, dy = 0) => {
  const scaled = lists.map((pts) => pts.map(([x, y]) => [12 + k * (x - 12), 12 + k * (y - 12)]));
  const all = scaled.flat(), xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
  const ox = 12 - (Math.min(...xs) + Math.max(...xs)) / 2 + dx, oy = 12 - (Math.min(...ys) + Math.max(...ys)) / 2 + dy;
  return scaled.map((pts) => pts.map(([x, y]) => [x + ox, y + oy]));
};

// ── hammer: steel head, wooden handle, tilted ──
{
  // drawn upright, turned 45°, then shrunk and centered as one piece; nudged down-left a little
  // because the head carries most of the weight
  const R = (pts) => rotate(pts, 45, 12, 12);
  const [handle, head, glint] = fit([R(rectPts(10.7, 8.4, 2.6, 13, 1.3)), R(rectPts(6, 3, 12, 5.8, 1.5)), R([[7.4, 4.4], [10.8, 4.4]])], 1.02, -0.9, 0.9);
  icons.hammer = {
    materials: 'steel wood',
    parts: [{ solid: poly(handle), alt: true }, { solid: poly(head) }],
    shine: toD(glint),
  };
}

// ── send: paper plane with a crease ──
{
  const [plane, crease, glint] = fit([[[21.4, 2.6], [13.8, 21.2], [10.6, 13.4], [2.8, 10.2]], [[18.6, 5.4], [11.6, 12.4]], [[5.6, 10.2], [9.6, 8.6]]], 0.94, -0.8, 0.8);
  icons.send = {
    parts: [{ solid: poly(plane), cut: (g) => [bandPoly(crease, 0.6 + g)] }],
    detail: () => [groove(toD(crease), 1.2)],
    shine: toD(glint),
  };
}

// ── folder-open: back panel with tab + slanted front flap (crisp, so the gap stays) ──
icons['folder-open'] = {
  parts: [
    { solid: 'M2.6 6.2A1.8 1.8 0 0 1 4.4 4.4H9.2L11.2 6.4H18.2A1.8 1.8 0 0 1 20 8.2V10H2.6z', sharp: true },
    { solid: poly([[5, 11.4], [21.8, 11.4], [19, 19.6], [2.2, 19.6]]), sharp: true },
  ],
  shine: 'M4.4 6.4v1.8',
};

// ── copy: a sheet behind (only its L shows) and one in front ──
icons.copy = {
  parts: [
    { solid: 'M2.8 5A2.2 2.2 0 0 1 5 2.8H13.4A2.2 2.2 0 0 1 15.6 5V7H7V15.6H5A2.2 2.2 0 0 1 2.8 13.4z', sharp: true },
    { solid: 'M10.6 8.4H19A2.2 2.2 0 0 1 21.2 10.6V19A2.2 2.2 0 0 1 19 21.2H10.6A2.2 2.2 0 0 1 8.4 19V10.6A2.2 2.2 0 0 1 10.6 8.4z', sharp: true },
  ],
  shine: 'M10.2 11v2.4',
};

writeIcons(icons, OUT);
