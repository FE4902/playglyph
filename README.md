# Playglyph

**웹게임용 게임 UI 아이콘 라이브러리**입니다. AI가 웹게임을 만들 때 그대로 가져다 쓰도록 만들었습니다. Lucide나 Font Awesome 같은 앱 아이콘 세트에는 없는 체력 하트(꽉 찬·반·빈·깨진 하트), 동전, 보석, 에너지, 물약, 보상, 출석, 광고 보기, 잠긴 스테이지 같은 게임 화면 아이콘이 중심이고, 설정·소리·일시정지·메뉴 같은 기본 아이콘도 함께 들어 있습니다.

- **바로 게임처럼 보이는 스티커 스타일:** `sticker`는 두꺼운 외곽선과 명암이 있는 컬러 아이콘입니다. `filled`(꽉 채운 단색)도 있습니다.
- **재질로 테마 맞추기:** 아이콘 세트 전체를 게임 분위기에 맞춰 다시 칠합니다. wood, stone, steel, gold, bronze, silver, lava, poison, arcane, holy (뒤의 네 개는 빛남)
- **AI 친화:** Lucide·Font Awesome·Material 이름이 별칭으로 그대로 통합니다(`trash-2`, `xmark`, `floppy-disk`, `play_arrow`). 대소문자·구분자는 무시하고, 없는 이름은 "?" 아이콘과 비슷한 이름 제안으로 처리해서 화면이 깨지지 않습니다. `llms.txt` 포함
- **게임 엔진용 도구:** 캔버스·Phaser·Pixi에 넣을 이미지로 바꾸는 `toImage` / `toCanvas`, 비활성·잠김 상태 표현

> 현재 134종 모두 채운 단색과 스티커로 그려져 있습니다. 이전 선 스타일(`icons/line/`)은 새 아이콘이 아직 그려지지 않았을 때의 대체용으로만 남아 있습니다.
>
> 아이콘은 `scripts/draw-batch-*.mjs`로 그립니다(공통 규칙은 `scripts/draw-lib.mjs`). 고친 뒤에는 해당 스크립트를 다시 실행하고 `npm run build`로 검사합니다.

## 빠르게 보기

```bash
npm run preview
```

- 메인 · 2D 게임 아이콘 비교: `http://127.0.0.1:5178/`
- 갤러리: `http://127.0.0.1:5178/preview/`
- HTML 한 파일 예제: `http://localhost:5178/examples/single-file.html`
- 스타일 비교 샘플: `http://localhost:5178/samples/compare.html`

## 사용법

### HTML 한 파일 (빌드 없음)

```html
<script src="https://cdn.jsdelivr.net/npm/playglyph/dist/playglyph.js"></script>

<i data-pg="settings"></i>
<i data-pg="coin" data-style="sticker" data-size="32"></i>
<i data-pg="settings" data-style="sticker" data-material="wood" data-border="#fff"></i>
```

페이지가 로드되면 `data-pg`가 붙은 요소가 SVG로 바뀝니다. 나중에 요소를 추가했다면 `playglyph.createIcons()`를 다시 부르세요.

요소별 옵션: `data-style`(filled | sticker), `data-material`, `data-secondary`, `data-size`, `data-color`, `data-state`(disabled | locked), `data-border`(스티커 테두리 색)

자바스크립트 없이 이미지로: `<img src=".../dist/svg/sticker/gold/coin.svg">`

### ES 모듈 (트리셰이킹)

```js
import { Settings, Pause, toSvg } from 'playglyph';          // filled
import { Coin, renderSticker } from 'playglyph/sticker';     // sticker
import { wood, gold } from 'playglyph/materials';

el.innerHTML = toSvg(Pause, { size: 24, color: '#fff' });
el.innerHTML = renderSticker(Coin, { material: gold, size: 48, border: '#fff' });
```

이름으로 찾기(트리셰이킹 안 됨): `import { icon } from 'playglyph/lookup'` → `icon('gear', { style: 'sticker' })`

### React

```jsx
import { Settings, Gear, PauseIcon } from 'playglyph/react';   // filled
<Settings size={24} color="white" />
```

### Canvas / 게임 엔진

```js
// 로딩 때 한 번 이미지로 만들고, 매 프레임에는 drawImage만
const coin = await playglyph.stickerToImage(playglyph.getIcon('coin', 'sticker'), { size: 64 });
ctx.drawImage(coin, x, y, 32, 32);

const pause = await toCanvas(Pause, { size: 32, color: '#fff' });   // filled
this.textures.addCanvas('pause', pause);                            // Phaser
```

### 단색 도트

