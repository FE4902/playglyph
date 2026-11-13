#!/usr/bin/env node
// Validates icon sources and generates dist/.
//   icons/<name>.json          metadata (description, aliases, tags, tagsKo, categories)
//   icons/filled/<name>.svg    filled mono style (main style)
//   icons/sticker/<name>.svg   color sticker style (roles via data-fill / data-stroke)
//   pixel/<name>.pxl           experimental pixel style
//
//   node scripts/build.mjs          → validate + build
//   node scripts/build.mjs --check  → validate only (exit 1 on problems)
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ICONS = join(ROOT, 'icons');
const PIXEL = join(ROOT, 'pixel');
const DIST = join(ROOT, 'dist');
const CHECK_ONLY = process.argv.includes('--check');
const PKG = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const { materials } = await import(pathToFileURL(join(ROOT, 'src/materials.js')).href);

const ALLOWED_TAGS = new Set(['path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse']);
const CATEGORIES = ['system', 'control', 'menu', 'currency', 'hud', 'combat', 'social', 'input', 'misc'];
const NAME_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const TONES = ['outline', 'shadow', 'base', 'light', 'shine'];
const ROLES = new Set([...TONES, ...TONES.map((t) => `alt-${t}`)]);
const HEX_RE = /^#[0-9a-f]{6}$/i;

