# Playglyph에 기여하기

아이콘을 그리거나 고칠 때 필요한 내용입니다. 사용법은 [README.md](README.md)와 [문서](https://fe4902.github.io/playglyph/docs/)를 보세요.

현재 134종 모두 채운 단색(`filled`)과 스티커(`sticker`)로 그려져 있습니다.

아이콘은 `scripts/draw-batch-*.mjs`로 그립니다(공통 규칙은 `scripts/draw-lib.mjs`). 고친 뒤에는 해당 스크립트를 다시 실행하고 `npm run build`로 검사합니다.

## 로컬에서 보기

```bash
npm run preview
```

- 메인 · 2D 게임 아이콘 비교: `http://127.0.0.1:5178/`
- 갤러리: `http://127.0.0.1:5178/preview/`
- 문서: `http://localhost:5178/docs/`
- 세트 검토 보드: `http://localhost:5178/samples/review.html` (`?icons=a,b,c`, `?bg=light`, `?big=96`)
- 도트 검토 보드: `http://localhost:5178/samples/pixel-board.html`

## 원본 구조

```
icons/<name>.json          메타데이터: description, aliases, tags, tagsKo, categories
icons/filled/<name>.svg    채운 단색 (주 스타일)
icons/sticker/<name>.svg   컬러 스티커
pixel/<name>.pxl           도트 (실험적, 갤러리와 llms.txt에는 노출 안 함)
src/                       런타임 (core, sticker, lookup, materials, pixel, react)
scripts/build.mjs          검사 + dist 생성
scripts/draw-*.mjs         아이콘 생성 스크립트 (공통 규칙은 draw-lib.mjs)
scripts/size-check.mjs     채운 아이콘의 시각 크기 측정
scripts/penpot/            Penpot에서 고친 도안을 icons/로 되돌리는 도구
scripts/readme-assets.mjs  README 이미지(.github/assets/)를 dist/svg에서 다시 만듦
samples/                   검토 보드 (review.html, pixel-board.html)
archive/icons/             세트에서 뺀 예전 도안 9종 (ROADMAP 참고)
```

README에 들어가는 이미지는 `npm run build` 뒤에 `node scripts/readme-assets.mjs`로 다시 만듭니다.

## Penpot에서 고치기

Penpot 파일에 스타일마다 페이지가 있고(Filled, Sticker), 아이콘 하나가 24×24 컴포넌트 하나입니다. 레이어 순서는 SVG 원소 순서와 같습니다.

1. `node scripts/penpot/bridge.mjs`를 실행하고 Penpot MCP 플러그인을 연결합니다. 플러그인 탭이 가려지면 연결이 끊기니 Penpot 창을 화면에 둡니다.
2. `scripts/penpot/plugin.js`의 내용을 MCP `execute_code`로 한 번 실행합니다. 그다음 고친 아이콘을 `await storage.pg.stage('edit-1', ['coin'])`로 보냅니다(이름을 빼면 현재 페이지 전체).
3. `node scripts/penpot/sync.mjs edit-1`로 바뀐 아이콘을 확인하고, `--apply`로 `icons/`에 씁니다. 손대지 않은 레이어는 원본 줄을 그대로 두므로 git diff에는 고친 줄만 나옵니다. 마지막으로 `npm run build`로 검사합니다.

- 스티커 색 역할은 레이어에 붙어 따라갑니다. 새로 그린 레이어는 이름(`outline`, `shadow`, `base`, `light`, `shine`, `alt-*`)으로 역할을 정합니다.
- 획은 가운데 정렬, 단색만 씁니다. 그림자·블러·그라디언트는 원본 형식에 담을 수 없어 동기화가 거부합니다.
- `scripts/draw-batch-*.mjs`로 만든 아이콘이면 같은 수정을 스크립트에도 옮깁니다. 그러지 않으면 스크립트를 다시 실행할 때 수정이 덮어써집니다.
- 처음 가져올 때는 `storage.pg.importStyle('filled')`로 페이지를 만들고 `stage('baseline')`을 보낸 뒤 `node scripts/penpot/sync.mjs --init`을 실행합니다.
- 생성 스크립트로 다시 그린 아이콘은 `icons/`에 쓴 뒤 `storage.pg.replace(board, style, svg)`로 Penpot 컴포넌트를 바꿉니다. 그다음 `stage('baseline', [이름])`을 보내고 `sync.mjs --init`으로 기준을 맞춥니다.

## 그리기 규칙

빌드(`npm run check`)가 검사하는 것:

- **filled:** `viewBox="0 0 24 24"`, 루트 `fill="currentColor"`. 자식의 fill·stroke는 `currentColor` 또는 `none`만. `transform`·`style`·`class`·`id` 금지
- **sticker:** `viewBox="0 0 24 24"`. 색은 역할로 지정합니다. `data-fill` / `data-stroke`에 `outline | shadow | base | light | shine` (보조 재질은 `alt-` 접두사). 역할이 없는 색은 고정색(`#rrggbb`)으로 남습니다. 루트의 `data-materials="steel gold"`가 기본 재질
- **메타:** `description` 필수(80자 이하, "언제 쓰는지"), 카테고리 1개, 이름·별칭은 전체에서 겹치면 안 됨
- **크기 (경고만):** 채운 아이콘의 크기 상자, 칠해진 면적, 무게중심을 재서 세트에서 튀는 아이콘을 알려 줍니다. 빌드는 멈추지 않습니다. 전체 표는 `node scripts/size-check.mjs`로 봅니다.

검사하지 않지만 지킬 것:

- 스티커는 외곽선 → 그림자 → 위·왼쪽으로 0.5 옮긴 본면 → 흰 하이라이트 순서. 빛은 좌상단에서
- 꺼짐(`*-off`) 스티커는 하이라이트를 빨간 사선 아래에 그리고, 사선 중심선에서 2.6 이상 떨어뜨립니다. 사선에 닿으면 사선에 흰 흠집이 난 것처럼 보입니다
- 스티커 외곽선(3.4)까지 24×24 안에 들어오게
- 24px에서 실루엣만 보고도 무엇인지 알 수 있게
- 컬러 도안을 한 색으로 채웠을 때 형태가 뭉개지면 `.pxl` 끝에 `@mono`를 추가하고 같은 크기의 단색 도안을 그립니다. `1`은 채움, `.`은 투명입니다.
- 24×24 정사각형 안에서 실제 크기로 보고 시각적 중심을 맞추기. 재생처럼 비대칭인 도형은 좌우 여백과 면적을 함께 보고 위치를 보정

### 같은 카테고리의 아이콘 맞추기

- 같은 테마와 카테고리에서 함께 쓰는 아이콘은 하나의 스타일로 그립니다. 선 굵기, 모서리의 둥근 정도, 체감 크기, 디테일 밀도를 맞춥니다.
- 컬러 아이콘은 빛의 방향, 그림자 깊이, 명암 단계와 하이라이트 강도를 맞춥니다. 같은 금속이라면 같은 팔레트를 쓰고, 다른 재질이나 상태를 구분하는 데 필요한 색은 유지합니다.
- 켬·끔처럼 짝을 이루는 아이콘은 기본 도형의 크기와 위치를 공유합니다. 상태 표식을 추가한 뒤에도 두 아이콘을 번갈아 봤을 때 중심이 움직여 보이지 않게 조정합니다.
- 갤러리에서 같은 카테고리, 스타일, 재질을 선택해 24px로 나란히 비교합니다. 새 아이콘은 `samples/review.html`에서 기존 아이콘 사이에 섞어 16·24·48px로 봅니다.

## 이름 규칙 (AI가 맞히기 쉽게)

- Lucide와 겹치는 개념은 Lucide 이름을 따릅니다 (`settings`, `volume-2`, `volume-x`, `pause`)
- 켬/끔은 `-off` 접미사 쌍 (`music` / `music-off`)
- 흔히 쓰는 다른 이름은 별칭으로 (`mute`, `retry`, `inventory`, `bgm`)
