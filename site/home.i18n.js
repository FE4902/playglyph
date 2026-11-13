// English for the intro page (index.html). Korean lives in the HTML; keys used from JS carry both.
pgI18n.add({
  ko: {
    'search.placeholder': '{n}개 아이콘 검색 — heart, 코인, 설정',
    'pg.default': '기본',
    'pg.pixelNote': '도트 스타일은 실험 중이라 {n}종만 있어요. 16×16 도안이라 16·32·48px처럼 정수 배율에서 또렷합니다.',
    'cat.hud': '상태·HUD', 'cat.currency': '재화·보상', 'cat.combat': '전투·행동', 'cat.menu': '메뉴', 'cat.system': '시스템',
    'cat.control': '진행 제어', 'cat.input': '입력', 'cat.social': '소셜', 'cat.misc': '기타',
  },
  en: {
    'page.title': 'Playglyph — UI icons for web games',
    'page.description': 'Hearts, coins, gear and settings. 134 free UI icons for web games in solid, color sticker and pixel styles, with 10 materials.',
    'search.placeholder': 'Search {n} icons — heart, coin, settings',
    'search.aria': 'Search icons',
    'pg.default': 'Default',
    'pg.pixelNote': 'Pixel style is in beta, so only {n} icons have it. They are drawn on a 16×16 grid, so they stay crisp at whole multiples like 16, 32 and 48px.',
    'cat.hud': 'Status & HUD', 'cat.currency': 'Currency & rewards', 'cat.combat': 'Combat & actions', 'cat.menu': 'Menu', 'cat.system': 'System',
    'cat.control': 'Flow control', 'cat.input': 'Input', 'cat.social': 'Social', 'cat.misc': 'Misc',

    'hero.free': 'Free · ISC license',
    'hero.title': 'UI icons<br />for web games',
    'cta.browse': 'Browse icons',
    'cta.docs': 'Docs',
    'cta.download': 'Download',
    'hero.facts': '<b data-stat="icons">134</b> icons · <b>3</b> styles · <b data-stat="materials">10</b> materials · <b>0</b> dependencies',

    'cmp.title': 'Icon comparison',
    'cmp.alt': 'A pixel RPG adventurer stands on a cobblestone path in an autumn village beside a river and wooden bridge',
    'cmp.slider': 'Compare Lucide and Playglyph icons',
    'cmp.sr': 'Compares health, coin, gem and gear icons. Use the left and right arrow keys to adjust. Home shows all Playglyph, End shows all Lucide.',

    'play.title': 'Styles and materials',
    'play.desc': 'Click an icon to copy its HTML.',
    'play.controls': 'Preview settings',
    'play.style': 'Style',
    'play.sticker': 'Sticker',
    'play.filled': 'Solid',
    'play.pixel': 'Pixel <small>beta</small>',
    'play.material': 'Material',
    'play.size': 'Size',

    'feat.title': 'Library contents',
    'feat.icons.t': '<span data-stat="icons">134</span> game UI icons',
    'feat.icons.d': 'Health, currency, gear, rewards, menus',
    'feat.materials.t': '<span data-stat="materials">10</span> material themes',
    'feat.names.t': '<span data-stat="aliases">814</span> aliases',

    'start.title': 'Get started',
    'start.more': 'ES modules · React · Canvas · AI in the docs →',

    'dl.title': 'Get it free',
    'dl.meta': 'v<span data-version>0.1.0</span> · ISC license',
    'dl.button': 'Download playglyph-<span data-version>0.1.0</span>.zip',
    'dl.github': 'View on GitHub',

  },
});
pgI18n.apply();
pgI18n.mountSwitch();
