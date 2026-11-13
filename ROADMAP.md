# Playglyph 다음 단계 기획

2026-11-09 작성, 2026-11-13 갱신. 아이콘을 계속 늘릴 때 무엇을 먼저 그리고 무엇을 만들지 정한다. 순서는 웹게임을 만드는 사람(그리고 AI)이 실제로 막히는 지점을 기준으로 정했다.

## 1. 지금 상태

- **아이콘 134종:** 모두 `filled`(단색)와 `sticker`(컬러) 두 스타일로 그렸다. `pixel`은 16종만 있는 실험 스타일이다. line 스타일은 2026-11-09에 지웠다.
- **카테고리 분포:** hud 32, control 27, menu 22, system 22, currency 9, input 7, social 7, combat 6, misc 2. 화면 조작과 HUD는 충분하다. 전투·소셜·아이템 쪽은 얇다.
- **재질 10종:** wood, stone, steel, gold, bronze, silver, lava, poison, arcane, holy. 세트 전체를 다시 칠한다.
- **별칭:** 814개. Lucide·Font Awesome·Material 이름과 게임 용어가 기존 아이콘으로 연결된다. 그래서 mana, xp, energy, inventory, craft, vip 같은 단어는 이미 그려진다.
- **Penpot 라이브러리:** Filled·Sticker 페이지에 컴포넌트 268개가 있다. `scripts/penpot/`로 Penpot에서 고친 내용을 `icons/`로 되돌린다.
- **보관된 아이콘:** `archive/icons/`에 9종(axe, bomb, castle, dice-d20, ghost, mushroom, pickaxe, portal, tree-pine)이 있다. 0.1.0 때부터 세트에서 빠져 있고, 뺀 이유는 기록에 없다.
- **배포:** npm에는 아직 올리지 않았다. 버전은 0.1.0이다. 스크립트와 llms.txt의 주소는 GitHub Pages(`https://fe4902.github.io/playglyph/dist/`)를 쓴다.
- **최근 정리 (2026-11-13):** 134종을 다시 검토해 6종(`trophy`, `joystick`, `leaderboard`, `rocket`, `languages`, `arrow-keys`)을 고쳤다. README를 다시 쓰고 `CONTRIBUTING.md`, `CHANGELOG.md`를 추가했다. 쓰지 않는 데모 자산과 샘플, 갤러리의 이전 스타일 표시 코드를 지웠다. 고친 6종은 아직 Penpot 컴포넌트에 반영하지 않았다.

## 2. 목표와 원칙

**목표:** 흔한 웹게임 화면(타이틀, HUD, 인벤토리, 상점, 결과, 설정)을 Playglyph 아이콘만으로 채울 수 있게 한다. 지금은 상태 이상, 장비 슬롯, 별점 결과 화면, 소셜 화면에서 대체할 아이콘이 없다.

**원칙**
- **새 의미만 추가한다.** 별칭으로 해결되는 단어는 그리지 않는다. 대신 별칭이 게임 맥락에서 틀린 경우는 고친다(7장).
- **레퍼런스를 먼저 본다.** Flaticon, Kenney Game Icons, RhosGFX에서 그 의미를 흔히 어떻게 그리는지 확인한 뒤 그린다.
- **세트로 검토한다.** 배치마다 새 아이콘을 기존 아이콘 사이에 섞어 놓고 네 가지를 본다. 톤, 24px에서 라벨 없이 알아보는지, 관례적인 형태인지, 시각 크기다. 크기는 16·24·48px, 어두운 배경과 밝은 배경에서 본다.
- **메타데이터도 함께 쓴다.** 아이콘마다 `description`, 별칭, 한국어 태그를 같이 쓴다. AI가 이름을 추측해도 맞도록 하기 위해서다.

## 3. 추가할 아이콘

### 1차: 게임 화면에서 바로 막히는 것 (16종)

