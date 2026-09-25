# [비플레인] 디자인 분석표
<!-- 디자인 분석표는 화면, 공통 영역, 색·폰트·간격 같은 토큰, 화면 상태를 눈으로 확인해 적는 문서입니다. -->
## 확인한 자료
<!-- //.디자인 원본은 피그마에서 디자인을 섹션으로 감싼것을 예제 프롬프트 복사하여 올림-->
- 디자인 원본: [https://www.figma.com/design/czX98xxkHXsWcyFj4krR8S/%EB%B0%95%ED%9A%A8%EC%A0%95?node-id=2349-1071&m=dev] (node "wrap", 1920x13146)
- 확인한 화면: [헤더 히어로, 소개 이동 바(category 인스턴스), 녹두라인 제품(line), 장점(merit), 소개(introduction tit1/tit2), 푸터(footer)]
- 실제 에셋 위치: [./assets] (하위 img 폴더 없음, 파일이 assets 바로 아래 위치)
- 구현 파일: index.html, styles.css, script.js (React/Tailwind로 온 Figma 코드는 참고만 하고 순수 HTML/CSS/JS로 변환)

## 화면 목록

| 화면 | 목적 | 주요 행동 | 필요한 상태 |
|---|---|---|---|
| beplain 녹두라인 랜딩(wrap) | 녹두라인 제품과 브랜드를 소개 | 캐러셀 이전/다음, 소개 앵커 이동, 맨 위로 이동, 공식몰 이동 | 캐러셀 스크롤 위치, 반응형(360/768/1280) |

## 공통 영역

- 헤더: 초록 배경 히어로 + "beplain" 3D 로고, 장식 별/구슬
- 소개 이동 바: 반투명 알약형 바, 좌측 로고 + 우측 "소개" 버튼(#story로 이동)
- 푸터: "beplain으로 바로가기"(외부 링크) 버튼 + 맨 위로 이동 버튼
- 공통 카드: 장점(point) 카드 3종, 소개(story) 말풍선 카드 여러 종 (색상만 다름)

## 디자인 토큰

- 배경색: `linear-gradient(180deg, #7FDE25 17.79%, #2D9838 100%)` (페이지 전체), 푸터 하단은 `#156012`로 더 어두워짐
- 본문색: `#7FDE26` (헤더 히어로 솔리드 배경)
- 강조색: 노랑 #ECF319 / #EDFF62, 라임 카드 #D9FB5F·#E2FFA2, 포인트별 초록 #00A44A/#28C25B, 파랑 #1B53FF/#4774FF, 핑크 #ED3385/#FF7BB5
- 제목 폰트: **[KIM]WILDgag Bold**(Figma 원본, 라이선스 파일 없음) → **Black Han Sans**(Google Fonts)로 대체. 굵고 각진 인상을 우선했으며 정확히 동일하지 않음
- 본문 폰트: Pretendard (jsDelivr CDN, Figma와 동일 폰트), "&" 강조 글자는 PT Sans Bold
- 본문 크기: 원본 96~128px(desktop 포스터 기준) → clamp()로 유동 축소
- 라운드: 카드 32~40px, 버튼 60~150px(알약형)

## 반응형

- 360px: 소개 말풍선과 장점 카드를 1열로 재배치하고 장식 이미지는 축소하여 유지
- 768px: 1920px 원본 프레임의 좌표와 종횡비를 비례 축소
- 1280px: 1920px 원본 프레임의 좌표와 종횡비를 비례 축소
- 360/768/1280에서 Chrome headless 전체 페이지 렌더링으로 잘림과 겹침을 시각 확인

## 인터랙션

- 소개 이동 바: `#story`로 앵커 이동 (스크롤 애니메이션은 `scroll-behavior:smooth`)
- 캐러셀: 한 제품씩 중앙 노출, 이전/다음 버튼·키보드 방향키·포인터 드래그/스와이프 지원
- 맨 위로 이동 버튼: `window.scrollTo({top:0})` 동작 확인됨
- 애니메이션: 디자인에 스크롤 트리거 모션이 명시되어 있지 않아 추가하지 않음

## 에셋

- 로고(작은 nav용): assets/logo.svg
- beplain 3D 워드마크(헤더 히어로용): assets/beplain-wordmark.png — **Figma에 로컬 매칭 파일이 없어 `download_assets`로 신규 다운로드**
- 홀로그램 별: assets/pink3d.png (헤더/merit/story에서 반복 사용되는 여러 Star 노드에 공통 재사용)
- 유리구슬: assets/yellow3d.png
- 8각 별: assets/starwhite.png, starhotpink.png, starpink.png, startyellow.png
- 뱃지: assets/scalloped.png, 콩 마스코트: assets/been.png
- 소개 1번 프레임 말풍선(Figma 원본 SVG): assets/story_speech_pink_primary_figma.svg, story_speech_lime_figma.svg, story_speech_pink_secondary_figma.svg
- 소개 1번 프레임 장식(Figma 원본): assets/story_bean_figma.svg, story_star_pink_figma.svg, story_star_yellow_figma.svg, story_ball_figma.png, story_holo_figma.png
- 소개 2번 프레임 말풍선: assets/bubble_green1.png, bubble_green2.png, bubble_blue.png
- 장점 카드 배경 블롭: assets/point1.png, point2.png, point3.png
- 리본: assets/ribbon1.png, ribbon2.png / 화살표: assets/arrow-up.png
- 제품 사진(캐러셀 9종): assets/클렌징폼.png, 클렌징오일.png, 클렌징워터.png, 클렌징밤.png, 클렌징밀크밤.png, 세럼.png, 수딩크림.png, 토너.png, 패드.png
- 폰트: Jua·PT Sans(Google Fonts), Pretendard(jsDelivr CDN)

## 확인된 사실

- 기존 index.html/styles.css는 전혀 다른 "베스트샐러" 화면(다른 배경/톤)이었음 → 사용자 확인 후 이 브랜드 랜딩으로 전체 교체
- assets 폴더에 img 하위 폴더는 없고 파일이 바로 assets 아래 있음(초기 탐색 시 인코딩 문제로 혼동 있었음, PowerShell로 확인)
- Figma의 여러 Star/holo 이미지 노드가 동일한 소스 이미지를 재사용하고 있어, 로컬에서도 pink3d.png/yellow3d.png를 여러 위치에 재사용함
- 설치된 Chrome의 headless 렌더링으로 데스크톱(1280)/태블릿(768)/모바일(360) 전체 페이지 스크린샷을 확인함

## 아직 확인하지 못한 내용

- "[KIM]Wildgag" 원본 폰트 파일이 없어 Jua로 대체함 — 원본 폰트 파일(라이선스)이 있다면 교체 필요
- Figma의 정확한 픽셀 좌표(회전된 별/리본 등 장식 요소)는 1920px 데스크톱 포스터 기준이라, 모바일/태블릿에서는 배치를 단순화함 — 디자이너 확인 시 세부 위치 조정 가능
- "소개" 버튼이 페이지 내 앵커(#story)인지, 별도 페이지/외부 링크인지는 Figma 상 단일 상태만 확인되어 앵커로 가정함
