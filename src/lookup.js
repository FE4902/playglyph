// Name-based access for code that does not know the exact icon names (AI-written games, HTML-only pages).
// Pulls in every icon, so it is NOT tree-shaken. Bundled apps should import icons by name instead.
import * as mono from './icons.js';
import * as lineIcons from './line-icons.js';
import * as stickerIcons from './sticker-icons.js';
import * as pixelIcons from './pixel-icons.js';
import { names, aliases } from './catalog.js';
import { toSvg, toPascalCase } from './core.js';
import { renderSticker } from './sticker-render.js';
import { renderPixel } from './pixel-render.js';
import { resolveMaterial } from './materials.js';

/** Shown in place of an unknown icon so the game never breaks: a rounded square with a question mark. */
export const placeholder = [
  ['path', { d: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 3.6a3.4 3.4 0 0 0-3.4 3.2 1.1 1.1 0 0 0 2.2.1 1.2 1.2 0 1 1 1.6 1.2c-.9.4-1.5 1.1-1.5 2.1v.4a1.1 1.1 0 0 0 2.2 0v-.3c0-.2.1-.3.3-.4A3.4 3.4 0 0 0 12 6.6zm0 9.4a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6z', 'fill-rule': 'evenodd' }],
];

const STYLE_ALIASES = {
  filled: 'filled', fill: 'filled', mono: 'filled', solid: 'filled', glyph: 'filled',
  sticker: 'sticker', color: 'sticker', colour: 'sticker', colored: 'sticker', cartoon: 'sticker',
  line: 'line', outline: 'line', stroke: 'line',
  pixel: 'pixel', 'pixel-art': 'pixel', retro: 'pixel',
};
const normalizeStyle = (s) => STYLE_ALIASES[String(s ?? 'filled').toLowerCase()] ?? 'filled';

const normalize = (name) =>
  String(name ?? '')
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[\s_.:]+/g, '-')
    .replace(/^(icon|pg|lucide|fa|fas|far|fa-solid|fa-regular|mdi|md|material|ri|bi|ph|tabler|ion|heroicons)-/, '')
    .replace(/-icon$/, '');

// Style suffixes other icon sets put on names (Material "_outlined", Font Awesome "-solid", Phosphor "-fill" …).
// Only stripped when the full name is not known, so real names like "heart-outline" still win.
const VARIANT = /-(outline|outlined|filled|fill|solid|rounded|round|sharp|regular|bold|alt|line|duotone)$/;

const lookup = (k) => (names.includes(k) ? k : aliases[k] ?? null);

/** Canonical name for any spelling or alias ('Gear', 'gear_icon', 'inventory' → 'settings' / 'backpack'), or null. */
export function resolveName(name) {
  const k = normalize(name);
  return lookup(k) ?? (VARIANT.test(k) ? lookup(k.replace(VARIANT, '')) : null);
}

const distance = (a, b) => {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
};

/**
 * Closest canonical names to a misspelled or unknown name. Two signals:
 *  - spelling: edit distance (typos like "setings")
 *  - words: whole words shared with a name or alias ("volume_up" → volume-2 via "volume"). Words under
 *    3 letters ("up", "x", "2") never count on their own, so "volume_up" does not suggest arrow-up.
 */
export function suggest(name, limit = 3) {
  const k = normalize(name).replace(VARIANT, '');
  const kw = k.split('-').filter(Boolean);
  const best = new Map(); // canonical → [score, sharedLetters, editDistance]
  for (const cand of [...names, ...Object.keys(aliases)]) {
    const canonical = aliases[cand] ?? cand;
    const edit = distance(k, cand);
    const cw = cand.split('-').filter(Boolean);
    const shared = cw.filter((w) => w.length >= 3 && kw.includes(w));
    const sharedLetters = shared.reduce((n, w) => n + w.length, 0);
    const score = Math.min(edit, shared.length ? 1 + 0.5 * (cw.length - shared.length) : Infinity);
    // spelling-only matches must be close: a quarter of the length (so "castle" does not match "cast")
    if (!shared.length && edit > Math.max(1, Math.floor(k.length / 4))) continue;
    const prev = best.get(canonical);
    const cur = [score, sharedLetters, edit];
    if (!prev || score < prev[0] || (score === prev[0] && (sharedLetters > prev[1] || (sharedLetters === prev[1] && edit < prev[2])))) best.set(canonical, cur);
  }
  return [...best.entries()]
    .filter(([, [score]]) => score <= Math.max(1.5, Math.floor(k.length / 4)))
    .sort((a, b) => a[1][0] - b[1][0] || b[1][1] - a[1][1] || a[1][2] - b[1][2])
    .slice(0, limit)
    .map(([n]) => n);
}

const warned = new Set();
const warnOnce = (key, msg) => { if (!warned.has(key)) { warned.add(key); console.warn(msg); } };

/**
 * Icon data by any name. style: 'filled' (default) | 'sticker' | 'line' | 'pixel'. Returns null when
 * that name or that style does not exist (no fallback here — see icon() for fallbacks).
 */
export function getIcon(name, style = 'filled') {
  const k = resolveName(name);
  if (!k) return null;
  const key = toPascalCase(k);
  const s = normalizeStyle(style);
  const set = s === 'sticker' ? stickerIcons : s === 'pixel' ? pixelIcons : s === 'line' ? lineIcons : mono;
  return set[key] ?? null;
}

/**
 * SVG markup for any icon name. Never throws: unknown names render a placeholder and log suggestions.
 * Options: style ('filled' | 'sticker'), material, secondary, size, color, state, class.
 * A style an icon does not have yet falls back (sticker → filled in the material's color).
 */
export function icon(name, options = {}) {
  const { style: rawStyle, material, secondary, class: cls, className, ...rest } = options;
  const style = normalizeStyle(rawStyle);
  const classes = [cls, className].filter(Boolean).join(' ') || undefined;
  const canonical = resolveName(name);
  if (!canonical) {
    const s = suggest(name);
    warnOnce(`name:${name}`, `playglyph: no icon named "${name}", showing a placeholder.${s.length ? ` Did you mean: ${s.join(', ')}?` : ''}`);
    return toSvg(placeholder, { ...rest, class: classes });
  }
  if (style === 'sticker') {
    const st = getIcon(canonical, 'sticker');
    if (st) return renderSticker(st, { material, secondary, className: classes, ...rest });
    warnOnce(`style:${canonical}:sticker`, `playglyph: "${canonical}" has no sticker version yet, using filled.`);
  }
  if (style === 'pixel') {
    const px = getIcon(canonical, 'pixel');
    if (px) return renderPixel(px, { material, secondary, className: classes, ...rest });
    warnOnce(`style:${canonical}:pixel`, `playglyph: "${canonical}" has no pixel version, using filled.`);
  }
  const node = (style === 'line' && getIcon(canonical, 'line')) || getIcon(canonical, 'filled');
  const color = material ? resolveMaterial(material).mono : rest.color;
  return toSvg(node, { ...rest, ...(color ? { color } : {}), class: classes });
}

const DATA_OPTIONS = ['style', 'material', 'secondary', 'size', 'scale', 'shading', 'state', 'color', 'border'];

/**
 * Replace every <i data-pg="settings"></i> in the page with its SVG. Options per element:
 * data-style (filled | sticker), data-material, data-secondary, data-size, data-color, data-state, data-border.
 * Call it again after adding elements dynamically.
 */
export function createIcons({ root = globalThis.document, attrs = {}, nameAttr = 'data-pg' } = {}) {
  if (!root) return;
  for (const el of root.querySelectorAll(`[${nameAttr}]`)) {
    const name = el.getAttribute(nameAttr);
    const opts = { ...attrs };
    for (const key of DATA_OPTIONS) {
      const v = el.getAttribute(`data-${key}`);
      if (v != null) opts[key] = /^\d+(\.\d+)?$/.test(v) ? Number(v) : v;
    }
    const canonical = resolveName(name) ?? 'unknown';
    opts.class = ['pg', `pg-${canonical}`, el.getAttribute('class')].filter(Boolean).join(' ');
    const doc = root.ownerDocument ?? root;
    const tpl = doc.createElement('template');
    tpl.innerHTML = icon(name, opts);
    const svg = tpl.content.firstElementChild;
    for (const a of ['id', 'title', 'aria-label', 'style']) {
      const v = el.getAttribute(a);
      if (v != null) svg.setAttribute(a, a === 'style' && svg.getAttribute('style') ? `${svg.getAttribute('style')};${v}` : v);
    }
    if (!el.hasAttribute('aria-label')) svg.setAttribute('aria-hidden', 'true');
    el.replaceWith(svg);
  }
}
