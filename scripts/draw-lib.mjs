// Shared drawing helpers for the scripts/draw-batch-*.mjs icon scripts.
// Encodes the spec's drawing rules so every batch looks like one set:
// line parts 2.8 wide, soft corners on solids, steel by default, sticker = outline → shadow → base (moved up-left) → one shine.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { materials } from '../src/materials.js';
import { pathToPolys } from './size-check.mjs';

export const f = (n) => +n.toFixed(2);
const rad = (d) => (d * Math.PI) / 180;
/** Point on a circle, as "x y". */
export const P = (cx, cy, r, a) => `${f(cx + r * Math.cos(rad(a)))} ${f(cy + r * Math.sin(rad(a)))}`;
export const circle = (cx, cy, r) => `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0z`;
export const rrect = (x, y, w, h, r) => {
  r = Math.min(r, w / 2, h / 2);
  return `M${f(x + r)} ${f(y)}h${f(w - 2 * r)}a${f(r)} ${f(r)} 0 0 1 ${f(r)} ${f(r)}v${f(h - 2 * r)}a${f(r)} ${f(r)} 0 0 1 ${f(-r)} ${f(r)}h${f(2 * r - w)}a${f(r)} ${f(r)} 0 0 1 ${f(-r)} ${f(-r)}v${f(2 * r - h)}a${f(r)} ${f(r)} 0 0 1 ${f(r)} ${f(-r)}z`;
};
export const poly = (pts) => 'M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L') + 'z';
/** Rotate points [[x, y]] by deg around (cx, cy). */
export const rotate = (pts, deg, cx = 12, cy = 12) => pts.map(([x, y]) => {
  const a = rad(deg), dx = x - cx, dy = y - cy;
  return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)];
});
/** A band of half-width h along a polyline (mitered joins, flat ends) — for gaps cut along a line. */
export function bandPoly(pts, h) {
  const n = pts.length, left = [], right = [];
  const norm = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy); return [-dy / L, dx / L]; };
  for (let i = 0; i < n; i++) {
    let nx, ny;
    if (i === 0) [nx, ny] = norm(pts[0], pts[1]);
    else if (i === n - 1) [nx, ny] = norm(pts[n - 2], pts[n - 1]);
    else {
      const [ax, ay] = norm(pts[i - 1], pts[i]), [bx, by] = norm(pts[i], pts[i + 1]);
      const mx = ax + bx, my = ay + by, L = Math.hypot(mx, my), c = (mx / L) * ax + (my / L) * ay;
      nx = mx / L / c; ny = my / L / c;
    }
    left.push([pts[i][0] + nx * h, pts[i][1] + ny * h]);
    right.push([pts[i][0] - nx * h, pts[i][1] - ny * h]);
  }
  return poly([...left, ...right.reverse()]);
}
/** Circle 1 minus circle 2 (a crescent), as one closed path — for a shape partly hidden behind another. */
export function crescent([x1, y1, r1], [x2, y2, r2]) {
  const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy);
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d), h = Math.sqrt(r1 * r1 - a * a);
  const mx = x1 + (a * dx) / d, my = y1 + (a * dy) / d;
  const p1 = [mx + (h * dy) / d, my - (h * dx) / d], p2 = [mx - (h * dy) / d, my + (h * dx) / d];
  return `M${f(p1[0])} ${f(p1[1])}A${f(r1)} ${f(r1)} 0 1 0 ${f(p2[0])} ${f(p2[1])}A${f(r2)} ${f(r2)} 0 0 1 ${f(p1[0])} ${f(p1[1])}z`;
}

/**
 * A shape with a slash's corridor cut out of it — the gap that keeps an "off" slash from merging
 * with what it crosses. half = half the slash width + the gap (+ the soft-corner stroke if the shape has one).
 */
export function slashed(d, { a = [3.4, 3.4], b = [20.6, 20.6], half }) {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]], L = Math.hypot(dx, dy);
  const side = (p) => (dx * (p[1] - a[1]) - dy * (p[0] - a[0])) / L; // signed distance from the slash line
  const clip = (pts, keep) => {
    const out = [];
    pts.forEach((p, i) => {
      const q = pts[(i + 1) % pts.length], sp = keep(side(p)), sq = keep(side(q));
      if (sp >= 0) out.push(p);
      if ((sp >= 0) !== (sq >= 0)) { const t = sp / (sp - sq); out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]); }
    });
    return out;
  };
  const pieces = [];
  for (const { pts } of pathToPolys(d)) for (const keep of [(v) => v - half, (v) => -v - half]) {
    const c = clip(pts, keep);
    if (c.length > 2) pieces.push(poly(c));
  }
  return pieces.join(' ');
}
/** Sticker "off" slash in the fixed red used by volume-x and music-off. */
export const RED_SLASH = ['#4a1029', '#a3203f', '#e33e4a'];

