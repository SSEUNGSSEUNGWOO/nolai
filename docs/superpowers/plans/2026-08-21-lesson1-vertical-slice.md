# 놀AI 계획 1 — 레슨 1 수직 슬라이스 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 브라우저에서 누구나 열어 레슨 1(임베딩 지도)을 훅부터 배지 획득까지 완주할 수 있게 만든다. 계정 없이, 진도는 localStorage에 저장한다.

**Architecture:** 레슨은 zod로 검증되는 JSON 데이터이고, 놀이터는 독립 React 컴포넌트다. `LessonRunner`가 JSON의 스텝을 순서대로 진행하며 놀이터에서 올라오는 이벤트를 받아 다음 단계로 넘어갈지 판단한다. 놀이터는 레슨 흐름을 전혀 모른다. 임베딩 좌표는 파이썬 스크립트가 사전 계산해 정적 JSON으로 커밋하며, 런타임에 AI API를 호출하지 않는다.

**Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · motion (구 Framer Motion) · zod · Vitest + Testing Library · Playwright · Python 3.12 (uv) + sentence-transformers(KURE-v1, 로컬 GPU) + scikit-learn MDS

**설계 문서:** `docs/superpowers/specs/2026-08-21-nolai-design.md`

---

## 타입 체크에 관한 주의

**`npx tsc --noEmit`만 단독으로 믿지 말 것.** Next 16은 `app/layout.tsx`가 쓰는 `LayoutProps` 같은 전역 타입을 `.next/types/`에 코드 생성한다. 빌드를 한 번도 안 돌린 상태에서 `tsc --noEmit`을 실행하면 `TS2304: Cannot find name 'LayoutProps'`로 실패한다 — 코드가 잘못된 게 아니라 생성된 타입이 아직 없는 것이다.

타입 검증은 항상 **`npm run build`**로 한다. 이 계획의 모든 검증 단계가 그렇게 돼 있다.

---

## 이 계획이 만들지 않는 것

다음은 **계획 2·3**에서 다룬다. 이 계획에서 구현하려 하지 말 것.

- 닉네임·비밀코드·로그인 (계획 2)
- Supabase·서버 저장·내 방 화면 (계획 2)
- 레슨 2 벡터검색 놀이터 (계획 3)
- 효과음 (계획 2에서 보상 연출과 함께)

---

## 파일 구조

```
nolai/
├── frontend/
│   ├── app/
│   │   ├── layout.tsx                     # 폰트·전역 스타일
│   │   ├── globals.css                    # Tailwind v4 테마 토큰
│   │   ├── page.tsx                       # 랜딩
│   │   └── lesson/[lessonId]/page.tsx     # 레슨 화면
│   ├── components/
│   │   ├── LessonRunner.tsx               # 스텝 진행 오케스트레이터
│   │   ├── OwlBubble.tsx                  # 노리 말풍선
│   │   └── steps/
│   │       ├── HookStep.tsx
│   │       ├── NameStep.tsx
│   │       ├── ChallengeStep.tsx
│   │       └── RewardStep.tsx
│   ├── playgrounds/
│   │   ├── types.ts                       # PlaygroundProps 계약
│   │   ├── registry.ts                    # 이름 → 컴포넌트
│   │   └── embedding-map/
│   │       ├── EmbeddingMap.tsx           # 놀이터 본체
│   │       ├── WordChip.tsx               # 단어 칩
│   │       └── geometry.ts                # 순수 함수(좌표·거리·연결선)
│   ├── lib/
│   │   ├── lesson-schema.ts               # 레슨 zod 스키마
│   │   ├── dataset-schema.ts              # 데이터셋 zod 스키마
│   │   ├── content.ts                     # 레슨·데이터셋 로더
│   │   └── local-progress.ts              # localStorage 진도
│   ├── copy/ui.ts                         # UI 고정 문자열
│   ├── lessons/embedding-map.json
│   └── datasets/words-animals-vehicles.json
└── tools/embed/
    ├── pyproject.toml
    ├── words.yaml                         # 단어 원본
    ├── build_dataset.py                   # 임베딩 → MDS → JSON
    └── test_build_dataset.py
```

**책임 분리 원칙:** `geometry.ts`에는 DOM을 모르는 순수 함수만 둔다. 좌표 계산과 연결선 규칙이 여기 모여 있어야 컴포넌트를 띄우지 않고 테스트할 수 있다. `EmbeddingMap.tsx`는 그 함수들을 쓰고 DOM 이벤트만 처리한다.

---

## Task 1: 프로젝트 셋업

**Files:**
- Create: `frontend/` (create-next-app 산출물 전체)
- Create: `frontend/vitest.config.ts`
- Create: `frontend/vitest.setup.ts`
- Modify: `frontend/package.json`

- [ ] **Step 1: Next.js 프로젝트 생성**

`C:\Dev\personal\nolai` 에서 실행:

```bash
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --yes
```

- [ ] **Step 2: 테스트 도구 설치**

```bash
cd frontend
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
npm install zod motion
```

- [ ] **Step 3: vitest 설정 파일 작성**

