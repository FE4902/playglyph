// Color "sticker" renderer: thick outline, flat base, one shadow band, highlight — recolored by material.
// A sticker icon is { materials: ['steel'], nodes: [[tag, attrs, roles], ...] } where roles is
// { fill?: role, stroke?: role } and role is outline | shadow | base | light | shine (primary material)
// or alt-outline … alt-shine (secondary material). Parts without a role keep their fixed color.
import { resolveMaterial, steel, gold } from './materials.js';
import { attrString, svgToDataURL, svgToImage, svgToCanvas } from './core.js';

const TONE = { outline: 0, shadow: 1, base: 2, light: 3, shine: 4 };

const toGray = (hex, dim = 0.8) => {
  const n = parseInt(hex.slice(1), 16);
  const y = Math.round((0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) * dim);
  return '#' + [y, y, y].map((v) => v.toString(16).padStart(2, '0')).join('');
};

/** Resolve every role to a concrete color. */
export function stickerPalette(icon, options = {}) {
  const { material, secondary, state } = options;
  const [defPrimary, defSecondary] = icon.materials ?? [];
  const m1 = resolveMaterial(material ?? defPrimary, steel);
  const m2 = resolveMaterial(secondary ?? defSecondary, gold);
  const colorOf = (role, fixed) => {
    let c = fixed;
    if (role) {
      const alt = role.startsWith('alt-');
      c = (alt ? m2 : m1).tones[TONE[alt ? role.slice(4) : role]];
    }
    if (!c || c === 'none') return c;
    if (state === 'disabled') return toGray(c);
    if (state === 'locked') return role === 'outline' || role === 'alt-outline' ? '#0d0d12' : '#2a2a35';
    return c;
  };
  return { colorOf, glow: !state && m1.glow ? m1.tones[3] : null, primary: m1, secondary: m2 };
}

let glowId = 0;

/**
 * SVG markup for a sticker icon.
 * Options: material, secondary, size (default 24), state ('disabled' | 'locked'), className,
 * border (a color, e.g. '#fff' — adds a sticker-style rim around the outline so the icon pops on dark HUDs).
 */
export function renderSticker(icon, options = {}) {
  const { colorOf, glow } = stickerPalette(icon, options);
  const size = options.size ?? 24;
  const isOutline = (r) => r === 'outline' || r === 'alt-outline';
  // Border: re-draw the outline-layer shapes underneath, 2 units wider, in the border color.
  const border = options.border
    ? icon.nodes
        .filter(([, attrs, roles = {}]) => isOutline(roles.fill) || isOutline(roles.stroke) || attrs['data-layer'] === 'outline')
        .map(([tag, attrs]) => {
          const w = Number(attrs['stroke-width'] ?? 0);
          const { 'data-layer': _, ...plain } = attrs;
          return `<${tag} ${attrString({ ...plain, fill: options.border, stroke: options.border, 'stroke-width': w + 2.2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' })}/>`;
        })
        .join('')
    : '';
  let body = border + icon.nodes
    .map(([tag, attrs, roles = {}]) => {
      const a = { ...attrs };
      if (roles.fill || a.fill) a.fill = colorOf(roles.fill, a.fill);
      if (roles.stroke || a.stroke) a.stroke = colorOf(roles.stroke, a.stroke);
      return `<${tag} ${attrString(a)}/>`;
    })
    .join('');
  let defs = '';
  if (glow) {
    const id = `pg-glow-${++glowId}`;
    defs = `<defs><filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="0" stdDeviation="1.1" flood-color="${glow}" flood-opacity="0.85"/></filter></defs>`;
    body = `<g filter="url(#${id})">${body}</g>`;
  }
  const cls = options.className ? ` class="${options.className}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" style="overflow:visible"${cls}>${defs}${body}</svg>`;
}

export const stickerToDataURL = (icon, options) => svgToDataURL(renderSticker(icon, options));
export const stickerToImage = (icon, options) => svgToImage(renderSticker(icon, options));

/** Rasterize to a canvas (async). Options as renderSticker plus pixelRatio. */
export function stickerToCanvas(icon, options = {}) {
  const { pixelRatio, size = 24, ...rest } = options;
  return svgToCanvas((px) => renderSticker(icon, { ...rest, size: px }), Number(size), pixelRatio);
}
