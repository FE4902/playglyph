#!/usr/bin/env node
// Writes icon edits made in Penpot back into icons/<style>/<name>.svg.
//
//   node scripts/penpot/sync.mjs --init          after importing into Penpot and staging set "baseline":
//                                                 snapshots icons/ as the sync baseline
//   node scripts/penpot/sync.mjs <set>           dry run: lists icons whose drawing changed in Penpot
//   node scripts/penpot/sync.mjs <set> --apply   writes only those icons into icons/
//
// Layers left untouched in Penpot keep their original source line, so a git diff shows just the edit.
// State lives in .penpot-sync/ (gitignored):
//   staged/baseline/<style>/<name>.json  Penpot markup as of the last sync (layer ids ↔ source lines by order)
//   src-baseline/<style>/<name>.svg      icons/ as of the last sync
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, copyFileSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { convert } from './penpot-to-svg.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const STATE = join(ROOT, '.penpot-sync');
const STYLES = ['filled', 'sticker'];
const EL = /^\s*<(path|circle|rect|line|polyline|polygon|ellipse)\b[\s\S]*?\/>\s*$/;
const args = process.argv.slice(2);

if (args[0] === '--init') {
  if (!existsSync(join(STATE, 'staged', 'baseline'))) { console.error('stage set "baseline" from Penpot first (plugin.js: stage("baseline"))'); process.exit(1); }
  for (const s of STYLES) cpSync(join(ROOT, 'icons', s), join(STATE, 'src-baseline', s), { recursive: true });
  console.log('baseline snapshot of icons/ saved');
  process.exit(0);
}

function merge(style, name, cur) {
  const srcPath = join(STATE, 'src-baseline', style, `${name}.svg`);
  const basePath = join(STATE, 'staged', 'baseline', style, `${name}.json`);
  if (!existsSync(srcPath) || !existsSync(basePath)) return { svg: cur.svg, src: null };
  const src = readFileSync(srcPath, 'utf8');
  const srcLines = src.split('\n');
  const elIdx = srcLines.map((l, i) => (EL.test(l) ? i : -1)).filter((i) => i >= 0);
  const base = convert(JSON.parse(readFileSync(basePath, 'utf8')));
  if (base.lines.length !== elIdx.length) return { svg: cur.svg, src }; // can't pair layers with lines: full conversion
  const keep = new Map(base.lines.map((l, i) => [l.id, { conv: l.line, src: srcLines[elIdx[i]] }]));
  const body = cur.lines.map((l) => (keep.get(l.id)?.conv === l.line ? keep.get(l.id).src : l.line));
  const headOf = (c) => c.svg.slice(0, c.svg.indexOf('\n' + (c.lines[0]?.line ?? '</svg>')));
  const head = headOf(cur) === headOf(base) ? srcLines.slice(0, elIdx[0]).join('\n') : headOf(cur);
  const tail = srcLines.slice(elIdx.at(-1) + 1).join('\n');
  return { svg: `${head}\n${body.join('\n')}\n${tail}`, src };
}

const [set, flag] = args;
if (!set) { console.error('usage: sync.mjs --init | <set> [--apply]'); process.exit(1); }
const changed = [], warns = [], out = {};
for (const style of STYLES) {
  const dir = join(STATE, 'staged', set, style);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const name = f.slice(0, -5);
    const cur = convert(JSON.parse(readFileSync(join(dir, f), 'utf8')));
    warns.push(...cur.warn);
    const { svg, src } = merge(style, name, cur);
    if (svg !== src) { changed.push(`${style}/${name}`); out[`${style}/${name}`] = svg; }
  }
}
console.log(`changed: ${changed.length ? changed.join(', ') : 'none'}`);
if (warns.length) console.log('warnings:\n  ' + warns.join('\n  '));
if (flag === '--apply') {
  for (const key of changed) {
    const [style, name] = key.split('/');
    writeFileSync(join(ROOT, 'icons', style, `${name}.svg`), out[key]);
    mkdirSync(join(STATE, 'src-baseline', style), { recursive: true });
    writeFileSync(join(STATE, 'src-baseline', style, `${name}.svg`), out[key]);
    mkdirSync(join(STATE, 'staged', 'baseline', style), { recursive: true });
    copyFileSync(join(STATE, 'staged', set, style, `${name}.json`), join(STATE, 'staged', 'baseline', style, `${name}.json`));
  }
  console.log(`applied ${changed.length} file(s) — run npm run build to check them`);
}
