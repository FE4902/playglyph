# 변경 기록

## 배포 전 (0.2.0 예정)

### 호환이 깨지는 변경

- line 스타일을 지웠다. `playglyph/line` 내보내기와 `getIcon(name, 'line')`이 없어졌다. `style: 'line'`이나 `'outline'`을 넘기면 filled로 그린다.

### 바뀐 것

- 다시 그린 아이콘: `swords`, `treasure-chest`(filled), `bow-arrow`, `trophy`, `joystick`, `rocket`.
- 결함 수정: `languages`(filled)의 원 양옆 돌기, `leaderboard`·`arrow-keys`(sticker)의 겹친 하이라이트, `bell-off`·`eye-off`·`wifi-off`(sticker)의 사선 위 하이라이트, `wifi-off`(filled)의 남은 조각.
- 아이콘 갤러리(`preview/`)를 다시 만들었다. 왼쪽에 스타일·재질·크기·카테고리, 가운데에 아이콘 격자가 있고, 아이콘을 고르면 아래 서랍에 상세가 열린다. 주소로 아이콘을 가리킬 수 있다(`?icon=trophy&material=gold`).
- 로고를 스티커 스타일의 재생 표시 타일로 바꿨다(헤더, 파비콘). 헤더의 언어 선택과 테마 버튼은 테두리 없는 조용한 컨트롤로 맞췄다.
- 메인 페이지를 정리했다. 히어로의 아이콘 시트는 기울임과 빛 번짐을 빼고 인벤토리 칸으로 그렸고, 배지와 세 번째 버튼을 뺐다. 구성 카드는 목록으로 바꿨다.
- `llms.txt`와 갤러리의 예제 주소가 GitHub Pages를 가리킨다. 이전의 jsdelivr 주소는 npm 공개 전이라 동작하지 않았다.

### 추가된 것

- `StickerOptions`와 `LookupOptions` 타입에 `border`(스티커 테두리 색)가 들어갔다. 실행 시에는 이미 동작하던 옵션이다.
- 한국어·영어 사이트와 문서 페이지, 영어 README.
- Penpot에서 고친 도안을 `icons/`로 되돌리는 도구(`scripts/penpot/`).

## 0.1.0

첫 버전. 아이콘 134종(filled, sticker), 도트 16종(실험적), 재질 10종, 별칭, `llms.txt`.