`frontend/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    exclude: ["node_modules/**", "e2e/**"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

`frontend/vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// @testing-library/react의 자동 cleanup은 설정에 의존한다. 명시적으로 건다.
afterEach(() => {
  cleanup();
});
```

> cleanup을 명시적으로 거는 이유: 뒤 태스크의 테스트 파일들은 한 파일에서 `render()`를 여러 번 부른다. cleanup이 안 되면 DOM이 누적되어 `getByTestId`가 중복 매치로 실패한다.

- [ ] **Step 4: tsconfig에 vitest 타입 추가**

`frontend/tsconfig.json`의 `compilerOptions`에 추가:

```json
"types": ["vitest/globals", "node"]
```

> 이게 없으면 테스트 파일이 `vitest run`은 통과하는데 **`npm run build`가 깨진다.** `tsconfig.json`의 `include`가 `**/*.ts`라 테스트 파일도 타입 체크 대상인데, `globals: true`로 쓰는 `describe`/`it`/`expect`의 타입이 없기 때문이다. `"node"`를 반드시 함께 넣어야 한다 — `types`를 지정하면 `@types/*` 자동 포함이 그 목록으로 제한되는데 `vitest.config.ts`가 `node:path`와 `__dirname`을 쓴다.

- [ ] **Step 5: package.json에 스크립트 추가**

`frontend/package.json`의 `"scripts"` 에 추가:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: 스모크 테스트로 설정이 동작하는지 확인**

`frontend/lib/smoke.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";

function Probe() {
  return <span data-testid="probe">hi</span>;
}

describe("setup", () => {
  it("컴포넌트를 렌더하고 매처가 동작한다", () => {
    render(<Probe />);
    expect(screen.getByTestId("probe")).toBeInTheDocument();
  });
});
```

> 일부러 `describe`/`it`/`expect`를 import하지 않았다. `globals: true`와 Step 4의 `types` 설정이 둘 다 제대로 걸렸는지 확인하는 것이 이 스모크 테스트의 목적이다.

- [ ] **Step 7: 테스트와 빌드 실행**

Run: `npm run test`
Expected: PASS — `1 passed`

Run: `npm run build`
Expected: 성공. 여기서 `TS2582: Cannot find name 'describe'`가 나오면 Step 4의 `types` 설정이 빠진 것이다.

- [ ] **Step 8: 스모크 테스트 삭제 후 커밋**

```bash
rm lib/smoke.test.tsx
npm run build   # 테스트 파일이 없어도 여전히 성공하는지 확인
cd ..
git add frontend
git commit -m "chore: Next.js + Vitest 프로젝트 셋업"
```

---

## Task 2: 디자인 토큰과 폰트

팝 캔디 톤을 CSS 변수로 못 박는다. 이후 모든 컴포넌트가 이 토큰만 쓴다.

**Files:**
- Modify: `frontend/app/globals.css`
- Modify: `frontend/app/layout.tsx`

- [ ] **Step 1: Pretendard 폰트 패키지 설치**

```bash
cd frontend
npm install pretendard
```

> CDN(jsDelivr)에서 불러오지 않고 **자체 호스팅**한다. 이 서비스의 주 사용 환경이 학교·가정 네트워크인데, CDN이 막히면 렌더가 지연된다. npm 패키지를 쓰면 번들러가 woff2를 정적 자산으로 emit해준다(dynamic subset 92개, unicode-range로 필요한 것만 내려받음).

- [ ] **Step 2: globals.css를 토큰 정의로 교체**

`frontend/app/globals.css` 전체를 다음으로 교체:

```css
@import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
@import "tailwindcss";

@theme {
  --color-ink: #1f2430;
  --color-cream: #fff3d6;
  --color-paper: #fffdf6;
  --color-candy-red: #ff6b6b;
  --color-candy-teal: #4ecdc4;
  --color-candy-yellow: #ffd93d;
  --color-muted: #736b5a;

  --font-sans: "Pretendard Variable", system-ui, sans-serif;

  --radius-pop: 14px;
}

@layer base {
  body {
    background-color: var(--color-cream);
    color: var(--color-ink);
    font-family: var(--font-sans);
  }
}
```

> **폰트 `@import`가 반드시 첫 줄이어야 한다.** CSS 규격상 `@import`는 `@charset`/`@layer` 외 모든 규칙보다 앞에 와야 하는데, `@import "tailwindcss"`가 내부적으로 `@layer` 규칙들로 확장되기 때문에 그 뒤에 폰트 import를 두면 규격 위반이 된다. Turbopack의 CSS 최적화기(lightningcss)가 **경고만 내고 그 import를 통째로 버린다.** 빌드는 성공하는데 폰트는 안 걸리는 상태가 되므로 육안으로 보기 전엔 모른다.

> **`--color-muted`는 접근성 때문에 이 값이다.** 원래 `#8a8172`였는데 크림 배경에서 대비가 3.49:1로 WCAG AA(4.5:1) 미달이었다. `#736b5a`는 cream에서 4.79:1, paper에서 5.19:1이다. 이 값을 밝게 바꾸지 말 것.

- [ ] **Step 3: layout.tsx 메타데이터 설정**

`frontend/app/layout.tsx` 전체를 다음으로 교체:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "놀AI — AI는 어떻게 생각할까?",
  description:
    "10~13세 어린이가 AI의 작동 원리를 손으로 만져서 배우는 온라인 놀이터.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: 토큰이 실제로 유틸리티로 생성되는지 확인**

눈으로 볼 수 없으므로 빌드 산출물을 직접 확인한다.

`app/page.tsx`에 프로브를 임시로 넣는다:

```tsx
<div className="bg-candy-red border-ink text-muted bg-paper rounded-pop" />
```

Run: `npm run build`

그다음 생성된 CSS를 grep한다 (Turbopack은 `.next/static/chunks/*.css`에 emit한다. `.next/static/css/`가 아니다):

```bash
grep -o "\.bg-candy-red{[^}]*}" .next/static/chunks/*.css
grep -o "\.rounded-pop{[^}]*}" .next/static/chunks/*.css
grep -ic "pretendard" .next/static/chunks/*.css
ls .next/static/media/*.woff2 | wc -l
```

Expected:
```
.bg-candy-red{background-color:var(--color-candy-red)}
.rounded-pop{border-radius:var(--radius-pop)}
2          ← @font-face와 --font-sans 값
92         ← woff2가 로컬로 emit됨
```

`jsdelivr`로 grep했을 때 **0건**이어야 한다. 1건이라도 나오면 자체 호스팅이 안 된 것이다.

확인 후 프로브를 되돌린다:

```bash
git checkout -- app/page.tsx
```

> `app/page.tsx`는 Task 15에서 통째로 교체한다. 여기서 커밋하지 않는다.

- [ ] **Step 5: 커밋**

```bash
git add frontend/app
git commit -m "feat: 팝 캔디 디자인 토큰과 Pretendard 폰트 적용"
```

---

## Task 3: 레슨 스키마

**Files:**
- Create: `frontend/lib/lesson-schema.ts`
- Test: `frontend/lib/lesson-schema.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`frontend/lib/lesson-schema.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { lessonSchema } from "./lesson-schema";

const validLesson = {
  id: "embedding-map",
  order: 1,
  lang: "ko",
  title: "비슷한 말끼리 모여라",
  playground: "EmbeddingMap",
  dataset: "words-animals-vehicles",
  steps: [
    { type: "hook", owl: "컴퓨터는 '강아지'라는 말을 몰라." },
    { type: "play", owl: ["아무거나 끌어다 놔봐!"], goal: { minPlaced: 5 } },
    { type: "name", concept: "임베딩", body: "말을 숫자로 바꿔서 기억해." },
    {
      type: "challenge",
      question: "'호랑이'는 어디에 놓일까?",
      choices: ["강아지 근처", "자동차 근처"],
      answer: 0,
      explain: "호랑이도 동물이니까!",
    },
    { type: "reward", badge: "map-explorer" },
  ],
};

describe("lessonSchema", () => {
  it("올바른 레슨을 통과시킨다", () => {
    expect(lessonSchema.parse(validLesson).id).toBe("embedding-map");
  });

  it("모르는 스텝 타입을 거부한다", () => {
    const bad = { ...validLesson, steps: [{ type: "dance", owl: "hi" }] };
    expect(() => lessonSchema.parse(bad)).toThrow();
  });

  it("challenge의 answer가 choices 범위를 벗어나면 거부한다", () => {
    const bad = {
      ...validLesson,
      steps: [
        {
          type: "challenge",
          question: "q",
          choices: ["a", "b"],
          answer: 5,
          explain: "e",
        },
      ],
    };
    expect(() => lessonSchema.parse(bad)).toThrow(/answer/);
  });

  it("play 스텝의 owl 대사가 비어 있으면 거부한다", () => {
    const bad = {
      ...validLesson,
      steps: [{ type: "play", owl: [], goal: { minPlaced: 1 } }],
    };
    expect(() => lessonSchema.parse(bad)).toThrow();
  });

  it("goal.minPlaced가 0이면 거부한다", () => {
    const bad = {
      ...validLesson,
      steps: [{ type: "play", owl: ["가"], goal: { minPlaced: 0 } }],
    };
    expect(() => lessonSchema.parse(bad)).toThrow();
  });

  it("choices가 2개 미만이면 거부한다", () => {
    const bad = {
      ...validLesson,
      steps: [
        {
          type: "challenge",
          question: "q",
          choices: ["하나뿐"],
          answer: 0,
          explain: "e",
        },
      ],
    };
    expect(() => lessonSchema.parse(bad)).toThrow();
  });

  it("스텝의 오타를 해당 필드만 짚어서 알려준다", () => {
    const bad = {
      ...validLesson,
      steps: [{ type: "play", owl: ["가"], goal: { minPlace: 5 } }],
    };

    const result = lessonSchema.safeParse(bad);
    expect(result.success).toBe(false);

    const issues = JSON.stringify(result.error!.issues);
    expect(issues).toMatch(/minPlace/);
    // 다른 스텝 타입의 필드가 섞여 나오면 안 된다
    expect(issues).not.toMatch(/concept|badge|question/);
  });
});
```

> 마지막 테스트가 이 스키마 구조의 회귀 방지선이다. 누군가 `discriminatedUnion`을 `union`으로 되돌리면 이 테스트가 깨진다.

- [ ] **Step 2: 테스트 실행해서 실패 확인**

Run: `npm run test lib/lesson-schema`
Expected: FAIL — `Failed to resolve import "./lesson-schema"`

- [ ] **Step 3: 스키마 구현**

`frontend/lib/lesson-schema.ts`:

```ts
import { z } from "zod";

const hookStep = z.strictObject({
  type: z.literal("hook"),
  owl: z.string().min(1),
});

const playStep = z.strictObject({
  type: z.literal("play"),
  owl: z.array(z.string().min(1)).min(1),
  goal: z.strictObject({ minPlaced: z.number().int().positive() }),
});

const nameStep = z.strictObject({
  type: z.literal("name"),
  concept: z.string().min(1),
  body: z.string().min(1),
});

const challengeStep = z.strictObject({
  type: z.literal("challenge"),
  question: z.string().min(1),
  choices: z.array(z.string().min(1)).min(2),
  answer: z.number().int().nonnegative(),
  explain: z.string().min(1),
});

const rewardStep = z.strictObject({
  type: z.literal("reward"),
  badge: z.string().min(1),
});

export const lessonStepSchema = z.discriminatedUnion("type", [
  hookStep,
  playStep,
  nameStep,
  challengeStep,
  rewardStep,
]);

export const lessonSchema = z
  .strictObject({
    id: z.string().min(1),
    order: z.number().int().positive(),
    lang: z.literal("ko"),
    title: z.string().min(1),
    playground: z.string().min(1),
    dataset: z.string().min(1),
    steps: z.array(lessonStepSchema).min(1),
  })
  .superRefine((lesson, ctx) => {
    lesson.steps.forEach((step, index) => {
      if (step.type !== "challenge") return;

      if (step.answer >= step.choices.length) {
        ctx.addIssue({
          code: "custom",
          message: "answer가 choices 범위를 벗어났습니다",
          path: ["steps", index, "answer"],
        });
      }
    });
  });

export type Lesson = z.infer<typeof lessonSchema>;
export type LessonStep = z.infer<typeof lessonStepSchema>;
```

**이 구조는 에러 메시지 품질 때문에 이렇게 돼 있다. `z.union`으로 되돌리지 말 것.**

`z.union`은 스텝 하나가 실패할 때 **5개 브랜치 전부의 에러**를 보고한다. `goal: { minPlace: 5 }` 오타 하나에 `concept`·`body`·`question`·`choices`·`answer`·`explain`·`badge`가 전부 "expected X, received undefined"로 딸려 나오고, `owl: expected string, received array` 같은 엉뚱한 진단까지 섞인다. 레슨 JSON 손편집이 이 프로젝트에서 가장 자주 하는 작업인데 편집자가 그 벽에서 원인을 못 찾는다.

`z.discriminatedUnion`은 `type`을 먼저 보고 해당 브랜치만 검사하므로 에러가 한 필드로 좁혀진다. 그러려면 `challengeStep`에 `.refine()`이 붙어 있으면 안 되므로, `answer < choices.length` 검사를 레슨 레벨 `superRefine`으로 올렸다.

`z.object` 대신 `z.strictObject`인 이유는 모르는 키를 조용히 버리지 않게 하려는 것이다. 기본 `z.object`는 `goal: { minPlaced: 5, minPlace: 999 }` 같은 편집 잔재를 **아무 경고 없이 통과**시킨다. strict면 `Unrecognized key: "minPlace"`로 짚어준다.

실제 개선 결과 (`goal: { minPlace: 5 }` 오타):

```jsonc
// 이전 — 만지지도 않은 필드까지 8개 넘게 쏟아짐
// owl / concept / body / question / choices / answer / explain / badge ...

// 지금 — 두 줄로 끝
[
  { "code": "invalid_type", "path": ["steps", 1, "goal", "minPlaced"],
    "message": "Invalid input: expected number, received undefined" },
  { "code": "unrecognized_keys", "keys": ["minPlace"], "path": ["steps", 1, "goal"],
    "message": "Unrecognized key: \"minPlace\"" }
]
```

- [ ] **Step 4: 테스트 실행해서 통과 확인**

Run: `npm run test lib/lesson-schema`
Expected: PASS — `7 passed`

- [ ] **Step 5: 커밋**

```bash
git add frontend/lib
git commit -m "feat: 레슨 JSON zod 스키마 추가"
```

---

## Task 4: 데이터셋 스키마

**Files:**
- Create: `frontend/lib/dataset-schema.ts`
- Test: `frontend/lib/dataset-schema.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`frontend/lib/dataset-schema.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { datasetSchema } from "./dataset-schema";

const valid = {
  id: "words-animals-vehicles",
  model: "nlpai-lab/KURE-v1",
  projection: "mds",
  categories: [
    { id: "animal", label: "동물", color: "#FF6B6B" },
    { id: "vehicle", label: "탈것", color: "#4ECDC4" },
  ],
  words: [
    { id: "dog", label: "강아지", emoji: "🐶", category: "animal", x: 0.2, y: 0.3 },
    { id: "car", label: "자동차", emoji: "🚗", category: "vehicle", x: 0.8, y: 0.6 },
  ],
};

describe("datasetSchema", () => {
  it("올바른 데이터셋을 통과시킨다", () => {
    expect(datasetSchema.parse(valid).words).toHaveLength(2);
  });

  it("좌표가 0~1 범위를 벗어나면 거부한다", () => {
    const bad = {
      ...valid,
      words: [{ ...valid.words[0], x: 1.5 }, valid.words[1]],
    };
    expect(() => datasetSchema.parse(bad)).toThrow();
  });

  it("정의되지 않은 카테고리를 참조하면 거부한다", () => {
    const bad = {
      ...valid,
      words: [{ ...valid.words[0], category: "ghost" }, valid.words[1]],
    };
    expect(() => datasetSchema.parse(bad)).toThrow(/category/);
  });

  it("word id가 중복되면 거부한다", () => {
    const bad = {
      ...valid,
      words: [valid.words[0], { ...valid.words[1], id: "dog" }],
    };
    expect(() => datasetSchema.parse(bad)).toThrow(/중복/);
  });

  it("category id가 중복되면 거부한다", () => {
    const bad = {
      ...valid,
      categories: [
        ...valid.categories,
        { id: "animal", label: "동물2", color: "#000000" },
      ],
    };
    expect(() => datasetSchema.parse(bad)).toThrow(/중복/);
  });
});
```

> **중복 id 검사가 필요한 이유:** Task 9의 놀이터는 `new Map(words.map(w => [w.id, w]))`로 조회 맵을 만들고 React에서 `key={word.id}`를 쓴다. 중복이 있으면 **단어 하나가 아무 에러 없이 사라진다.** 데이터셋의 원본인 `words.yaml`은 사람이 손으로 편집하므로 복붙 중복이 현실적인 실수다.

> 참고: `z.number()`는 `NaN`과 `Infinity`를 `invalid_type`으로 거부한다. 생성기 버그로 좌표가 `NaN`이 되면 카드가 `left: NaN%`로 안 보이게 될 텐데, 스키마에서 먼저 막힌다.

- [ ] **Step 2: 테스트 실행해서 실패 확인**

Run: `npm run test lib/dataset-schema`
Expected: FAIL — `Failed to resolve import "./dataset-schema"`

- [ ] **Step 3: 스키마 구현**

`frontend/lib/dataset-schema.ts`:

```ts
import { z } from "zod";

const category = z.strictObject({
  id: z.string().min(1),
  label: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

const word = z.strictObject({
  id: z.string().min(1),
  label: z.string().min(1),
  emoji: z.string().min(1),
  category: z.string().min(1),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

export const datasetSchema = z
  .strictObject({
    id: z.string().min(1),
    model: z.string().min(1),
    projection: z.literal("mds"),
    categories: z.array(category).min(1),
    words: z.array(word).min(2),
  })
  .superRefine((data, ctx) => {
    const known = new Set(data.categories.map((c) => c.id));

    const seenCategoryIds = new Set<string>();
    data.categories.forEach((c, i) => {
      if (seenCategoryIds.has(c.id)) {
        ctx.addIssue({
          code: "custom",
          message: `category id가 중복됩니다: ${c.id}`,
          path: ["categories", i, "id"],
        });
      }
      seenCategoryIds.add(c.id);
    });

    const seenWordIds = new Set<string>();
    data.words.forEach((w, i) => {
      if (seenWordIds.has(w.id)) {
        ctx.addIssue({
          code: "custom",
          message: `word id가 중복됩니다: ${w.id}`,
          path: ["words", i, "id"],
        });
      }
      seenWordIds.add(w.id);

      if (!known.has(w.category)) {
        ctx.addIssue({
          code: "custom",
          message: `알 수 없는 category: ${w.category}`,
          path: ["words", i, "category"],
        });
      }
    });
  });

export type Dataset = z.infer<typeof datasetSchema>;
export type DatasetWord = z.infer<typeof word>;
export type DatasetCategory = z.infer<typeof category>;
```

- [ ] **Step 4: 테스트 실행해서 통과 확인**

Run: `npm run test lib/dataset-schema`
Expected: PASS — `5 passed`

- [ ] **Step 5: 커밋**

```bash
git add frontend/lib
git commit -m "feat: 데이터셋 zod 스키마 추가"
```

---

## Task 5: 임베딩 사전 계산 도구 (파이썬)

**Files:**
- Create: `tools/embed/pyproject.toml`
- Create: `tools/embed/words.yaml`
- Create: `tools/embed/build_dataset.py`
- Test: `tools/embed/test_build_dataset.py`

- [ ] **Step 1: uv 프로젝트 생성**

`C:\Dev\personal\nolai` 에서:

```bash
mkdir -p tools/embed
cd tools/embed
uv init --no-workspace
uv add sentence-transformers torch scikit-learn numpy pyyaml
uv add --dev pytest
```

> 임베딩은 **로컬 GPU에서 돌린다.** 모델은 `nlpai-lab/KURE-v1` — 고려대가 BAAI/bge-m3를 한국어 검색용으로 파인튜닝한 것으로, 한국어 검색 벤치마크에서 bge-m3 원본을 앞선다. API 키가 필요 없어 누구나 같은 결과를 재현할 수 있다. 첫 실행 시 모델(약 2GB)을 내려받는다.

- [ ] **Step 2: 단어 원본 작성**

`tools/embed/words.yaml`:

```yaml
# 단어 선정 규칙 (레슨을 늘릴 때 반드시 지킬 것)
#
# 1. 다의어 금지. 임베딩은 뜻으로 모으는데 뜻이 여러 개면 모델이 그 사이에 놓는다.
#    걸렸던 예: 배(ship/pear/belly), 사과(apple/apology), 새(bird/new)
#
# 2. 카테고리는 '사람이 묶은 분류'가 아니라 '의미적으로 가까운 것끼리'여야 한다.
#    걸렸던 예: '먹을 것'은 생과일과 가공 디저트가 섞여 두 덩이로 쪼개졌다.
#    → '과일'로 좁히니 하나의 무리가 됐다.
#
# 3. 바꾼 뒤에는 반드시 클러스터 품질을 숫자로 재검증한다.
#    좌표는 어떤 경우에도 손으로 고치지 않는다.
#
# 검토해서 통과시킨 경계 사례 (다시 따지지 않아도 됨):
#   병아리 — '초보자'라는 비유적 뜻이 있으나 실제 이웃은 호랑이·물고기·코끼리로
#            동물 무리에 정확히 붙는다
#   포도   — 사어가 된 동음이의어 捕盜(포도청)가 있으나 실제 이웃은 귤·수박으로
#            과일 무리에 정확히 붙는다
#
# 규칙 1이 막으려는 건 '뜻이 갈려 모델이 중간에 놓는 것'이지 사전적 중의성 자체가
# 아니다. 애매하면 바꾸지 말고 먼저 실제 이웃을 찍어보고 판단할 것.

id: words-animals-vehicles
categories:
  - { id: animal,  label: 동물,     color: "#FF6B6B" }
  - { id: vehicle, label: 탈것,     color: "#4ECDC4" }
  - { id: fruit,   label: 과일,     color: "#FFD93D" }
words:
  - { id: dog,      label: 강아지,   emoji: "🐶", category: animal }
  - { id: cat,      label: 고양이,   emoji: "🐱", category: animal }
  - { id: rabbit,   label: 토끼,     emoji: "🐰", category: animal }
  - { id: tiger,    label: 호랑이,   emoji: "🐯", category: animal }
  - { id: elephant, label: 코끼리,   emoji: "🐘", category: animal }
  - { id: chick,    label: 병아리,   emoji: "🐤", category: animal }
  - { id: fish,     label: 물고기,   emoji: "🐟", category: animal }
  - { id: car,      label: 자동차,   emoji: "🚗", category: vehicle }
  - { id: bus,      label: 버스,     emoji: "🚌", category: vehicle }
  - { id: train,    label: 기차,     emoji: "🚆", category: vehicle }
  - { id: bike,     label: 자전거,   emoji: "🚲", category: vehicle }
  - { id: airplane, label: 비행기,   emoji: "✈️", category: vehicle }
  - { id: truck,    label: 트럭,     emoji: "🚚", category: vehicle }
  - { id: strawberry, label: 딸기,   emoji: "🍓", category: fruit }
  - { id: banana,     label: 바나나, emoji: "🍌", category: fruit }
  - { id: grape,      label: 포도,   emoji: "🍇", category: fruit }
  - { id: watermelon, label: 수박,   emoji: "🍉", category: fruit }
  - { id: tangerine,  label: 귤,     emoji: "🍊", category: fruit }
```

- [ ] **Step 3: 좌표 정규화 함수의 실패하는 테스트 작성**

`tools/embed/test_build_dataset.py`:

```python
import numpy as np
from build_dataset import normalize_coords


def test_normalize_maps_into_unit_box_with_margin():
    raw = np.array([[-10.0, -10.0], [10.0, 10.0], [0.0, 0.0]])
    out = normalize_coords(raw, margin=0.08)

    assert out.min() >= 0.08 - 1e-9
    assert out.max() <= 0.92 + 1e-9


def test_normalize_preserves_relative_order():
    raw = np.array([[0.0, 0.0], [1.0, 0.0], [2.0, 0.0]])
    out = normalize_coords(raw, margin=0.1)

    assert out[0][0] < out[1][0] < out[2][0]


def test_normalize_handles_degenerate_axis():
    # 모든 y가 같을 때 0으로 나누면 안 된다
    raw = np.array([[0.0, 5.0], [1.0, 5.0]])
    out = normalize_coords(raw, margin=0.1)

    assert np.all(np.isfinite(out))
    assert out[0][1] == out[1][1] == 0.5
```

- [ ] **Step 4: 테스트 실행해서 실패 확인**

Run: `uv run pytest -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'build_dataset'`

- [ ] **Step 5: build_dataset.py 구현**

`tools/embed/build_dataset.py`:

```python
"""단어 목록을 임베딩해 2D 좌표 데이터셋으로 만든다.

실행:  uv run python build_dataset.py
출력:  ../../frontend/datasets/<id>.json

모델은 로컬에서 돌아간다. API 키가 필요 없다.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import torch
import yaml
from sentence_transformers import SentenceTransformer
from sklearn.manifold import MDS

MODEL = "nlpai-lab/KURE-v1"
HERE = Path(__file__).parent
OUT_DIR = HERE.parent.parent / "frontend" / "datasets"


def normalize_coords(raw: np.ndarray, margin: float) -> np.ndarray:
    """2D 좌표를 [margin, 1-margin] 범위로 정규화한다.

    한 축의 값이 모두 같으면 그 축은 0.5로 고정한다.
    """
    span = 1.0 - 2.0 * margin
    out = np.empty_like(raw, dtype=float)

    for axis in range(raw.shape[1]):
        col = raw[:, axis]
        lo, hi = col.min(), col.max()
        if hi - lo < 1e-12:
            out[:, axis] = 0.5
        else:
            out[:, axis] = margin + (col - lo) / (hi - lo) * span

    return out


def cosine_distance_matrix(vectors: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    unit = vectors / norms
    similarity = unit @ unit.T
    return np.clip(1.0 - similarity, 0.0, 2.0)


def embed(labels: list[str]) -> np.ndarray:
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"loading {MODEL} on {device}")

    model = SentenceTransformer(MODEL, device=device)
    return model.encode(
        labels,
        normalize_embeddings=True,
        convert_to_numpy=True,
        show_progress_bar=True,
    )


def main() -> None:
    source = yaml.safe_load((HERE / "words.yaml").read_text(encoding="utf-8"))
    words = source["words"]
    labels = [w["label"] for w in words]

    vectors = embed(labels)
    distances = cosine_distance_matrix(vectors)

    # init="classical_mds"인 이유:
    # 기본값 'random'은 n=18 같은 작은 점 집합에서 SMACOF가 지역 최솟값에
    # 빠져 특정 카테고리만 압축이 덜 되는 현상이 있었다. 원본 1024차원에서는
    # 세 카테고리 응집도가 0.38~0.47로 비슷한데, random 초기화 2D에서는
    # 0.22 / 0.25 / 0.43으로 과일만 안 눌렸다. classical 초기화는 셋 다
    # 고르게 압축하고(0.22 / 0.26 / 0.26) 결정적이다.
    #
    # random_state를 두지 않은 이유: classical 초기화에서는 sklearn 내부
    # RNG 경로에 도달하지 않는다(init이 배열로 들어가면 random 초기화 분기를
    # 타지 않는다). 남겨두면 무언가 하는 것처럼 오해를 준다.
    # n_init=1은 명시적으로 고정한다 — 배열 init에서는 어차피 1로 강제되는데,
    # 미래 버전의 기본값 변경으로 경고가 뜨는 걸 막는다.
    mds = MDS(
        n_components=2,
        metric="precomputed",
        init="classical_mds",
        n_init=1,
        normalized_stress="auto",
    )
    coords = normalize_coords(mds.fit_transform(distances), margin=0.08)

    dataset = {
        "id": source["id"],
        "model": MODEL,
        "projection": "mds",
        "categories": source["categories"],
        "words": [
            {
                "id": w["id"],
                "label": w["label"],
                "emoji": w["emoji"],
                "category": w["category"],
                "x": round(float(coords[i][0]), 4),
                "y": round(float(coords[i][1]), 4),
            }
            for i, w in enumerate(words)
        ],
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"{source['id']}.json"
    out_path.write_text(
        json.dumps(dataset, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"wrote {out_path} ({len(words)} words)")


if __name__ == "__main__":
    main()
```

- [ ] **Step 6: 테스트 실행해서 통과 확인**

Run: `uv run pytest -v`
Expected: PASS — `3 passed`

- [ ] **Step 7: 실제 데이터셋 생성**

```bash
uv run python build_dataset.py
```

Expected:
```
loading nlpai-lab/KURE-v1 on cuda
wrote .../frontend/datasets/words-animals-vehicles.json (18 words)
```

첫 실행은 모델 다운로드(약 2GB) 때문에 몇 분 걸린다. `on cpu`로 뜨면 GPU를 못 잡은 것이니 CUDA 지원 torch가 설치됐는지 확인한다 — 단어 18개라 CPU로도 끝나지만 데이터셋을 늘릴 때 느려진다.

- [ ] **Step 8: 클러스터 품질을 숫자로 검증**

육안 검수는 검증이 아니다. 임시 스크립트로 아래를 계산해서 확인한다(커밋하지 않는다).

측정 항목:
- 같은 카테고리 쌍의 평균 2D 거리, 다른 카테고리 쌍의 평균 거리, 그 비율
- 카테고리별 응집도(카테고리 내부 평균 쌍거리) 3개
- 카테고리 무게중심 3개와 서로 간 거리
- 가장 가까운 5쌍, 가장 먼 5쌍 (라벨과 같음/다름 표시)

합격 기준:

| 항목 | 기준 | 실제 달성값 |
|---|---|---|
| 같은/다른 카테고리 비율 | ≥ 2.0배 | **2.12배** |
| 응집도 편차 (최대/최소) | ≤ 1.6배 | **1.13배** |
| 무게중심 최소 이격 | ≥ 0.25 | **0.5435** |
| 가장 가까운 5쌍 | 전부 같은 카테고리 | **5/5** |
| 가장 먼 5쌍의 같은 카테고리 | ≤ 1개 | **0개** |

기준을 못 넘으면 **`words.yaml`을 고쳐 재생성한다. 좌표는 어떤 경우에도 손으로 고치지 않는다.**

다만 기준 미달일 때 **단어부터 의심하지 말 것.** 이 프로젝트에서 실제로 두 번 헛짚었다. 먼저 원본 1024차원 코사인 거리 기준으로 같은 지표를 내서, 원본에서도 퍼져 있는지(단어 문제) 2D에서만 퍼지는지(투영 문제)를 구분한다. 실제 원인은 MDS 초기화였다.

- [ ] **Step 8-1: 재현성 확인**

`build_dataset.py`를 두 번 돌려서 출력 JSON의 SHA256이 동일한지 확인한다.

```bash
uv run python build_dataset.py && sha256sum ../../frontend/datasets/words-animals-vehicles.json
uv run python build_dataset.py && sha256sum ../../frontend/datasets/words-animals-vehicles.json
```

Expected: 두 해시가 동일. 다르면 파이프라인에 무작위성이 남아 있는 것이다.

- [ ] **Step 9: 커밋**

```bash
cd ../..
git add tools/embed frontend/datasets
git commit -m "feat: 임베딩 사전 계산 도구와 첫 데이터셋 추가"
```

---

## Task 6: 콘텐츠 로더

레슨 JSON과 데이터셋 JSON을 읽어 zod로 검증한다. 깨진 콘텐츠가 런타임에 도달하지 않게 막는 문지기다.

**Files:**
- Create: `frontend/lessons/embedding-map.json`
- Create: `frontend/lib/content.ts`
- Test: `frontend/lib/content.test.ts`

- [ ] **Step 1: 레슨 JSON 작성**

`frontend/lessons/embedding-map.json`:

```json
{
  "id": "embedding-map",
  "order": 1,
  "lang": "ko",
  "title": "비슷한 말끼리 모여라",
  "playground": "EmbeddingMap",
  "dataset": "words-animals-vehicles",
  "steps": [
    {
      "type": "hook",
      "owl": "컴퓨터는 '강아지'라는 말을 몰라. 그럼 어떻게 알아듣지?"
    },
    {
      "type": "play",
      "owl": [
        "아무거나 끌어다 놔봐!",
        "오! 네가 놓은 자리가 아니라 제자리로 가네?",
        "하나 더 놔볼래? 뭐가 붙는지 보자.",
        "어? 뭔가 보이기 시작하는데?",
        "계속 놔봐. 자리가 정해져 있는 것 같지?",
        "이제 무리가 생기는 게 보여?",
        "몇 덩어리로 나뉘었는지 세어볼래?"
      ],
      "goal": { "minPlaced": 9 }
    },
    {
      "type": "name",
      "concept": "임베딩",
      "body": "컴퓨터는 말을 숫자로 바꿔서 기억해. 비슷한 뜻일수록 숫자가 비슷해지고, 그래서 지도에서 가까이 붙는 거야."
    },
    {
      "type": "challenge",
      "question": "'호랑이'는 어디에 놓일까?",
      "choices": ["강아지 근처", "자동차 근처", "딸기 근처"],
      "answer": 0,
      "explain": "호랑이도 동물이니까 다른 동물들 쪽으로 가!"
    },
    {
      "type": "reward",
      "badge": "map-explorer"
    }
  ]
}
```

**대본을 쓸 때 지킬 규칙 — 이 프로젝트에서 두 번 걸렸다.**

`play` 스텝의 `owl` 배열은 **아이가 놓은 개수**로 인덱싱된다(`owl[placedCount]`). 어떤 단어를 놓았는지는 보지 않는다. 따라서 **모든 대사는 아이가 무엇을 어떤 순서로 놓든 참이어야 한다.**

걸렸던 예:
- `"강아지랑 고양이가 붙었네"` — 아이가 그 둘을 안 놓았을 수 있다
- `"비슷한 것끼리 붙었네"` (3개 시점) — C(18,3) 중 25.7%는 세 카테고리에서 하나씩 뽑혀 아무것도 안 붙는다

해법은 **단정 대신 질문**이다. "붙었네"가 아니라 "뭔가 보이기 시작하는데?"로 쓰면 어떤 상태에서도 어색하지 않다.

**`minPlaced`는 체험이 실제로 일어나는 지점에 맞춘다.** 세 카테고리가 전부 2개 이상 놓여야 "덩어리"라고 부를 수 있는데:

| minPlaced | 세 카테고리 모두 2개 이상 |
|---|---|
| 6 | 16.97% |
| 8 | 60.39% |
| **9** | **76.31%** |

6이면 5번 중 4번은 어느 한 카테고리가 점 하나만 있는 상태로 다음 단계로 넘어간다. 그런데 바로 다음 `name` 스텝이 "비슷한 뜻일수록 가까이 붙는다"고 설명한다 — 아이가 못 본 걸 설명하는 꼴이다. 그래서 9로 잡았다.

**`explain`은 실제 데이터와 맞아야 한다.** 원래 "강아지·고양이 쪽으로 가!"였는데, 호랑이의 이웃 순위가 병아리(0.1955) 코끼리(0.2172) 토끼(0.2391) 물고기(0.2439) 강아지(0.2609) 고양이(0.3576)라 하필 가장 먼 동물 둘을 지목한 셈이었다. 특정 단어를 지목하지 않는 표현으로 바꿨다.

- [ ] **Step 2: 실패하는 테스트 작성**

`frontend/lib/content.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { getLesson, getDataset, listLessons, assertPlayable } from "./content";

describe("content 로더", () => {
  it("embedding-map 레슨을 검증해서 읽는다", () => {
    const lesson = getLesson("embedding-map");
    expect(lesson.title).toBe("비슷한 말끼리 모여라");
    expect(lesson.steps[0].type).toBe("hook");
  });

  it("레슨이 참조하는 데이터셋이 실제로 존재한다", () => {
    const lesson = getLesson("embedding-map");
    const dataset = getDataset(lesson.dataset);
    expect(dataset.words.length).toBeGreaterThanOrEqual(10);
  });

  it("없는 레슨을 요청하면 에러를 던진다", () => {
    expect(() => getLesson("nope")).toThrow(/nope/);
  });

  it("레슨 목록을 order 순으로 돌려준다", () => {
    const orders = listLessons().map((l) => l.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it("실제 레슨과 데이터셋 조합은 끝까지 진행 가능하다", () => {
    const lesson = getLesson("embedding-map");
    expect(() =>
      assertPlayable(lesson, getDataset(lesson.dataset)),
    ).not.toThrow();
  });

  it("데이터셋 단어 수보다 minPlaced가 크면 거부한다", () => {
    const lesson = getLesson("embedding-map");
    const dataset = getDataset(lesson.dataset);
    const tooFew = { ...dataset, words: dataset.words.slice(0, 2) };

    expect(() => assertPlayable(lesson, tooFew)).toThrow(/minPlaced/);
  });
});
```

> 마지막 두 테스트가 **소프트락**을 막는다. `play` 스텝의 `minPlaced`가 데이터셋 단어 수보다 크면 아이가 단어를 전부 놓아도 "다 했어요" 버튼이 안 나온다. 스키마는 레슨 파일과 데이터셋 파일을 따로 검증하므로 이 조합 검사는 로더에서만 할 수 있다. `words.yaml`에서 단어를 지우는 순간 터지는 종류의 사고다.

- [ ] **Step 3: 테스트 실행해서 실패 확인**

Run: `npm run test lib/content`
Expected: FAIL — `Failed to resolve import "./content"`

- [ ] **Step 4: 로더 구현**

`frontend/lib/content.ts`:

```ts
import { lessonSchema, type Lesson } from "./lesson-schema";
import { datasetSchema, type Dataset } from "./dataset-schema";

import embeddingMapLesson from "@/lessons/embedding-map.json";
import wordsAnimalsVehicles from "@/datasets/words-animals-vehicles.json";

const rawLessons: Record<string, unknown> = {
  "embedding-map": embeddingMapLesson,
};

const rawDatasets: Record<string, unknown> = {
  "words-animals-vehicles": wordsAnimalsVehicles,
};

export function getDataset(id: string): Dataset {
  const raw = rawDatasets[id];
  if (!raw) throw new Error(`알 수 없는 데이터셋: ${id}`);
  return datasetSchema.parse(raw);
}

/**
 * 레슨이 자기 데이터셋으로 실제로 끝까지 진행 가능한지 확인한다.
 *
 * play 스텝의 minPlaced가 데이터셋 단어 수보다 크면, 아이가 단어를 전부
 * 놓아도 목표를 못 채워 다음 단계로 못 넘어간다 — 소프트락이다.
 * 스키마는 두 파일을 따로 보므로 이 검사는 여기서만 할 수 있다.
 */
