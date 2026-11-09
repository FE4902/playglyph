// Converts Penpot markup (staged by the plugin) into Playglyph source SVGs.
//   node penpot-to-svg.mjs <rawDir> <outDir>
// rawDir/<style>/<name>.json = { style, name, markup, root: {data-*}, shapes: { <id>: { name, src: {data-*} | null } } }
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROLES = new Set(['outline', 'shadow', 'base', 'light', 'shine'].flatMap((t) => [t, `alt-${t}`]));
const INK = '#1e1e2e';
const K = 0.5522847498;

// ── tiny XML parser (Penpot markup is well-formed) ──────────────────────────
export function parseXml(src) {
  const root = { tag: '#root', attrs: {}, children: [] };
  const stack = [root];
  for (const m of src.matchAll(/<(\/?)([\w:-]+)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>/g)) {
    const [, close, tag, rawAttrs, self] = m;
    if (close) { stack.pop(); continue; }
    const attrs = Object.fromEntries([...rawAttrs.matchAll(/([\w:-]+)="([^"]*)"/g)].map((a) => [a[1], a[2]]));
    const node = { tag, attrs, children: [] };
    stack.at(-1).children.push(node);
    if (!self) stack.push(node);
  }
  return root;
}
const styleOf = (n) => Object.fromEntries((n.attrs.style ?? '').split(';').map((s) => s.split(':').map((x) => x.trim())).filter((p) => p[0]));
const cls = (n) => (n.attrs.class ?? '').split(/\s+/);
const find = (n, pred) => { if (pred(n)) return n; for (const c of n.children) { const r = find(c, pred); if (r) return r; } return null; };
const findAll = (n, pred, out = []) => { if (pred(n)) out.push(n); for (const c of n.children) findAll(c, pred, out); return out; };

// ── geometry ────────────────────────────────────────────────────────────────
const fmt = (v) => { const r = Math.round(v * 100) / 100; return Object.is(r, -0) ? '0' : String(r); };
const parseMatrix = (t) => {
  if (!t) return [1, 0, 0, 1, 0, 0];
  const m = t.match(/matrix\(([^)]+)\)/);
  if (!m) throw new Error(`unsupported transform ${t}`);
  return m[1].split(/[\s,]+/).map(Number);
};
const mul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
const apply = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
const isIdentityLinear = (M) => Math.abs(M[0] - 1) < 1e-4 && Math.abs(M[3] - 1) < 1e-4 && Math.abs(M[1]) < 1e-4 && Math.abs(M[2]) < 1e-4;
const isRotation = (M) => Math.abs(M[0] - M[3]) < 1e-4 && Math.abs(M[1] + M[2]) < 1e-4 && Math.abs(M[0] ** 2 + M[1] ** 2 - 1) < 1e-3;

function pathD(d, M) {
  const toks = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g);
  let out = '', i = 0, cmd = '';
  const pairs = { M: 1, L: 1, C: 3, S: 2, Q: 2, T: 1 };
  while (i < toks.length) {
    if (/[a-zA-Z]/.test(toks[i])) { cmd = toks[i++]; if (cmd !== cmd.toUpperCase()) throw new Error(`relative path command ${cmd}`); out += cmd; if (cmd === 'Z') continue; }
    if (cmd === 'Z') continue;
    if (!(cmd in pairs)) throw new Error(`unsupported path command ${cmd}`);
    const pts = [];
    for (let k = 0; k < pairs[cmd]; k++) { const [x, y] = apply(M, +toks[i++], +toks[i++]); pts.push(`${fmt(x)} ${fmt(y)}`); }
    out += (out.endsWith(cmd) ? '' : ' ') + pts.join(' ');
  }
  return out.replace(/Z/g, 'z');
}
function ellipseD(cx, cy, rx, ry, M) {
  const P = (x, y) => apply(M, x, y).map(fmt).join(' ');
  const kx = rx * K, ky = ry * K;
  return `M${P(cx + rx, cy)}C${P(cx + rx, cy + ky)} ${P(cx + kx, cy + ry)} ${P(cx, cy + ry)}C${P(cx - kx, cy + ry)} ${P(cx - rx, cy + ky)} ${P(cx - rx, cy)}C${P(cx - rx, cy - ky)} ${P(cx - kx, cy - ry)} ${P(cx, cy - ry)}C${P(cx + kx, cy - ry)} ${P(cx + rx, cy - ky)} ${P(cx + rx, cy)}z`;
}
function rectD(x, y, w, h, r, M) {
  const P = (a, b) => apply(M, a, b).map(fmt).join(' ');
  r = Math.min(r, w / 2, h / 2);
  if (!r) return `M${P(x, y)}L${P(x + w, y)}L${P(x + w, y + h)}L${P(x, y + h)}z`;
  const k = r * (1 - K);
  return `M${P(x + r, y)}L${P(x + w - r, y)}C${P(x + w - k, y)} ${P(x + w, y + k)} ${P(x + w, y + r)}L${P(x + w, y + h - r)}C${P(x + w, y + h - k)} ${P(x + w - k, y + h)} ${P(x + w - r, y + h)}L${P(x + r, y + h)}C${P(x + k, y + h)} ${P(x, y + h - k)} ${P(x, y + h - r)}L${P(x, y + r)}C${P(x, y + k)} ${P(x + k, y)} ${P(x + r, y)}z`;
}

