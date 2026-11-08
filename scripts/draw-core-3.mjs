// Redraw settings, coin, heart (filled + sticker) to the 2026-11-07 reference rules.
import { writeFileSync } from 'node:fs';
const OUT = process.argv[2] ?? new URL('../icons', import.meta.url).pathname;
// thickness: 1 = original button look (A), 2/3 = current (B), 0 = front view, no side (D). Filled coin keeps the full edge unless K = 0.
const K = Number(process.env.THICK ?? 2 / 3);
const f = (n) => +n.toFixed(2);
const rad = (d) => d * Math.PI / 180;
const pt = (cx, cy, r, a) => `${f(cx + r * Math.cos(rad(a)))} ${f(cy + r * Math.sin(rad(a)))}`;

// ── gear: 6 short, wide teeth ──
function gear(cx, cy, { N = 6, root = 7.7, tip = 9.7, baseHalf = 2.05, tipHalf = 1.45, rot = -90 } = {}) {
  const aB = Math.asin(baseHalf / root) * 180 / Math.PI;
  const aT = Math.asin(tipHalf / tip) * 180 / Math.PI;
  let d = '';
  for (let i = 0; i < N; i++) {
    const c = rot + i * 360 / N;
    const pts = [[root, c - aB], [tip, c - aT], [tip, c + aT], [root, c + aB]];
    d += (i === 0 ? 'M' : 'L') + pt(cx, cy, ...pts[0]) + 'L' + pt(cx, cy, ...pts[1]);
    d += `A${tip} ${tip} 0 0 1 ` + pt(cx, cy, ...pts[2]) + 'L' + pt(cx, cy, ...pts[3]);
    d += `A${root} ${root} 0 0 1 ` + pt(cx, cy, root, c + 360 / N - aB);
  }
  return d + 'z';
}
const circ = (cx, cy, r) => `M${f(cx - r)} ${f(cy)}a${r} ${r} 0 1 0 ${f(2 * r)} 0a${r} ${r} 0 1 0 ${f(-2 * r)} 0z`;
const star = (cx, cy, R, r) => {
  let d = '';
  for (let i = 0; i < 10; i++) d += (i ? 'L' : 'M') + pt(cx, cy, i % 2 ? r : R, -90 + i * 36);
  return d + 'z';
};