const toPascalCase = (s) => s.replace(/(^|-)([a-z0-9])/g, (_, __, ch) => ch.toUpperCase());
const parseAttrs = (s) => Object.fromEntries([...s.matchAll(/([\w:-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
const errors = [];

function parseSvg(path, fail) {
  const src = readFileSync(path, 'utf8');
  const m = src.match(/<svg\b([^>]*)>([\s\S]*)<\/svg>/);
  if (!m) { fail('no <svg> root'); return null; }
  const children = [];
  const leftovers = m[2].replace(/<!--[\s\S]*?-->/g, '').replace(/<(\w+)\b([^>]*?)\/>/g, (_, tag, a) => {
    if (!ALLOWED_TAGS.has(tag)) fail(`<${tag}> is not allowed`);
    children.push([tag, parseAttrs(a)]);
    return '';
  });
  if (leftovers.trim()) fail(`unexpected markup: ${leftovers.trim().slice(0, 60)}`);
  if (!children.length) fail('icon is empty');
  return { root: parseAttrs(m[1]), children };
}

// ── metadata ────────────────────────────────────────────────────────────────
const icons = [];
for (const file of readdirSync(ICONS).filter((f) => f.endsWith('.json')).sort()) {
  const name = file.slice(0, -5);
  const fail = (msg) => errors.push(`icons/${file}: ${msg}`);
  if (!NAME_RE.test(name)) fail('file name must be kebab-case starting with a letter');
  let meta = {};
  try { meta = JSON.parse(readFileSync(join(ICONS, file), 'utf8')); } catch (e) { fail(`invalid JSON: ${e.message}`); }
  const { description, aliases = [], tags = [], tagsKo = [], categories = [] } = meta;
  if (!description || description.length > 80) fail('"description" is required (≤ 80 chars, says when to use the icon)');
  if (![aliases, tags, tagsKo].every(Array.isArray)) fail('aliases, tags, tagsKo must be arrays');
  if (categories.length !== 1 || !CATEGORIES.includes(categories[0])) fail(`exactly one category from: ${CATEGORIES.join(', ')}`);
  for (const a of aliases) if (!NAME_RE.test(a)) fail(`alias "${a}" must be kebab-case starting with a letter`);
  const sizeAllow = meta.sizeCheck?.allow ?? [];
  if (sizeAllow.length && !meta.sizeCheck?.why) fail('"sizeCheck.allow" needs a "why"');
  icons.push({ name, pascal: toPascalCase(name), description, aliases, tags, tagsKo, category: categories[0], sizeAllow });
}
const byName = new Map(icons.map((i) => [i.name, i]));

// ── filled ──────────────────────────────────────────────────────────────────
const styleFiles = (dir) => (existsSync(join(ICONS, dir)) ? readdirSync(join(ICONS, dir)).filter((f) => f.endsWith('.svg')).sort() : []);
for (const file of styleFiles('filled')) {
  const name = file.slice(0, -4);
  const fail = (msg) => errors.push(`icons/filled/${file}: ${msg}`);
  if (!byName.has(name)) { fail(`no icons/${name}.json`); continue; }
  const svg = parseSvg(join(ICONS, 'filled', file), fail);
  if (!svg) continue;
  if (svg.root.viewBox !== '0 0 24 24') fail('root viewBox must be "0 0 24 24"');
  if (svg.root.fill !== 'currentColor') fail('root fill must be "currentColor"');
  for (const [tag, a] of svg.children) {
    for (const k of ['style', 'class', 'id', 'transform']) if (k in a) fail(`<${tag}> must not set "${k}"`);
    for (const k of ['fill', 'stroke']) if (k in a && !['currentColor', 'none'].includes(a[k])) fail(`<${tag}> ${k} must be currentColor or none`);
  }
  byName.get(name).filled = svg.children;
}

// ── sticker ─────────────────────────────────────────────────────────────────
for (const file of styleFiles('sticker')) {
  const name = file.slice(0, -4);
  const fail = (msg) => errors.push(`icons/sticker/${file}: ${msg}`);
  if (!byName.has(name)) { fail(`no icons/${name}.json`); continue; }
  const svg = parseSvg(join(ICONS, 'sticker', file), fail);
  if (!svg) continue;
  if (svg.root.viewBox !== '0 0 24 24') fail('root viewBox must be "0 0 24 24"');
  const mats = (svg.root['data-materials'] ?? '').split(/\s+/).filter(Boolean);
  for (const m of mats) if (!materials[m]) fail(`unknown material "${m}"`);
  const nodes = svg.children.map(([tag, a]) => {
    const attrs = { ...a };
    const roles = {};
    for (const k of ['style', 'class', 'id']) if (k in attrs) fail(`<${tag}> must not set "${k}"`);
    for (const kind of ['fill', 'stroke']) {
      const role = attrs[`data-${kind}`];
      delete attrs[`data-${kind}`];
      if (role) {
        if (!ROLES.has(role)) fail(`<${tag}> data-${kind}="${role}" is not a role (${[...ROLES].join(', ')})`);
        roles[kind] = role;
        delete attrs[kind];
      } else if (kind in attrs && attrs[kind] !== 'none' && !HEX_RE.test(attrs[kind])) {
        fail(`<${tag}> ${kind} must be a role (data-${kind}), "none" or a #rrggbb fixed color`);
      } else if (kind === 'fill' && !(kind in attrs)) {
        fail(`<${tag}> needs an explicit fill (role, none or #rrggbb)`);
      }
    }
    return Object.keys(roles).length ? [tag, attrs, roles] : [tag, attrs];
  });
  byName.get(name).sticker = { materials: mats, nodes };
}

// ── pixel (experimental) ────────────────────────────────────────────────────
const ROLE_RE = /^[.1-5a-eA-Z]$/;
if (existsSync(PIXEL)) {
  for (const file of readdirSync(PIXEL).filter((f) => f.endsWith('.pxl')).sort()) {
    const name = file.slice(0, -4);
    const fail = (msg) => errors.push(`pixel/${file}: ${msg}`);
    if (!byName.has(name)) { fail(`no icons/${name}.json`); continue; }
    let size = 16;
    const fixed = {};
    let mats = [];
    const rows = [];
    let monoRows;
    for (const raw of readFileSync(join(PIXEL, file), 'utf8').split('\n')) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      if (line.startsWith('@size ')) size = Number(line.slice(6));
      else if (line.startsWith('@materials ')) mats = line.slice(11).trim().split(/\s+/);
      else if (/^@[A-Z] #[0-9a-f]{6}$/i.test(line)) fixed[line[1]] = line.slice(3).toLowerCase();
      else if (line === '@mono' && !monoRows) monoRows = [];
      else if (line.startsWith('@')) fail(`unknown directive: ${line}`);
      else (monoRows ?? rows).push(line);
    }
    if (rows.length !== size) fail(`expected ${size} rows, got ${rows.length}`);
    rows.forEach((r, y) => {
      if (r.length !== size) fail(`row ${y + 1} has ${r.length} cells, expected ${size}`);
      for (const ch of r) {
        if (!ROLE_RE.test(ch)) fail(`row ${y + 1}: "${ch}" is not a role`);
        else if (ch >= 'A' && ch <= 'Z' && !fixed[ch]) fail(`row ${y + 1}: fixed color "${ch}" is not defined`);
      }
    });
    if (monoRows && (monoRows.length !== size || monoRows.some((row) => row.length !== size || /[^.1]/.test(row)))) {
      fail(`@mono needs ${size} rows of ${size} cells using only "." and "1"`);
    }
    for (const m of mats) if (!materials[m]) fail(`unknown material "${m}"`);
    byName.get(name).pixel = { size, rows, materials: mats, ...(monoRows ? { monoRows } : {}), ...(Object.keys(fixed).length ? { fixed } : {}) };
  }
}

for (const i of icons) {
  if (!i.filled) errors.push(`icons/${i.name}.json: no art — add icons/filled/${i.name}.svg`);
  i.mono = i.filled;
  i.styles = [i.filled && 'filled', i.sticker && 'sticker'].filter(Boolean);
}

// Every canonical name and alias must be unique — they all become exports.
const owner = new Map();
for (const i of icons) {
  for (const n of [i.name, ...i.aliases]) {
    const p = toPascalCase(n);
    for (const key of [p, `${p}Icon`]) {
      if (owner.has(key) && owner.get(key) !== i.name) errors.push(`name "${n}" (${key}) is used by both ${owner.get(key)} and ${i.name}`);
      owner.set(key, i.name);
    }
  }
}

if (errors.length) {
  console.error(`✖ ${errors.length} problem(s):\n  ` + errors.join('\n  '));
  process.exit(1);
}
const count = (k) => icons.filter((i) => i[k]).length;
console.log(`✔ ${icons.length} icons valid — filled ${count('filled')}, sticker ${count('sticker')}, pixel (experimental) ${count('pixel')}; ${icons.reduce((n, i) => n + i.aliases.length, 0)} aliases`);

// Visual size: warn (don't fail) when a filled icon looks bigger, smaller, lighter or heavier than the set.
// Full table: node scripts/size-check.mjs
{
  const { measureIcon, sizeWarnings } = await import(pathToFileURL(join(ROOT, 'scripts/size-check.mjs')).href);
  const measured = icons.filter((i) => i.filled).map((i) => ({ name: i.name, allow: i.sizeAllow, ...measureIcon(i.filled) }));
  const { warnings } = sizeWarnings(measured);
  if (warnings.length) console.warn(`⚠ size: ${warnings.length} icon(s) stand out — compare them on samples/board.html\n  ` + warnings.join('\n  '));
  else console.log(`✔ size: ${measured.length} filled icons look the same size`);
}
if (CHECK_ONLY) process.exit(0);

// ── generate ────────────────────────────────────────────────────────────────
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
const banner = '// Generated by scripts/build.mjs — do not edit.\n';
const json = (v) => JSON.stringify(v);
const write = (file, text) => {
  mkdirSync(dirname(join(DIST, file)), { recursive: true });
  writeFileSync(join(DIST, file), text);
};

for (const f of ['core.js', 'materials.js', 'lookup.js']) copyFileSync(join(ROOT, 'src', f), join(DIST, f));
copyFileSync(join(ROOT, 'src/pixel.js'), join(DIST, 'pixel-render.js'));
copyFileSync(join(ROOT, 'src/sticker.js'), join(DIST, 'sticker-render.js'));

const withStyle = (k) => icons.filter((i) => i[k]);
// One icon can reach the same export name twice (`search` → SearchIcon, alias `search-icon` → SearchIcon),
// which is a SyntaxError in ESM — so collect each icon's names as a set.
const iconExportNames = (i) => [...new Set([i.pascal, `${i.pascal}Icon`, ...i.aliases.flatMap((a) => [toPascalCase(a), `${toPascalCase(a)}Icon`])])];
const aliasExports = (icon) => iconExportNames(icon).filter((n) => n !== icon.pascal).map((n) => `${icon.pascal} as ${n}`);
const exportNames = (list) => list.flatMap(iconExportNames);
const dataModule = (list, key) => banner + list.map((i) => `export const ${i.pascal} = ${json(i[key])};`).join('\n') + '\n';
const reexports = (list, from) => list.map((i) => `export { ${aliasExports(i).join(', ')} } from './${from}';`).join('\n') + '\n';
const MATERIAL_EXPORTS = `export { ${Object.keys(materials).join(', ')}, materials } from './materials.js';\n`;

write('icons.js', dataModule(icons, 'mono'));
write('sticker-icons.js', dataModule(withStyle('sticker'), 'sticker'));
write('pixel-icons.js', dataModule(withStyle('pixel'), 'pixel'));
write('catalog.js', banner +
  `export const names = ${json(icons.map((i) => i.name))};\n` +
  `export const aliases = ${json(Object.fromEntries(icons.flatMap((i) => i.aliases.map((a) => [a, i.name]))))};\n` +
  `export const styles = ${json(Object.fromEntries(icons.map((i) => [i.name, i.styles])))};\n`);

write('index.js', banner + `export * from './icons.js';\nexport * as icons from './icons.js';\n` + reexports(icons, 'icons.js') +
  `export { defaultAttributes, resolveAttributes, toSvg, createElement, createIcons, toDataURL, toImage, toCanvas, svgToDataURL, svgToImage, toKebabCase, toPascalCase } from './core.js';\n` + MATERIAL_EXPORTS);
write('sticker.js', banner + `export * from './sticker-icons.js';\nexport * as stickerIcons from './sticker-icons.js';\n` + reexports(withStyle('sticker'), 'sticker-icons.js') +
  `export { renderSticker, stickerToDataURL, stickerToImage, stickerToCanvas, stickerPalette } from './sticker-render.js';\n` + MATERIAL_EXPORTS);
write('pixel.js', banner + `export * from './pixel-icons.js';\nexport * as pixelIcons from './pixel-icons.js';\n` + reexports(withStyle('pixel'), 'pixel-icons.js') +
  `export { renderPixel, drawPixel, pixelToCanvas, pixelToDataURL, pixelPalette } from './pixel-render.js';\n` + MATERIAL_EXPORTS);
write('react.js', readFileSync(join(ROOT, 'src/react.js'), 'utf8') + `\n${banner}import * as nodes from './icons.js';\n` +
  icons.map((i) => `export const ${i.pascal} = createReactIcon('${i.pascal}', '${i.name}', nodes.${i.pascal});`).join('\n') + '\n' +
  `export { ${icons.flatMap(aliasExports).join(', ')} };\n`);

// ── types ───────────────────────────────────────────────────────────────────
const nameUnion = icons.flatMap((i) => [i.name, ...i.aliases]).map((n) => `'${n}'`).join(' | ');
const matUnion = Object.keys(materials).map((m) => `'${m}'`).join(' | ');
const materialDecls = `${Object.keys(materials).map((m) => `export declare const ${m}: Material;`).join('\n')}\nexport declare const materials: Record<MaterialName, Material>;`;
const decl = (list, type) => exportNames(list).map((n) => `export declare const ${n}: ${type};`).join('\n');
write('index.d.ts', `${banner}export type IconNode = Array<[tag: string, attrs: Record<string, string>]>;
export interface StickerIcon { materials: string[]; nodes: Array<[tag: string, attrs: Record<string, string>, roles?: { fill?: string; stroke?: string }]> }
export interface PixelIcon { size: number; rows: string[]; monoRows?: string[]; materials: string[]; fixed?: Record<string, string> }
export interface Material { name: string; tones: readonly [string, string, string, string, string]; mono: string; glow: boolean }
export type MaterialName = ${matUnion};
/** Every canonical icon name and alias. */
export type IconName = ${nameUnion};
export interface IconOptions { size?: number | string; color?: string; className?: string; [attr: string]: unknown }
export interface CanvasOptions extends IconOptions { pixelRatio?: number }
export declare const defaultAttributes: Record<string, string | number>;
export declare function resolveAttributes(options?: IconOptions): Record<string, unknown>;
export declare function toSvg(icon: IconNode, options?: IconOptions): string;
export declare function createElement(icon: IconNode, options?: IconOptions): SVGSVGElement;
export declare function createIcons(opts: { icons: Record<string, IconNode>; root?: ParentNode; attrs?: IconOptions & { class?: string }; nameAttr?: string }): void;
export declare function toDataURL(icon: IconNode, options?: IconOptions): string;
export declare function toImage(icon: IconNode, options?: IconOptions): Promise<HTMLImageElement>;
export declare function toCanvas(icon: IconNode, options?: CanvasOptions): Promise<HTMLCanvasElement>;
export declare function svgToDataURL(svg: string): string;
export declare function svgToImage(svg: string): Promise<HTMLImageElement>;
export declare function toKebabCase(s: string): string;
export declare function toPascalCase(s: string): string;
${materialDecls}
export declare const icons: Record<string, IconNode>;
${decl(icons, 'IconNode')}
`);
const stickerOptions = `export interface StickerOptions { material?: Material | MaterialName; secondary?: Material | MaterialName; size?: number; state?: 'disabled' | 'locked'; border?: string; className?: string }`;
write('sticker.d.ts', `${banner}import type { StickerIcon, Material, MaterialName } from './index.js';
export type { StickerIcon, Material, MaterialName };
${stickerOptions}
export declare function renderSticker(icon: StickerIcon, options?: StickerOptions): string;
export declare function stickerToDataURL(icon: StickerIcon, options?: StickerOptions): string;
export declare function stickerToImage(icon: StickerIcon, options?: StickerOptions): Promise<HTMLImageElement>;
export declare function stickerToCanvas(icon: StickerIcon, options?: StickerOptions & { pixelRatio?: number }): Promise<HTMLCanvasElement>;
export declare function stickerPalette(icon: StickerIcon, options?: StickerOptions): { colorOf(role: string | undefined, fixed?: string): string; glow: string | null; primary: Material; secondary: Material };
${materialDecls}
export declare const stickerIcons: Record<string, StickerIcon>;
${decl(withStyle('sticker'), 'StickerIcon')}
`);
write('pixel.d.ts', `${banner}import type { PixelIcon, Material, MaterialName } from './index.js';
export interface PixelOptions { material?: Material | MaterialName; secondary?: Material | MaterialName; scale?: number; size?: number; shading?: 'mono' | 'flat' | 'cel' | 'full' | 'gloss'; color?: string; state?: 'disabled' | 'locked'; className?: string }
export declare function renderPixel(icon: PixelIcon, options?: PixelOptions): string;
export declare function pixelToDataURL(icon: PixelIcon, options?: PixelOptions): string;
export declare function drawPixel(ctx: CanvasRenderingContext2D, icon: PixelIcon, x: number, y: number, options?: PixelOptions): void;
export declare function pixelToCanvas(icon: PixelIcon, options?: PixelOptions): HTMLCanvasElement;
${materialDecls}
export declare const pixelIcons: Record<string, PixelIcon>;
${decl(withStyle('pixel'), 'PixelIcon')}
`);
write('materials.d.ts', `${banner}import type { Material, MaterialName } from './index.js';\nexport type { Material, MaterialName };\n${materialDecls}\nexport declare function resolveMaterial(m: Material | MaterialName | null | undefined, fallback?: Material): Material;\n`);
write('lookup.d.ts', `${banner}import type { IconNode, StickerIcon, PixelIcon, IconName, Material, MaterialName } from './index.js';
import type { PixelOptions } from './pixel.js';
export type IconStyle = 'filled' | 'sticker' | 'pixel' | 'mono' | 'color';
export interface LookupOptions { style?: IconStyle; material?: Material | MaterialName; secondary?: Material | MaterialName; size?: number | string; color?: string; shading?: PixelOptions['shading']; state?: 'disabled' | 'locked'; border?: string; class?: string }
export declare const placeholder: IconNode;
export declare function resolveName(name: IconName | (string & {})): string | null;
export declare function suggest(name: string, limit?: number): string[];
export declare function getIcon(name: IconName | (string & {}), style?: 'filled' | 'mono'): IconNode | null;
export declare function getIcon(name: IconName | (string & {}), style: 'sticker' | 'color'): StickerIcon | null;
export declare function getIcon(name: IconName | (string & {}), style: 'pixel'): PixelIcon | null;
export declare function icon(name: IconName | (string & {}), options?: LookupOptions): string;
export declare function createIcons(opts?: { root?: ParentNode; attrs?: LookupOptions; nameAttr?: string }): void;
`);
write('react.d.ts', `${banner}import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from 'react';
export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> { size?: number | string; color?: string }
export type Icon = ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>;
export declare function createReactIcon(displayName: string, kebabName: string, iconNode: Array<[string, Record<string, string>]>): Icon;
${exportNames(icons).map((n) => `export declare const ${n}: Icon;`).join('\n')}
`);

// ── <script> global build: window.playglyph, auto-replaces <i data-pg> on load ──
const ident = (m) => m.replace(/-/g, '_');
const asModule = (modName, src) => {
  const body = src
    .replace(/^import \* as (\w+) from '\.\/([\w-]+)\.js';$/gm, (_, v, m) => `const ${v} = __${ident(m)};`)
    .replace(/^import \{([^}]+)\} from '\.\/([\w-]+)\.js';$/gm, (_, list, m) => `const {${list}} = __${ident(m)};`);
  const exported = [...body.matchAll(/^export (?:async )?(?:function|const) (\w+)/gm)].map((m) => m[1]);
  return `const __${ident(modName)} = (() => {\n${body.replace(/^export (async function|function|const) /gm, '$1 ')}\nreturn { ${exported.join(', ')} };\n})();`;
};
const read = (f) => readFileSync(join(ROOT, 'src', f), 'utf8');
const dataObj = (list, key) => json(Object.fromEntries(list.map((i) => [i.pascal, i[key]])));
write('playglyph.js',
  `/*! ${PKG.name} ${PKG.version} — game UI icons. <i data-pg="settings"></i> is replaced on load; or playglyph.icon('pause'). */\n(() => {\n` +
  [
    asModule('core', read('core.js')),
    asModule('materials', read('materials.js')),
    asModule('pixel-render', read('pixel.js')),
    asModule('sticker-render', read('sticker.js')),
    `const __icons = ${dataObj(icons, 'mono')};`,
    `const __sticker_icons = ${dataObj(withStyle('sticker'), 'sticker')};`,
    `const __pixel_icons = ${dataObj(withStyle('pixel'), 'pixel')};`,
    `const __catalog = { names: ${json(icons.map((i) => i.name))}, aliases: ${json(Object.fromEntries(icons.flatMap((i) => i.aliases.map((a) => [a, i.name]))))} };`,
    asModule('lookup', read('lookup.js')),
  ].join('\n') +
  `\nconst api = Object.assign({}, __core, __sticker_render, __pixel_render, __lookup, { materials: __materials.materials, icons: __icons, stickerIcons: __sticker_icons, names: __catalog.names, aliases: __catalog.aliases, version: ${json(PKG.version)} });\n` +
  // Names AI-written code tends to guess for "draw the icons again" all do the same thing.
  `for (const k of ['refresh', 'render', 'renderIcons', 'replace', 'replaceIcons', 'scan', 'update', 'init', 'load']) api[k] = api.createIcons;\n` +
  `globalThis.playglyph = api;\n` +
  // Icons added after load (lists, popups, re-rendered HUDs) are drawn automatically: the AI test showed
  // generated code rarely knows to call createIcons() again. One pass per animation frame at most.
  `if (typeof document !== 'undefined') {\n` +
  `  let queued = false;\n` +
  `  const flush = () => { queued = false; api.createIcons(); };\n` +
  `  const schedule = () => { if (!queued) { queued = true; (globalThis.requestAnimationFrame || setTimeout)(flush); } };\n` +
  `  const has = (n) => n.nodeType === 1 && (n.hasAttribute('data-pg') || !!n.querySelector('[data-pg]'));\n` +
  `  api.observer = typeof MutationObserver === 'undefined' ? null : new MutationObserver((muts) => {\n` +
  `    for (const m of muts) { if (m.type === 'attributes' || [...m.addedNodes].some(has)) return schedule(); }\n` +
  `  });\n` +
  `  api.stopAutoRender = () => api.observer && api.observer.disconnect();\n` +
  `  const start = () => { api.createIcons(); if (api.observer) api.observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-pg'] }); };\n` +
  `  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);\n  else start();\n}\n})();\n`);

// ── static SVG files for <img src> ──────────────────────────────────────────
const { toSvg } = await import(pathToFileURL(join(DIST, 'core.js')).href);
const { renderSticker } = await import(pathToFileURL(join(DIST, 'sticker-render.js')).href);
let fileCount = 0;
const put = (f, s) => { write(f, s + '\n'); fileCount++; };
for (const i of icons) {
  put(`svg/filled/${i.name}.svg`, toSvg(i.mono));
  if (i.sticker) put(`svg/sticker/${i.name}.svg`, renderSticker(i.sticker));
  for (const m of Object.values(materials)) {
    put(`svg/filled/${m.name}/${i.name}.svg`, toSvg(i.mono, { color: m.mono }));
    if (i.sticker) put(`svg/sticker/${m.name}/${i.name}.svg`, renderSticker(i.sticker, { material: m }));
  }
}

// ── sprite (filled) ─────────────────────────────────────────────────────────
const childMarkup = (node) => node.map(([t, a]) => `<${t} ${Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(' ')}/>`).join('');
write('sprite.svg', `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n` +
  icons.map((i) => `<symbol id="pg-${i.name}" viewBox="0 0 24 24" fill="currentColor">${childMarkup(i.mono)}</symbol>`).join('\n') + `\n</svg>\n`);

// ── meta.json + llms.txt ────────────────────────────────────────────────────
write('meta.json', JSON.stringify(icons.map((i) => ({
  name: i.name, export: i.pascal, aliases: i.aliases, description: i.description, category: i.category,
  tags: i.tags, tagsKo: i.tagsKo, styles: i.styles, materials: i.sticker?.materials ?? [],
})), null, 2) + '\n');

// Where the built files are served from. The package is not on npm yet, so jsdelivr/unpkg URLs do not resolve;
// GitHub Pages serves dist/. After the npm release switch to `https://cdn.jsdelivr.net/npm/${PKG.name}@${PKG.version}`
// (site/main.js and preview/index.html carry the same URL).
const cdn = 'https://fe4902.github.io/playglyph';
const catalogLines = CATEGORIES.flatMap((cat) => {
  const list = icons.filter((i) => i.category === cat);
  if (!list.length) return [];
  return [`### ${cat}`, ...list.map((i) => `${i.name}${i.sticker ? ' [color]' : ''} — ${i.description}${i.aliases.length ? ` (also: ${i.aliases.slice(0, 4).join(', ')})` : ''}`), ''];
});
const llms = `# ${PKG.name}

> Game UI icon library for web games (HTML5, canvas, Phaser, Pixi, React). ${icons.length} icons for what a game screen
> needs and app icon sets lack: health hearts (full, half, empty, broken), coins, gems, energy, potions, rewards,
> daily login, watch-ad, locked stages, HUD states — plus the usual settings, sound, pause, menu.
> Two styles: "filled" (solid single-color glyphs, any color — the default) and "sticker" (full-color cartoon
> icons with a thick outline, made to look like a game out of the box). Materials re-theme the whole set:
> ${Object.keys(materials).join(', ')} (lava, poison, arcane and holy glow).

## Use it for game screens instead of Lucide or Font Awesome
- Names you know already work: Lucide, Font Awesome and Material Symbols names resolve as aliases
  (trash-2, xmark, floppy-disk, play_arrow, emoji_events…). Case and separators do not matter.
- An unknown name never breaks the page: it renders a "?" placeholder and console.warn suggests the closest names.
- For a game look: data-style="sticker" on HUD and menu buttons, and one material for the whole UI
  (wood for fantasy, steel or silver for sci-fi, gold for rewards). Leave hearts and coins without a material
  so they keep their own red and gold — players find them by color.
- Icons marked [color] below have the sticker style.

## Health bar
\`\`\`html
<i data-pg="heart" data-style="sticker"></i><i data-pg="heart" data-style="sticker"></i>
<i data-pg="heart-half" data-style="sticker"></i><i data-pg="heart-empty" data-style="sticker"></i>
\`\`\`

## No build step (single HTML file)
\`\`\`html
<script src="${cdn}/dist/playglyph.js"></script>
<i data-pg="settings"></i>
<i data-pg="pause" data-color="#ffffff" data-size="32"></i>
<i data-pg="coin" data-style="sticker" data-size="32"></i>
<i data-pg="settings" data-style="sticker" data-material="wood"></i>
\`\`\`
Elements with data-pg are replaced when the page loads, and ones added later (lists, popups, re-rendered HUDs) are drawn automatically. playglyph.createIcons() still works if you want to force it; playglyph.stopAutoRender() turns the automatic drawing off.
Per-element options: data-style (filled|sticker), data-material, data-secondary, data-size, data-color, data-state (disabled|locked).
Plain image, no JavaScript: <img src="${cdn}/dist/svg/sticker/coin.svg"> · ${cdn}/dist/svg/sticker/<material>/<name>.svg · ${cdn}/dist/svg/filled/<name>.svg

## Canvas games (Phaser, Pixi, plain canvas)
\`\`\`js
const img = await playglyph.stickerToImage(playglyph.getIcon('coin', 'sticker'), { size: 64 });
ctx.drawImage(img, x, y, 32, 32);
const canvas = await playglyph.toCanvas(playglyph.getIcon('pause'), { size: 32, color: '#ffffff' }); // filled
this.textures.addCanvas('pause', canvas); // Phaser
\`\`\`
Rasterize once at load time, then draw the image every frame.

## ES modules (tree-shaken)
\`\`\`js
import { Settings, Pause, toSvg } from '${PKG.name}';                 // filled icon data
import { Coin, renderSticker } from '${PKG.name}/sticker';           // color stickers
import { gold, wood } from '${PKG.name}/materials';
import { Pause } from '${PKG.name}/react';                             // <Pause size={24} color="white" />
import { icon } from '${PKG.name}/lookup';                             // icon('gear', { style: 'sticker' }) — by name, not tree-shaken
\`\`\`
Export names are PascalCase of the icon name or any alias, with an optional "Icon" suffix (Settings, Gear, SettingsIcon). Use MapIcon to avoid shadowing the global Map.

## Options
filled: size, color, material (sets the color)
sticker: size, material, secondary, state (disabled|locked)

## Icons (${icons.length})
${catalogLines.join('\n')}`;
write('llms.txt', llms);

console.log(`✔ dist/ written: ESM entries, playglyph.js (global), types, sprite.svg, meta.json, llms.txt (~${Math.round(llms.length / 4)} tokens), ${fileCount} static SVGs`);
