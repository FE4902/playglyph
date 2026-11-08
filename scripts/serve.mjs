#!/usr/bin/env node
// Local-only static server for the landing page and gallery.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT ?? process.argv[2] ?? 5178);
const PUBLIC_ROOTS = new Set(['index.html', 'site', 'preview', 'docs', 'dist', 'samples']);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif' };

createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const parts = (path === '/' ? '/index.html' : path).split('/').filter(Boolean);
    if (!PUBLIC_ROOTS.has(parts[0]) || parts.some(part => part.startsWith('.') || part.includes('\\'))) {
      return res.writeHead(404).end('Not found');
    }
    let file = join(ROOT, ...parts);
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': (TYPES[extname(file)] ?? 'application/octet-stream') + '; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(PORT, '127.0.0.1', () => console.log(`playglyph → http://127.0.0.1:${PORT}/`));
