---
name: 놀AI
description: 10~13세가 AI 작동 원리를 손으로 만지는 놀이터 — 팝 캔디 톤의 디자인 시스템(빌드 기준 기록)
colors:
  ink: "#1f2430"
  cream: "#fff3d6"
  paper: "#fffdf6"
  candy-red: "#ff6b6b"
  candy-teal: "#4ecdc4"
  candy-yellow: "#ffd93d"
  muted: "#736b5a"
typography:
  display:
    fontFamily: "Pretendard Variable, system-ui, sans-serif"
    fontSize: "2.25rem → 3rem(lg) → 3.75rem(xl)"
    fontWeight: 900
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Pretendard Variable, system-ui, sans-serif"
    fontSize: "1.875rem → 2.25rem/3rem(lg)"
    fontWeight: 900
    lineHeight: 1.25
  title:
    fontFamily: "Pretendard Variable, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 900
  body:
    fontFamily: "Pretendard Variable, system-ui, sans-serif"
    fontSize: "1rem / 1.125rem(랜딩 본문)"
    fontWeight: 700
  label:
    fontFamily: "Pretendard Variable, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 800
  mono:
    fontFamily: "ui-monospace, monospace"
    fontWeight: 900
rounded:
  pop: "14px"
  thumb: "10px / 12px"
  pill: "9999px"
spacing:
  stack-sm: "12px"
  stack-md: "16px"
  stack-lg: "24px"
  gutter: "20px"
  section-y: "56px / 80px(lg)"
components:
  button-primary:
    backgroundColor: "{colors.candy-red}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pop}"
    padding: "8px 20px"
  button-cta:
    backgroundColor: "{colors.candy-red}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pop}"
    padding: "12px 24px"
  button-nav-start:
    backgroundColor: "{colors.candy-yellow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pop}"
    padding: "8px 16px"
  button-choice:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pop}"
    padding: "8px 16px"
  button-choice-selected:
    backgroundColor: "{colors.candy-teal}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pop}"
    padding: "8px 16px"
  speech-bubble:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pop}"
    padding: "12px 16px"
  card-lesson:
    backgroundColor: "{colors.candy-red}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pop}"
    padding: "8px 16px 8px 8px"
  card-lesson-next:
    backgroundColor: "{colors.candy-yellow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pop}"
    padding: "8px 16px 8px 8px"
  card-lesson-done:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pop}"
    padding: "8px 16px 8px 8px"
  word-chip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  stage:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.pop}"
---

# Design System: 놀AI

<!-- 빌드된 코드에서 추출한 기록(2026-08-30). 의도가 아니라 실제 값. 기준 파일: frontend/app/globals.css -->

## Overview

**Creative North Star: "팝 캔디 — 스티커 판 위의 로봇 노리"**

모든 면은 종이(크림·페이퍼)이고, 그 위에 남색 굵은 선으로 그린 스티커가 붙어 있다. 스티커는 아래로 딱 떨어지는 단색 그림자를 갖고, 손가락으로 누르면 그림자만큼 내려가 판에 붙는다(`globals.css` `button:active`). 색은 코랄·민트·노랑 셋뿐이고, 랜딩에서는 이 셋이 섹션 전체를 칠하는 색면이 된다(`components/landing/Landing.tsx`). 로봇 노리(포즈 7종, `lib/art.ts`)가 모든 화면의 내레이터다 — 글을 지워도 무슨 화면인지 알아본다.

두 목소리가 공존한다(의도). 아이 화면(`/play`, `/lesson`, `/room`)은 노리가 반말로 말한다. 랜딩(`/`)은 부모·교사에게 존댓말로 쓰지만, 말풍선 속 노리는 여전히 반말이다(`Landing.tsx` `heroLine`, `Speech`). 어른용 정보(성취기준 표)는 랜딩 맨 아래에만 있고 아이 화면에는 없다.

