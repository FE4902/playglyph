# Playglyph 아이콘 확장 기획서

2026-11-09 · 제안

## 목표

다음 확장은 **전리품 획득 → 가방 정리 → 장비 교체 → 수리·분해**에 필요한 아이콘을 채운다. 현재 134종은 Filled와 Sticker로 제공된다. 기존 `backpack`, `treasure-chest`, `sword`, `shield`, `anvil`을 화면에 배치하고, 새 아이콘으로 그 화면에서 할 수 있는 행동을 구분한다.

첫 출시 범위는 신규 8종, Filled와 Sticker 합계 16개 SVG다. 앞의 4종을 먼저 그려 한 화면에 배치하고, 검수 결과를 나머지 4종에 반영한다. Line은 종료된 스타일로 둔다.

## 방향 비교

| 방향 | 채우는 빈틈 | 순서 |
|---|---|---|
| 전리품·인벤토리 | 현재 가방이나 상자 아이콘으로 표현하기 어려운 줍기, 장착, 스택 나누기 등 | **1차.** 기존 자산과 조합해 인벤토리 화면 하나를 바로 구성할 수 있다. |
| 전투 상태 효과 | 플레이어·적 HUD에 여러 상태가 동시에 뜰 때의 구분 | 2차 후보. 기존 불꽃·눈송이·하트와 겹치는 의미를 먼저 정리한다. |
| 조작 안내 | 기기 아이콘에서 실제 키, 버튼, 길게 누르기로 확장 | 3차 후보. 키캡 위에 텍스트를 얹는 방식을 먼저 검증하면 키마다 SVG를 추가할 필요가 없다. |

## 1차 제작 목록

아래 이름은 현재 저장소의 아이콘 이름 및 별칭과 겹치지 않는 후보이며, 신규 8종은 기존 `menu` 카테고리로 시작한다.

| 순서 | 이름 | 쓰이는 장면 | 24px 실루엣과 비교 대상 |
|---|---|---|---|
| 시안 1 | `loot-pickup` | 필드에서 떨어진 전리품을 줍는 버튼 | 손바닥 위 작은 마름모. `pointer`의 위로 뻗은 검지와 달리 손바닥을 가로로 펼친다. `treasure-chest`는 보상 출처를 표시할 때 함께 쓴다. |
| 시안 2 | `equip` | 아이템 상세 카드에서 장착 | 한쪽이 열린 장비 슬롯과 안으로 들어가는 화살표. 슬롯의 빈 공간을 확보해 단독 화살표와 구분한다. |
| 시안 3 | `stack-split` | 같은 아이템 묶음을 두 슬롯에 나눔 | 한 덩어리가 두 덩어리로 벌어지는 형태. 수량은 UI에서 표시하고, `copy`의 겹친 사각형과 헷갈리지 않게 덩어리 사이를 띄운다. |
| 시안 4 | `repair` | 장비 내구도 회복 | 짧은 망치 머리와 수리 지점의 작은 반짝임. 24px에서 기존 `hammer`와 구분되는지 먼저 확인한다. |
| 확장 1 | `unequip` | 장비 슬롯에서 가방으로 돌려보냄 | `equip`과 같은 슬롯과 화살표 굵기. 화살표 방향을 바꾸고 슬롯 기준 위치를 공유한다. |
| 확장 2 | `inventory-sort` | 가방 목록의 정렬 방식 변경 | 길이가 단계적으로 다른 세 줄과 정렬 방향 표시. `list`와 나란히 놓고 식별성을 확인한다. |
| 확장 3 | `recipe-book` | 제작에 필요한 재료와 수량 확인 | 책 한쪽에 재료 슬롯을 크게 하나 둔다. `book-open`과 구분되도록 책보다 슬롯을 먼저 읽을 수 있게 한다. |
| 확장 4 | `salvage` | 장비를 분해해 재료로 회수 | 한 조각의 장비와 떨어져 나온 재료 두 조각. `trash-2`를 쓰는 버리기와 결과가 다르므로 휴지통 실루엣은 피한다. |

