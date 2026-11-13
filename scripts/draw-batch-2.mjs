#!/usr/bin/env node
// Batch 2: system + control icons (filled + sticker), drawn to the spec's drawing rules:
// chunky silhouettes, line parts 2.8 wide, steel by default, one highlight, gaps instead of shading in mono,
// size keylines (round ~20, tall 18-20, wide 19-20, triangles ~18 tall, X ~16).
//
//   node scripts/draw-batch-2.mjs            → writes icons/filled + icons/sticker
//   node scripts/draw-batch-2.mjs <outDir>   → writes <outDir>/filled + <outDir>/sticker (for trying changes)
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { f, P, circle, rrect, poly, fillRole, raised, recess, groove, UP, strokeRole, writeIcons } from './draw-lib.mjs';

const OUT = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'icons');

const icons = {};

// ── log-out: open door + arrow out ──
{
  const door = poly([[4.5, 3.2], [11.9, 4.8], [11.9, 19.2], [4.5, 20.8]]);
  const head = poly([[16.3, 6.9], [21.7, 12], [16.3, 17.1]]);
  icons['log-out'] = {
    parts: [{ solid: door, cut: (g) => [circle(9.7, 12.4, 1.15 + g)] }, { line: 'M13.9 12H17.4' }, { solid: head }],
    detail: [recess(circle(9.7, 12.4, 1.15))],
    shine: 'M6.2 6.4V9.4',
  };
}

// ── circle-help: disc with a ? ──
{
  const cx = 12, cy = 9.3, r = 3.3, h = 1.4; // hook center, mid radius, half thickness
  const ro = r + h, ri = r - h;
  const a0 = 205;                                   // hook starts at the left
  const xR = 13.4, xL = 10.6, stemEnd = 14.1;      // stem: x 10.6..13.4 (2.8 wide)
  const aOut = Math.atan2(Math.sqrt(ro * ro - (xR - cx) ** 2), xR - cx) * 180 / Math.PI; // outer arc meets stem right edge
  const yIn = cy + Math.sqrt(Math.max(0, ri * ri - (xL - cx) ** 2));
  const q = `M${P(cx, cy, ro, a0)}A${ro} ${ro} 0 1 1 ${f(xR)} ${f(cy + Math.sqrt(ro * ro - (xR - cx) ** 2))}` +
    `L${xR} ${stemEnd}A${h} ${h} 0 0 1 ${xL} ${stemEnd}L${xL} ${f(yIn)}` +
    `A${ri} ${ri} 0 1 0 ${P(cx, cy, ri, a0)}A${h} ${h} 0 0 1 ${P(cx, cy, ro, a0)}z`;
  void aOut;
  const dot = circle(12, 17.7, 1.6);
  icons['circle-help'] = {
    parts: [{ solid: circle(12, 12, 9.6), cut: [q, dot], sharp: true }],
    detail: [...raised(`${q} ${dot}`)],
    shine: `M${P(12, 12, 7.4, 200)}A7.4 7.4 0 0 1 ${P(12, 12, 7.4, 232)}`,
  };
}

// ── info: disc with an i ──
{
  const dot = circle(12, 7.5, 1.65);
  const stem = rrect(10.6, 10.3, 2.8, 7.6, 1.4);
  icons.info = {
    parts: [{ solid: circle(12, 12, 9.6), cut: [dot, stem], sharp: true }],
    detail: [...raised(`${dot} ${stem}`)],
    shine: `M${P(12, 12, 7.4, 200)}A7.4 7.4 0 0 1 ${P(12, 12, 7.4, 232)}`,
  };
}

// ── fullscreen: four corner brackets ──
{
  const a = 4.4, b = 19.6, l = 4.2;
  icons.fullscreen = {
    parts: [
      { line: `M${a} ${a + l}V${a}H${a + l}` }, { line: `M${b - l} ${a}H${b}V${a + l}` },
      { line: `M${b} ${b - l}V${b}H${b - l}` }, { line: `M${a + l} ${b}H${a}V${b - l}` },
    ],
    shine: `M${a + 0.2} ${a + 2.6}V${a + 1}`,
  };
}

