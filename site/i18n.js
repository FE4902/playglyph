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
  var languages = { ko: '한국어', en: 'English' };
  var supported = Object.keys(languages);
  function resolve() {
    var q = new URLSearchParams(location.search).get('lang');
    if (supported.includes(q)) {
      try { localStorage.setItem(KEY, q); } catch (e) {}
      return q;
    }
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    if (supported.includes(saved)) return saved;
    var browserLang = (navigator.language || '').toLowerCase().split('-')[0];
    return supported.includes(browserLang) ? browserLang : 'en';
  }

  var lang = resolve();
  document.documentElement.lang = lang;
  var dict = Object.fromEntries(supported.map(function (l) { return [l, {}]; }));

  function t(key, vars) {
    var s = dict[lang][key];
    if (s == null) s = dict.ko[key];
    if (s == null) s = key;
    return vars ? s.replace(/\{(\w+)\}/g, function (_, k) { return vars[k] != null ? vars[k] : ''; }) : s;
  }

  function add(d) {
    supported.forEach(function (l) { Object.assign(dict[l], d[l] || {}); });
  }

  function apply(root) {
    root = root || document;
    if (lang === 'ko') return;
    var translations = dict[lang];
    root.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = translations[el.dataset.i18n];
      if (v != null) el.innerHTML = v;
    });
    root.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.dataset.i18nAttr.split(',').forEach(function (pair) {
        var p = pair.split('=');
        var v = translations[(p[1] || '').trim()];
        if (v != null) el.setAttribute(p[0].trim(), v);
      });
    });
    if (translations['page.title']) document.title = translations['page.title'];
    var md = document.querySelector('meta[name="description"]');
    if (md && translations['page.description']) md.setAttribute('content', translations['page.description']);
  }

  function set(next) {
    try { localStorage.setItem(KEY, next); } catch (e) {}
    var u = new URL(location.href);
    if (u.searchParams.has('lang')) { u.searchParams.set('lang', next); location.href = u.href; }
    else location.reload();
  }

  function mountSwitch(onChange = set) {
    document.querySelectorAll('[data-lang-switch]').forEach(function (container) {
      var select = document.createElement('select');
      select.setAttribute('aria-label', t('lang.label'));
      supported.forEach(function (l) {
        var option = new Option(languages[l], l);
        option.lang = l;
        select.add(option);
      });
      select.value = lang;
      select.addEventListener('change', function () { onChange(select.value); });
      container.replaceChildren(select);
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