export function assertPlayable(lesson: Lesson, dataset: Dataset): void {
  lesson.steps.forEach((step) => {
    if (step.type !== "play") return;

    if (step.goal.minPlaced > dataset.words.length) {
      throw new Error(
        `레슨 ${lesson.id}: minPlaced(${step.goal.minPlaced})가 ` +
          `데이터셋 단어 수(${dataset.words.length})보다 많습니다. ` +
          `아이가 전부 놓아도 다음으로 넘어갈 수 없습니다.`,
      );
    }
  });
}

export function getLesson(id: string): Lesson {
  const raw = rawLessons[id];
  if (!raw) throw new Error(`알 수 없는 레슨: ${id}`);

  const lesson = lessonSchema.parse(raw);
  assertPlayable(lesson, getDataset(lesson.dataset));

  return lesson;
}

export function listLessons(): Lesson[] {
  return Object.keys(rawLessons)
    .map(getLesson)
    .sort((a, b) => a.order - b.order);
}
```

- [ ] **Step 5: tsconfig에서 JSON import 허용 확인**

`frontend/tsconfig.json`의 `compilerOptions`에 다음이 있는지 확인하고, 없으면 추가:

```json
"resolveJsonModule": true
```

- [ ] **Step 6: 테스트 실행해서 통과 확인**

Run: `npm run test lib/content`
Expected: PASS — `6 passed`

- [ ] **Step 7: 커밋**

```bash
git add frontend/lessons frontend/lib frontend/tsconfig.json
git commit -m "feat: 레슨 1 JSON과 검증 로더 추가"
```

---

## Task 7: 놀이터 기하 계산 (순수 함수)

DOM을 모르는 순수 함수만 모은다. 놀이터의 두뇌에 해당하며 여기서 대부분의 로직 테스트가 끝난다.

**Files:**
- Create: `frontend/playgrounds/embedding-map/geometry.ts`
- Test: `frontend/playgrounds/embedding-map/geometry.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`frontend/playgrounds/embedding-map/geometry.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  toNormalized,
  distance,
  linkStyle,
  buildLinks,
  LINK_THRESHOLD,
} from "./geometry";

const rect = { left: 100, top: 50, width: 400, height: 200 };

describe("toNormalized", () => {
  it("화면 좌표를 0~1 좌표로 바꾼다", () => {
    expect(toNormalized({ x: 300, y: 150 }, rect)).toEqual({ x: 0.5, y: 0.5 });
  });

  it("영역 밖 좌표를 0~1로 자른다", () => {
    expect(toNormalized({ x: 0, y: 0 }, rect)).toEqual({ x: 0, y: 0 });
    expect(toNormalized({ x: 9999, y: 9999 }, rect)).toEqual({ x: 1, y: 1 });
  });
});

describe("distance", () => {
  it("두 점 사이 유클리드 거리를 잰다", () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
});

describe("linkStyle", () => {
  it("가까울수록 선이 굵어진다", () => {
    const near = linkStyle(0.02);
    const far = linkStyle(LINK_THRESHOLD * 0.9);
    expect(near!.width).toBeGreaterThan(far!.width);
  });

  it("임계값보다 멀면 선을 그리지 않는다", () => {
    expect(linkStyle(LINK_THRESHOLD + 0.01)).toBeNull();
  });
});

describe("buildLinks", () => {
  it("가까운 쌍만 연결하고 쌍을 중복하지 않는다", () => {
    const links = buildLinks([
      { id: "a", x: 0.1, y: 0.1 },
      { id: "b", x: 0.12, y: 0.1 },
      { id: "c", x: 0.9, y: 0.9 },
    ]);

    expect(links).toHaveLength(1);
    expect(links[0].fromId).toBe("a");
    expect(links[0].toId).toBe("b");
  });

  it("점이 하나뿐이면 연결이 없다", () => {
    expect(buildLinks([{ id: "a", x: 0.5, y: 0.5 }])).toEqual([]);
  });
});
```

