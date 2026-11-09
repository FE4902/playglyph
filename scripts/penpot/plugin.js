// Penpot plugin-side helpers for Playglyph. Run this file's contents once through the Penpot MCP
// `execute_code` tool; it installs functions on `storage.pg` for later calls. Needs bridge.mjs running.
//
//   await storage.pg.load()                       fetch icons from the bridge
//   await storage.pg.importStyle('filled')        new page with one component per icon, grouped by category
//   await storage.pg.stage('edit-1', ['coin'])    send the current page's icons (or the named ones) to the bridge
//
// Notes
// - Keep the Penpot tab visible while this runs; a hidden tab gets suspended and the plugin stops answering.
// - Every imported layer carries pluginData "src" (its data-fill / data-stroke / data-layer roles), so roles
//   survive edits. A layer you add takes its role from its name: outline, shadow, base, light, shine, or alt-*.
// - Use center strokes, solid colors, no shadows/blur: the source format has no place for anything else.
// - The SES sandbox rejects HTML-comment tokens in code, so the regex below is built from pieces.
const BRIDGE = 'http://127.0.0.1:5199';
const CATS = ['system', 'control', 'menu', 'currency', 'hud', 'combat', 'social', 'input', 'misc'];
const COMMENT = new RegExp('<' + '!' + '--[\\s\\S]*?--' + '>', 'g');
const ELEMENT = /<(path|circle|rect|line|polyline|polygon|ellipse)\b([^>]*?)\/>/g;
const INK = '#1E1E2E';
const withTimeout = (p, ms = 10000) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('bridge timeout')), ms))]);
const dataAttrs = (s) => { const o = {}; for (const [, k, v] of s.matchAll(/([\w:-]+)="([^"]*)"/g)) if (k.startsWith('data-')) o[k] = v; return o; };

const pg = {
  icons: null,
  async load() {
    pg.icons = await withTimeout((await withTimeout(fetch(BRIDGE + '/'))).json());
    return Object.keys(pg.icons).length;
  },
  boards: () => penpotUtils.findShapes((s) => s.type === 'board' && s.parent?.name === 'icons', penpot.root),

  // one 24×24 board per icon; layers keep source order and get their roles as names + pluginData
  icon(name, style, svg, parent) {
    const g = penpot.createShapeFromSvg(style === 'sticker' ? svg : svg.replaceAll('currentColor', INK));
    const bg = g.children.find((c) => c.name === 'base-background'); // anchors the viewBox origin
    const board = penpot.createBoard();
    board.name = name; board.resize(24, 24); board.fills = []; board.clipContent = true;
    board.x = bg ? bg.x : g.x; board.y = bg ? bg.y : g.y;
    bg?.remove();
    const attrs = [...svg.replace(COMMENT, '').matchAll(ELEMENT)].map((m) => dataAttrs(m[2]));
    [...g.children].forEach((k, i) => {
      const a = attrs[i] ?? {};
      k.name = a['data-fill'] || a['data-stroke'] || a['data-layer'] || `layer-${i + 1}`;
      k.setPluginData('src', JSON.stringify(a));
      board.appendChild(k);
    });
    board.setPluginData('style', style);
    board.setPluginData('root', JSON.stringify(dataAttrs(svg.match(/<svg\b([^>]*)>/)[1])));
    parent?.appendChild(board);
    return board;
  },

  section(cat, x, y) {
    const sec = penpot.createBoard();
    sec.name = cat; sec.fills = [{ fillColor: '#FFFFFF', fillOpacity: 1 }]; sec.borderRadius = 12;
    sec.x = x; sec.y = y; sec.resize(520, 100);
    const fl = sec.addFlexLayout(); fl.dir = 'column'; fl.rowGap = 16; fl.verticalPadding = 24; fl.horizontalPadding = 24; fl.verticalSizing = 'auto';
    const title = penpot.createText(cat.toUpperCase());
    title.fontSize = '12'; title.fontWeight = '700'; title.letterSpacing = '1.5'; title.growType = 'auto-width';
    title.fills = [{ fillColor: '#6B6478', fillOpacity: 1 }];
    sec.appendChild(title);
    const grid = penpot.createBoard(); grid.name = 'icons'; grid.fills = []; grid.resize(472, 24);
    const gf = grid.addFlexLayout(); gf.dir = 'row'; gf.wrap = 'wrap'; gf.rowGap = 16; gf.columnGap = 16; gf.verticalSizing = 'auto';
    sec.appendChild(grid);
    return { sec, grid };
  },

  // call per style; split into several calls (one category each) if the tool call times out
  async importStyle(style, cats = CATS, pageName) {
    if (!pg.icons) await pg.load();
    const page = penpotUtils.getPageByName(pageName ?? style) ?? Object.assign(penpot.createPage(), { name: pageName ?? style });
    await Promise.race([penpot.openPage(page), new Promise((r) => setTimeout(r, 5000))]);
    let y = penpot.root.children.reduce((m, s) => Math.max(m, s.y + s.height + 32), 0);
    const done = [];
    for (const cat of cats) {
      const names = Object.keys(pg.icons).filter((n) => pg.icons[n].category === cat && pg.icons[n][style]);
      if (!names.length) continue;
      const { sec, grid } = pg.section(cat, 0, y);
      for (const n of names) {
        const b = pg.icon(n, style, pg.icons[n][style], grid);
        const c = penpot.library.local.createComponent([b]);
        c.name = n; c.path = `${style} / ${cat}`; b.name = n;
      }
      await penpot.waitForLayoutUpdate();
      y += sec.height + 32; done.push([cat, names.length]);
    }
    return done;
  },

  payload(b) {
    const shapes = {};
    const walk = (s) => { for (const c of s.children ?? []) { const src = c.getPluginData('src'); shapes[c.id] = { name: c.name, src: src ? JSON.parse(src) : null }; walk(c); } };
    walk(b);
    const root = b.getPluginData('root');
    return { style: b.getPluginData('style'), name: b.name, root: root ? JSON.parse(root) : {}, shapes, markup: penpot.generateMarkup([b], { type: 'svg' }) };
  },

  async stage(set, names) {
    const boards = pg.boards().filter((b) => !names || names.includes(b.name));
    const res = [];
    for (let i = 0; i < boards.length; i += 20) {
      const items = boards.slice(i, i + 20).map(pg.payload);
      const r = await withTimeout(fetch(BRIDGE + '/stage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ set, items }) }));
      res.push(await r.text());
    }
    return res;
  },
};
storage.pg = pg;
return 'storage.pg ready';
