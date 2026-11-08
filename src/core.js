// Runtime helpers shared by every entry point. Copied verbatim into dist/ by the build.
// An "icon node" is an array of [tagName, attributes] pairs, e.g. [['path', { d: 'M3 3h18' }]].
// Every child paints with currentColor, so the root `color` attribute recolors the whole icon.

export const defaultAttributes = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'currentColor',
};

export const toKebabCase = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Za-z])([0-9])/g, '$1-$2').toLowerCase();
export const toPascalCase = (s) => s.replace(/(^|[-_ ]+)([a-z0-9])/gi, (_, __, ch) => ch.toUpperCase());

/** Resolve user options into root <svg> attributes. Options: size, color, className, plus any raw SVG attribute. */
export function resolveAttributes(options = {}) {
  // strokeWidth / absoluteStrokeWidth are accepted and ignored (filled icons have no adjustable stroke).
  const { size, color, strokeWidth, absoluteStrokeWidth, className, class: cls, ...rest } = options;
  const attrs = { ...defaultAttributes };
  if (size != null) attrs.width = attrs.height = size;
  if (color != null) attrs.color = color;
  const classes = [cls, className].filter(Boolean).join(' ');
  if (classes) attrs.class = classes;
  return { ...attrs, ...rest };
}

const escapeAttr = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
export const attrString = (attrs) =>
  Object.entries(attrs)
    .filter(([, v]) => v != null && v !== false)
    .map(([k, v]) => `${k}="${escapeAttr(v)}"`)
    .join(' ');

/** Serialize an icon node to an SVG markup string. */
export function toSvg(iconNode, options) {
  const children = iconNode.map(([tag, attrs]) => `<${tag} ${attrString(attrs)}/>`).join('');
  return `<svg ${attrString(resolveAttributes(options))}>${children}</svg>`;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Build a live SVGElement (browser only). */
export function createElement(iconNode, options) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  for (const [k, v] of Object.entries(resolveAttributes(options))) {
    if (k !== 'xmlns' && v != null && v !== false) svg.setAttribute(k, String(v));
  }
  for (const [tag, attrs] of iconNode) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
    svg.appendChild(el);
  }
  return svg;
}

/**
 * Replace every <i data-pg="settings"></i> with its SVG, using only the icons you pass in
 * (tree-shaken). For name lookup with aliases and fallbacks, use createIcons from 'playglyph/lookup'.
 */
export function createIcons({ icons, root = globalThis.document, attrs = {}, nameAttr = 'data-pg' } = {}) {
  if (!icons) throw new Error('playglyph: createIcons({ icons }) needs an icon map');
  if (!root) return;
  for (const el of root.querySelectorAll(`[${nameAttr}]`)) {
    const name = el.getAttribute(nameAttr);
    const node = icons[toPascalCase(name)];
    if (!node) {
      console.warn(`playglyph: unknown icon "${name}"`);
      continue;
    }
    const own = {};
    for (const a of el.attributes) if (a.name !== nameAttr) own[a.name] = a.value;
    const classes = ['pg', `pg-${name}`, attrs.class, own.class].filter(Boolean).join(' ');
    el.replaceWith(createElement(node, { ...attrs, ...own, class: classes }));
  }
}

// ── Game-engine helpers ────────────────────────────────────────────────────
// currentColor has no meaning inside an <img> or a canvas, so these default to white,
// which reads on the dark HUDs most games use. Pass `color` to change it.

export const svgToDataURL = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

/** SVG as a data: URL — usable as <img src>, CSS background, or a texture source. */
export function toDataURL(iconNode, options = {}) {
  return svgToDataURL(toSvg(iconNode, { color: '#ffffff', ...options }));
}

/** Load any SVG string into an HTMLImageElement (resolves once decoded). */
export function svgToImage(svg) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('playglyph: failed to rasterize icon'));
    img.src = svgToDataURL(svg);
  });
}

/** Load the icon into an HTMLImageElement. */
export function toImage(iconNode, options = {}) {
  return svgToImage(toSvg(iconNode, { color: '#ffffff', ...options }));
}

/** Rasterize an SVG string onto a new canvas of `size` CSS px × pixelRatio. */
export async function svgToCanvas(svgAtSize, size, pixelRatio = globalThis.devicePixelRatio || 1) {
  const px = Math.round(size * pixelRatio);
  const img = await svgToImage(svgAtSize(px));
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = px;
  canvas.getContext('2d').drawImage(img, 0, 0, px, px);
  return canvas;
}

/**
 * Rasterize to a canvas at `size` CSS px × `pixelRatio` (defaults to devicePixelRatio).
 * Feed the result to ctx.drawImage, Phaser `textures.addCanvas`, Pixi `Texture.from`, Three `CanvasTexture`…
 */
export function toCanvas(iconNode, options = {}) {
  const { pixelRatio, size = 24, ...rest } = options;
  return svgToCanvas((px) => toSvg(iconNode, { color: '#ffffff', ...rest, size: px }), Number(size), pixelRatio);
}
