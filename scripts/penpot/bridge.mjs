#!/usr/bin/env node
// Local bridge between the Penpot MCP plugin and this repo (127.0.0.1 only).
//   GET  /       → every icon's source SVGs (filled, sticker) + category, for import into Penpot
//   POST /stage  → { set, items: [{ style, name, markup, root, shapes }] } from plugin.js `stage()`;
//                  written to .penpot-sync/staged/<set>/<style>/<name>.json — never into icons/ directly.
//                  `node scripts/penpot/sync.mjs <set> --apply` is what writes icons/.
//
//   node scripts/penpot/bridge.mjs [port=5199]
import { createServer } from 'node:http';
import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ICONS = join(ROOT, 'icons');
const STATE = join(ROOT, '.penpot-sync');
const PORT = Number(process.argv[2] ?? 5199);
const STYLES = ['filled', 'sticker'];
const SAFE = /^[a-z0-9][a-z0-9._-]*$/i;

function bundle() {
  const out = {};
  for (const f of readdirSync(ICONS).filter((f) => f.endsWith('.json')).sort()) {
    const name = f.slice(0, -5);
    const meta = JSON.parse(readFileSync(join(ICONS, f), 'utf8'));
    const e = { category: meta.categories[0], description: meta.description };
    for (const s of STYLES) {
      const p = join(ICONS, s, `${name}.svg`);
      if (existsSync(p)) e[s] = readFileSync(p, 'utf8');
    }
    out[name] = e;
  }
  return out;
}
const send = (res, code, type, body) => { res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(body); };

createServer((req, res) => {
  // the plugin runs on the Penpot origin, so it needs CORS (and Chrome's local-network preflight header)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.writeHead(204).end();
  const path = new URL(req.url, 'http://x').pathname;
  if (req.method === 'GET' && path === '/') return send(res, 200, 'application/json', JSON.stringify(bundle()));
  if (req.method === 'POST' && path === '/stage') {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 5e6) req.destroy(); });
    req.on('end', () => {
      try {
        const { set, items } = JSON.parse(body);
        if (!SAFE.test(set)) throw new Error('bad set name');
        for (const it of items) {
          if (!STYLES.includes(it.style) || !SAFE.test(it.name) || typeof it.markup !== 'string') throw new Error(`bad item ${it.name}`);
          const dir = join(STATE, 'staged', set, it.style);
          mkdirSync(dir, { recursive: true });
          writeFileSync(join(dir, `${it.name}.json`), JSON.stringify(it));
        }
        send(res, 200, 'application/json', JSON.stringify({ ok: true, n: items.length }));
      } catch (e) { send(res, 400, 'text/plain', String(e.message)); }
    });
    return;
  }
  send(res, 404, 'text/plain', 'not found');
}).listen(PORT, '127.0.0.1', () => console.log(`penpot bridge → http://127.0.0.1:${PORT}/`));