- [ ] **Step 2: 테스트 실행해서 실패 확인**

Run: `npm run test playgrounds/embedding-map/geometry`
Expected: FAIL — `Failed to resolve import "./geometry"`

- [ ] **Step 3: 구현**

`frontend/playgrounds/embedding-map/geometry.ts`:

```ts
export interface Point {
  x: number;
  y: number;
}

export interface PositionedWord extends Point {
  id: string;
}

export interface Link {
  fromId: string;
  toId: string;
  from: Point;
  to: Point;
  width: number;
  opacity: number;
}

/** 이 거리보다 멀면 선을 그리지 않는다. 0~1 정규화 좌표 기준. */
export const LINK_THRESHOLD = 0.22;
// 실데이터(18단어)로 검증한 값이다. 이 임계값에서 링크 16개가 생기고
// 전부 같은 카테고리끼리 연결된다. 0.30까지 올리면 카테고리를 넘나드는
// 오연결이 4개 생겨 "선 = 비슷함"이라는 메시지가 깨진다.
// 데이터셋을 새로 만들면 같은 방식으로 다시 검증할 것.

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function toNormalized(
  point: Point,
  rect: { left: number; top: number; width: number; height: number },
): Point {
  return {
    x: clamp01((point.x - rect.left) / rect.width),
    y: clamp01((point.y - rect.top) / rect.height),
  };
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function linkStyle(d: number): { width: number; opacity: number } | null {
  if (d > LINK_THRESHOLD) return null;
  const closeness = 1 - d / LINK_THRESHOLD;
  return {
    width: 2 + closeness * 5,
    opacity: 0.2 + closeness * 0.45,
  };
}

export function buildLinks(words: PositionedWord[]): Link[] {
  const links: Link[] = [];

  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j < words.length; j++) {
      const a = words[i];
      const b = words[j];
      const style = linkStyle(distance(a, b));
      if (!style) continue;

      links.push({
        fromId: a.id,
        toId: b.id,
        from: { x: a.x, y: a.y },
        to: { x: b.x, y: b.y },
        ...style,
      });
    }
  }

  return links;
}
```

- [ ] **Step 4: 테스트 실행해서 통과 확인**

Run: `npm run test playgrounds/embedding-map/geometry`
Expected: PASS — `7 passed`

- [ ] **Step 5: 커밋**

```bash
git add frontend/playgrounds
git commit -m "feat: 임베딩 지도 기하 계산 순수 함수 추가"
```

---

## Task 8: 놀이터 계약과 레지스트리

**Files:**
- Create: `frontend/playgrounds/types.ts`
- Create: `frontend/playgrounds/registry.ts`
- Test: `frontend/playgrounds/registry.test.ts`

- [ ] **Step 1: 계약 타입 작성**

`frontend/playgrounds/types.ts`:

```ts
import type { ComponentType } from "react";

/** 놀이터가 바깥으로 올려보내는 사건. 놀이터는 이걸 누가 듣는지 모른다. */
export interface PlaygroundEvent {
  type: string;
  payload?: Record<string, unknown>;
}

/** 아이가 만들어낸 결과물. "내 방"에 저장될 재료다. */
export interface Artifact {
  kind: string;
  payload: Record<string, unknown>;
}

export interface PlaygroundProps {
  data: unknown;
  onEvent: (event: PlaygroundEvent) => void;
  onArtifact: (artifact: Artifact) => void;
}

export type PlaygroundComponent = ComponentType<PlaygroundProps>;
```

- [ ] **Step 2: 실패하는 테스트 작성**

`frontend/playgrounds/registry.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { getPlayground } from "./registry";

describe("놀이터 레지스트리", () => {
  it("EmbeddingMap을 이름으로 찾는다", () => {
    expect(getPlayground("EmbeddingMap")).toBeTypeOf("function");
  });

  it("없는 놀이터를 요청하면 에러를 던진다", () => {
    expect(() => getPlayground("Nope")).toThrow(/Nope/);
  });
});
```

- [ ] **Step 3: 테스트 실행해서 실패 확인**

Run: `npm run test playgrounds/registry`
Expected: FAIL — `Failed to resolve import "./registry"`

- [ ] **Step 4: EmbeddingMap 자리표시 컴포넌트와 레지스트리 구현**

Task 9에서 본체를 채운다. 지금은 레지스트리가 동작하는 최소 형태만 만든다.

`frontend/playgrounds/embedding-map/EmbeddingMap.tsx`:

```tsx
"use client";

import type { PlaygroundProps } from "../types";

export default function EmbeddingMap(_props: PlaygroundProps) {
  return <div data-testid="embedding-map" />;
}
```

`frontend/playgrounds/registry.ts`:

```ts
import EmbeddingMap from "./embedding-map/EmbeddingMap";
import type { PlaygroundComponent } from "./types";

const registry: Record<string, PlaygroundComponent> = {
  EmbeddingMap,
};

export function getPlayground(name: string): PlaygroundComponent {
  const component = registry[name];
  if (!component) throw new Error(`알 수 없는 놀이터: ${name}`);
  return component;
}
```

- [ ] **Step 5: 테스트 실행해서 통과 확인**

Run: `npm run test playgrounds/registry`
Expected: PASS — `2 passed`

- [ ] **Step 6: 커밋**

```bash
git add frontend/playgrounds
git commit -m "feat: 놀이터 계약 타입과 레지스트리 추가"
```

---

## Task 9: EmbeddingMap 놀이터

이 계획의 핵심이다. 아이가 단어를 끌어다 놓으면 자석처럼 제자리로 튕겨 간다.

**Files:**
- Create: `frontend/playgrounds/embedding-map/WordChip.tsx`
- Modify: `frontend/playgrounds/embedding-map/EmbeddingMap.tsx` (전체 교체)
- Test: `frontend/playgrounds/embedding-map/EmbeddingMap.test.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

`frontend/playgrounds/embedding-map/EmbeddingMap.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import EmbeddingMap from "./EmbeddingMap";
import type { Dataset } from "@/lib/dataset-schema";

