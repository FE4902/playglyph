#!/usr/bin/env node
// Measures how big each filled icon looks, so a set of icons reads as one size.
// Physical size alone is misleading (an X fills far less than a square of the same box),
// so this reports both the bounding box and the painted area, plus where the weight sits.
//
//   node scripts/size-check.mjs [dir]     → table of every filled icon (default icons/filled), outliers marked
//   import { measureIcon, sizeWarnings }  → used by scripts/build.mjs
//
// No dependencies: a small rasterizer that understands what filled icons may contain
// (path, circle, ellipse, rect, line, polyline, polygon; fill, stroke, fill-rule).
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RES = 6; // samples per unit → a 144×144 grid for the 24×24 box

// Limits, in 24-unit icon space. Drawing rule in the spec: round ~20, tall 18–20, wide 19–20,
// triangle ~18 tall, X ~16. Airy shapes sit smaller but must look as heavy as their neighbors.
export const LIMITS = {
  minSide: 15,     // longest side smaller than this looks undersized
  maxSide: 21.2,   // longer than this crowds the 24 box and the sticker outline
  minMargin: 1.2,  // space to the edge; the sticker outline needs ~1.7 but may overlap slightly
  // Painted area, fixed rather than relative to the set: as solid icons are added the median drifts up
  // and would start flagging airy icons that were already approved. Range taken from the approved
  // core 12 (103–263) with a little room.
  inkMin: 100,     // below this looks light
  inkMax: 290,     // above this looks heavy
  offCenter: 1.3,  // weight center more than this from (12, 12) looks shifted
};

// ── geometry → polylines ─────────────────────────────────────────────────────
const num = (v, d = 0) => (v == null ? d : Number(v));

function arcPoints(x1, y1, rx, ry, phi, fa, fs, x2, y2) {
  // SVG endpoint arc → center form (SVG spec F.6.5), sampled
  if (rx === 0 || ry === 0) return [[x2, y2]];
  const c = Math.cos(phi), s = Math.sin(phi);
  const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
  const xp = c * dx + s * dy, yp = -s * dx + c * dy;
  rx = Math.abs(rx); ry = Math.abs(ry);
  const lam = (xp * xp) / (rx * rx) + (yp * yp) / (ry * ry);
  if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
  const sign = fa === fs ? -1 : 1;
  const num_ = rx * rx * ry * ry - rx * rx * yp * yp - ry * ry * xp * xp;
  const co = sign * Math.sqrt(Math.max(0, num_ / (rx * rx * yp * yp + ry * ry * xp * xp)));
  const cxp = co * (rx * yp / ry), cyp = co * (-ry * xp / rx);
  const cx = c * cxp - s * cyp + (x1 + x2) / 2, cy = s * cxp + c * cyp + (y1 + y2) / 2;
  const ang = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const t1 = ang(1, 0, (xp - cxp) / rx, (yp - cyp) / ry);
  let dt = ang((xp - cxp) / rx, (yp - cyp) / ry, (-xp - cxp) / rx, (-yp - cyp) / ry);
  if (!fs && dt > 0) dt -= 2 * Math.PI;
  if (fs && dt < 0) dt += 2 * Math.PI;
  const n = Math.max(4, Math.ceil(Math.abs(dt) / (Math.PI / 24)));
  const pts = [];
  for (let i = 1; i <= n; i++) {
    const t = t1 + (dt * i) / n;
    pts.push([cx + rx * Math.cos(t) * c - ry * Math.sin(t) * s, cy + rx * Math.cos(t) * s + ry * Math.sin(t) * c]);
  }
  return pts;
}

