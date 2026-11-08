// English for the intro page (index.html). Korean lives in the HTML; keys used from JS carry both.
pgI18n.add({
  ko: {
    'search.placeholder': '{n}개 아이콘 검색 — heart, 코인, 설정',
    'pg.default': '기본',
    'pg.pixelNote': '도트 스타일은 실험 중이라 {n}종만 있어요. 16×16 도안이라 16·32·48px처럼 정수 배율에서 또렷합니다.',
    'cat.hud': '상태·HUD', 'cat.currency': '재화·보상', 'cat.combat': '전투·행동', 'cat.menu': '메뉴', 'cat.system': '시스템',
    'cat.control': '진행 제어', 'cat.input': '입력', 'cat.social': '소셜', 'cat.misc': '기타',
    'hud.quest': '숲속의 작은 모험', 'hud.questStep': '숨겨진 보물 찾기 · 2 / 3', 'hud.location': '고요한 숲',
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
    'hud.quest': 'A Small Forest Adventure', 'hud.questStep': 'Find the hidden treasure · 2 / 3', 'hud.location': 'Quiet Forest',

    'hero.free': 'Free · ISC license',
    'hero.title': 'UI icons<br />for web games',
    'hero.lede': 'From health hearts, coins, gems and inventory all the way to the settings menu. Comes in solid and color sticker styles, with materials you can swap to match your game.',
    'cta.browse': 'Browse icons',
    'cta.docs': 'Docs',
    'cta.download': 'Download',
    'hero.facts': '<b data-stat="icons">134</b> icons · <b>3</b> styles · <b data-stat="materials">10</b> materials · <b>0</b> dependencies',

    'cmp.title': 'Same game, different icons.',
    'cmp.help': 'Drag the center bar left and right',
    'cmp.alt': 'Animated 2D pixel game with a walking character, slimes and coins',
    'cmp.lucideTag': 'icons',
    'cmp.playglyphTag': 'pixel icons',
    'cmp.slider': 'Compare Lucide and Playglyph icons',
    'cmp.caption': 'Same background, same layout. Only the icons changed.',
    'cmp.source': '2D pixel game · GIF demo',
    'cmp.sr': 'Compares health, coin, gem and gear icons. Use the left and right arrow keys to adjust. Home shows all Playglyph, End shows all Lucide.',

    'play.title': 'Try styles and materials',
    'play.desc': 'The same icons in solid, color sticker and pixel. One material repaints the whole set. Click an icon to copy its HTML.',
    'play.controls': 'Preview settings',
    'play.style': 'Style',
    'play.sticker': 'Sticker',
    'play.filled': 'Solid',
    'play.pixel': 'Pixel <small>beta</small>',
    'play.material': 'Material',
    'play.size': 'Size',

    'feat.title': "What's inside",
    'feat.icons.t': '<span data-stat="icons">134</span> game UI icons',
    'feat.icons.d': 'Full, half, empty and broken hearts, coins, gems, potions, rewards, daily check-ins and locked stages. Built around the game-screen icons that app icon sets leave out.',
    'feat.materials.t': '<span data-stat="materials">10</span> material themes',
    'feat.materials.d': 'wood, stone, steel, gold, bronze and silver, plus glowing lava, poison, arcane and holy. One option repaints the whole set.',
    'feat.names.t': 'The names you already know',
    'feat.names.d': '<span data-stat="aliases">814</span> names from Lucide, Font Awesome and Material work as aliases. An unknown name falls back to a "?" icon with suggestions, so the screen never breaks.',
    'feat.canvas.d': 'Turn icons into images once at load with <code>toImage</code> or <code>toCanvas</code>, then just <code>drawImage</code> every frame.',

    'start.title': 'Get started',
    'start.desc': 'One script, no build step. When the page loads, elements with <code>data-pg</code> turn into SVGs.',
    'start.more': 'ES modules · React · Canvas · AI in the docs →',

    'dl.title': 'Get it free',
    'dl.meta': 'v<span data-version>0.1.0</span> · ISC license — free for commercial games too. Just keep the copyright notice.',
    'dl.button': 'Download playglyph-<span data-version>0.1.0</span>.zip',
    'dl.note': 'SVG sources, ES modules, global script, React components, sprite, llms.txt',
    'dl.github': 'View on GitHub',

    'footer.compare': 'Comparison icons:',
    'footer.disclaimer': 'This comparison demo was made by Playglyph and is not affiliated with or endorsed by Lucide.',
  },
});
pgI18n.apply();
pgI18n.mountSwitch();