| 이름 | 쓰임 | 카테고리 | 비고 |
| --- | --- | --- | --- |
| `star-empty` | 스테이지 결과 별점의 빈 칸 (★★☆) | hud | `heart-empty`와 같은 방식. 별점 화면 필수 |
| `star-half` | 평점, 절반 진행 | hud | `heart-half`와 짝 |
| `poison` | 독 상태 이상 | hud | `flame`(화상), `snowflake`(빙결)과 상태 이상 한 벌 |
| `stun` | 기절 (머리 위 별) | hud | 상태 이상 |
| `stat-up` | 버프, 능력치 상승 | hud | 지금은 `buff → sparkles`라 의미가 약함 |
| `stat-down` | 디버프, 능력치 하락 | hud | `stat-up`과 짝 |
| `revive` | 부활, 다시 하기(목숨 사용) | hud | 하트 + 되돌림 화살표 |
| `bomb` | 폭탄, 폭발 아이템 | combat | archive에서 다시 검토 |
| `boss` | 보스 스테이지, 강한 적 | combat | `skull`과 구분: 뿔이나 왕관 |
| `helmet` | 머리 장비 슬롯 | combat | 장비 슬롯 한 벌 |
| `armor` | 몸 장비 슬롯 | combat | 지금은 `armor → shield`. 갑옷 그림을 따로 둠 |
| `boots` | 신발 장비 슬롯, 이동 속도 | combat | 장비 슬롯 |
| `ring` | 반지 장비 슬롯 | combat | 지금은 `ring → bell`(울림). 7장 참고 |
| `filter` | 인벤토리·목록 필터 | control | 인벤토리 UI |
| `sort` | 정렬 | control | 인벤토리 UI |
| `loading` | 로딩, 대기 중 | system | 회전 표시. `hourglass`와 구분 |

### 2차: 장르별로 자주 쓰는 것 (15종)

| 이름 | 쓰임 | 카테고리 | 비고 |
| --- | --- | --- | --- |
| `amulet` | 목걸이 장비 슬롯 | combat | 장비 슬롯 마무리 |
| `axe` | 도끼 무기, 벌목 | combat | archive |
| `pickaxe` | 채굴 | combat | archive |
| `coins` | 동전 더미, 상점 묶음 상품 | currency | `coin` 한 개와 구분 |
| `exchange` | 교환, 환전 | currency | 화살표 두 개 |
| `spin-wheel` | 행운의 룰렛, 일일 보상 | currency | 모바일 게임에서 흔함 |
| `friend` | 친구 목록 | social | `users`(파티)와 구분 |
| `guild` | 길드, 클랜 | social | 깃발 문장 |
| `emote` | 감정 표현 | social | 웃는 얼굴 |
| `jump` | 모바일 가상 버튼: 점프 | input | 터치 조작 한 벌 |
| `dash` | 모바일 가상 버튼: 대시 | input | 터치 조작 |
| `interact` | 상호작용, 줍기 | input | 손 모양. 지금 `hand → pointer` |
| `sliders` | 상세 설정 (그래픽·조작) | system | 설정 하위 화면 |
| `signal` | 네트워크 상태, 핑 | system | 온라인 게임 |
| `battery` | 기기 배터리, 절전 | system | 모바일 HUD |

### 3차: 세계관·장식 (8종 이상)

| 이름 | 쓰임 | 카테고리 |
| --- | --- | --- |
| `castle` | 성, 월드맵 거점 | misc |
| `portal` | 포털, 이동 지점 | misc |
| `ghost` | 유령 적, 관전 모드 | combat |
| `mushroom` | 버섯 아이템, 숲 | misc |
| `tree-pine` | 나무, 자원 | misc |
| `dice-d20` | TRPG 주사위 | misc |
| `bookmark` | 즐겨찾기, 저장한 퀘스트 | menu |
| `event` | 이벤트, 축제 (폭죽) | currency |

3차에는 archive의 6종이 들어 있다. 다시 그리기 전에 왜 뺐는지부터 확인한다(7장).

## 4. 스타일·기능 확장

| 항목 | 내용 | 이유 |
| --- | --- | --- |
| 알림 배지 | `icon('mail', { badge: 3 })`처럼 빨간 점과 숫자를 얹는 옵션 | 메일·퀘스트·상점의 새 소식 표시는 게임 UI에서 매우 흔하다. 지금은 쓰는 사람이 직접 그린다 |
| 쿨다운 표시 | `cooldown: 0.4` → 스킬 아이콘 위에 원형으로 줄어드는 어두운 덮개 | 스킬 버튼마다 필요하다. 비활성(`state: 'disabled'`)과 같은 방식으로 넣을 수 있다 |
| 스프라이트 아틀라스 | 빌드할 때 PNG 아틀라스와 Phaser·Pixi용 JSON을 크기별(32·64·128)로 생성 | 엔진에서는 SVG보다 아틀라스가 편하다. `toCanvas`로 하나씩 그리는 것보다 빠르다 |
| pixel 확대 | 실험 16종 → HUD·재화 중심 40종. 그다음 정식 스타일 여부를 결정 | 도트 게임에서 수요가 있다. 134종 전체를 그리기 전에 반응을 본다 |
| Penpot 공유 라이브러리 | 지금 파일을 Penpot 공유 라이브러리로 발행하고, 디자이너용 사용법을 문서에 추가 | 디자이너가 화면 시안에 바로 쓰게 한다 |