도트 아이콘은 기본으로 재질 색을 사용합니다. `shading: 'mono'`를 지정하면 한 색으로 그립니다. 하트나 코인처럼 단색에서 형태가 뭉개지는 아이콘은 전용 도안을 사용합니다. 기본색은 흰색이며, 아래와 같이 원하는 색을 지정할 수 있습니다. 16×16 도안은 32px, 48px처럼 정수 배율에서 또렷하게 보입니다.

```html
<i data-pg="heart" data-style="pixel" data-shading="mono" data-color="#54e0ba" data-size="32"></i>
```

```js
import { Heart, renderPixel } from 'playglyph/pixel';

el.innerHTML = renderPixel(Heart, { shading: 'mono', color: '#54e0ba', size: 32 });
```

같은 `shading`과 `color` 옵션을 `drawPixel()`과 `pixelToCanvas()`에도 쓸 수 있습니다.

## 원본 구조

```
icons/<name>.json          메타데이터: description, aliases, tags, tagsKo, categories
icons/filled/<name>.svg    채운 단색 (주 스타일)
icons/sticker/<name>.svg   컬러 스티커
icons/line/<name>.svg      이전 선 스타일 — filled가 그려지기 전까지 대체용
pixel/<name>.pxl           도트 (실험적, 갤러리와 llms.txt에는 노출 안 함)
src/                       런타임 (core, sticker, lookup, materials, pixel, react)
scripts/build.mjs          검사 + dist 생성
```

## 그리기 규칙

빌드(`npm run check`)가 검사하는 것:

- **filled:** `viewBox="0 0 24 24"`, 루트 `fill="currentColor"`. 자식의 fill·stroke는 `currentColor` 또는 `none`만. `transform`·`style`·`class`·`id` 금지
- **sticker:** `viewBox="0 0 24 24"`. 색은 역할로 지정합니다. `data-fill` / `data-stroke`에 `outline | shadow | base | light | shine` (보조 재질은 `alt-` 접두사). 역할이 없는 색은 고정색(`#rrggbb`)으로 남습니다. 루트의 `data-materials="steel gold"`가 기본 재질
- **메타:** `description` 필수(80자 이하, "언제 쓰는지"), 카테고리 1개, 이름·별칭은 전체에서 겹치면 안 됨
- **크기 (경고만):** 채운 아이콘의 크기 상자, 칠해진 면적, 무게중심을 재서 세트에서 튀는 아이콘을 알려 줍니다. 빌드는 멈추지 않습니다. 전체 표는 `node scripts/size-check.mjs`로 봅니다.

검사하지 않지만 지킬 것:

- 스티커는 외곽선 → 그림자 → 위·왼쪽으로 0.5 옮긴 본면 → 흰 하이라이트 순서. 빛은 좌상단에서
- 스티커 외곽선(3.4)까지 24×24 안에 들어오게
- 24px에서 실루엣만 보고도 무엇인지 알 수 있게
- 컬러 도안을 한 색으로 채웠을 때 형태가 뭉개지면 `.pxl` 끝에 `@mono`를 추가하고 같은 크기의 단색 도안을 그립니다. `1`은 채움, `.`은 투명입니다.
- 24×24 정사각형 안에서 실제 크기로 보고 시각적 중심을 맞추기. 재생처럼 비대칭인 도형은 좌우 여백과 면적을 함께 보고 위치를 보정

### 같은 카테고리의 아이콘 맞추기

- 같은 테마와 카테고리에서 함께 쓰는 아이콘은 하나의 스타일로 그립니다. 선 굵기, 모서리의 둥근 정도, 체감 크기, 디테일 밀도를 맞춥니다.
- 컬러 아이콘은 빛의 방향, 그림자 깊이, 명암 단계와 하이라이트 강도를 맞춥니다. 같은 금속이라면 같은 팔레트를 쓰고, 다른 재질이나 상태를 구분하는 데 필요한 색은 유지합니다.
- 켬·끔처럼 짝을 이루는 아이콘은 기본 도형의 크기와 위치를 공유합니다. 상태 표식을 추가한 뒤에도 두 아이콘을 번갈아 봤을 때 중심이 움직여 보이지 않게 조정합니다.
- 갤러리에서 같은 카테고리, 스타일, 재질을 선택해 24px로 나란히 비교합니다. 대체 표시되는 아이콘은 해당 스타일의 아트가 채워질 때까지 별도로 표시합니다.

## 이름 규칙 (AI가 맞히기 쉽게)

- Lucide와 겹치는 개념은 Lucide 이름을 따릅니다 (`settings`, `volume-2`, `volume-x`, `pause`)
- 켬/끔은 `-off` 접미사 쌍 (`music` / `music-off`)
- 흔히 쓰는 다른 이름은 별칭으로 (`mute`, `retry`, `inventory`, `bgm`)

외부 의존성은 없습니다 (React는 선택적 peer dependency).