/** Clip a polygon to the intersection of half-planes; each plane is (p) => value, kept where value ≥ 0 (linear). */
export function clipPlanes(pts, planes) {
  let out = pts;
  for (const plane of planes) {
    const src = out; out = [];
    src.forEach((p, i) => {
      const q = src[(i + 1) % src.length], a = plane(p), b = plane(q);
      if (a >= 0) out.push(p);
      if ((a >= 0) !== (b >= 0)) { const t = a / (a - b); out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]); }
    });
    if (!out.length) break;
  }
  return out;
}
export { pathToPolys };

/** Points of a rectangle (optionally rounded by sampling the corners) — rotate() them for tilted shapes. */
export const rectPts = (x, y, w, h, r = 0, n = 4) => {
  if (!r) return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  const out = [];
  for (const [cx, cy, a0] of [[x + w - r, y + r, -90], [x + w - r, y + h - r, 0], [x + r, y + h - r, 90], [x + r, y + r, 180]])
    for (let k = 0; k <= n; k++) { const a = rad(a0 + (k / n) * 90); out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  return out;
};

/** Star with n points (default 5). */
export const starPts = (cx, cy, R, r, n = 5) => [...Array(2 * n)].map((_, i) => {
  const a = rad(-90 + (i * 180) / n), k = i % 2 ? r : R;
  return [cx + k * Math.cos(a), cy + k * Math.sin(a)];
});
export const star = (cx, cy, R, r, n = 5) => poly(starPts(cx, cy, R, r, n));
/** Grow a closed polygon outward by d (mitered) — e.g. to keep a hole its designed size under the soft-corner stroke. */
export function offsetPoly(pts, d) {
  const n = pts.length, area = pts.reduce((s, [x, y], i) => s + x * pts[(i + 1) % n][1] - pts[(i + 1) % n][0] * y, 0);
  const sgn = area > 0 ? 1 : -1; // outward for either winding (y points down)
  const nrm = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy); return [(sgn * dy) / L, (-sgn * dx) / L]; };
  return poly(pts.map((p, i) => {
    const [ax, ay] = nrm(pts[(i - 1 + n) % n], p), [bx, by] = nrm(p, pts[(i + 1) % n]);
    const mx = ax + bx, my = ay + by, L = Math.hypot(mx, my), c = (mx / L) * ax + (my / L) * ay;
    return [p[0] + ((mx / L) * d) / c, p[1] + ((my / L) * d) / c];
  }));
}

export const LW = 2.8;      // line parts
export const SOFT = 1.4;    // soft-corner stroke on solids (filled style)
export const OUTLINE = 3.4; // sticker outline
const TONE = { outline: 0, shadow: 1, base: 2, light: 3, shine: 4 };
// Default materials (spec rule): steel for system/control/menu, gold for currency and rewards.
// The hex written into the file is only the preview color for that default; the role decides the real color.
let MATS = ['steel', 'gold'];
let FIXED = null; // a fixed 5-tone palette (heart-style icons whose color is the meaning): no roles, outline marked as a layer
const hex = (r) => { const alt = r.startsWith('alt-'); const t = alt ? r.slice(4) : r; return FIXED ? FIXED[TONE[t]] : materials[MATS[alt ? 1 : 0]].tones[TONE[t]]; };
const tag = (kind, r) => (FIXED ? (r === 'outline' ? ' data-layer="outline"' : '') : ` data-${kind}="${r}"`);
export const fillRole = (r) => `fill="${hex(r)}"${tag('fill', r)}`;
export const strokeRole = (r) => `stroke="${hex(r)}"${tag('stroke', r)}`;
/** The heart's fixed red (used by heart-style icons). */
export const HEART_RED = ['#4a1029', '#a3203f', '#e33e4a', '#ff7d63', '#ffe6d2'];
const altRole = (p, r) => (p.alt ? `alt-${r}` : r);
const LINE = 'fill="none" stroke-linecap="round" stroke-linejoin="round"';
export const UP = ' transform="translate(-0.5 -0.6)"'; // where the sticker's base face sits

// An icon is { parts, detail?, shine? }:
//   parts:  { solid: d, cut?: d[] | (grow) => d[], sharp? }  filled shape; cuts are holes in the filled style.
//             A cut given as a function receives how much to grow it (the soft-corner stroke also draws
//             around holes and would shrink them), so holes keep their designed size.
//           { line: d, w? }                                   a 2.8 stroke (w overrides, sparingly)
//           outline optionally overrides the sticker outline width for compact details.
//           any part may set filledOnly / stickerOnly: true, and a line part may set fixed: [outline, shadow, base] hex colors
//           any part may set filledOnly: true (the sticker shows it through `detail` instead)
//   detail: sticker-only elements (an array, or a function returning one so colors follow `materials`) drawn on the face (sticker draws no holes; it shows them as detail)
//   shine:  one highlight stroke for the sticker
//   materials: 'steel' (default) | 'gold' | 'steel gold' … — the second is for parts marked { alt: true }
const cutsOf = (p, grow) => (typeof p.cut === 'function' ? p.cut(grow) : p.cut ?? []);

