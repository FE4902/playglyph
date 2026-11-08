// Playglyph intro page. One plain ES module, no dependencies.
// Every part is wrapped on its own so one failure never breaks the rest of the page.

// Keep in sync with "version" in package.json.
const VERSION = '0.1.0';
// Switch to `https://cdn.jsdelivr.net/npm/playglyph@${VERSION}/dist` after the npm release.
const CDN = 'https://fe4902.github.io/playglyph/dist';

// site/i18n.js (a classic script) runs first and holds the Korean/English strings.
const t = (key, vars) => (window.pgI18n ? window.pgI18n.t(key, vars) : key);

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function safe(label, fn) {
  try {
    const r = fn();
    if (r && typeof r.catch === 'function') r.catch((e) => console.error(`[site] ${label}:`, e));
  } catch (e) {
    console.error(`[site] ${label}:`, e);
  }
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1400);
}

async function copyText(text, msg) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(msg);
  } catch (e) {
    console.warn('[site] clipboard:', e);
    showToast(t('toast.copyFailed'));
  }
}

// ---- Parts that need no icon data ----

safe('theme', () => {
  const btn = document.getElementById('theme');
  const root = document.documentElement;
  const apply = (theme) => {
    root.dataset.theme = theme;
    if (!btn) return;
    const isLight = theme === 'light';
    // Both icons live in the button; CSS shows the one for the theme a click switches to.
    const label = t(isLight ? 'theme.toDark' : 'theme.toLight');
    btn.setAttribute('aria-label', label);
    btn.title = label;
  };
  let saved = null;
  try { saved = localStorage.getItem('pg-theme'); } catch {}
  apply(saved === 'light' ? 'light' : 'dark');
  btn?.addEventListener('click', () => {
    const next = root.dataset.theme !== 'light' ? 'light' : 'dark';
    apply(next);
    try { localStorage.setItem('pg-theme', next); } catch {}
  });
});

safe('version', () => {
  for (const el of $$('[data-version]')) el.textContent = VERSION;
});

safe('search shortcut', () => {
  const input = $('form.search input[name="q"]');
  if (!input) return;
  document.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
    const el = e.target;
    if (el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
    e.preventDefault();
    input.focus();
  });
});

safe('tabs', () => {
  for (const box of $$('.tabs')) {
    const tabs = $$('[role="tab"]', box);
    const select = (tab, focus) => {
      for (const t of tabs) {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      }
      if (focus) tab.focus();
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab, false));
      tab.addEventListener('keydown', (e) => {
        const n = tabs.length;
        const to = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
        if (to == null) return;
        e.preventDefault();
        select(tabs[to], true);
      });
    });
    select(tabs.find((t) => t.getAttribute('aria-selected') === 'true') ?? tabs[0], false);
  }
});

safe('cdn', () => {
  for (const code of $$('code[data-cdn]')) code.textContent = code.textContent.split('{CDN}').join(CDN);
});

safe('copy buttons', () => {
  for (const pre of $$('.tabpanel pre')) {
    const btn = document.createElement('button');
    btn.className = 'copy';
    btn.type = 'button';
    btn.setAttribute('aria-label', t('copy.aria'));
    btn.textContent = t('copy.button');
    btn.addEventListener('click', () => {
      const code = pre.querySelector('code');
      copyText(code ? code.textContent : pre.textContent.slice(0, -btn.textContent.length), t('toast.copied'));
    });
    pre.append(btn);
  }
});

// ---- Parts that need the icon library ----

let lib = null;
try {
  const [lookup, mats, catalog] = await Promise.all([
    import('../dist/lookup.js'),
    import('../dist/materials.js'),
    import('../dist/catalog.js'),
  ]);
  lib = { ...lookup, materials: mats.materials, names: catalog.names };
} catch (e) {
  console.error('[site] could not load dist/ (run `npm run build`):', e);
}

