// Builds the images used in README.md / README.en.md from the built icons.
//
//   node scripts/readme-assets.mjs
//
// Reads dist/svg/filled/*.svg and dist/svg/sticker/**/*.svg (run `npm run build` first if dist is stale)
// and writes self-contained SVGs into .github/assets/. No dependencies. Re-run after icons change.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SVG_DIR = join(root, 'dist', 'svg');
const OUT_DIR = join(root, '.github', 'assets');

// Icons that are being redrawn. Name them here to keep them out of the README images until they settle.
const HOLD = new Set([]);

const W = 960;
const PANEL = '#171a2b';
const PANEL_EDGE = '#2e3454';
const INK = '#f2f4ff';
const LABEL = '#c9cfea';
const MUTED = '#8089ad';
const FONT = "ui-rounded, 'SF Pro Rounded', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

let uid = 0;

/** Inner markup of one built icon, safe to inline many times in one document. */
function inner(name, style, material) {
  if (HOLD.has(name)) throw new Error(`"${name}" is on hold; pick another icon`);
  const file = style === 'filled'
    ? join(SVG_DIR, 'filled', `${name}.svg`)
    : join(SVG_DIR, 'sticker', ...(material ? [material] : []), `${name}.svg`);
  let svg;
  try {
    svg = readFileSync(file, 'utf8');
  } catch {
    throw new Error(`Missing ${file}`);
  }
  const body = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const n = ++uid;
  return body
    .replace(/ data-[a-z-]+="[^"]*"/g, '')
    // Glow filters carry an id; make each copy unique so they do not collide.
    .replace(/\bid="([^"]+)"/g, (_, id) => `id="${id}-r${n}"`)
    .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${id}-r${n})`);
}

/** One icon drawn at (x, y) with the given pixel size. */
function place(name, x, y, size, { style = 'sticker', material, color = INK } = {}) {
  const s = +(size / 24).toFixed(4);
  // color as well as fill: filled icons stroke with currentColor for their soft corners
  const fill = style === 'filled' ? ` fill="${color}" color="${color}"` : '';
  return `<g transform="translate(${x} ${y}) scale(${s})"${fill}>${inner(name, style, material)}</g>`;
}

const text = (x, y, str, { size = 15, weight = 600, fill = LABEL, anchor = 'start', spacing = 0 } = {}) =>
  `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${spacing ? ` letter-spacing="${spacing}"` : ''}>${str}</text>`;

function doc(height, title, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}" viewBox="0 0 ${W} ${height}" role="img" aria-label="${title}">
<title>${title}</title>
<rect x="1" y="1" width="${W - 2}" height="${height - 2}" rx="28" fill="${PANEL}" stroke="${PANEL_EDGE}" stroke-width="2"/>
${body.join('\n')}
</svg>
`;
}

/** A row of icons, evenly spaced, starting at x. */
function row(names, x, y, size, gap, opts) {
  return names.map((n, i) => place(n, x + i * (size + gap), y, size, typeof opts === 'function' ? opts(n, i) : opts));
}

// ---- banner -------------------------------------------------------------------------------------
function banner() {
  const icons = ['heart', 'coin', 'gem', 'star', 'zap', 'potion', 'sword', 'shield', 'key', 'treasure-chest', 'crown', 'gamepad'];
  const size = 52, gap = 18;
  const x = (W - (icons.length * size + (icons.length - 1) * gap)) / 2;
  return doc(300, 'Playglyph: game UI icons for web games', [
    text(W / 2, 104, 'Playglyph', { size: 64, weight: 800, fill: INK, anchor: 'middle', spacing: -1 }),
    text(W / 2, 146, 'Game UI icons for web games', { size: 21, weight: 500, fill: LABEL, anchor: 'middle' }),
    ...row(icons, x, 196, size, gap),
  ]);
}

// ---- preview: icons grouped by where they go on a game screen --------------------------------------
const GRID_X = 262, SIZE = 44, GAP = 24; // 10 columns: 262 .. 918