export function pathToPolys(d) {
  const toks = d.match(/[a-zA-Z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) ?? [];
  const polys = [];
  let cur = null, x = 0, y = 0, sx = 0, sy = 0, cmd = '', i = 0, lc = null; // lc = last control point
  const n = () => Number(toks[i++]);
  const bez = (pts, p) => { // sample a bezier with control points pts (incl. start)
    const deg = pts.length - 1;
    for (let k = 1; k <= 12; k++) {
      const t = k / 12;
      let q = pts.slice();
      for (let r = 0; r < deg; r++) q = q.slice(1).map((b, j) => [q[j][0] + (b[0] - q[j][0]) * t, q[j][1] + (b[1] - q[j][1]) * t]);
      p.push(q[0]);
    }
  };
  while (i < toks.length) {
    if (/[a-zA-Z]/.test(toks[i])) cmd = toks[i++];
    const rel = cmd === cmd.toLowerCase() && cmd !== 'z';
    const C = cmd.toUpperCase();
    const ox = rel ? x : 0, oy = rel ? y : 0;
    if (C === 'Z') { if (cur) cur.closed = true; x = sx; y = sy; lc = null; cur = null; continue; }
    if (C === 'M') {
      x = ox + n(); y = oy + n(); sx = x; sy = y;
      cur = { pts: [[x, y]], closed: false }; polys.push(cur);
      cmd = rel ? 'l' : 'L'; lc = null; continue;
    }
    if (!cur) { cur = { pts: [[x, y]], closed: false }; polys.push(cur); }
    const p = cur.pts;
    if (C === 'L') { x = ox + n(); y = oy + n(); p.push([x, y]); lc = null; }
    else if (C === 'H') { x = ox + n(); p.push([x, y]); lc = null; }
    else if (C === 'V') { y = oy + n(); p.push([x, y]); lc = null; }
    else if (C === 'C' || C === 'S') {
      let c1;
      if (C === 'C') c1 = [ox + n(), oy + n()];
      else c1 = lc ? [2 * x - lc[0], 2 * y - lc[1]] : [x, y];
      const c2 = [ox + n(), oy + n()], e = [ox + n(), oy + n()];
      bez([[x, y], c1, c2, e], p); lc = c2; [x, y] = e;
    } else if (C === 'Q' || C === 'T') {
      const c1 = C === 'Q' ? [ox + n(), oy + n()] : lc ? [2 * x - lc[0], 2 * y - lc[1]] : [x, y];
      const e = [ox + n(), oy + n()];
      bez([[x, y], c1, e], p); lc = c1; [x, y] = e;
    } else if (C === 'A') {
      const rx = n(), ry = n(), rot = n(), fa = n(), fs = n(), ex = ox + n(), ey = oy + n();
      p.push(...arcPoints(x, y, rx, ry, (rot * Math.PI) / 180, fa, fs, ex, ey)); x = ex; y = ey; lc = null;
    } else throw new Error(`unsupported path command "${cmd}"`);
  }
  return polys.filter((q) => q.pts.length > 0);
}

const ellipsePoly = (cx, cy, rx, ry) => ({ closed: true, pts: [...Array(64)].map((_, k) => [cx + rx * Math.cos((k / 64) * 2 * Math.PI), cy + ry * Math.sin((k / 64) * 2 * Math.PI)]) });

function roundRectPoly(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  if (!r) return { closed: true, pts: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]] };
  const pts = [];
  for (const [cx, cy, a0] of [[x + w - r, y + r, -90], [x + w - r, y + h - r, 0], [x + r, y + h - r, 90], [x + r, y + r, 180]])
    for (let k = 0; k <= 8; k++) { const a = ((a0 + (k / 8) * 90) * Math.PI) / 180; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  return { closed: true, pts };
}

function shapePolys(tag, a) {
  if (tag === 'path') return pathToPolys(a.d ?? '');
  if (tag === 'circle') return [ellipsePoly(num(a.cx), num(a.cy), num(a.r), num(a.r))];
  if (tag === 'ellipse') return [ellipsePoly(num(a.cx), num(a.cy), num(a.rx), num(a.ry))];
  if (tag === 'rect') return [roundRectPoly(num(a.x), num(a.y), num(a.width), num(a.height), num(a.rx ?? a.ry))];
  if (tag === 'line') return [{ closed: false, pts: [[num(a.x1), num(a.y1)], [num(a.x2), num(a.y2)]] }];
  if (tag === 'polyline' || tag === 'polygon') {
    const v = (a.points ?? '').trim().split(/[\s,]+/).map(Number);
    const pts = [];
    for (let k = 0; k + 1 < v.length; k += 2) pts.push([v[k], v[k + 1]]);
    return [{ closed: tag === 'polygon', pts }];
  }
  return [];
}