const svgF = (body) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">\n${body}\n</svg>\n`;
const svgS = (mats, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" data-materials="${mats}">\n${body}\n</svg>\n`;
const P = { steel: ['#1b1f33', '#4d5a7c', '#8b9dba', '#c6d4e6', '#f6fbff'], gold: ['#3d1e10', '#a3531c', '#e39a2b', '#ffd45a', '#fff7d6'] };
const role = (pal, r) => `fill="${pal[['outline', 'shadow', 'base', 'light', 'shine'].indexOf(r)]}" data-fill="${r}"`;
const srole = (pal, r) => `stroke="${pal[['outline', 'shadow', 'base', 'light', 'shine'].indexOf(r)]}" data-stroke="${r}"`;

// settings — filled: gear with round corners (stroke 1.4), hole ~27% of width
{
  const g = gear(12, 12);
  writeFileSync(`${OUT}/filled/settings.svg`, svgF(
    `  <path d="${g} ${circ(12, 12, 3.6)}" fill-rule="evenodd" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>`));
  // sticker: face + visible side (thickness) below, hole shows depth
  const s = P.steel, TG = 1.6 * K, up = f(12 - (18.6 + TG) / 2 + 9.3), dn = f(up + TG);
  const gu = gear(12, up, { root: 7.4, tip: 9.3, baseHalf: 2.0, tipHalf: 1.4 });
  const gd = gear(12, dn, { root: 7.4, tip: 9.3, baseHalf: 2.0, tipHalf: 1.4 });
  writeFileSync(`${OUT}/sticker/settings.svg`, svgS('steel', [
    ...(TG ? [`  <path d="${gd}" ${role(s, 'outline')} ${srole(s, 'outline')} stroke-width="3.4" stroke-linejoin="round"/>`] : []),
    `  <path d="${gu}" ${role(s, 'outline')} ${srole(s, 'outline')} stroke-width="3.4" stroke-linejoin="round"/>`,
    ...(TG ? [`  <path d="${gd}" ${role(s, 'shadow')}/>`] : []),
    `  <path d="${gu}" ${role(s, 'base')}/>`,
    `  <path d="${gear(11.55, up - 0.45, { root: 6.55, tip: 8.5, baseHalf: 1.75, tipHalf: 1.15 })}" ${role(s, 'light')}/>`,
    `  <circle cx="12" cy="${up}" r="3.0" ${role(s, 'outline')}/>`,
    `  <path d="M${pt(12, up, 5.3, 200)}A5.3 5.3 0 0 1 ${pt(12, up, 5.3, 238)}" fill="none" stroke-linecap="round" stroke-width="1.3" ${srole(s, 'shine')}/>`,
  ].join('\n')));
}

// coin — face circle + 2px edge below; star emblem (no concentric rings)
{
  const r = 9.2, gap = 0.9, sh = K ? gap + 1.7 : 0, fc = f(12 - (18.4 + sh) / 2 + r);
  const ec = fc + sh, R2 = r + gap;
  // intersection of edge circle (ec, r) and gap circle (fc, R2)
  const y = ((R2 * R2 - r * r) + (ec * ec - fc * fc)) / (2 * (ec - fc));
  const dx = Math.sqrt(R2 * R2 - (y - fc) ** 2);
  const edge = `M${f(12 - dx)} ${f(y)}A${r} ${r} 0 0 0 ${f(12 + dx)} ${f(y)}A${R2} ${R2} 0 0 1 ${f(12 - dx)} ${f(y)}z`;
  writeFileSync(`${OUT}/filled/coin.svg`, svgF(
    `  <path d="${circ(12, fc, r)} ${star(12, fc + 0.2, 4.6, 2.1)}" fill-rule="evenodd"/>` + (sh ? `\n  <path d="${edge}"/>` : '')));
  const g = P.gold, TC = 2.4 * K, fs = f(12 - (18.4 + TC) / 2 + r), es = f(fs + TC);
  writeFileSync(`${OUT}/sticker/coin.svg`, svgS('gold', [
    ...(TC ? [`  <circle cx="12" cy="${es}" r="${r}" ${role(g, 'outline')} ${srole(g, 'outline')} stroke-width="3.4"/>`] : []),
    `  <circle cx="12" cy="${fs}" r="${r}" ${role(g, 'outline')} ${srole(g, 'outline')} stroke-width="3.4"/>`,
    ...(TC ? [`  <circle cx="12" cy="${es}" r="${r}" ${role(g, 'shadow')}/>`] : []),
    `  <circle cx="12" cy="${fs}" r="${r}" ${role(g, 'light')}/>`,
    `  <circle cx="12" cy="${fs}" r="6.4" ${role(g, 'shadow')}/>`,
    `  <circle cx="12" cy="${f(fs + 0.9)}" r="6.1" ${role(g, 'base')}/>`,
    `  <path d="${star(12, fs + 0.85, 4.0, 1.85)}" ${role(g, 'shadow')} ${srole(g, 'shadow')} stroke-width="0.6" stroke-linejoin="round"/>`,
    `  <path d="${star(12, fs + 0.45, 4.0, 1.85)}" ${role(g, 'light')} ${srole(g, 'light')} stroke-width="0.6" stroke-linejoin="round"/>`,
    `  <path d="M${pt(12, fs, 7.8, 196)}A7.8 7.8 0 0 1 ${pt(12, fs, 7.8, 232)}" fill="none" stroke-linecap="round" stroke-width="1.3" ${srole(g, 'shine')}/>`,
  ].join('\n')));
}

// heart — plumper, rounder tip
{
  const H = 'M12 20.4C10.9 20.4 3 15.6 3 9.6A5.1 5.1 0 0 1 12 6.7A5.1 5.1 0 0 1 21 9.6C21 15.6 13.1 20.4 12 20.4z';
  writeFileSync(`${OUT}/filled/heart.svg`, svgF(
    `  <path d="${H}" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>`));
  const red = ['#4a1029', '#a3203f', '#e33e4a', '#ff7d63', '#ffe6d2'];
  writeFileSync(`${OUT}/sticker/heart.svg`, svgS('', [
    `  <path d="${H}" fill="${red[0]}" stroke="${red[0]}" stroke-width="3.4" stroke-linejoin="round" data-layer="outline"/>`,
    `  <path d="${H}" fill="${red[1]}"/>`,
    `  <path d="${H}" fill="${red[2]}" transform="translate(0.55 0.15) scale(0.91)"/>`,
    `  <ellipse cx="7.3" cy="9.6" rx="1.9" ry="1.15" fill="${red[4]}" transform="rotate(-40 7.3 9.6)"/>`,
  ].join('\n')).replace(' data-materials=""', ''));
}
console.log('written to', OUT);