// geometry of one rendered element, in board coordinates; `allowTransform` permits rotate() on ellipse/rect
function geometry(el, bx, by, allowTransform) {
  const T = [1, 0, 0, 1, -bx, -by];
  const M = mul(T, parseMatrix(el.attrs.transform));
  const a = el.attrs, n = (k) => +(a[k] ?? 0);
  if (el.tag === 'path') return ['path', { d: pathD(a.d, M) }];
  if (el.tag === 'ellipse' || el.tag === 'circle') {
    const cx = n('cx'), cy = n('cy'), rx = el.tag === 'circle' ? n('r') : n('rx'), ry = el.tag === 'circle' ? n('r') : n('ry');
    const [ccx, ccy] = apply(M, cx, cy);
    if (isIdentityLinear(M)) return Math.abs(rx - ry) < 1e-3 ? ['circle', { cx: fmt(ccx), cy: fmt(ccy), r: fmt(rx) }] : ['ellipse', { cx: fmt(ccx), cy: fmt(ccy), rx: fmt(rx), ry: fmt(ry) }];
    if (allowTransform && isRotation(M)) {
      const deg = Math.atan2(M[1], M[0]) * 180 / Math.PI;
      return ['ellipse', { cx: fmt(ccx), cy: fmt(ccy), rx: fmt(rx), ry: fmt(ry), transform: `rotate(${fmt(deg)} ${fmt(ccx)} ${fmt(ccy)})` }];
    }
    return ['path', { d: ellipseD(cx, cy, rx, ry, M) }];
  }
  if (el.tag === 'rect') {
    const x = n('x'), y = n('y'), w = n('width'), h = n('height'), r = n('rx');
    if (isIdentityLinear(M)) { const [px, py] = apply(M, x, y); return ['rect', { x: fmt(px), y: fmt(py), width: fmt(w), height: fmt(h), ...(r ? { rx: fmt(r) } : {}) }]; }
    return ['path', { d: rectD(x, y, w, h, r, M) }];
  }
  throw new Error(`unsupported element <${el.tag}>`);
}
const sameGeom = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ── one icon ────────────────────────────────────────────────────────────────
export function convert({ style, name, markup, root = {}, shapes = {} }) {
  const doc = parseXml(markup);
  const board = find(doc, (n) => n.tag === 'g' && /^shape-/.test(n.attrs.id ?? ''));
  const bg = find(board, (n) => cls(n).includes('frame-background'));
  const bx = +bg.attrs.x, by = +bg.attrs.y;
  const kids = find(board, (n) => cls(n).includes('frame-children'));
  const leaves = findAll(kids, (n) => n.tag === 'g' && /^shape-/.test(n.attrs.id ?? '') && n.children.some((c) => cls(c).includes('fills') || cls(c).includes('strokes')));
  const els = [];
  const warn = [];
  for (const leaf of leaves) {
    const id = leaf.attrs.id.slice(6);
    const meta = shapes[id] ?? {};
    const fillG = leaf.children.find((c) => cls(c).includes('fills'));
    const strokeG = leaf.children.find((c) => cls(c).includes('strokes'));
    if (strokeG && findAll(strokeG, (n) => n.tag === 'mask' || n.tag === 'clipPath' || 'mask' in n.attrs || 'clip-path' in n.attrs).length)
      throw new Error(`${name}: layer "${meta.name}" uses an inner/outer stroke — set stroke position to center`);
    if (find(leaf, (n) => n.tag === 'linearGradient' || n.tag === 'radialGradient' || n.tag === 'pattern' || n.tag === 'image'))
      throw new Error(`${name}: layer "${meta.name}" uses a gradient or image — solid colors only`);
    if (find(leaf, (n) => n.tag === 'filter')) warn.push(`${name}: layer "${meta.name}" has a shadow/blur that SVG source cannot keep`);
    const fills = fillG ? findAll(fillG, (n) => ['path', 'ellipse', 'circle', 'rect'].includes(n.tag)) : [];
    const strokeEl = strokeG ? find(strokeG, (n) => cls(n).includes('stroke-shape'))?.children.find((c) => ['path', 'ellipse', 'circle', 'rect'].includes(c.tag)) : null;
    const fillPaint = fills.map((f) => ({ el: f, st: styleOf(f) })).filter((f) => f.st.fill && f.st.fill !== 'none');
    const sst = strokeEl ? styleOf(strokeEl) : null;
    const hasStroke = sst && sst.stroke && sst.stroke !== 'none' && +sst['stroke-width'] > 0;
    const allowT = style !== 'filled';
    const base = fillPaint[0]?.el ?? strokeEl ?? fills[0];
    if (!base) continue;
    const [tag, geom] = geometry(base, bx, by, allowT);
    const a = { ...geom };
    const src = meta.src ?? null;
    const nameRole = ROLES.has(meta.name) ? meta.name : null;
    if (fillPaint[0]) {
      a.fill = fillPaint[0].st.fill.toLowerCase();
      if (fillPaint[0].st['fill-opacity'] && +fillPaint[0].st['fill-opacity'] < 1) a['fill-opacity'] = fmt(+fillPaint[0].st['fill-opacity']);
      const fr = fillPaint[0].el.attrs['fill-rule'] ?? fillPaint[0].st['fill-rule'];
      if (fr === 'evenodd') a['fill-rule'] = 'evenodd';
    } else a.fill = 'none';
    if (hasStroke) {
      if (strokeEl !== base && fillPaint[0] && !sameGeom(geometry(strokeEl, bx, by, allowT), [tag, geom])) warn.push(`${name}: layer "${meta.name}" stroke geometry differs from fill`);
      a.stroke = sst.stroke.toLowerCase();
      a['stroke-width'] = fmt(+sst['stroke-width']);
      if (sst['stroke-opacity'] && +sst['stroke-opacity'] < 1) a['stroke-opacity'] = fmt(+sst['stroke-opacity']);
      const cap = sst['stroke-linecap'] ?? strokeEl.attrs['stroke-linecap'];
      if (cap && cap !== 'butt') a['stroke-linecap'] = cap;
      a['stroke-linejoin'] = strokeG.attrs['stroke-linejoin'] ?? strokeEl.attrs['stroke-linejoin'] ?? 'round';
    }
    // roles: imported layers keep their source data-* attrs; new layers take the role from the layer name
    const data = src ? { ...src } : {};
    if (!src && nameRole) { if (a.fill !== 'none') data['data-fill'] = nameRole; if (a.stroke) data['data-stroke'] = nameRole; }
    if (data['data-fill'] && a.fill === 'none') delete data['data-fill'];
    if (data['data-stroke'] && !a.stroke) delete data['data-stroke'];
    for (const extra of fillPaint.slice(1)) warn.push(`${name}: layer "${meta.name}" has ${fillPaint.length} fills; only the top one is kept`);
    els.push([tag, a, data, id]);
  }
  const { svg, lines } = serialize(style, name, root, els);
  return { svg, lines, warn };
}