if (lib) {
  const { icon, getIcon, createIcons, resolveName, materials, names } = lib;

  safe('createIcons', () => createIcons());

  safe('cover', () => {
    const sheet = document.getElementById('cover-sheet');
    if (!sheet) return;
    const cover = ['heart', 'coin', 'gem', 'treasure-chest', 'potion', 'sword', 'shield', 'crown', 'trophy', 'star',
      'key', 'map', 'gift', 'backpack', 'skull', 'flame', 'bow-arrow', 'hourglass', 'medal', 'settings'];
    const tint = { shield: 'wood', crown: 'gold', gem: 'arcane' };
    sheet.innerHTML = cover
      .filter((n) => resolveName(n))
      .map((n) => `<span class="cover-cell">${icon(n, { style: 'sticker', size: 48, ...(tint[n] ? { material: tint[n] } : {}) })}</span>`)
      .join('');
  });

  safe('playground', () => {
    const grid = document.getElementById('pg-grid');
    if (!grid) return;
    const styleGroup = document.getElementById('pg-style');
    const matGroup = document.getElementById('pg-material');
    const sizeInput = document.getElementById('pg-size');
    const sizeOut = document.getElementById('pg-size-out');
    const note = document.getElementById('pg-note');

    const LIST = ['heart', 'heart-half', 'heart-empty', 'coin', 'gem', 'potion', 'treasure-chest', 'gift', 'trophy', 'crown',
      'star', 'sword', 'shield', 'bow-arrow', 'skull', 'backpack', 'map', 'key', 'lock', 'settings', 'pause', 'play', 'volume-2', 'home']
      .filter((n) => resolveName(n));
    const hasPixel = (n) => !!getIcon(n, 'pixel');
    const PIXEL = [...LIST.filter(hasPixel), ...names.filter((n) => hasPixel(n) && !LIST.includes(n))];

    const state = {
      style: $('[aria-pressed="true"]', styleGroup ?? document.body)?.dataset.v ?? 'sticker',
      material: null,
      size: Number(sizeInput?.value) || 40,
    };

    if (matGroup) {
      const opts = [[null, t('pg.default'), null], ...Object.keys(materials).map((k) => [k, k, materials[k].tones[2]])];
      matGroup.innerHTML = opts.map(([k, label, color]) =>
        `<button type="button" class="swatch" data-m="${escapeHtml(k ?? '')}" aria-pressed="${k === state.material}" title="${escapeHtml(label)}">` +
        `${color ? `<span class="dot" style="background:${escapeHtml(color)}"></span>` : '<span class="dot dot-none"></span>'}${escapeHtml(label)}</button>`).join('');
      matGroup.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-m]');
        if (!b) return;
        state.material = b.dataset.m || null;
        for (const x of $$('button[data-m]', matGroup)) x.setAttribute('aria-pressed', String(x === b));
        render();
      });
    }

    styleGroup?.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-v]');
      if (!b) return;
      state.style = b.dataset.v;
      for (const x of $$('button[data-v]', styleGroup)) x.setAttribute('aria-pressed', String(x === b));
      render();
    });

    sizeInput?.addEventListener('input', () => {
      state.size = Number(sizeInput.value) || 40;
      render();
    });

    // Pixel art is drawn on a 16x16 grid, so it renders at whole multiples of 16.
    const renderSize = () => (state.style === 'pixel' ? Math.min(64, Math.max(16, Math.round(state.size / 16) * 16)) : state.size);

    function render() {
      const size = renderSize();
      if (sizeOut) sizeOut.textContent = String(size);
      if (note) note.textContent = state.style === 'pixel'
        ? t('pg.pixelNote', { n: PIXEL.length })
        : '';
      const list = state.style === 'pixel' ? PIXEL : LIST;
      const opts = { style: state.style, size, ...(state.material ? { material: state.material } : {}) };
      grid.innerHTML = list.map((n) => {
        let svg = '';
        try { svg = icon(n, opts); } catch (e) { console.warn('[site] icon', n, e); }
        return `<button class="pg-cell" type="button" title="${escapeHtml(n)}" data-name="${escapeHtml(n)}">${svg}<span class="nm">${escapeHtml(n)}</span></button>`;
      }).join('');
    }

    grid.addEventListener('click', (e) => {
      const cell = e.target.closest('.pg-cell');
      if (!cell) return;
      const name = cell.dataset.name;
      const { style, material } = state;
      const size = renderSize();
      const snippet = `<i data-pg="${name}"${style !== 'filled' ? ` data-style="${style}"` : ''}${material ? ` data-material="${material}"` : ''}${size !== 24 ? ` data-size="${size}"` : ''}></i>`;
      copyText(snippet, t('toast.copiedName', { name }));
    });

    render();
  });
}

// ---- Parts that need meta.json ----

let meta = null;
try {
  const res = await fetch(new URL('../dist/meta.json', import.meta.url));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  meta = await res.json();
  if (!Array.isArray(meta)) throw new Error('meta.json is not an array');
} catch (e) {
  console.error('[site] could not load dist/meta.json:', e);
}

const CATEGORIES = ['hud', 'currency', 'combat', 'menu', 'system', 'control', 'input', 'social', 'misc']
  .map((id) => [id, t(`cat.${id}`)]);

function groupByCategory(list) {
  const labels = new Map(CATEGORIES);
  const groups = new Map(CATEGORIES.map(([k]) => [k, []]));
  for (const m of list) {
    const k = m.category ?? 'misc';
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(m);
  }
  return [...groups].filter(([, items]) => items.length).map(([key, items]) => ({ key, label: labels.get(key) ?? key, items }));
}

if (meta) {
  safe('stats', () => {
    const fmt = (n) => n.toLocaleString('ko-KR');
    const aliasCount = meta.reduce((sum, m) => sum + (m.aliases?.length ?? 0), 0);
    for (const el of $$('[data-stat="icons"]')) el.textContent = fmt(meta.length);
    for (const el of $$('[data-stat="aliases"]')) el.textContent = fmt(aliasCount);
    if (lib) for (const el of $$('[data-stat="materials"]')) el.textContent = fmt(Object.keys(lib.materials).length);
    const input = $('form.search input[name="q"]');
    if (input) input.placeholder = t('search.placeholder', { n: meta.length });
  });

  safe('meta categories', () => {
    const el = document.getElementById('meta-cats');
    if (el) el.textContent = groupByCategory(meta).map((g) => `${g.label} ${g.items.length}`).join(' · ');
  });
}