**Key Characteristics:**
- 남색(`ink`) 2.5~3px 실선 외곽선 + `0 3px/4px 0 ink` 오프셋 그림자. 블러 없음.
- 종이 질감: body는 18px 점무늬, 놀이터 무대는 24px 모눈(`.stage-grid`) 또는 14px 점(`.stage-dots`).
- Pretendard Variable 단일 서체, 굵기는 700/800/900만. 가늘거나 보통 굵기 없음.
- 아이콘은 이모지가 아니라 그림 파일(webp, ComfyUI 제작). 노리 포즈 7, 배지 16, 레슨 썸네일 16, 단어 그림 52.
- 모션은 스프링 팝 한 종류. 움직임 줄임이면 정지.
- 다크 모드 없음. 런타임 LLM·분석 도구 없음.

## Colors

검정 대신 남색 하나로 선을 긋고, 캔디 세 색이 면을 칠하며, 종이 두 톤이 바탕이다(`app/globals.css` `@theme`).

### Primary
- **캔디 레드(코랄)** (`candy-red`): 기본 버튼(`components/steps/styles.ts` `popButton`), 랜딩 CTA, 아직 안 한 레슨 카드(`components/LessonList.tsx`), 랜딩 "임베딩" 섹션의 색면.

### Secondary
- **캔디 옐로** (`candy-yellow`): "다음에 할 것"의 색. 다음 레슨 카드(`.pulse-card`), 상단 바 시작하기, 켜진 전구(`playgrounds/bit-lights/BitLights.tsx`), `::selection`, 색종이 링. 랜딩 레슨 목록 섹션의 색면.
- **캔디 틸(민트)** (`candy-teal`): "고른 것"의 색. 선택된 보기 버튼(`choiceButton`), 랜딩 "부모·선생님께" 섹션의 색면.

### Neutral
- **잉크(남색)** (`ink`): 모든 외곽선·그림자·본문 글자·포커스 링·스크롤바 썸. 랜딩 마지막 섹션은 잉크를 바탕으로 뒤집어 `paper` 글자를 쓴다.
- **크림** (`cream`): body 바탕(점무늬 위), 헤더, 썸네일 뒤판, `themeColor`.
- **페이퍼** (`paper`): 스티커·말풍선·무대·카드의 흰 면. 놀이터 무대는 항상 페이퍼.
- **뮤티드** (`muted`): 보조 글자(묶음 제목, 레슨 번호, 자릿값, 푸터 링크). 강조 없이 물러나는 정보에만.

### Named Rules
**The Ink Line Rule.** 선과 그림자는 오직 `ink`다. 회색 테두리, 반투명 검정 그림자는 없다. 얇은 구분선만 `ink/15`, `ink/30`으로 옅어진다(`Landing.tsx` 레슨 목록 `divide-y`, 표).

**The Three Candies Rule.** 유채색은 코랄·민트·노랑 셋뿐이다. 데이터셋 갈래 색(`dataset.categories[].color`)만 예외로 놀이터 안에서 쓰인다 — 그마저 단어를 놓기 전에는 흰색(`#FFFFFF`)이고 놓은 뒤에만 색이 붙는다(`EmbeddingMap.tsx` `undecided`).

**The Color Means State Rule.** 같은 모양의 카드가 색으로 상태를 말한다: 코랄 = 아직, 노랑 = 다음, 페이퍼 = 끝냄(`LessonList.tsx`). 보기 버튼은 페이퍼 = 안 고름, 민트 = 고름(`styles.ts`).

## Typography

**Display / Body Font:** Pretendard Variable (system-ui, sans-serif 폴백) — `globals.css` `--font-sans`, `pretendardvariable-dynamic-subset.css` import.
**Mono:** Tailwind 기본 `font-mono` — 숫자 읽기(`BitLights.tsx` 총합·자릿값)에만.

**Character:** 서체는 하나, 굵기는 셋(700/800/900). 가벼운 글자가 없어서 스티커 위 글씨처럼 읽힌다. 한글 제목은 `break-keep`과 `text-balance`로 어절 단위 줄바꿈(`Landing.tsx` 루트).