// ── rasterize ────────────────────────────────────────────────────────────────
function segDist2(px, py, [x1, y1], [x2, y2]) {
  const dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy;
  let t = L ? ((px - x1) * dx + (py - y1) * dy) / L : 0;
  t = Math.max(0, Math.min(1, t));
  const ex = x1 + t * dx - px, ey = y1 + t * dy - py;
  return ex * ex + ey * ey;
}

function winding(px, py, polys) {
  let w = 0, crossings = 0;
  for (const { pts } of polys) {
    for (let k = 0; k < pts.length; k++) {
      const [x1, y1] = pts[k], [x2, y2] = pts[(k + 1) % pts.length]; // fill always closes
      if ((y1 <= py) !== (y2 <= py)) {
        const xi = x1 + ((py - y1) / (y2 - y1)) * (x2 - x1);
        if (xi > px) { crossings++; w += y2 > y1 ? 1 : -1; }
      }
    }
  }
  return { w, crossings };
}

/**
 * children: [[tag, attrs], ...] of a filled icon (root fill = currentColor).
 * Returns sizes in 24-unit icon space.
 */
export function measureIcon(children) {
  const N = 24 * RES;
  const grid = new Uint8Array(N * N);
  for (const [tag, a] of children) {
    const polys = shapePolys(tag, a);
    const fill = (a.fill ?? 'currentColor') !== 'none' && tag !== 'line' && tag !== 'polyline';
    const sw = a.stroke && a.stroke !== 'none' ? num(a['stroke-width'], 1) : 0;
    const evenodd = a['fill-rule'] === 'evenodd';
    // bounding box of the element (+ stroke) to skip empty pixels quickly
    let x0 = 24, y0 = 24, x1 = 0, y1 = 0;
    for (const { pts } of polys) for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    const pad = sw / 2 + 0.01, r2 = (sw / 2) ** 2;
    const gx0 = Math.max(0, Math.floor((x0 - pad) * RES)), gx1 = Math.min(N - 1, Math.ceil((x1 + pad) * RES));
    const gy0 = Math.max(0, Math.floor((y0 - pad) * RES)), gy1 = Math.min(N - 1, Math.ceil((y1 + pad) * RES));
    for (let gy = gy0; gy <= gy1; gy++) {
      const py = (gy + 0.5) / RES;
      for (let gx = gx0; gx <= gx1; gx++) {
        const idx = gy * N + gx;
        if (grid[idx]) continue;
        const px = (gx + 0.5) / RES;
        let hit = false;
        if (fill) { const { w, crossings } = winding(px, py, polys); hit = evenodd ? crossings % 2 === 1 : w !== 0; }
        if (!hit && sw) {
          outer: for (const { pts, closed } of polys) {
            const m = closed ? pts.length : pts.length - 1;
            if (pts.length === 1 && segDist2(px, py, pts[0], pts[0]) <= r2) { hit = true; break; }
            for (let k = 0; k < m; k++) if (segDist2(px, py, pts[k], pts[(k + 1) % pts.length]) <= r2) { hit = true; break outer; }
          }
        }
        if (hit) grid[idx] = 1;
      }
    }
  }
  let ink = 0, sx = 0, sy = 0, bx0 = N, by0 = N, bx1 = -1, by1 = -1;
  for (let gy = 0; gy < N; gy++) for (let gx = 0; gx < N; gx++) {
    if (!grid[gy * N + gx]) continue;
    ink++; sx += gx + 0.5; sy += gy + 0.5;
    if (gx < bx0) bx0 = gx; if (gx > bx1) bx1 = gx; if (gy < by0) by0 = gy; if (gy > by1) by1 = gy;
  }
  if (!ink) return { width: 0, height: 0, ink: 0, cx: 12, cy: 12, margin: 12 };
  const r1 = (v) => Math.round(v * 10) / 10;
  const left = bx0 / RES, top = by0 / RES, right = (bx1 + 1) / RES, bottom = (by1 + 1) / RES;
  return {
    width: r1(right - left), height: r1(bottom - top),
    ink: Math.round(ink / (RES * RES)),
    cx: r1(sx / ink / RES), cy: r1(sy / ink / RES),
    margin: r1(Math.min(left, top, 24 - right, 24 - bottom)),
  };
}