const data: Dataset = {
  id: "test",
  model: "nlpai-lab/KURE-v1",
  projection: "mds",
  categories: [
    { id: "animal", label: "동물", color: "#FF6B6B" },
    { id: "vehicle", label: "탈것", color: "#4ECDC4" },
  ],
  words: [
    { id: "dog", label: "강아지", emoji: "🐶", category: "animal", x: 0.2, y: 0.2 },
    { id: "cat", label: "고양이", emoji: "🐱", category: "animal", x: 0.25, y: 0.24 },
    { id: "car", label: "자동차", emoji: "🚗", category: "vehicle", x: 0.85, y: 0.8 },
  ],
};

function setup() {
  const onEvent = vi.fn();
  const onArtifact = vi.fn();
  render(<EmbeddingMap data={data} onEvent={onEvent} onArtifact={onArtifact} />);
  return { onEvent, onArtifact };
}

beforeEach(() => {
  // jsdom은 레이아웃을 계산하지 않으므로 지도 영역 크기를 고정한다
  Element.prototype.getBoundingClientRect = vi.fn(() => ({
    left: 0, top: 0, width: 400, height: 400,
    right: 400, bottom: 400, x: 0, y: 0, toJSON: () => ({}),
  })) as unknown as () => DOMRect;
});

describe("EmbeddingMap", () => {
  it("처음에는 모든 단어가 서랍에 있고 지도는 비어 있다", () => {
    setup();
    expect(screen.getAllByTestId(/^drawer-word-/)).toHaveLength(3);
    expect(screen.queryAllByTestId(/^placed-word-/)).toHaveLength(0);
  });

  it("단어를 지도에 놓으면 지도로 옮겨간다", () => {
    setup();
    fireEvent.click(screen.getByTestId("drawer-word-dog"));

    expect(screen.getByTestId("placed-word-dog")).toBeInTheDocument();
    expect(screen.queryByTestId("drawer-word-dog")).not.toBeInTheDocument();
  });

  it("단어를 놓을 때마다 placed 이벤트를 올려보낸다", () => {
    const { onEvent } = setup();
    fireEvent.click(screen.getByTestId("drawer-word-dog"));

    expect(onEvent).toHaveBeenCalledWith({
      type: "placed",
      payload: { wordId: "dog", placedCount: 1 },
    });
  });

  it("가까운 두 단어 사이에만 선이 생긴다", () => {
    setup();
    fireEvent.click(screen.getByTestId("drawer-word-dog"));
    fireEvent.click(screen.getByTestId("drawer-word-cat"));
    expect(screen.getAllByTestId(/^link-/)).toHaveLength(1);

    fireEvent.click(screen.getByTestId("drawer-word-car"));
    expect(screen.getAllByTestId(/^link-/)).toHaveLength(1);
  });

  it("모든 단어를 놓으면 작품을 올려보낸다", () => {
    const { onArtifact } = setup();
    fireEvent.click(screen.getByTestId("drawer-word-dog"));
    fireEvent.click(screen.getByTestId("drawer-word-cat"));
    fireEvent.click(screen.getByTestId("drawer-word-car"));

    expect(onArtifact).toHaveBeenCalledWith({
      kind: "embedding-map",
      payload: { datasetId: "test", placedIds: ["dog", "cat", "car"] },
    });
  });
});
```

> 테스트는 드래그가 아니라 **클릭**으로 배치한다. 클릭도 정식 배치 수단이다 — 마우스 없이 터치만 쓰는 아이, 드래그가 어려운 아이를 위한 접근성 경로이며 동시에 테스트를 안정적으로 만든다.

- [ ] **Step 2: 테스트 실행해서 실패 확인**

Run: `npm run test playgrounds/embedding-map/EmbeddingMap`
Expected: FAIL — `Unable to find an element by: [data-testid="drawer-word-dog"]`

- [ ] **Step 3: WordChip 구현**

`frontend/playgrounds/embedding-map/WordChip.tsx`:

```tsx
"use client";

interface WordChipProps {
  label: string;
  emoji: string;
  color: string;
  testId: string;
  onActivate?: () => void;
}

export default function WordChip({
  label,
  emoji,
  color,
  testId,
  onActivate,
}: WordChipProps) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onActivate}
      style={{ backgroundColor: color }}
      className="whitespace-nowrap rounded-full border-[2.5px] border-ink px-3 py-1 text-sm font-extrabold text-ink shadow-[0_3px_0_var(--color-ink)]"
    >
      {emoji} {label}
    </button>
  );
}
```

- [ ] **Step 4: EmbeddingMap 본체 구현**

`frontend/playgrounds/embedding-map/EmbeddingMap.tsx` 전체를 교체:

```tsx
"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import type { Dataset } from "@/lib/dataset-schema";
import type { PlaygroundProps } from "../types";
import WordChip from "./WordChip";
import { buildLinks } from "./geometry";