// ── languages: globe ──
{
  const R = 9.6, c = 12;
  // cuts: a meridian lens ring and two latitude bands, split where they cross so evenodd never re-fills
  const ring = (rx, ry) => `M${c} ${f(c - ry)}A${rx} ${ry} 0 0 1 ${c} ${f(c + ry)}A${rx} ${ry} 0 0 1 ${c} ${f(c - ry)}z`;
  const lens = [ring(4.3, R), ring(3.0, R)];
  const lat = (y) => {
    const dy = Math.abs(y - c), half = 0.65;
    const xo = (rx) => rx * Math.sqrt(1 - (dy / R) ** 2);
    const o = xo(4.3), i = xo(3.0);
    // the outer pieces end on the globe's own edge: a cut that runs past it would be filled back in by evenodd
    const outer = (s) => {
      const pts = [];
      for (let k = 0; k <= 6; k++) { const yy = y - half + (k / 6) * 2 * half; pts.push([c + s * Math.sqrt(R * R - (yy - c) ** 2), yy]); }
      return 'M' + [...pts, [c + s * o, y + half], [c + s * o, y - half]].map(([px, py]) => `${f(px)} ${f(py)}`).join('L') + 'z';
    };
    return [outer(-1), outer(1), rrect(c - i, y - half, 2 * i, 2 * half, 0.01)];
  };
  const cuts = [...lens, ...lat(7.6), ...lat(16.4)];
  icons.languages = {
    parts: [{ solid: circle(c, c, R), cut: cuts, sharp: true }],
    detail: [
      `  <ellipse cx="${c}" cy="${c}" rx="3.65" ry="${R}" fill="none" stroke-width="1.3" ${strokeRole('shadow')}${UP}/>`,
      groove(`M${f(c - Math.sqrt(R * R - 4.4 ** 2))} 7.6H${f(c + Math.sqrt(R * R - 4.4 ** 2))}`),
      groove(`M${f(c - Math.sqrt(R * R - 4.4 ** 2))} 16.4H${f(c + Math.sqrt(R * R - 4.4 ** 2))}`),
    ],
    shine: `M${P(12, 12, 7.9, 196)}A7.9 7.9 0 0 1 ${P(12, 12, 7.9, 226)}`,
  };
}

// ── vibrate: phone + zigzags ──
{
  const phone = rrect(7.6, 3.4, 8.8, 17.2, 2.2);
  const zig = (x0, x1) => `M${x0} 7.8L${x1} 10L${x0} 12.2L${x1} 14.4L${x0} 16.6`;
  icons.vibrate = {
    parts: [{ solid: phone, cut: (g) => [rrect(10.6 - g, 5.4 - g, 2.8 + 2 * g, 1.2 + 2 * g, 0.6 + g)] }, { line: zig(4.6, 2.9), w: 2.4 }, { line: zig(19.4, 21.1), w: 2.4 }],
    detail: [recess(rrect(9.2, 7.4, 5.6, 9.6, 1))],
    shine: 'M9.3 5.6h1.4',
  };
}

// ── arrow-left / arrow-right: block arrows ──
{
  const left = [[2.9, 12], [11, 4.4], [11, 8.6], [20.4, 8.6], [20.4, 15.4], [11, 15.4], [11, 19.6]];
  const mirror = (pts) => pts.map(([x, y]) => [24 - x, y]);
  icons['arrow-left'] = { parts: [{ solid: poly(left) }], shine: 'M8.4 7.6 6.3 9.6' };
  icons['arrow-right'] = { parts: [{ solid: poly(mirror(left)) }], shine: 'M5 10.3v1.4' };
}

// ── fast-forward: two triangles, kept apart so each reads at 16px ──
{
  const tri = (x) => poly([[x, 5.6], [x + 8, 12], [x, 18.4]]);
  icons['fast-forward'] = { parts: [{ solid: tri(3) }, { solid: tri(13.6) }], shine: 'M5 8.6v3.2' };
}

// ── skip-forward: triangle + bar, with a clear gap between them ──
{
  icons['skip-forward'] = {
    parts: [{ solid: poly([[3.6, 4.6], [14.2, 12], [3.6, 19.4]]) }, { solid: rrect(17, 4.6, 3.2, 14.8, 1.2) }],
    shine: 'M5.6 7.8v3.6',
  };
}

// ── check ──
icons.check = { parts: [{ line: 'M3.4 12.8 9.2 18.6 20.6 5.8' }], shine: 'M4.3 12.6l1.3 1.3' };

// ── menu: three bars ──
icons.menu = {
  parts: [{ line: 'M4.4 6.2H19.6' }, { line: 'M4.4 12H19.6' }, { line: 'M4.4 17.8H19.6' }],
  shine: 'M5 5.6h2.6',
};

writeIcons(icons, OUT);
