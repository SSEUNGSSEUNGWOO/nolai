# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

놀AI — 10~13세 어린이가 AI 작동 원리(임베딩·벡터검색·학습 데이터·토큰·픽셀·비트 등)를 손으로 만져서 배우는 웹 놀이터. 설계 문서 `docs/superpowers/specs/2026-08-21-nolai-design.md`가 모든 결정의 근거이며, 14장(결정 기록)·16장(열린 질문)에 이유가 적혀 있다. 새 결정을 내리면 그 문서에 날짜와 함께 덧붙인다.

## 저장소 구성

| 폴더 | 역할 |
|---|---|
| `frontend/` | Next.js 16 / React 19 / Tailwind 4 앱. 자세한 구조·콘텐츠 규칙은 `frontend/README.md` |
| `supabase/migrations/` | DB 스키마 (`0001_init` → 순번). `0003`이 E2E 전용 `test` 스키마를 만든다 |
| `tools/embed/` | 파이썬(uv) 임베딩 사전 계산. `*.yaml` 소스 → `frontend/datasets/*.json` |
| `tools/art/` | 로컬 ComfyUI(:8188)로 마스코트·배지·단어 그림 생성. `batch.sh`가 전체 재생성 |
| `tools/icons/` | PWA 아이콘 생성 (`frontend/`에서 `node ../tools/icons/make.js`) |
| `docs/superpowers/` | 설계 문서와 구현 계획 |

`frontend/AGENTS.md`는 `next dev`가 자동으로 넣는 블록이다. **이 Next.js는 학습 데이터와 다르다** — API를 쓰기 전에 `frontend/node_modules/next/dist/docs/`를 읽는다.

## 명령 (모두 `frontend/`에서)

```bash
npm run dev                              # http://localhost:3000
npm run test                             # vitest 단위 테스트 전체
npx vitest run lib/content.test.ts       # 파일 하나
npx vitest run -t "번호로 부르지"          # 이름으로 하나
npm run test:e2e                         # Playwright. 3100 포트에 SUPABASE_SCHEMA=test로 서버를 새로 띄운다
npx playwright test e2e/account.spec.ts  # E2E 하나
npm run lint
npm run build                            # 콘텐츠 검증도 여기서 터진다 (아래 참고)
```

- E2E는 `reuseExistingServer: false`, `workers: 1`이 의도다. 이미 떠 있는 3000 서버를 빌리면 운영(`public`) 데이터를 지울 수 있어서 막아둔 것이니 고치지 않는다.
- E2E는 `frontend/.env.local`을 직접 읽는다. `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`이 필요하다.
- 데이터셋 재생성: `tools/embed/`에서 `uv run python build_dataset.py [words.yaml]` 등. 모델(`nlpai-lab/KURE-v1`)은 로컬 GPU에서 돈다. 빌더↔yaml↔레슨 대응표는 `frontend/README.md`.

## 큰 그림

**레슨 = JSON, 놀이터 = 코드.** `frontend/lessons/*.json`(16개)이 `lib/lesson-schema.ts`의 zod 스키마로 검증되고, 각 레슨은 `hook → play → name → challenge → predict → reveal → reward` 스텝을 갖는다. `components/LessonRunner.tsx`가 스텝을 넘기고, `components/steps/`가 각 화면을 그린다.

**놀이터는 레슨을 모른다.** `playgrounds/types.ts`의 `PlaygroundProps { data, onEvent, onArtifact }`만 안다. 놀이터가 `onEvent({type: "placed"})` 같은 이벤트를 올리면 `LessonRunner`가 레슨 JSON의 `goal.kind`(`placed`·`searched`·`taught`… 14종)와 맞춰 세어 다음 스텝으로 넘긴다. 새 놀이터는 `playgrounds/registry.ts`에 등록해야 레슨이 부를 수 있다.

**콘텐츠 오류는 빌드가 막는다.** `lib/content.ts`의 `assertPlayable`·`assertPlaygroundExists`·`assertBadgeNamesExist`가 로드 시점에 던진다 — 없는 놀이터, 한글 이름 없는 배지, 데이터셋보다 큰 `goal.min`, 데이터셋 종류와 안 맞는 `goal.kind`. `lib/content.test.ts`는 아이가 보는 문장에 레슨 번호가 들어가는 것도 막는다. **레슨은 제목으로 부른다** — 순서(`lessonGroups`)는 바뀐다.

**모든 숫자는 진짜다.** `frontend/datasets/`의 좌표·유사도는 실제 임베딩 모델 출력이므로 손으로 고치지 않는다. 예외는 `pixel-art.json`·`sounds-simple.json`·`bits-basic.json`(모델이 안 만듦).

**인증·진도.** 정식 회원가입 없이 닉네임 + 비밀코드. 세션은 HMAC 서명된 무상태 쿠키(`lib/auth/session.ts`, 1년). 로그인 전 진도는 `localStorage`(`lib/local-progress.ts`)에 쌓이고, 가입·로그인 시 `POST /api/sync`로 서버에 합친다. 브라우저는 Supabase에 직접 붙지 않는다 — `app/api/*` Route Handler만 `lib/supabase.ts`(service_role, `server-only`)를 쓰고, 테이블은 RLS가 켜져 있지만 정책이 없다(anon 차단이 의도).

## 작업 규칙

- `main`에서 직접 작업하며 PR이 없다. **push가 곧 배포**이니 push 전에 확인받는다.
- 테스트가 다 통과해도 폰에서 막힌 적이 있다. UI 변경은 실제 브라우저(Playwright MCP 또는 폰)로 눈으로 본다.
- 아트 톤: 두꺼운 남색(#1f2430) 외곽선 + 캔디 팔레트(코랄 #ff6b6b·민트 #4ecdc4·노랑 #ffd93d·크림 #fff3d6). 단어 그림은 `ART_STYLE=natural`(실제 색). 마스코트는 로봇 "노리" — 문서 앞부분의 "부엉이"는 옛 표현이다.
- 성취기준 코드(6실05-04 등)는 아이 화면에 띄우지 않는다. 랜딩(`/`)에만 쓴다. `/`는 랜딩(실제 EmbeddingMap 내장, 세션·진도 있으면 `/play`로), `/play`가 아이의 레슨 목록이다. 디자인 시스템은 `DESIGN.md`, 제품 사실은 `PRODUCT.md`.