function preview() {
  const groups = [
    ['HUD', 'health, status, timers', ['heart', 'heart-half', 'heart-empty', 'heart-crack', 'star', 'zap', 'flame', 'skull', 'crown', 'clock']],
    ['Currency &amp; rewards', 'shop, daily login, ads', ['coin', 'gem', 'key', 'ticket', 'gift', 'treasure-chest', 'calendar-check', 'monitor-play', 'trophy', 'medal']],
    ['Combat', 'weapons, skills, items', ['sword', 'swords', 'shield', 'bow-arrow', 'magic-wand', 'potion', 'crosshair', 'ammo', 'target', 'heart-plus']],
    ['Controls', 'buttons and input', ['play', 'pause', 'restart', 'home', 'close', 'check', 'dpad', 'gamepad', 'joystick', 'keyboard']],
    ['Menu', 'screens and settings', ['settings', 'backpack', 'map', 'quest', 'store', 'user', 'volume-2', 'music', 'bell', 'menu']],
  ];
  const top = 44, step = 84;
  const body = [];
  groups.forEach(([label, sub, names], i) => {
    const y = top + i * step;
    body.push(text(44, y + 20, label, { size: 17, weight: 700, fill: INK }));
    body.push(text(44, y + 41, sub, { size: 13, weight: 500, fill: MUTED }));
    body.push(...row(names, GRID_X, y, SIZE, GAP));
  });
  return doc(top * 2 + (groups.length - 1) * step + SIZE, 'Playglyph icons grouped by game use: HUD, currency and rewards, combat, controls, menu', body);
}

// ---- styles: filled vs sticker, then the ten materials -----------------------------------------------
function styles() {
  const sample = ['heart', 'coin', 'gem', 'star', 'potion', 'shield', 'sword', 'key', 'settings', 'pause'];
  const materials = ['wood', 'stone', 'steel', 'gold', 'bronze', 'silver', 'lava', 'poison', 'arcane', 'holy'];
  const themed = ['sword', 'shield', 'settings'];
  const body = [];
  let y = 44;

  body.push(text(44, y + 20, 'filled', { size: 17, weight: 700, fill: INK }));
  body.push(text(44, y + 41, 'one color, any color', { size: 13, weight: 500, fill: MUTED }));
  body.push(...row(sample, GRID_X, y, SIZE, GAP, { style: 'filled' }));
  y += 84;

  body.push(text(44, y + 20, 'sticker', { size: 17, weight: 700, fill: INK }));
  body.push(text(44, y + 41, 'outline, shading, color', { size: 13, weight: 500, fill: MUTED }));
  body.push(...row(sample, GRID_X, y, SIZE, GAP));
  y += 84;

  body.push(`<line x1="44" y1="${y - 8}" x2="${W - 44}" y2="${y - 8}" stroke="${PANEL_EDGE}" stroke-width="2"/>`);
  y += 28;

  body.push(text(44, y + 20, 'materials', { size: 17, weight: 700, fill: INK }));
  body.push(text(44, y + 41, 'recolor the whole set', { size: 13, weight: 500, fill: MUTED }));
  themed.forEach((name, r) => {
    materials.forEach((m, i) => body.push(place(name, GRID_X + i * (SIZE + GAP), y + r * 68, SIZE, { material: m })));
  });
  const namesY = y + themed.length * 68 + 6;
  materials.forEach((m, i) => body.push(text(GRID_X + i * (SIZE + GAP) + SIZE / 2, namesY, m, { size: 13, weight: 600, fill: LABEL, anchor: 'middle' })));

  return doc(namesY + 34, 'Playglyph styles: filled and sticker, and the ten materials (wood, stone, steel, gold, bronze, silver, lava, poison, arcane, holy)', body);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const [file, build] of [['banner.svg', banner], ['preview.svg', preview], ['styles.svg', styles]]) {
  const svg = build();
  writeFileSync(join(OUT_DIR, file), svg);
  console.log(`${file}  ${(svg.length / 1024).toFixed(1)} KB`);
}
