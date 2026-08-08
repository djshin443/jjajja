# legacy — 사용되지 않는 옛 코드 보관소

이 디렉터리의 파일들은 **index.html에서 로드되지 않는** 과거 버전 코드입니다.
참고용으로만 보관하며, 게임 동작에는 아무 영향이 없습니다.

| 파일 | 정체 |
|---|---|
| `english-game.js` | 여러 파일(main.js, opening.js, ending.js 등)로 분리되기 전의 단일 파일 통합 버전 |
| `boss-dialogue.js` | 보스 대화의 캔버스 연출 버전 (현재는 main.js의 DOM 방식 `showBossMessage` 사용) |
| `ending_landscape.js` | 대화형(클릭/자동재생) 엔딩 버전 (현재는 ending.js의 자동 스크롤 방식 사용) |
