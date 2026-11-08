#!/usr/bin/env node
// Batch 5: HUD and status (filled + sticker). Materials: steel by default; color where it carries the meaning
// (warning → gold/yellow, fire → lava, mana → arcane, heal potion → red liquid). Shared rules in draw-lib.mjs.
//   node scripts/draw-batch-5.mjs            → writes icons/filled + icons/sticker
//   node scripts/draw-batch-5.mjs <outDir>   → writes <outDir>/… (for trying changes)
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { P, circle, rrect, poly, starPts, bandPoly, offsetPoly, raised, recess, groove, UP, writeIcons } from './draw-lib.mjs';

const OUT = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'icons');
const icons = {};
const arcPts = (cx, cy, r, a0, a1, n = 8) => [...Array(n + 1)].map((_, i) => {
  const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
});

// keyhole: a round top on a tapered stem, grown by g for the soft-corner stroke
const keyhole = (cx, cy, g = 0) => {
  const r = 1.7 + g, a = 52;
  const L = [cx - r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
  const R = [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
  return `M${L[0].toFixed(2)} ${L[1].toFixed(2)}A${r.toFixed(2)} ${r.toFixed(2)} 0 1 1 ${R[0].toFixed(2)} ${R[1].toFixed(2)}L${(cx + 1.5 + g).toFixed(2)} ${(cy + 4.2 + g).toFixed(2)}H${(cx - 1.5 - g).toFixed(2)}z`;
};

// ── lock / lock-open ──
{
  const body = rrect(4.4, 9.5, 15.2, 11, 2.4);
  const lockParts = (shackle) => ({
    materials: 'steel',
    parts: [{ line: shackle }, { solid: body, cut: (g) => [keyhole(12, 13.9, g)] }],
    detail: () => [recess(keyhole(12, 13.9), 'outline')],
    shine: 'M6.4 11.5v2.4',
  });
  icons.lock = lockParts('M7.6 9.9V7.1a4.4 4.4 0 0 1 8.8 0V9.9');
  icons['lock-open'] = lockParts('M7.6 9.9V6.9a4.4 4.4 0 0 1 8.5 -1.6');
}

// ── triangle-alert: warning (yellow carries the meaning → gold) ──
{
  const bang = (g) => [rrect(10.6 - g, 7.2 - g, 2.8 + 2 * g, 6.6 + 2 * g, 1.4 + g), circle(12, 16.2, 1.5 + g)];
  icons['triangle-alert'] = {
    materials: 'gold',
    parts: [{ solid: poly([[12, 1.9], [21.8, 18.9], [2.2, 18.9]]), cut: bang }],
    detail: () => [recess(bang(0).join(' '), 'outline')],
    shine: 'M9.6 7.2 8 10',
  };
}

// ── level-up: disc with an up arrow ──
{
  const arrow = poly([[12, 5.4], [17.6, 11], [14.3, 11], [14.3, 17.8], [9.7, 17.8], [9.7, 11], [6.4, 11]]);
  icons['level-up'] = {
    materials: 'gold',
    parts: [{ solid: circle(12, 12, 9.6), cut: [arrow], sharp: true }],
    detail: () => [...raised(arrow)],
    shine: `M${P(12, 12, 7.6, 200)}A7.6 7.6 0 0 1 ${P(12, 12, 7.6, 232)}`,
  };
}

// ── shield: defend / armor ──
{
  const S = 'M12 2.6L20 5.6V11.2C20 16 16.6 19.6 12 21.4C7.4 19.6 4 16 4 11.2V5.6z';
  icons.shield = {
    materials: 'steel',
    parts: [{ solid: S }],
    detail: () => [recess('M12 2.6L20 5.6V11.2C20 16 16.6 19.6 12 21.4z', 'shadow')],
    shine: 'M6.2 7.4v3.2',
  };
}

// ── skull: death, kills, danger ──
{
  const head = 'M12 2.8C7 2.8 3.6 6.4 3.6 10.8C3.6 13.6 4.8 15.4 6.6 16.4V19a1.6 1.6 0 0 0 1.6 1.6H15.8a1.6 1.6 0 0 0 1.6 -1.6V16.4C19.2 15.4 20.4 13.6 20.4 10.8C20.4 6.4 17 2.8 12 2.8z';
  const nose = [[12, 13.8], [13.2, 15.9], [10.8, 15.9]];
  const holes = (g) => [circle(8.5, 11, 2.3 + g), circle(15.5, 11, 2.3 + g), offsetPoly(nose, g),
    rrect(9.9 - g, 17.9 - g, 1.2 + 2 * g, 2.7 + g, 0.01), rrect(12.9 - g, 17.9 - g, 1.2 + 2 * g, 2.7 + g, 0.01)];
  icons.skull = {
    materials: 'steel',
    parts: [{ solid: head, cut: holes }],
    detail: () => [recess([circle(8.5, 11, 2.3), circle(15.5, 11, 2.3), poly(nose)].join(' '), 'outline'), groove('M10.5 18.2V20M13.5 18.2V20', 1.1)],
    shine: 'M6 7.6a6.6 6.6 0 0 1 2.6 -2.6',
  };
}

// ── flame: fire status, streak (lava) ──
{
  // drawn at 1.08× about (12, 12.8) so the narrow flame holds its own next to wider icons
  const K = 1.08, T = (x, y) => `${(12 + K * (x - 12)).toFixed(2)} ${(12.8 + K * (y - 12.8)).toFixed(2)}`;
  const F = `M${T(12, 2.6)}C${T(12, 2.6)} ${T(6, 8)} ${T(6, 13.8)}A${6 * K} ${6 * K} 0 0 0 ${T(18, 13.8)}C${T(18, 10.6)} ${T(16.2, 8.4)} ${T(15, 7.4)}C${T(14.8, 9.4)} ${T(13.8, 10.6)} ${T(12.6, 11)}C${T(13.4, 8.2)} ${T(12, 4.4)} ${T(12, 2.6)}z`;
  const inner = (g) => {
    const k = 1.08 * (1 + g / 2.2), cx = 12, cy = 17; // inner flame, scaled with the outer and grown by g
    const pts = [[12, 13.2], [13.6, 15], [14.2, 17], [13.5, 18.8], [12, 19.4], [10.5, 18.8], [9.8, 17], [10.4, 15]];
    return poly(pts.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]));
  };
  icons.flame = {
    materials: 'lava',
    parts: [{ solid: F, cut: (g) => [inner(g)] }],
    detail: () => [recess(inner(0), 'light')],
    shine: 'M7.8 12.4a5.4 5.4 0 0 1 1.3 -2.8',
  };
}

