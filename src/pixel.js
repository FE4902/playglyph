// Pixel-style renderer. A pixel icon is:
//   { size: 16, rows: ['....1111....', ...], materials: ['steel', 'gold'], fixed: { R: '#e43b44' } }
// Row characters are color ROLES, not colors:
//   .      transparent
//   1-5    primary material   (outline, shadow, base, light, shine)
//   a-e    secondary material (same order)
//   A-Z    fixed colors defined by the icon (not affected by material)
import { resolveMaterial, steel, gold } from './materials.js';
import { attrString } from './core.js';

const SHADING = {
  flat: [0, 2, 2, 2, 2],
  cel: [0, 1, 2, 2, 2],
  full: [0, 1, 2, 3, 3],
  gloss: [0, 1, 2, 3, 4],
};

const toGray = (hex, dim = 0.75) => {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const y = Math.round((0.299 * r + 0.587 * g + 0.114 * b) * dim);
  return '#' + [y, y, y].map((v) => v.toString(16).padStart(2, '0')).join('');
};

/** Resolve every role in an icon to a concrete color for the given options. */
export function pixelPalette(icon, options = {}) {
  const { material, secondary, shading = 'gloss', state } = options;
  const [defPrimary, defSecondary] = icon.materials ?? [];
  const m1 = resolveMaterial(material ?? defPrimary, steel);
  const m2 = resolveMaterial(secondary ?? defSecondary, gold);
  if (shading === 'mono') {
    const color = state === 'locked' ? '#2a2a35' : state === 'disabled' ? '#bfbfbf' : options.color ?? '#ffffff';
    return { colorOf: (ch) => ch === '.' ? null : color, glow: null, primary: m1, secondary: m2 };
  }
  const map = SHADING[shading] ?? SHADING.gloss;
  const colorOf = (ch) => {
    if (ch === '.') return null;
    let c;
    if (ch >= '1' && ch <= '5') c = m1.tones[map[ch.charCodeAt(0) - 49]];
    else if (ch >= 'a' && ch <= 'e') c = m2.tones[map[ch.charCodeAt(0) - 97]];
    else c = icon.fixed?.[ch] ?? '#ff00ff';
    if (state === 'disabled') return toGray(c);
    if (state === 'locked') return ch === '1' || ch === 'a' ? '#0d0d12' : '#2a2a35';
    return c;
  };
  const glow = state ? null : m1.glow ? m1.tones[3] : null;
  return { colorOf, glow, primary: m1, secondary: m2 };
}

let glowId = 0;
const pixelRows = (icon, shading) => shading === 'mono' ? icon.monoRows ?? icon.rows : icon.rows;

/**
 * Render a pixel icon to an SVG string with crisp pixels.
 * Options: material, secondary, scale (pixels per cell, default 2), size (overrides scale),
 * shading ('mono' | 'flat' | 'cel' | 'full' | 'gloss'), color (for mono), state ('disabled' | 'locked').
 * Glowing materials add 2 cells of padding on every side for the halo.
 */
export function renderPixel(icon, options = {}) {
  const n = icon.size ?? icon.rows.length;
  const { colorOf, glow } = pixelPalette(icon, options);
  const pad = glow ? 2 : 0;
  const cells = n + pad * 2;
  const px = options.size != null ? Number(options.size) : cells * (options.scale ?? 2);
  const rects = [];
  pixelRows(icon, options.shading).forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const color = colorOf(row[x]);
      let end = x + 1;
      while (end < row.length && colorOf(row[end]) === color) end++;
      if (color) rects.push(`<rect ${attrString({ x, y, width: end - x, height: 1, fill: color })}/>`);
      x = end;
    }
  });
  let body = rects.join('');
  let defs = '';
  if (glow) {
    const id = `pg-glow-${++glowId}`;
    defs = `<defs><filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="0" stdDeviation="0.9" flood-color="${glow}" flood-opacity="0.9"/></filter></defs>`;
    body = `<g filter="url(#${id})">${body}</g>`;
  }
  const cls = options.className ? ` class="${options.className}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="${-pad} ${-pad} ${cells} ${cells}" shape-rendering="crispEdges"${cls}>${defs}${body}</svg>`;
}

/** SVG as a data: URL — for <img src>, CSS backgrounds, or texture loaders. */
export function pixelToDataURL(icon, options) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(renderPixel(icon, options));
}

/**
 * Draw a pixel icon straight onto a 2D canvas context. Synchronous — no image decoding,
 * so it is safe inside a game loop. (x, y) is the top-left corner; `scale` is pixels per cell.
 */
export function drawPixel(ctx, icon, x, y, options = {}) {
  const scale = options.scale ?? 2;
  const { colorOf, glow } = pixelPalette(icon, options);
  const draw = (c) => {
    pixelRows(icon, options.shading).forEach((row, ry) => {
      for (let rx = 0; rx < row.length; rx++) {
        const col = colorOf(row[rx]);
        if (col) {
          c.fillStyle = col;
          c.fillRect(x + rx * scale, y + ry * scale, scale, scale);
        }
      }
    });
  };
  if (glow) {
    ctx.save();
    ctx.shadowColor = glow;
    ctx.shadowBlur = scale * 2;
    draw(ctx);
    ctx.restore();
  } else {
    draw(ctx);
  }
}

/** Rasterize to a new canvas (glow padding included). Feed it to Phaser `textures.addCanvas`, Pixi `Texture.from`, etc. */
export function pixelToCanvas(icon, options = {}) {
  const n = icon.size ?? icon.rows.length;
  const scale = options.scale ?? 2;
  const { glow } = pixelPalette(icon, options);
  const pad = glow ? 2 : 0;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = (n + pad * 2) * scale;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  drawPixel(ctx, icon, pad * scale, pad * scale, options);
  return canvas;
}