/**
 * Warnings for icons whose size or weight stands out from the set. measured: [{ name, allow?, ...measureIcon() }]
 * `allow` lists checks an icon is known to fail on purpose, set in icons/<name>.json as
 *   "sizeCheck": { "allow": ["light"], "why": "a checkmark is a short line" }
 * Kinds: small, large, edge, light, heavy, off-center.
 */
export function sizeWarnings(measured, limits = LIMITS) {
  const inks = measured.map((m) => m.ink).sort((a, b) => a - b);
  const median = inks.length ? inks[Math.floor(inks.length / 2)] : 0;
  const out = [];
  for (const m of measured) {
    const side = Math.max(m.width, m.height);
    const why = [];
    const add = (kind, msg) => { if (!(m.allow ?? []).includes(kind)) why.push(msg); };
    if (side < limits.minSide) add('small', `looks small (longest side ${side}, keep ≥ ${limits.minSide})`);
    if (side > limits.maxSide) add('large', `looks large (longest side ${side}, keep ≤ ${limits.maxSide})`);
    if (m.margin < limits.minMargin) add('edge', `too close to the edge (${m.margin} left, keep ≥ ${limits.minMargin})`);
    if (m.ink < limits.inkMin) add('light', `looks light (painted area ${m.ink}, keep ≥ ${limits.inkMin})`);
    if (m.ink > limits.inkMax) add('heavy', `looks heavy (painted area ${m.ink}, keep ≤ ${limits.inkMax})`);
    const off = Math.hypot(m.cx - 12, m.cy - 12);
    if (off > limits.offCenter) add('off-center', `weight sits off center (${m.cx}, ${m.cy})`);
    if (why.length) out.push(`${m.name}: ${why.join('; ')}`);
  }
  return { median, warnings: out };
}

// ── standalone: print a table ────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const DIR = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'icons', 'filled');
  const parseAttrs = (s) => Object.fromEntries([...s.matchAll(/([\w:-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
  const measured = readdirSync(DIR).filter((f) => f.endsWith('.svg')).sort().map((file) => {
    const src = readFileSync(join(DIR, file), 'utf8');
    const body = src.match(/<svg\b[^>]*>([\s\S]*)<\/svg>/)[1];
    const children = [...body.matchAll(/<(\w+)\b([^>]*?)\/>/g)].map((m) => [m[1], parseAttrs(m[2])]);
    const name = file.slice(0, -4);
    let allow = [];
    try { allow = JSON.parse(readFileSync(join(DIR, '..', `${name}.json`), 'utf8')).sizeCheck?.allow ?? []; } catch {}
    return { name, allow, ...measureIcon(children) };
  });
  const { median, warnings } = sizeWarnings(measured);
  const flagged = new Set(warnings.map((w) => w.split(':')[0]));
  console.log('icon            w×h          area   center       margin');
  for (const m of measured) {
    console.log(`${flagged.has(m.name) ? '!' : m.allow.length ? '~' : ' '} ${m.name.padEnd(14)}${`${m.width}×${m.height}`.padEnd(13)}${String(m.ink).padEnd(7)}${`${m.cx}, ${m.cy}`.padEnd(13)}${m.margin}`);
  }
  console.log(`\n! stands out, ~ known exception (sizeCheck.allow in its .json). Set median area ${median}. ${warnings.length ? `${warnings.length} to look at:\n  ` + warnings.join('\n  ') : 'Nothing stands out.'}`);
}