### Hierarchy
- **Display** (900, `text-4xl → lg:5xl → xl:6xl`, 1.08, -0.02em): 랜딩 h1 하나뿐. 아이 첫 화면 h1은 `text-5xl` 900(`app/play/page.tsx`).
- **Headline** (900, `text-3xl → lg:4xl/5xl`, leading-tight): 랜딩 섹션 h2. 강조는 `underline decoration-[6px]`로 굵은 밑줄.
- **Title** (900, `text-lg` ~ `text-xl`): 묶음 이름 알약, 배지 이름(`RewardStep.tsx`), 레슨 카드 제목.
- **Body** (700, `text-base`; 랜딩 본문은 `text-lg`, 최대 `60ch`): 설명문. 보조 톤은 `text-ink/80`.
- **Label** (800, `text-sm` / `text-xs`): 칩 글자, 상단 바 nav, 말풍선(`text-base` 800), 묶음 제목(`text-sm` 800 `muted`).

### Named Rules
**The Heavy Only Rule.** `font-black`(900)·`font-extrabold`(800)·`font-bold`(700) 외의 굵기는 쓰지 않는다. 코드 어디에도 400·500·600이 없다.

**The Big Number Rule.** 놀이터의 숫자는 `font-mono text-4xl font-black`으로 크게, 자릿값 같은 부연은 `font-mono text-[10px] muted`로 작게(`BitLights.tsx`).

## Layout

- **아이 화면은 한 손 폭.** `/play`, 스텝 화면, `/room`은 `mx-auto max-w-md px-5` 세로 스택(`app/play/page.tsx`, `components/steps/HookStep.tsx`). 레슨은 `lg:max-w-5xl`, 내 방은 `lg:max-w-4xl`로 넓어진다(`app/lesson/[lessonId]/LessonClient.tsx`, `app/room/page.tsx`).
- **랜딩은 색면 띠.** 섹션마다 `border-y-[3px] border-ink`로 나뉘고 안쪽은 `max-w-6xl px-5 py-14 lg:py-20`. 데스크톱은 2열(`lg:grid-cols-2`), 모바일은 한 열로 접힌다. 첫 화면은 헤드라인 → 노리+말풍선 → 실제 EmbeddingMap(4:3, `lg:max-w-5xl lg:-rotate-1`).
- **간격 리듬:** 요소 사이 `gap-3`(12px)·`gap-4`(16px)·`gap-6`(24px), 섹션 내부 `gap-8/10`. 좌우 여백은 항상 `px-5`(20px).
- **안전 영역:** body가 `env(safe-area-inset-*)` 패딩을 갖고 `viewportFit: cover`(`app/layout.tsx`).
- **무대는 화면 폭.** 놀이터 무대(`EmbeddingMap`)는 `aspect-[4/3] w-full`, 넓은 화면에서 서랍이 옆으로(`lg:grid-cols-[minmax(0,1fr)_18rem]`).

## Elevation & Depth

블러 없는 **오프셋 단색 그림자**만 있다. 그림자는 깊이가 아니라 "떼어 붙인 스티커"의 두께이고, 누르면 사라지면서 요소가 그 두께만큼 내려간다(`globals.css` `button:active, a[href]:active { transform: translateY(3px); box-shadow: none }`). 랜딩 섹션 색면끼리는 그림자 없이 3px 잉크 선으로만 나뉜다.

### Shadow Vocabulary
- **sticker-sm** (`box-shadow: 0 3px 0 var(--color-ink)`): 기본. 버튼, 칩, 레슨 카드, 말풍선(아이 화면). 코드에서 29회.
- **sticker-md** (`0 4px 0 var(--color-ink)`): 놀이터 무대, 읽기판, 랜딩 말풍선·CTA. 17회.
- **sticker-lg** (`0 5px 0 var(--color-ink)`): 랜딩 레슨 묶음 카드 한 곳.
- **glow-next** (`0 0 0 10px rgba(255,217,61,0)`로 퍼지는 링, `.pulse-card`): 다음 레슨 카드·첫 칩. 크기를 바꾸지 않고 링만 번진다.
- **glow-bulb** (`0 0 18px 6px rgba(255,217,61,.75)`): 켜진 전구(`BitLights.tsx`). 시스템에서 유일한 블러 그림자이며 "빛"을 뜻할 때만.

### Named Rules
**The Press-Down Rule.** 누를 수 있는 것은 전부 sticker 그림자를 갖고, `:active`에서 3px 내려가며 그림자를 잃는다. 호버 상태는 따로 없다 — 손가락 앱이다.

