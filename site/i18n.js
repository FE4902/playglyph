// Korean / English for the Playglyph site. A classic script (not a module) so it runs before first paint.
// Korean is written in the HTML; English comes from dictionaries added with pgI18n.add().
//
// Mark text with  data-i18n="key"                      → innerHTML replaced in English
//      attributes  data-i18n-attr="aria-label=key, title=key2"
// Page-wide keys   page.title, page.description
//
// The choice is shared with the gallery: ?lang=ko|en, then localStorage 'pg-lang', then the browser language.
(function () {
  var KEY = 'pg-lang';
  function resolve() {
    var q = new URLSearchParams(location.search).get('lang');
    if (q === 'ko' || q === 'en') {
      try { localStorage.setItem(KEY, q); } catch (e) {}
      return q;
    }
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    if (saved === 'ko' || saved === 'en') return saved;
    return (navigator.language || '').toLowerCase().indexOf('ko') === 0 ? 'ko' : 'en';
  }

  var lang = resolve();
  document.documentElement.lang = lang;
  var dict = { ko: {}, en: {} };

  function t(key, vars) {
    var s = dict[lang][key];
    if (s == null) s = dict.ko[key];
    if (s == null) s = key;
    return vars ? s.replace(/\{(\w+)\}/g, function (_, k) { return vars[k] != null ? vars[k] : ''; }) : s;
  }

  function add(d) {
    ['ko', 'en'].forEach(function (l) { Object.assign(dict[l], d[l] || {}); });
  }

  function apply(root) {
    root = root || document;
    if (lang === 'ko') return;
    var en = dict.en;
    root.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = en[el.dataset.i18n];
      if (v != null) el.innerHTML = v;
    });
    root.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.dataset.i18nAttr.split(',').forEach(function (pair) {
        var p = pair.split('=');
        var v = en[(p[1] || '').trim()];
        if (v != null) el.setAttribute(p[0].trim(), v);
      });
    });
    if (en['page.title']) document.title = en['page.title'];
    var md = document.querySelector('meta[name="description"]');
    if (md && en['page.description']) md.setAttribute('content', en['page.description']);
  }

  function set(next) {
    try { localStorage.setItem(KEY, next); } catch (e) {}
    var u = new URL(location.href);
    if (u.searchParams.has('lang')) { u.searchParams.set('lang', next); location.href = u.href; }
    else location.reload();
  }

  // <div data-lang-switch></div> becomes a KO / EN segmented switch.
  function mountSwitch() {
    document.querySelectorAll('[data-lang-switch]').forEach(function (g) {
      g.setAttribute('role', 'group');
      g.setAttribute('aria-label', t('lang.label'));
      g.innerHTML = ['ko', 'en'].map(function (l) {
        return '<button type="button" lang="' + l + '" data-lang="' + l + '" aria-pressed="' + (l === lang) + '">' + l.toUpperCase() + '</button>';
      }).join('');
      g.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-lang]');
        if (b && b.dataset.lang !== lang) set(b.dataset.lang);
      });
    });
  }

  // Strings shared by every page: header, footer, theme, copy buttons, toasts.
  add({
    ko: {
      'lang.label': '언어',
      'theme.toLight': '밝은 테마로 전환',
      'theme.toDark': '어두운 테마로 전환',
      'copy.button': '복사',
      'copy.aria': '코드 복사',
      'toast.copied': '복사됨',
      'toast.copiedName': '복사됨 — {name}',
      'toast.copyFailed': '복사하지 못했어요',
    },
    en: {
      'lang.label': 'Language',
      'theme.toLight': 'Switch to light theme',
      'theme.toDark': 'Switch to dark theme',
      'copy.button': 'Copy',
      'copy.aria': 'Copy code',
      'toast.copied': 'Copied',
      'toast.copiedName': 'Copied — {name}',
      'toast.copyFailed': "Couldn't copy",
      'brand.aria': 'Playglyph home',
      'nav.aria': 'Main menu',
      'nav.icons': 'Icons',
      'nav.docs': 'Docs',
      'nav.github': 'GitHub repository',
      'footer.license': 'ISC license',
    },
  });

  window.pgI18n = { lang: lang, t: t, add: add, apply: apply, set: set, mountSwitch: mountSwitch };
})();