검수 장면은 세 개면 충분하다. 필드에서는 `loot-pickup`을 전리품 위에, 가방에서는 `inventory-sort`와 `stack-split`을 목록과 스택 메뉴에, 장비 카드에서는 `equip`·`unequip`·`repair`·`salvage`를 상태에 맞게 배치한다. `recipe-book`은 기존 `anvil`로 여는 제작 화면에서 확인한다. 수량, 비용, 내구도, 희귀도는 화면의 텍스트나 배지로 처리한다.

## 그리기와 완료 기준

1. **Filled 먼저.** 기존 자산 옆에 24px로 놓고 실루엣과 시각적 중심을 맞춘다. 16px에서 복잡한 표식이 뭉치는지도 보되 24px을 합격 기준으로 삼는다.
2. **Sticker 적용.** 같은 실루엣에 기존 좌상단 광원과 재질 역할을 적용한다. 외곽선까지 24×24에 들어오게 하고, 밝은 배경과 어두운 배경에서 확인한다. 기본 재질 외에 wood나 gold를 적용해도 장착 방향과 분해 여부가 실루엣으로 구분돼야 한다.
3. **혼동하는 쌍 우선 확인.** 이름 없이 `equip` / `unequip`, `stack-split` / `copy`, `repair` / `hammer`, `salvage` / `trash-2`를 실제 크기로 비교한다. 두 번 봐야 구분되면 색을 바꾸기 전에 기본 도형을 고친다.
4. **저장소와 Penpot 대조.** 8개 이름마다 `icons/<name>.json`과 두 스타일 SVG를 추가하고, 생성 스크립트를 사용한 경우 원본도 함께 관리한다. `npm run check`로 이름 충돌과 SVG 규칙을 검사한다. Penpot의 Filled·Sticker 페이지에는 스타일마다 신규 컴포넌트 8개가 한 번씩 들어가야 한다. 134종 기준으로 출시 후 목표는 스타일당 142종이다. [저장소 그리기 및 동기화 규칙](../../../CONTRIBUTING.md#penpot에서-고치기)

## 후속 후보

- **전투 HUD.** `poisoned`, `stunned`, `bleeding`을 먼저 검토한다. 독은 기포가 있는 방울, 기절은 머리 위 별, 출혈은 상처에서 떨어지는 방울처럼 서로 다른 형태로 잡는다. 현재 `frozen`은 `snowflake`의 별칭이다. `burning`과 `regeneration`도 기존 `flame`과 `heart-plus`를 실제 HUD에서 써 본 뒤 전용 형태가 필요한지 판단한다. [Terraria 디버프 도감](https://terraria.wiki.gg/wiki/Category:Debuff_images)
- **조작 안내.** 빈 `keycap`, `mouse-left`, `mouse-right`, `press-and-hold`부터 검토한다. 키캡 위의 `E`나 `Space`는 UI 텍스트로 얹고 길게 누르기의 진행도는 UI에서 그린다. `tap`과 `drag`는 이미 각각 `pointer`, `move`로 연결되므로, 제스처 전용 그림이 필요한 화면이 생기면 이름을 따로 정한다. [Kenney Input Prompts 가이드](https://kenney.nl/knowledge-base/game-assets-2d/using-input-prompts)
- **결과·보상 화면.** `reward-claim`, `take-all`, `next-stage`, `revive`를 후보로 둔다. 기존 `gift`, `treasure-chest`, `trophy`, `restart`와 조합해 승리·실패 패널을 먼저 구성하면 어떤 행동에 새 그림이 필요한지 확인할 수 있다. `retry`와 `stage-select`는 이미 `restart`와 `layout-grid`의 별칭이다. [Hades 보상 수령·결과 UI 사례](https://www.supergiantgames.com/blog/hades-the-nighty-night-update-patch-notes/)

## 참고 화면

- [Minecraft 제작 가이드](https://www.minecraft.net/en-us/article/how-craft)에서 장비 슬롯, 인벤토리, 레시피북, 제작 결과 슬롯의 역할 구분을 본다.
- [Kenney RPG UI Pack](https://kenney.nl/assets/ui-pack-rpg-expansion)에서 슬롯과 패널 위에 작은 기호를 배치하는 방식을 본다.
- [Hades UI 변경 기록](https://www.supergiantgames.com/blog/hades-the-nighty-night-update-patch-notes/)에서 방을 떠나기 전에 보상을 받도록 안내하는 사례를 참고한다.