**The Flat Band Rule.** 섹션·헤더 같은 큰 면은 그림자 없이 3px 선으로만 구분한다.

## Shapes

- **팝 모서리** (`rounded-pop` = 14px, `--radius-pop`): 버튼·카드·말풍선·무대 전부. 시스템의 유일한 모서리 토큰.
- **알약** (`rounded-full`): 단어 칩(`WordChip.tsx`), 묶음 제목, "다음" 배지, 전구, 빈 무대의 "여기에 놓아봐"(점선 `border-dashed border-ink/30`).
- **썸네일** (`rounded-[10px]` 아이 화면, `rounded-[12px]` 랜딩): 64px 정사각 그림에 2px 잉크 선.
- **선 두께:** 2.5px가 기본(49회), 3px는 큰 것(무대·랜딩 섹션·헤더, 20회), 2px는 썸네일.
- **기울임:** 랜딩에서만 `-rotate-1`(무대), `±0.6deg`(묶음 카드) — 스티커를 삐뚜름하게 붙인 느낌. 아이 화면에는 없다.
- **말풍선 꼬리:** 45° 회전한 16px 정사각형에 왼쪽·아래 3px 선(`Landing.tsx` `Speech`).

## Components

### Buttons
- **Shape:** 팝 모서리(14px), 2.5px 잉크 선, sticker-sm 그림자.
- **Primary** (`popButton`, `components/steps/styles.ts`): 코랄 바탕, 잉크 글자 800, `px-5 py-2`. 스텝 화면의 "다음" 계열.
- **CTA** (`Landing.tsx` `cta`): 같은 코랄, 3px 선, `px-6 py-3 text-lg` 900, sticker-md. 랜딩 맨 아래.
- **Nav start** (`Landing.tsx` header): 노랑 바탕, `px-4 py-2 text-sm` 800.
- **Choice** (`choiceButton`): 페이퍼, 고르면 민트. `px-4 py-2` 800.
- **Text link**: `underline underline-offset-4 font-extrabold`, 색 없음(`BitLights.tsx` "전부 끄기"는 `muted`).
- **Active:** 전역 `translateY(3px)` + 그림자 제거. **Focus:** 전역 `outline: 3px solid ink; offset 3px; radius 6px`.

### Chips
- **Word chip** (`playgrounds/embedding-map/WordChip.tsx`): 알약, 2.5px 선, sticker-sm, `px-3 py-1 text-sm` 800. 앞에 20px 단어 그림(`components/WordIcon.tsx`). 바탕색은 데이터셋 갈래 색, 놓기 전엔 흰색. 놓은 뒤는 `span`(버튼 아님). 첫 칩은 `.pulse-card`.
- **Pill label**: 묶음 제목(코랄 알약, 2.5px 선, `text-lg` 900), "다음" 배지(잉크 알약, 페이퍼 글자 `text-xs`).

### Cards / Containers
- **Lesson card** (`components/LessonList.tsx`): `Link` 전체가 카드. 팝 모서리, 2.5px 선, sticker-sm, `p-2 pr-4`, 64px 썸네일 + 번호(`text-xs muted`) + 제목 800. 상태색: 코랄/노랑(`.pulse-card`)/페이퍼(썸네일 `opacity-60`).
- **Speech bubble**: 아이 화면 `MascotBubble.tsx`는 32px 노리 + `text-sm`, "노리 — 대사" 형식. 랜딩 `Speech`는 꼬리 달린 `text-base` 800 말풍선, 노리는 옆에 별도 이미지(96~208px).
- **Stage** (놀이터 무대): `.stage-grid`(지도류) 또는 `.stage-dots`(글·숫자류) 위에 팝 모서리, 3px 선, sticker-md. 빈 상태 문구는 무대 안 점선 알약.
- **Note box** (`BitLights.tsx` wide-note): 크림 바탕, 2.5px 선, 그림자 없음, `p-3 text-xs` 700.
- **Group card** (랜딩): 페이퍼, 3px 선, sticker-lg, `p-4 lg:p-5`, 안쪽 목록은 `divide-y-[2px] divide-ink/15`.