function serialize(style, name, root, els) {
  const attr = (o) => Object.entries(o).map(([k, v]) => ` ${k}="${v}"`).join('');
  const lines = els.map(([tag, a, data, id]) => ({ id, line: line(tag, a, data) }));
  function line(tag, a, data) {
    const o = { ...a };
    if (style === 'filled') {
      for (const k of ['fill', 'stroke']) if (o[k] && o[k] !== 'none') { if (o[k] !== INK) throw new Error(`${name}: filled icons are one color; found ${o[k]}`); o[k] = 'currentColor'; }
      if (o.fill === 'currentColor') delete o.fill; // root fill is currentColor
      delete o['fill-opacity']; delete o['stroke-opacity'];
      return `  <${tag}${attr(o)}/>`;
    }
    // sticker: fill, data-fill, stroke, data-stroke ordering like the generator
    const out = {};
    for (const [k, v] of Object.entries(o)) {
      out[k] = v;
      if (k === 'fill' && data['data-fill']) out['data-fill'] = data['data-fill'];
      if (k === 'stroke' && data['data-stroke']) out['data-stroke'] = data['data-stroke'];
    }
    if (data['data-layer']) out['data-layer'] = data['data-layer'];
    return `  <${tag}${attr(out)}/>`;
  }
  const body = lines.map((l) => l.line).join('\n');
  const rootExtra = style === 'filled' ? ' fill="currentColor"' : attr(root);
  return { lines, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"${rootExtra}>\n${body}\n</svg>\n` };
}

// ── CLI ─────────────────────────────────────────────────────────────────────
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const [rawDir, outDir] = process.argv.slice(2);
  let n = 0; const warns = [], errs = [];
  for (const style of ['filled', 'sticker']) {
    const dir = join(rawDir, style);
    if (!existsSync(dir)) continue;
    mkdirSync(join(outDir, style), { recursive: true });
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      try {
        const { svg, warn } = convert(JSON.parse(readFileSync(join(dir, f), 'utf8')));
        writeFileSync(join(outDir, style, f.replace(/\.json$/, '.svg')), svg);
        warns.push(...warn); n++;
      } catch (e) { errs.push(`${style}/${f}: ${e.message}`); }
    }
  }
  console.log(`converted ${n}`);
  if (warns.length) console.log('warnings:\n  ' + warns.join('\n  '));
  if (errs.length) { console.log('errors:\n  ' + errs.join('\n  ')); process.exitCode = 1; }
}