export function filledSvg(parts) {
  const els = parts.filter((p) => !p.stickerOnly).map((p) => {
    if (p.solid != null) {
      const sw = p.soft ?? SOFT; // soft-corner stroke width (the heart family uses 2)
      const grow = p.sharp ? 0 : sw / 2;
      const cuts = cutsOf(p, grow);
      const soft = p.sharp ? '' : ` stroke="currentColor" stroke-width="${sw}" stroke-linejoin="round"`;
      return `  <path d="${[p.solid, ...cuts].join(' ')}"${cuts.length || p.evenodd ? ' fill-rule="evenodd"' : ''}${soft}/>`;
    }
    return `  <path d="${p.line}" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="${p.w ?? LW}"/>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">\n${els.join('\n')}\n</svg>\n`;
}

export function stickerSvg(parts, { detail = [], shine, materials: mats = 'steel', stack = false, fixed = null } = {}) {
  MATS = [...mats.split(' '), 'gold'].slice(0, 2);
  FIXED = fixed;
  const layerOf = (list, role, shift) => list.filter((p) => !p.filledOnly).map((p) => {
    const t = shift ? UP : '';
    if (p.solid != null) {
      return role === 'outline'
        ? `  <path d="${p.solid}" ${fillRole(altRole(p, 'outline'))} ${strokeRole(altRole(p, 'outline')).replace(' data-layer="outline"', '')} stroke-width="${p.outline ?? OUTLINE}" stroke-linejoin="round"/>`
        : `  <path d="${p.solid}" ${fillRole(altRole(p, role))}${t}/>`;
    }
    const w = (p.w ?? LW) + (role === 'outline' ? (p.outline ?? OUTLINE) : 0);
    if (p.fixed) return `  <path d="${p.line}" ${LINE} stroke="${p.fixed[{ outline: 0, shadow: 1, base: 2 }[role]]}" stroke-width="${f(w)}"${t}/>`;
    return `  <path d="${p.line}" ${LINE} ${strokeRole(altRole(p, role))} stroke-width="${f(w)}"${t}/>`;
  });
  const layer = (role, shift) => layerOf(parts, role, shift);
  // stack: draw each part whole (outline, shadow, face) before the next, so a later part sits on top
  // with its own outline (crossed swords); otherwise all outlines first, so parts merge into one silhouette.
  const body = stack
    ? parts.filter((p) => !p.filledOnly).flatMap((p) => { const one = (r, sh) => layerOf([p], r, sh); return [...one('outline'), ...one('shadow'), ...one('base', true)]; })
    : [...layer('outline'), ...layer('shadow'), ...layer('base', true)];
  const els = [...body, ...(typeof detail === 'function' ? detail() : detail)];
  if (shine) els.push(`  <path d="${shine}" ${LINE} stroke-width="1.2" ${strokeRole('shine')}/>`);
  const out = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"${fixed ? '' : ` data-materials="${mats}"`}>\n${els.join('\n')}\n</svg>\n`;
  MATS = ['steel', 'gold'];
  FIXED = null;
  return out;
}

/** Sticker detail: a raised symbol (drop shadow + shine face), e.g. ? on a disc. */
export const raised = (d) => [
  `  <path d="${d}" ${fillRole('shadow')} transform="translate(0.1 0.5)"/>`,
  `  <path d="${d}" ${fillRole('shine')}${UP}/>`,
];
/** Sticker detail: a recessed area on the face (hole, slot, door). */
export const recess = (d, role = 'shadow') => `  <path d="${d}" ${fillRole(role)}${UP}/>`;
/** Sticker detail: a groove line on the face. */
export const groove = (d, w = 1.3) => `  <path d="${d}" ${LINE} stroke-width="${w}" ${strokeRole('shadow')}${UP}/>`;

export function writeIcons(icons, outDir) {
  mkdirSync(join(outDir, 'filled'), { recursive: true });
  mkdirSync(join(outDir, 'sticker'), { recursive: true });
  for (const [name, ic] of Object.entries(icons)) {
    writeFileSync(join(outDir, 'filled', `${name}.svg`), filledSvg(ic.parts));
    writeFileSync(join(outDir, 'sticker', `${name}.svg`), stickerSvg(ic.parts, ic));
  }
  console.log(`drew ${Object.keys(icons).length} icons → ${outDir}`);
}

/** A compact off-state slash, drawn after face details so the mark stays continuous. */
export const offSlash = () => [
  '  <path d="M3.4 3.4L20.6 20.6" fill="none" stroke="#4a1029" stroke-width="3.2" stroke-linecap="round"/>',
  '  <path d="M3.4 3.4L20.6 20.6" fill="none" stroke="#a3203f" stroke-width="1.8" stroke-linecap="round"/>',
  '  <path d="M3.4 3.4L20.6 20.6" fill="none" stroke="#e33e4a" stroke-width="1.8" stroke-linecap="round" transform="translate(-0.3 -0.3)"/>',
];