export default function EmbeddingMap({
  data,
  onEvent,
  onArtifact,
}: PlaygroundProps) {
  const dataset = data as Dataset;
  const [placedIds, setPlacedIds] = useState<string[]>([]);

  const colorOf = useMemo(() => {
    const map = new Map(dataset.categories.map((c) => [c.id, c.color]));
    return (categoryId: string) => map.get(categoryId) ?? "#FFFFFF";
  }, [dataset.categories]);

  const placedWords = placedIds.map(
    (id) => dataset.words.find((w) => w.id === id)!,
  );
  const drawerWords = dataset.words.filter((w) => !placedIds.includes(w.id));
  const links = buildLinks(placedWords);

  function place(wordId: string) {
    const next = [...placedIds, wordId];
    setPlacedIds(next);
    onEvent({
      type: "placed",
      payload: { wordId, placedCount: next.length },
    });

    if (next.length === dataset.words.length) {
      onArtifact({
        kind: "embedding-map",
        payload: { datasetId: dataset.id, placedIds: next },
      });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        data-testid="map-area"
        className="relative aspect-[4/3] w-full rounded-pop border-[3px] border-ink bg-paper shadow-[0_4px_0_var(--color-ink)]"
      >
        {/* 좌표 레이어 — 지도 테두리보다 안쪽으로 들여놓는다.
            칩은 좌표를 중심으로 그려지므로, 가장자리 칩이 지도 밖으로
            삐져나가지 않으려면 칩 반폭만큼의 여백이 필요하다. */}
        <div className="absolute inset-x-12 inset-y-6">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {links.map((link) => (
              <line
                key={`${link.fromId}-${link.toId}`}
                data-testid={`link-${link.fromId}-${link.toId}`}
                x1={link.from.x * 100}
                y1={link.from.y * 100}
                x2={link.to.x * 100}
                y2={link.to.y * 100}
                stroke="var(--color-ink)"
                strokeWidth={link.width}
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                opacity={link.opacity}
              />
            ))}
          </svg>

          {placedWords.map((word) => (
            <motion.div
              key={word.id}
              data-testid={`placed-word-${word.id}`}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              initial={{ scale: 1.3, opacity: 0.7 }}
              animate={{
                left: `${word.x * 100}%`,
                top: `${word.y * 100}%`,
                scale: 1,
                opacity: 1,
              }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
            >
              <WordChip
                testId={`chip-${word.id}`}
                label={word.label}
                emoji={word.emoji}
                color={colorOf(word.category)}
              />
            </motion.div>
          ))}
        </div>
      </div>

      <div data-testid="word-drawer" className="flex flex-wrap gap-2">
        {drawerWords.map((word) => (
          <WordChip
            key={word.id}
            testId={`drawer-word-${word.id}`}
            label={word.label}
            emoji={word.emoji}
            color={colorOf(word.category)}
            onActivate={() => place(word.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 테스트 실행해서 통과 확인**

Run: `npm run test playgrounds/embedding-map/EmbeddingMap`
Expected: PASS — `5 passed`

**연결선에 `vectorEffect="non-scaling-stroke"`가 반드시 필요하다.** SVG가 `preserveAspectRatio="none"`으로 뷰박스 100×100을 컨테이너 비율에 맞춰 찌그러뜨리는데, 이 변환은 좌표뿐 아니라 **선 두께에도 적용된다.** 지도가 4:3이므로 가로선과 세로선이 서로 다른 두께로 그려지고 대각선은 길이를 따라 두께가 변한다. "두께 = 가까움"이라는 설계가 방향에 따라 왜곡되는 것이다. `non-scaling-stroke`를 쓰면 두께가 화면 픽셀 단위로 고정되므로, `linkStyle`이 돌려주는 2~7이 그대로 픽셀 두께가 된다(나누지 않는다).

**배치 연출은 이동 거리가 짧아도 눈에 띄어야 한다.** `initial={{ scale: 1.3, opacity: 0.7 }}`가 그 역할을 한다. 부엉이가 첫 배치 직후 "네가 놓은 자리가 아니라 제자리로 가네?"라고 말하는데, 아이가 우연히 진짜 좌표 근처에 놓으면 이동이 거의 없다 — 지도 중앙에서 물고기까지는 0.126밖에 안 된다. 이동이 안 보여도 칩이 크게 나타났다 줄어드는 연출 덕에 "뭔가 일어났다"는 신호는 간다. 이 값을 줄이지 말 것.

- [ ] **Step 6: 커밋**

```bash
git add frontend/playgrounds
git commit -m "feat: 임베딩 지도 놀이터 구현 (배치·스프링 이동·연결선)"
```

---

## Task 10: 드래그로 배치하기

Task 9의 클릭 배치 위에 드래그를 얹는다. **드래그가 주된 조작이고 클릭은 접근성 경로다** — 터치만 쓰는 아이, 소근육 조작이 어려운 아이도 진행할 수 있어야 한다. 둘 다 같은 `place()`로 흘러간다.

**Files:**
- Modify: `frontend/vitest.setup.ts`
- Modify: `frontend/playgrounds/embedding-map/geometry.ts`
- Modify: `frontend/playgrounds/embedding-map/geometry.test.ts`
- Modify: `frontend/playgrounds/embedding-map/WordChip.tsx` (전체 교체)
- Modify: `frontend/playgrounds/embedding-map/EmbeddingMap.tsx` (전체 교체)
- Modify: `frontend/playgrounds/embedding-map/EmbeddingMap.test.tsx` (테스트 추가)

- [ ] **Step 1: jsdom에 PointerEvent 폴리필 추가**

jsdom에는 `PointerEvent`가 없어 포인터 이벤트 테스트가 `PointerEvent is not defined`로 죽는다.

`frontend/vitest.setup.ts` 전체를 교체:

```ts
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom은 PointerEvent를 구현하지 않는다. MouseEvent로 대체한다.
if (typeof window !== "undefined" && !window.PointerEvent) {
  class PointerEventPolyfill extends MouseEvent {
    constructor(type: string, params: MouseEventInit = {}) {
      super(type, params);
    }
  }
  window.PointerEvent = PointerEventPolyfill as unknown as typeof PointerEvent;
}

// @testing-library/react의 자동 cleanup은 설정에 의존한다. 명시적으로 건다.
afterEach(() => {
  cleanup();
});
```

- [ ] **Step 2: isInsideRect의 실패하는 테스트 추가**

`frontend/playgrounds/embedding-map/geometry.test.ts` 의 import 줄을 교체:

```ts
import {
  toNormalized,
  distance,
  linkStyle,
  buildLinks,
  isInsideRect,
  LINK_THRESHOLD,
} from "./geometry";
```

파일 맨 끝에 추가:

```ts
describe("isInsideRect", () => {
  it("영역 안의 점을 참으로 본다", () => {
    expect(isInsideRect({ x: 200, y: 100 }, rect)).toBe(true);
  });

  it("영역 밖의 점을 거짓으로 본다", () => {
    expect(isInsideRect({ x: 50, y: 100 }, rect)).toBe(false);
    expect(isInsideRect({ x: 200, y: 900 }, rect)).toBe(false);
  });

  it("경계 위의 점을 안으로 본다", () => {
    expect(isInsideRect({ x: 100, y: 50 }, rect)).toBe(true);
    expect(isInsideRect({ x: 500, y: 250 }, rect)).toBe(true);
  });
});
```

- [ ] **Step 3: 테스트 실행해서 실패 확인**

Run: `npm run test playgrounds/embedding-map/geometry`
Expected: FAIL — `isInsideRect is not a function`

- [ ] **Step 4: isInsideRect 구현**

`frontend/playgrounds/embedding-map/geometry.ts` 파일 맨 끝에 추가:

```ts
export function isInsideRect(
  point: Point,
  rect: { left: number; top: number; width: number; height: number },
): boolean {
  return (
    point.x >= rect.left &&
    point.x <= rect.left + rect.width &&
    point.y >= rect.top &&
    point.y <= rect.top + rect.height
  );
}
```

- [ ] **Step 5: 테스트 실행해서 통과 확인**

Run: `npm run test playgrounds/embedding-map/geometry`
Expected: PASS — `10 passed`

- [ ] **Step 6: 드래그의 실패하는 테스트 추가**

`frontend/playgrounds/embedding-map/EmbeddingMap.test.tsx` 의 마지막 `describe` 블록 안, 기존 테스트들 뒤에 추가:

```tsx
  it("드래그해서 지도 안에 놓으면 배치된다", () => {
    setup();
    const chip = screen.getByTestId("drawer-word-dog");

    fireEvent.pointerDown(chip, { clientX: 10, clientY: 380 });
    fireEvent.pointerMove(window, { clientX: 200, clientY: 200 });
    fireEvent.pointerUp(window, { clientX: 200, clientY: 200 });

    expect(screen.getByTestId("placed-word-dog")).toBeInTheDocument();
  });

  it("지도 밖에서 손을 떼면 배치되지 않는다", () => {
    setup();
    const chip = screen.getByTestId("drawer-word-dog");

    fireEvent.pointerDown(chip, { clientX: 10, clientY: 380 });
    fireEvent.pointerMove(window, { clientX: 900, clientY: 900 });
    fireEvent.pointerUp(window, { clientX: 900, clientY: 900 });

    expect(screen.queryByTestId("placed-word-dog")).not.toBeInTheDocument();
    expect(screen.getByTestId("drawer-word-dog")).toBeInTheDocument();
  });

  it("드래그하는 동안 손가락을 따라다니는 칩이 보인다", () => {
    setup();

    fireEvent.pointerDown(screen.getByTestId("drawer-word-dog"), {
      clientX: 10,
      clientY: 380,
    });
    fireEvent.pointerMove(window, { clientX: 120, clientY: 150 });

    expect(screen.getByTestId("drag-ghost")).toBeInTheDocument();
  });
```

> `getBoundingClientRect`가 모든 요소에 대해 `0,0,400,400`을 돌려주도록 목킹돼 있으므로 `(200,200)`은 지도 안, `(900,900)`은 지도 밖이다.

- [ ] **Step 7: 테스트 실행해서 실패 확인**

Run: `npm run test playgrounds/embedding-map/EmbeddingMap`
Expected: FAIL — `Unable to find an element by: [data-testid="placed-word-dog"]`

- [ ] **Step 8: WordChip에 드래그 시작 핸들러 추가**

`frontend/playgrounds/embedding-map/WordChip.tsx` 전체를 교체:

```tsx
"use client";

import type { PointerEvent as ReactPointerEvent } from "react";

interface WordChipProps {
  label: string;
  emoji: string;
  color: string;
  testId: string;
  onActivate?: () => void;
  onDragStart?: (event: ReactPointerEvent) => void;
}

export default function WordChip({
  label,
  emoji,
  color,
  testId,
  onActivate,
  onDragStart,
}: WordChipProps) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onActivate}
      onPointerDown={onDragStart}
      style={{ backgroundColor: color, touchAction: "none" }}
      className="whitespace-nowrap rounded-full border-[2.5px] border-ink px-3 py-1 text-sm font-extrabold text-ink shadow-[0_3px_0_var(--color-ink)]"
    >
      {emoji} {label}
    </button>
  );
}
```

> `touchAction: "none"`이 없으면 모바일에서 드래그가 페이지 스크롤로 먹힌다.

- [ ] **Step 9: EmbeddingMap 전체 교체**

`frontend/playgrounds/embedding-map/EmbeddingMap.tsx` 전체를 교체:

```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import type { Dataset } from "@/lib/dataset-schema";
import type { PlaygroundProps } from "../types";
import WordChip from "./WordChip";
import { buildLinks, isInsideRect } from "./geometry";

interface DragState {
  wordId: string;
  x: number;
  y: number;
}

export default function EmbeddingMap({
  data,
  onEvent,
  onArtifact,
}: PlaygroundProps) {
  const dataset = data as Dataset;
  const [placedIds, setPlacedIds] = useState<string[]>([]);
  const [drag, setDrag] = useState<DragState | null>(null);

  // 이벤트 핸들러 안에서 최신 배치 목록을 읽기 위한 거울. 닫힘(closure) 문제를 피한다.
  const placedRef = useRef<string[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);

  const wordById = useMemo(
    () => new Map(dataset.words.map((w) => [w.id, w])),
    [dataset.words],
  );

  const colorOf = useMemo(() => {
    const map = new Map(dataset.categories.map((c) => [c.id, c.color]));
    return (categoryId: string) => map.get(categoryId) ?? "#FFFFFF";
  }, [dataset.categories]);

  const placedWords = placedIds.map((id) => wordById.get(id)!);
  const drawerWords = dataset.words.filter((w) => !placedIds.includes(w.id));
  const links = buildLinks(placedWords);

  function place(wordId: string) {
    if (placedRef.current.includes(wordId)) return;

    const next = [...placedRef.current, wordId];
    placedRef.current = next;
    setPlacedIds(next);
    onEvent({ type: "placed", payload: { wordId, placedCount: next.length } });

    if (next.length === dataset.words.length) {
      onArtifact({
        kind: "embedding-map",
        payload: { datasetId: dataset.id, placedIds: next },
      });
    }
  }

  const draggingId = drag?.wordId ?? null;

  useEffect(() => {
    if (!draggingId) return;

    function move(event: PointerEvent) {
      setDrag((current) =>
        current ? { ...current, x: event.clientX, y: event.clientY } : current,
      );
    }

    function up(event: PointerEvent) {
      const rect = mapRef.current?.getBoundingClientRect();
      setDrag(null);

      if (rect && isInsideRect({ x: event.clientX, y: event.clientY }, rect)) {
        place(draggingId);
      }
    }

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    // place는 ref를 통해 최신 상태를 읽으므로 의존성에 넣지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingId]);

  const draggingWord = draggingId ? wordById.get(draggingId) : undefined;

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={mapRef}
        data-testid="map-area"
        className="relative aspect-[4/3] w-full rounded-pop border-[3px] border-ink bg-paper shadow-[0_4px_0_var(--color-ink)]"
      >
        {/* 좌표 레이어 — 지도 테두리보다 안쪽으로 들여놓는다.
            칩은 좌표를 중심으로 그려지므로, 가장자리 칩이 지도 밖으로
            삐져나가지 않으려면 칩 반폭만큼의 여백이 필요하다.
            드롭 판정은 바깥 map-area 전체를 쓴다(어디에 놓든 받아준다). */}
        <div className="absolute inset-x-12 inset-y-6">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {links.map((link) => (
              <line
                key={`${link.fromId}-${link.toId}`}
                data-testid={`link-${link.fromId}-${link.toId}`}
                x1={link.from.x * 100}
                y1={link.from.y * 100}
                x2={link.to.x * 100}
                y2={link.to.y * 100}
                stroke="var(--color-ink)"
                strokeWidth={link.width}
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                opacity={link.opacity}
              />
            ))}
          </svg>

          {placedWords.map((word) => (
            <motion.div
              key={word.id}
              data-testid={`placed-word-${word.id}`}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              initial={{ scale: 1.3, opacity: 0.7 }}
              animate={{
                left: `${word.x * 100}%`,
                top: `${word.y * 100}%`,
                scale: 1,
                opacity: 1,
              }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
            >
              <WordChip
                testId={`chip-${word.id}`}
                label={word.label}
                emoji={word.emoji}
                color={colorOf(word.category)}
              />
            </motion.div>
          ))}
        </div>
      </div>

      <div data-testid="word-drawer" className="flex flex-wrap gap-2">
        {drawerWords.map((word) => (
          <WordChip
            key={word.id}
            testId={`drawer-word-${word.id}`}
            label={word.label}
            emoji={word.emoji}
            color={colorOf(word.category)}
            onActivate={() => place(word.id)}
            onDragStart={(event) =>
              setDrag({
                wordId: word.id,
                x: event.clientX,
                y: event.clientY,
              })
            }
          />
        ))}
      </div>

      {drag && draggingWord && (
        <div
          data-testid="drag-ghost"
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 opacity-80"
          style={{ left: drag.x, top: drag.y }}
        >
          <WordChip
            testId={`ghost-${draggingWord.id}`}
            label={draggingWord.label}
            emoji={draggingWord.emoji}
            color={colorOf(draggingWord.category)}
          />
        </div>
      )}
    </div>
  );
}
```

> 클릭 배치도 그대로 살아 있다. 칩을 누르면 `pointerdown` → `pointerup`(서랍 위치라 지도 밖) → `click` 순으로 발생하는데, 드래그 경로는 지도 밖이라 아무 일도 안 하고 `click`이 `place()`를 부른다. `place()`가 중복을 막으므로 두 경로가 겹쳐도 안전하다.

- [ ] **Step 10: 테스트 실행해서 통과 확인**

Run: `npm run test playgrounds/embedding-map`
Expected: PASS — `18 passed` (geometry 10건 + EmbeddingMap 8건)

- [ ] **Step 11: 커밋**

```bash
git add frontend/playgrounds frontend/vitest.setup.ts
git commit -m "feat: 단어 칩 드래그 배치 추가 (클릭 경로는 접근성용으로 유지)"
```

---

## Task 11: UI 문자열 모음과 노리 말풍선

**Files:**
- Create: `frontend/copy/ui.ts`
- Create: `frontend/components/OwlBubble.tsx`
- Test: `frontend/components/OwlBubble.test.tsx`

- [ ] **Step 1: UI 문자열 파일 작성**

`frontend/copy/ui.ts`:

```ts
/** 화면에 나오는 고정 문구를 한곳에 모은다. 말투 일관성을 위해서다. */
export const ui = {
  owlName: "노리",
  landingTitle: "놀AI",
  landingSubtitle: "AI는 어떻게 생각할까?",
  landingCta: "시작하기",
  hookCta: "궁금해!",
  playDone: "다 했어요",
  nameCta: "알겠어!",
  challengeCorrect: "맞았어! 🎉",
  challengeRetry: "이렇게 되는 거야!",
  challengeNext: "다음으로",
  rewardTitle: "배지 획득!",
  rewardCta: "좋아!",
  lessonComplete: "레슨을 끝냈어!",
} as const;

export const badgeNames: Record<string, string> = {
  "map-explorer": "지도 탐험가",
};
```

- [ ] **Step 2: 실패하는 테스트 작성**

`frontend/components/OwlBubble.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import OwlBubble from "./OwlBubble";

describe("OwlBubble", () => {
  it("노리의 이름과 대사를 보여준다", () => {
    render(<OwlBubble text="아무거나 끌어다 놔봐!" />);
    expect(screen.getByText(/노리/)).toBeInTheDocument();
    expect(screen.getByText(/아무거나 끌어다 놔봐!/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: 테스트 실행해서 실패 확인**

Run: `npm run test components/OwlBubble`
Expected: FAIL — `Failed to resolve import "./OwlBubble"`

- [ ] **Step 4: 구현**

`frontend/components/OwlBubble.tsx`:

```tsx
import { ui } from "@/copy/ui";

export default function OwlBubble({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-pop border-[2.5px] border-ink bg-white px-3 py-2 shadow-[0_3px_0_var(--color-ink)]">
      <span className="text-xl leading-none" aria-hidden>
        🦉
      </span>
      <p className="text-sm leading-relaxed">
        <span className="font-extrabold">{ui.owlName}</span> — {text}
      </p>
    </div>
  );
}
```

- [ ] **Step 5: 테스트 실행해서 통과 확인**

Run: `npm run test components/OwlBubble`
Expected: PASS — `1 passed`

- [ ] **Step 6: 커밋**

```bash
git add frontend/copy frontend/components
git commit -m "feat: UI 문자열 모음과 노리 말풍선 컴포넌트 추가"
```

---

## Task 12: 스텝 컴포넌트 4종

`play`를 제외한 네 스텝의 화면. 각각 자기 데이터만 받고 "끝났다"를 콜백으로 알린다.

**Files:**
- Create: `frontend/components/steps/HookStep.tsx`
- Create: `frontend/components/steps/NameStep.tsx`
- Create: `frontend/components/steps/ChallengeStep.tsx`
- Create: `frontend/components/steps/RewardStep.tsx`
- Test: `frontend/components/steps/steps.test.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

`frontend/components/steps/steps.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HookStep from "./HookStep";
import NameStep from "./NameStep";
import ChallengeStep from "./ChallengeStep";
import RewardStep from "./RewardStep";

describe("HookStep", () => {
  it("질문을 보여주고 버튼을 누르면 다음으로 넘어간다", () => {
    const onDone = vi.fn();
    render(<HookStep owl="어떻게 알아듣지?" onDone={onDone} />);

    expect(screen.getByText(/어떻게 알아듣지/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "궁금해!" }));
    expect(onDone).toHaveBeenCalledOnce();
  });
});

describe("NameStep", () => {
  it("개념 이름과 설명을 보여준다", () => {
    const onDone = vi.fn();
    render(<NameStep concept="임베딩" body="숫자로 바꿔서 기억해." onDone={onDone} />);

    expect(screen.getByText("임베딩")).toBeInTheDocument();
    expect(screen.getByText(/숫자로 바꿔서/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "알겠어!" }));
    expect(onDone).toHaveBeenCalledOnce();
  });
});

describe("ChallengeStep", () => {
  const props = {
    question: "'호랑이'는 어디에?",
    choices: ["강아지 근처", "자동차 근처"],
    answer: 0,
    explain: "동물이니까!",
  };

  it("정답을 고르면 설명을 보여주고 다음으로 넘어갈 수 있다", () => {
    const onDone = vi.fn();
    render(<ChallengeStep {...props} onDone={onDone} />);

    fireEvent.click(screen.getByRole("button", { name: "강아지 근처" }));
    expect(screen.getByText(/동물이니까/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다음으로" }));
    expect(onDone).toHaveBeenCalledOnce();
  });

  it("오답을 골라도 진행을 막지 않고 설명을 보여준다", () => {
    const onDone = vi.fn();
    render(<ChallengeStep {...props} onDone={onDone} />);

    fireEvent.click(screen.getByRole("button", { name: "자동차 근처" }));
    expect(screen.getByText(/동물이니까/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다음으로" })).toBeEnabled();
  });
});

describe("RewardStep", () => {
  it("배지 이름을 한글로 보여준다", () => {
    const onDone = vi.fn();
    render(<RewardStep badge="map-explorer" onDone={onDone} />);

    expect(screen.getByText("지도 탐험가")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "좋아!" }));
    expect(onDone).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: 테스트 실행해서 실패 확인**

Run: `npm run test components/steps`
Expected: FAIL — `Failed to resolve import "./HookStep"`

- [ ] **Step 3: 공통 버튼 스타일과 HookStep 구현**

`frontend/components/steps/HookStep.tsx`:

```tsx
"use client";

import OwlBubble from "../OwlBubble";
import { ui } from "@/copy/ui";

export const popButton =
  "rounded-pop border-[2.5px] border-ink bg-candy-red px-5 py-2 font-extrabold text-white shadow-[0_3px_0_var(--color-ink)]";

export default function HookStep({
  owl,
  onDone,
}: {
  owl: string;
  onDone: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <span className="text-5xl" aria-hidden>
        🦉
      </span>
      <OwlBubble text={owl} />
      <button type="button" className={popButton} onClick={onDone}>
        {ui.hookCta}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: NameStep 구현**

`frontend/components/steps/NameStep.tsx`:

```tsx
"use client";

import { popButton } from "./HookStep";
import { ui } from "@/copy/ui";

export default function NameStep({
  concept,
  body,
  onDone,
}: {
  concept: string;
  body: string;
  onDone: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <p className="text-lg font-extrabold">방금 한 게 👉</p>
      <p className="rounded-pop border-[2.5px] border-ink bg-candy-yellow px-4 py-1 text-xl font-black">
        {concept}
      </p>
      <p className="max-w-md text-center text-sm leading-relaxed">{body}</p>
      <button type="button" className={popButton} onClick={onDone}>
        {ui.nameCta}
      </button>
    </div>
  );
}
```

- [ ] **Step 5: ChallengeStep 구현**

`frontend/components/steps/ChallengeStep.tsx`:

```tsx
"use client";

import { useState } from "react";
import OwlBubble from "../OwlBubble";
import { popButton } from "./HookStep";
import { ui } from "@/copy/ui";

export default function ChallengeStep({
  question,
  choices,
  answer,
  explain,
  onDone,
}: {
  question: string;
  choices: string[];
  answer: number;
  explain: string;
  onDone: () => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const isCorrect = picked === answer;

  return (
    <div className="flex flex-col gap-3 py-6">
      <OwlBubble text={question} />

      {choices.map((choice, index) => (
        <button
          key={choice}
          type="button"
          onClick={() => setPicked(index)}
          className={`rounded-pop border-[2.5px] border-ink px-4 py-2 font-extrabold shadow-[0_3px_0_var(--color-ink)] ${
            picked === index ? "bg-candy-teal" : "bg-white"
          }`}
        >
          {choice}
        </button>
      ))}

      {picked !== null && (
        <div className="flex flex-col gap-3 pt-2">
          <p className="text-sm font-extrabold">
            {isCorrect ? ui.challengeCorrect : ui.challengeRetry}
          </p>
          <p className="text-sm leading-relaxed">{explain}</p>
          <button type="button" className={popButton} onClick={onDone}>
            {ui.challengeNext}
          </button>
        </div>
      )}
    </div>
  );
}
```

> 오답이어도 `onDone` 버튼이 나온다. "틀린 답이 없다"는 설계 원칙 때문이다. 정답 여부는 문구로만 구분한다.

- [ ] **Step 6: RewardStep 구현**

`frontend/components/steps/RewardStep.tsx`:

```tsx
"use client";

import { motion } from "motion/react";
import { popButton } from "./HookStep";
import { ui, badgeNames } from "@/copy/ui";

export default function RewardStep({
  badge,
  onDone,
}: {
  badge: string;
  onDone: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-10">
      <motion.span
        className="text-6xl"
        aria-hidden
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
      >
        🏅
      </motion.span>
      <p className="text-xl font-black">{badgeNames[badge] ?? badge}</p>
      <p className="text-sm text-muted">{ui.rewardTitle}</p>
      <button type="button" className={popButton} onClick={onDone}>
        {ui.rewardCta}
      </button>
    </div>
  );
}
```

- [ ] **Step 7: 테스트 실행해서 통과 확인**

Run: `npm run test components/steps`
Expected: PASS — `5 passed`

- [ ] **Step 8: 커밋**

```bash
git add frontend/components
git commit -m "feat: 훅·이름붙이기·도전·보상 스텝 컴포넌트 추가"
```

---

## Task 13: LessonRunner

레슨 JSON의 스텝을 순서대로 진행한다. `play` 스텝에서는 놀이터를 띄우고, 놀이터가 올려보내는 이벤트로 진행 조건을 판단한다.

**Files:**
- Create: `frontend/components/LessonRunner.tsx`
- Test: `frontend/components/LessonRunner.test.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

`frontend/components/LessonRunner.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LessonRunner from "./LessonRunner";
import { getLesson, getDataset } from "@/lib/content";

const lesson = getLesson("embedding-map");
const dataset = getDataset(lesson.dataset);

beforeEach(() => {
  Element.prototype.getBoundingClientRect = vi.fn(() => ({
    left: 0, top: 0, width: 400, height: 400,
    right: 400, bottom: 400, x: 0, y: 0, toJSON: () => ({}),
  })) as unknown as () => DOMRect;
});

function renderRunner() {
  const onComplete = vi.fn();
  render(<LessonRunner lesson={lesson} dataset={dataset} onComplete={onComplete} />);
  return { onComplete };
}

describe("LessonRunner", () => {
  it("훅 스텝부터 시작한다", () => {
    renderRunner();
    expect(screen.getByText(/어떻게 알아듣지/)).toBeInTheDocument();
  });

  it("훅을 지나면 놀이터가 나온다", () => {
    renderRunner();
    fireEvent.click(screen.getByRole("button", { name: "궁금해!" }));
    expect(screen.getByTestId("word-drawer")).toBeInTheDocument();
  });

  it("minPlaced를 채우기 전에는 '다 했어요' 버튼이 없다", () => {
    renderRunner();
    fireEvent.click(screen.getByRole("button", { name: "궁금해!" }));

    fireEvent.click(screen.getByTestId("drawer-word-dog"));
    expect(screen.queryByRole("button", { name: "다 했어요" })).not.toBeInTheDocument();
  });

  it("minPlaced를 채우면 '다 했어요' 버튼이 나오고 이름 붙이기로 넘어간다", () => {
    renderRunner();
    fireEvent.click(screen.getByRole("button", { name: "궁금해!" }));

    const minPlaced = 9;
    dataset.words.slice(0, minPlaced).forEach((word) => {
      fireEvent.click(screen.getByTestId(`drawer-word-${word.id}`));
    });

    fireEvent.click(screen.getByRole("button", { name: "다 했어요" }));
    expect(screen.getByText("임베딩")).toBeInTheDocument();
  });

  it("마지막 보상까지 끝내면 onComplete를 부른다", () => {
    const { onComplete } = renderRunner();
    fireEvent.click(screen.getByRole("button", { name: "궁금해!" }));

    dataset.words.slice(0, 9).forEach((word) => {
      fireEvent.click(screen.getByTestId(`drawer-word-${word.id}`));
    });
    fireEvent.click(screen.getByRole("button", { name: "다 했어요" }));
    fireEvent.click(screen.getByRole("button", { name: "알겠어!" }));
    fireEvent.click(screen.getByRole("button", { name: "강아지 근처" }));
    fireEvent.click(screen.getByRole("button", { name: "다음으로" }));
    fireEvent.click(screen.getByRole("button", { name: "좋아!" }));

    expect(onComplete).toHaveBeenCalledWith({
      lessonId: "embedding-map",
      badge: "map-explorer",
    });
  });
});
```

- [ ] **Step 2: 테스트 실행해서 실패 확인**

Run: `npm run test components/LessonRunner`
Expected: FAIL — `Failed to resolve import "./LessonRunner"`

- [ ] **Step 3: 구현**

`frontend/components/LessonRunner.tsx`:

```tsx
"use client";

import { useRef, useState } from "react";
import type { Lesson } from "@/lib/lesson-schema";
import type { Dataset } from "@/lib/dataset-schema";
import type { Artifact, PlaygroundEvent } from "@/playgrounds/types";
import { getPlayground } from "@/playgrounds/registry";
import OwlBubble from "./OwlBubble";
import HookStep, { popButton } from "./steps/HookStep";
import NameStep from "./steps/NameStep";
import ChallengeStep from "./steps/ChallengeStep";
import RewardStep from "./steps/RewardStep";
import { ui } from "@/copy/ui";

export interface LessonResult {
  lessonId: string;
  badge: string;
}

export default function LessonRunner({
  lesson,
  dataset,
  onComplete,
}: {
  lesson: Lesson;
  dataset: Dataset;
  onComplete: (result: LessonResult) => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [placedCount, setPlacedCount] = useState(0);

  // 놀이터가 만든 산출물을 받아둔다. 계획 2에서 서버에 저장한다.
  const artifactRef = useRef<Artifact | null>(null);

  const step = lesson.steps[stepIndex];
  const Playground = getPlayground(lesson.playground);

  function next() {
    if (stepIndex + 1 < lesson.steps.length) {
      setStepIndex(stepIndex + 1);
      return;
    }

    const reward = lesson.steps.find((s) => s.type === "reward");
    onComplete({
      lessonId: lesson.id,
      badge: reward && reward.type === "reward" ? reward.badge : "",
    });
  }

  function handlePlaygroundEvent(event: PlaygroundEvent) {
    if (event.type === "placed") {
      setPlacedCount(Number(event.payload?.placedCount ?? 0));
    }
  }

  if (step.type === "hook") {
    return <HookStep owl={step.owl} onDone={next} />;
  }

  if (step.type === "play") {
    // 놓은 개수만큼 대사가 따라 올라간다. 대사가 모자라면 마지막 대사를 유지한다.
    const line = step.owl[Math.min(placedCount, step.owl.length - 1)];
    const canAdvance = placedCount >= step.goal.minPlaced;

    return (
      <div className="flex flex-col gap-3">
        <Playground
          data={dataset}
          onEvent={handlePlaygroundEvent}
          onArtifact={(a) => {
            artifactRef.current = a;
          }}
        />
        <OwlBubble text={line} />
        {canAdvance && (
          <button type="button" className={popButton} onClick={next}>
            {ui.playDone}
          </button>
        )}
      </div>
    );
  }

  if (step.type === "name") {
    return <NameStep concept={step.concept} body={step.body} onDone={next} />;
  }

  if (step.type === "challenge") {
    return (
      <ChallengeStep
        question={step.question}
        choices={step.choices}
        answer={step.answer}
        explain={step.explain}
        onDone={next}
      />
    );
  }

  return <RewardStep badge={step.badge} onDone={next} />;
}
```

> `artifactRef`는 지금 화면에 쓰이지 않지만 놀이터의 산출물을 받아두는 자리다. state가 아니라 ref인 이유는 값이 바뀌어도 다시 그릴 필요가 없어서다. 계획 2에서 이 값을 서버에 저장한다.

- [ ] **Step 4: 테스트 실행해서 통과 확인**

Run: `npm run test components/LessonRunner`
Expected: PASS — `5 passed`

- [ ] **Step 5: 커밋**

```bash
git add frontend/components
git commit -m "feat: 레슨 스텝 진행 오케스트레이터 추가"
```

---

## Task 14: localStorage 진도

**Files:**
- Create: `frontend/lib/local-progress.ts`
- Test: `frontend/lib/local-progress.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`frontend/lib/local-progress.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { readProgress, completeLesson, isCompleted } from "./local-progress";

beforeEach(() => {
  localStorage.clear();
});

describe("local-progress", () => {
  it("처음에는 완료한 레슨이 없다", () => {
    expect(readProgress().completedLessons).toEqual([]);
  });

  it("레슨을 완료하면 기록된다", () => {
    completeLesson("embedding-map", "map-explorer");
    expect(isCompleted("embedding-map")).toBe(true);
    expect(readProgress().badges).toEqual(["map-explorer"]);
  });

  it("같은 레슨을 두 번 완료해도 중복 기록하지 않는다", () => {
    completeLesson("embedding-map", "map-explorer");
    completeLesson("embedding-map", "map-explorer");
    expect(readProgress().completedLessons).toEqual(["embedding-map"]);
    expect(readProgress().badges).toEqual(["map-explorer"]);
  });

  it("저장값이 깨져 있으면 빈 진도로 되돌린다", () => {
    localStorage.setItem("nolai:progress", "{{{ 망가진 JSON");
    expect(readProgress().completedLessons).toEqual([]);
  });
});
```

- [ ] **Step 2: 테스트 실행해서 실패 확인**

Run: `npm run test lib/local-progress`
Expected: FAIL — `Failed to resolve import "./local-progress"`

- [ ] **Step 3: 구현**

`frontend/lib/local-progress.ts`:

```ts
const KEY = "nolai:progress";

export interface LocalProgress {
  completedLessons: string[];
  badges: string[];
}

const empty: LocalProgress = { completedLessons: [], badges: [] };

export function readProgress(): LocalProgress {
  if (typeof window === "undefined") return empty;

  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty;

    const parsed = JSON.parse(raw) as Partial<LocalProgress>;
    return {
      completedLessons: Array.isArray(parsed.completedLessons)
        ? parsed.completedLessons
        : [],
      badges: Array.isArray(parsed.badges) ? parsed.badges : [],
    };
  } catch {
    // 손상된 값은 조용히 버린다. 아이의 놀이를 막는 것보다 낫다.
    return empty;
  }
}

export function completeLesson(lessonId: string, badge: string): void {
  if (typeof window === "undefined") return;

  const current = readProgress();
  const next: LocalProgress = {
    completedLessons: current.completedLessons.includes(lessonId)
      ? current.completedLessons
      : [...current.completedLessons, lessonId],
    badges:
      !badge || current.badges.includes(badge)
        ? current.badges
        : [...current.badges, badge],
  };

  window.localStorage.setItem(KEY, JSON.stringify(next));
}

export function isCompleted(lessonId: string): boolean {
  return readProgress().completedLessons.includes(lessonId);
}
```

- [ ] **Step 4: 테스트 실행해서 통과 확인**

Run: `npm run test lib/local-progress`
Expected: PASS — `4 passed`

- [ ] **Step 5: 커밋**

```bash
git add frontend/lib
git commit -m "feat: localStorage 진도 저장 추가"
```

---

## Task 15: 랜딩과 레슨 라우트

**Files:**
- Modify: `frontend/app/page.tsx` (전체 교체)
- Create: `frontend/app/lesson/[lessonId]/page.tsx`
- Create: `frontend/app/lesson/[lessonId]/LessonClient.tsx`

- [ ] **Step 1: 랜딩 페이지 작성**

`frontend/app/page.tsx` 전체를 교체:

```tsx
import Link from "next/link";
import { listLessons } from "@/lib/content";
import { ui } from "@/copy/ui";

export default function Home() {
  const lessons = listLessons();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-5 text-center">
      <h1 className="text-5xl font-black">{ui.landingTitle}</h1>
      <p className="text-lg font-extrabold">{ui.landingSubtitle}</p>
      <p className="text-sm text-muted">들어가서 만져봐 👋</p>

      <div className="flex w-full flex-col gap-3 pt-4">
        {lessons.map((lesson) => (
          <Link
            key={lesson.id}
            href={`/lesson/${lesson.id}`}
            className="rounded-pop border-[2.5px] border-ink bg-candy-red px-5 py-3 font-extrabold text-white shadow-[0_3px_0_var(--color-ink)]"
          >
            {lesson.order}. {lesson.title}
          </Link>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: 레슨 서버 컴포넌트 작성**

`frontend/app/lesson/[lessonId]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getLesson, getDataset, listLessons } from "@/lib/content";
import LessonClient from "./LessonClient";

export function generateStaticParams() {
  return listLessons().map((lesson) => ({ lessonId: lesson.id }));
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;

  try {
    const lesson = getLesson(lessonId);
    const dataset = getDataset(lesson.dataset);
    return <LessonClient lesson={lesson} dataset={dataset} />;
  } catch {
    notFound();
  }
}
```

- [ ] **Step 3: 레슨 클라이언트 컴포넌트 작성**

`frontend/app/lesson/[lessonId]/LessonClient.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import type { Lesson } from "@/lib/lesson-schema";
import type { Dataset } from "@/lib/dataset-schema";
import LessonRunner, { type LessonResult } from "@/components/LessonRunner";
import { completeLesson } from "@/lib/local-progress";
import { ui } from "@/copy/ui";

export default function LessonClient({
  lesson,
  dataset,
}: {
  lesson: Lesson;
  dataset: Dataset;
}) {
  const [done, setDone] = useState(false);

  function handleComplete(result: LessonResult) {
    completeLesson(result.lessonId, result.badge);
    setDone(true);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 px-5 py-6">
      <header className="flex items-center justify-between text-sm font-extrabold">
        <Link href="/">← 놀AI</Link>
        <span>{lesson.title}</span>
      </header>

      {done ? (
        <div className="flex flex-col items-center gap-4 py-16">
          <p className="text-xl font-black">{ui.lessonComplete}</p>
          <Link
            href="/"
            className="rounded-pop border-[2.5px] border-ink bg-candy-teal px-5 py-2 font-extrabold shadow-[0_3px_0_var(--color-ink)]"
          >
            처음으로
          </Link>
        </div>
      ) : (
        <LessonRunner
          lesson={lesson}
          dataset={dataset}
          onComplete={handleComplete}
        />
      )}
    </main>
  );
}
```

- [ ] **Step 4: 전체 테스트와 빌드 확인**

Run: `npm run test`
Expected: PASS — 모든 테스트 통과

Run: `npm run build`
Expected: 빌드 성공, 타입 에러 없음

- [ ] **Step 5: 개발 서버에서 손으로 완주해보기**

Run: `npm run dev`

`http://localhost:3000` 에서 확인:
1. 랜딩에 "1. 비슷한 말끼리 모여라" 버튼이 있다
2. 누르면 노리가 질문을 던진다
3. "궁금해!"를 누르면 지도와 단어 서랍이 나온다
4. 단어를 **끌어서** 지도에 놓으면 자석처럼 제자리로 튕겨 간다
5. 단어를 **눌러서**(클릭) 놓아도 똑같이 배치된다
6. 지도 밖에서 손을 떼면 배치되지 않고 서랍에 남는다
7. 가까운 단어끼리 선이 생기고, 가까울수록 굵다
8. 6개를 놓으면 "다 했어요" 버튼이 나온다
9. 이름 붙이기 → 도전 → 배지 → 완료까지 진행된다

**4번이 이 계획의 핵심 검증이다.** 끌어다 놓은 칩이 제자리로 튕겨 가는 순간이 재미없게 느껴지면, 스프링 값(`stiffness`, `damping`)과 `initial.scale`을 조정해본다. 여기가 재미없으면 나머지가 다 의미 없다.

- [ ] **Step 6: 커밋**

```bash
git add frontend/app
git commit -m "feat: 랜딩과 레슨 라우트 연결"
```

---

## Task 16: E2E 테스트

**Files:**
- Create: `frontend/playwright.config.ts`
- Create: `frontend/e2e/lesson1.spec.ts`
- Modify: `frontend/package.json`

- [ ] **Step 1: Playwright 설치**

```bash
cd frontend
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: 설정 파일 작성**

`frontend/playwright.config.ts`:

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
  },
});
```

`frontend/package.json`의 `"scripts"` 에 추가:

```json
"test:e2e": "playwright test"
```

- [ ] **Step 3: 실패하는 E2E 테스트 작성**

`frontend/e2e/lesson1.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("레슨 1을 처음부터 끝까지 완주한다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /비슷한 말끼리 모여라/ }).click();

  await expect(page.getByText(/어떻게 알아듣지/)).toBeVisible();
  await page.getByRole("button", { name: "궁금해!" }).click();

  await expect(page.getByTestId("word-drawer")).toBeVisible();

  // 서랍에 남아 있는 첫 칩을 6번 누른다
  for (let i = 0; i < 9; i++) {
    await page.locator('[data-testid^="drawer-word-"]').first().click();
  }

  await page.getByRole("button", { name: "다 했어요" }).click();
  await expect(page.getByText("임베딩")).toBeVisible();

  await page.getByRole("button", { name: "알겠어!" }).click();
  await page.getByRole("button", { name: "강아지 근처" }).click();
  await page.getByRole("button", { name: "다음으로" }).click();

  await expect(page.getByText("지도 탐험가")).toBeVisible();
  await page.getByRole("button", { name: "좋아!" }).click();

  await expect(page.getByText("레슨을 끝냈어!")).toBeVisible();
});

test("진도가 localStorage에 남는다", async ({ page }) => {
  await page.goto("/lesson/embedding-map");
  await page.getByRole("button", { name: "궁금해!" }).click();

  for (let i = 0; i < 9; i++) {
    await page.locator('[data-testid^="drawer-word-"]').first().click();
  }
  await page.getByRole("button", { name: "다 했어요" }).click();
  await page.getByRole("button", { name: "알겠어!" }).click();
  await page.getByRole("button", { name: "강아지 근처" }).click();
  await page.getByRole("button", { name: "다음으로" }).click();
  await page.getByRole("button", { name: "좋아!" }).click();

  const stored = await page.evaluate(() =>
    window.localStorage.getItem("nolai:progress"),
  );
  expect(stored).toContain("embedding-map");
  expect(stored).toContain("map-explorer");
});

test("진짜 마우스로 끌어다 놓아도 배치된다", async ({ page }) => {
  await page.goto("/lesson/embedding-map");
  await page.getByRole("button", { name: "궁금해!" }).click();

  const chip = page.getByTestId("drawer-word-dog");
  const map = page.getByTestId("map-area");

  const chipBox = (await chip.boundingBox())!;
  const mapBox = (await map.boundingBox())!;

  await page.mouse.move(
    chipBox.x + chipBox.width / 2,
    chipBox.y + chipBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    mapBox.x + mapBox.width / 2,
    mapBox.y + mapBox.height / 2,
    { steps: 10 },
  );
  await page.mouse.up();

  await expect(page.getByTestId("placed-word-dog")).toBeVisible();
});

test("배치된 칩이 지도 밖으로 삐져나가지 않는다", async ({ page }) => {
  await page.goto("/lesson/embedding-map");
  await page.getByRole("button", { name: "궁금해!" }).click();

  // 전부 놓는다 — 가장자리 좌표를 가진 단어까지 확인해야 한다
  const drawer = page.locator('[data-testid^="drawer-word-"]');
  for (let remaining = await drawer.count(); remaining > 0; remaining--) {
    await drawer.first().click();
  }

  // 스프링 애니메이션이 끝날 때까지 기다린다
  await page.waitForTimeout(1200);

  const map = (await page.getByTestId("map-area").boundingBox())!;
  const chips = page.locator('[data-testid^="placed-word-"]');
  const count = await chips.count();
  expect(count).toBe(18);

  for (let i = 0; i < count; i++) {
    const chip = (await chips.nth(i).boundingBox())!;
    const label = await chips.nth(i).getAttribute("data-testid");

    expect(chip.x, `${label} 왼쪽`).toBeGreaterThanOrEqual(map.x - 1);
    expect(chip.y, `${label} 위쪽`).toBeGreaterThanOrEqual(map.y - 1);
    expect(chip.x + chip.width, `${label} 오른쪽`).toBeLessThanOrEqual(
      map.x + map.width + 1,
    );
    expect(chip.y + chip.height, `${label} 아래쪽`).toBeLessThanOrEqual(
      map.y + map.height + 1,
    );
  }
});
```

> 이 테스트가 필요한 이유: 칩은 좌표를 **중심**으로 그려지므로 가장자리 단어의 칩은 좌표보다 반폭만큼 더 뻗어 나간다. 데이터의 margin은 0.08(지도 폭의 8%)인데 "🐶 강아지" 칩의 반폭은 지도 폭의 약 11%다. 좌표 레이어를 안쪽으로 들여놓지 않으면 실제로 잘린다. jsdom은 레이아웃을 계산하지 않으므로 이 보증은 E2E에서만 가능하다.

- [ ] **Step 4: E2E 실행**

Run: `npm run test:e2e`
Expected: PASS — `4 passed`

실패하면 개발 서버 로그와 Playwright 리포트(`npx playwright show-report`)를 확인한다.

- [ ] **Step 5: 커밋**

```bash
cd ..
git add frontend
git commit -m "test: 레슨 1 완주 E2E 테스트 추가"
```

---

## Task 17: 마무리 점검

- [ ] **Step 1: 전체 테스트 실행**

```bash
cd frontend
npm run test
npm run test:e2e
npm run build
```

Expected: 세 명령 모두 성공

- [ ] **Step 2: 파이썬 도구 테스트 실행**

```bash
cd ../tools/embed
uv run pytest -v
```

Expected: PASS — `3 passed`

- [ ] **Step 3: 설계 원칙 대조 확인**

설계 문서 2절의 네 원칙이 실제로 지켜졌는지 화면에서 확인한다.

- [ ] 설명보다 조작이 먼저 온다 — 놀이터 진입까지 개념 설명이 없다
- [ ] 틀린 답이 없다 — 도전에서 오답을 골라도 진행이 막히지 않는다
- [ ] 한 레슨은 10분 — 처음부터 끝까지 걸린 시간을 재본다
- [ ] 모든 숫자는 진짜다 — 좌표를 손으로 고친 흔적이 없다

- [ ] **Step 4: README 작성**

`frontend/README.md` 전체를 교체:

```markdown
# 놀AI frontend

10~13세 어린이가 AI 작동 원리를 손으로 만져서 배우는 놀이터.

## 개발

```bash
npm install
npm run dev        # http://localhost:3000
npm run test       # 단위 테스트
npm run test:e2e   # E2E
npm run build
```

## 콘텐츠 추가

- 레슨 문구·난이도 수정: `lessons/*.json` 만 고친다
- 새 개념 추가: `playgrounds/` 에 컴포넌트를 만들고 `playgrounds/registry.ts` 에 등록한 뒤 레슨 JSON을 추가한다
- 임베딩 좌표 재계산: `tools/embed/` 참고. 좌표를 손으로 고치지 않는다

설계 문서: `../docs/superpowers/specs/2026-08-21-nolai-design.md`
```

- [ ] **Step 5: 커밋**

```bash
cd ..
git add frontend/README.md
git commit -m "docs: frontend README 작성"
```

---

## 완료 조건

이 계획은 다음이 모두 참일 때 끝난다.

1. `npm run test` 통과 (단위 테스트 전체)
2. `npm run test:e2e` 통과 (완주 2건 + 드래그 1건 + 칩 경계 1건)
3. `npm run build` 성공
4. `uv run pytest` 통과 (파이썬 도구 3건)
5. 브라우저에서 레슨 1을 손으로 완주할 수 있다
6. 새로고침해도 진도가 남아 있다

---

## 다음 계획

- **계획 2 — 계정 + 내 방:** 닉네임·비밀코드, Supabase 스키마와 RLS, 세션 쿠키, 진도·배지·작품 서버 저장, 내 방 화면, 보상 효과음
- **계획 3 — 레슨 2:** `NearestSearch` 놀이터, 문장 조각·질문 카드 데이터셋, 유사도 사전 계산