### Navigation
- 랜딩 상단 바: `sticky top-0`, 크림 바탕, 하단 3px 잉크 선, 로고 `text-2xl` 900 + 텍스트 링크(sm 이상) + 노랑 시작하기. 아이 화면은 상단 바 없음 — 푸터의 `text-xs muted underline` 링크 두 개뿐.

### 노리 (Signature)
- 포즈 7종 `base·curious·happy·surprised·wave·point·think`(`lib/art.ts` `mascotArt`). 대기 상태는 `.bob`(2.4s, -6px). 포즈 전환은 `scale 0.7, rotate -8 → 1, 0` 스프링(stiffness 260, damping 14)(`Landing.tsx`). 아이 화면 크기 144~160px, 말풍선 안은 32px, 랜딩 섹션은 80~208px.
- 랜딩에서 노리의 대사·포즈는 방문자가 놓은 단어 수로 바뀌고, 4개째에 색종이(`components/fx/Confetti`, 40개)가 터지며 다음 섹션 제목에 그 수가 박힌다.

### 모션 문법
- 스프링 한 종류가 기본: `type: "spring"`, stiffness 120~300, damping 14~24(`Landing.tsx`, `LessonRunner.tsx`, `RevealStep.tsx`, 놀이터들). 랜딩 섹션은 `y: 28 → 0` 한 번(`whileInView once`), 투명도는 건드리지 않는다.
- 보상은 `scale [0, 1.25, 1]` 0.7s + 색종이 + 효과음(`RewardStep.tsx`).
- `prefers-reduced-motion`이면 `.bob`·`.pulse-card` 정지, 스프링은 `useReducedMotion`으로 생략.

## Do's and Don'ts

### Do:
- **Do** 누를 수 있는 것에는 `rounded-pop border-[2.5px] border-ink shadow-[0_3px_0_var(--color-ink)]`를 준다. 전역 `:active`가 눌림을 처리한다.
- **Do** 아이콘은 `components/WordIcon.tsx`·`lib/art.ts`의 그림 파일로. 새 단어·배지·레슨은 `public/art/`에 webp를 만들고 `lib/art.test.ts`가 존재를 확인하게 한다.
- **Do** 놀이터 무대는 `.stage-grid`/`.stage-dots` 위에 팝 모서리·3px 선·sticker-md. 빈 상태에는 "여기에 놓아봐"류 문구를 무대 안에 크게.
- **Do** 상태는 색으로 말한다: 코랄(아직)·노랑(다음/켜짐)·민트(고름)·페이퍼(끝냄/안 고름).
- **Do** 노리를 화면의 화자로 쓰고, 노리 대사는 어느 화면이든 반말로. 어른에게 하는 지문은 존댓말(랜딩·`/parents`·`/privacy`).
- **Do** 굵기는 700/800/900만, 서체는 Pretendard Variable만. 한글 제목에 `break-keep`·`text-balance`.

### Don't:
- **Don't** 블러 그림자·회색 테두리·그라데이션 면을 쓰지 않는다. 예외는 전구의 "빛"뿐.
- **Don't** 이모지를 아이콘으로 쓰지 않는다. 남은 이모지(`app/room/ArtifactCard.tsx`, `playgrounds/analogy-lab/AnalogyLab.tsx`, `playgrounds/compare-meter/CompareMeter.tsx`의 라벨, `app/play/page.tsx`의 "👋", `LessonList.tsx`의 "✔")는 레거시다 — 시스템 규칙이 아니며, 그림이 없는 형용사 단어(`lib/art.ts` 주석)만 이모지 폴백이 의도적이다.
- **Don't** 다크 모드를 만들지 않는다. `themeColor`·바탕은 크림 하나다.
- **Don't** 호버 전용 상태를 설계하지 않는다. 손가락 앱이다 — 반응은 `:active`와 `:focus-visible`로.
- **Don't** 아이 화면에 성취기준 코드·표·존댓말 설명을 넣지 않는다.
- **Don't** 랜딩의 기울임(`rotate`)과 색면 섹션을 아이 화면으로 가져오지 않는다. 아이 화면은 크림 점무늬 위 세로 스택이다.
- **Don't** 런타임 LLM 호출·분석 스크립트를 넣지 않는다(제품 결정, `PRODUCT.md`).