// ── snowflake: freeze / slow ──
{
  const arms = [], ticks = [];
  for (let k = 0; k < 6; k++) {
    const a = -90 + k * 60;
    arms.push(`M12 12L${P(12, 12, 9, a)}`);
    const [bx, by] = [12 + 7 * Math.cos((a * Math.PI) / 180), 12 + 7 * Math.sin((a * Math.PI) / 180)];
    ticks.push(`M${P(bx, by, 2.4, a + 180 - 42)}L${bx.toFixed(2)} ${by.toFixed(2)}L${P(bx, by, 2.4, a + 180 + 42)}`);
  }
  icons.snowflake = {
    materials: 'steel',
    parts: [{ line: arms.join(''), w: 1.8, outline: 1.4 }, { line: ticks.join(''), w: 1.4, outline: 1.4 }],
    shine: 'M11.4 5.2v1.6',
  };
}

// ── droplet: mana (arcane) ──
{
  const D = 'M12 2.6C12 2.6 5 10 5 14.4a7 7 0 0 0 14 0C19 10 12 2.6 12 2.6z';
  const glint = arcPts(12, 14.4, 4.4, 115, 165, 6);
  icons.droplet = {
    materials: 'arcane',
    parts: [{ solid: D, cut: (g) => [bandPoly(glint, 0.6 + g)] }],
    shine: 'M' + glint.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L'),
  };
}

// ── potion: round flask, cork; heal liquid in red ──
{
  const RED = ['#4a1029', '#a3203f', '#e33e4a', '#ff7d63', '#ffe6d2'];
  const liquid = 'M5.33 13.3A6.8 6.8 0 1 0 18.67 13.3z';
  icons.potion = {
    materials: 'steel',
    parts: [
      { solid: rrect(8.8, 2.2, 6.4, 2.2, 1.1), sharp: true },
      { solid: rrect(9.6, 5.4, 4.8, 4.4, 0.6) },
      { solid: circle(12, 14.6, 6.8), sharp: true, cut: [rrect(6, 12.7, 12, 1.2, 0.6), circle(9.4, 16.6, 1.1)] },
    ],
    detail: () => [
      `  <path d="${liquid}" fill="${RED[1]}"${UP}/>`,
      `  <path d="M6.2 15.4A6 6 0 0 0 17.8 15.4C17.8 14.6 17.6 14 17.4 13.6H6.6C6.4 14 6.2 14.6 6.2 15.4z" fill="${RED[2]}"${UP}/>`,
      `  <circle cx="9.4" cy="16.6" r="1" fill="${RED[4]}"${UP.replace('-0.5 -0.6', '-0.5 -0.6')}/>`,
    ],
    shine: 'M7.2 11.2a5.4 5.4 0 0 1 2 -2',
  };
}

// ── sparkles: new item, buff (gold) ──
icons.sparkles = {
  materials: 'gold',
  parts: [{ solid: poly(starPts(10.4, 13.2, 8, 2.5, 4)) }, { solid: poly(starPts(18, 6.2, 3.4, 1.15, 4)) }],
  shine: 'M9.4 8.6v2',
};

// ── crosshair: aim ──
icons.crosshair = {
  materials: 'steel',
  parts: [
    { line: 'M7.8 5.4A7.8 7.8 0 0 0 5.4 7.8M5.4 16.2A7.8 7.8 0 0 0 7.8 18.6M16.2 18.6A7.8 7.8 0 0 0 18.6 16.2M18.6 7.8A7.8 7.8 0 0 0 16.2 5.4', w: 2.4, outline: 1.2 },
    { line: 'M12 2.8V7M12 17V21.2M2.8 12H7M17 12H21.2', w: 2.4, outline: 1.2 },
    { solid: circle(12, 12, 1.2), sharp: true, outline: 1.2 },
  ],
  shine: 'M11.5 3.2v1.2',
};

writeIcons(icons, OUT);