## 5. 작업 방식

배치 하나는 8–12종으로 한다. 순서는 다음과 같다.

1. **레퍼런스 확인:** Flaticon(fill), Kenney, RhosGFX에서 같은 의미를 3개 이상 보고, 공통된 형태를 정한다.
2. **그리기:** 기본은 `scripts/draw-batch-*.mjs`에 `draw-lib` 규칙(외곽선 3.4, 부드러운 모서리 1.4, 하이라이트 한 개)으로 그린다. 형태를 눈으로 맞춰야 하는 미세 조정은 Penpot에서 한다.
3. **세트 검토:** `samples/review.html`에서 새 아이콘을 비슷한 기존 아이콘 사이에 놓고 16·24·48px, 어두운·밝은 배경, filled·sticker에서 확인한다. 문제가 있는 아이콘은 보고하기 전에 고친다.
4. **동기화와 빌드:** Penpot 컴포넌트를 추가하거나 교체하고(`importStyle`, `replace`), `sync.mjs --init`으로 기준을 맞춘다. `npm run build`의 검사와 크기 검사를 통과해야 끝난다.
5. **기록:** `ICON-REVIEW.md`에 관찰과 수정 내용을 남긴다.

## 6. 단계별 계획

| 단계 | 내용 | 끝났다고 보는 기준 |
| --- | --- | --- |
| 1 | 1차 아이콘 16종. 별칭 정리(7장) | 별점 결과 화면, 상태 이상 HUD, 장비 슬롯 4칸, 인벤토리 필터·정렬을 Playglyph만으로 만든 샘플 화면이 있다 |
| 2 | 2차 아이콘 15종. pixel 40종 | 소셜 화면과 모바일 터치 조작 샘플이 있다. pixel 정식화 여부를 결정한다 |
| 3 | 알림 배지, 쿨다운, 스프라이트 아틀라스 | 데모 게임 화면에서 세 기능을 쓴다. 타입 정의와 문서가 있다 |
| 4 | 0.2.0 npm 배포. 3차 아이콘 | CHANGELOG, llms.txt, 문서 사이트가 최신이다. 설치 후 바로 쓰는 예제가 동작한다 |

각 단계의 샘플 화면은 실제 게임 화면 구성으로 아이콘이 충분한지 확인하는 용도다. 단계를 마칠 때 샘플 화면을 보고 다음 단계의 목록을 조정한다.

## 7. 결정이 필요한 사항과 위험

- **어긋난 별칭:** `ring → bell`은 게임에서 반지 장비로 쓰일 때 종이 그려진다. `armor → shield`, `hand → pointer`, `buff → sparkles`도 새 아이콘이 생기면 그쪽으로 옮겨야 한다. 별칭을 옮기면 기존 코드의 그림이 바뀌므로 0.2.0 변경 기록에 적는다.
- **archive 9종:** 뺀 이유가 기록에 없다. 다시 그리기 전에 그때 무엇이 문제였는지(형태, 크기, 의미 중복) 확인한다.
- **카테고리:** `misc`에 2종뿐이다. 3차의 세계관 아이콘이 들어오면 `world`나 `items` 카테고리를 새로 만들지 결정한다. 카테고리 목록은 `scripts/build.mjs`에 고정돼 있어 추가하려면 코드도 바꿔야 한다.
- **pixel 정식화:** 134종을 모두 도트로 그리는 데 드는 비용이 크다. 2단계의 40종 반응을 보고 정한다.
- **배포 시점:** npm 배포 전까지는 호환을 깨는 변경이 자유롭다. 별칭 정리처럼 깨지는 변경은 0.2.0 전에 끝낸다.
- **Penpot 연결:** 플러그인 탭이 화면에 보이지 않으면 연결이 끊긴다. 큰 배치를 Penpot에 넣을 때는 Penpot 창을 띄워 둔 상태에서 작업한다.
