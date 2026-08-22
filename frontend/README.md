# 놀AI frontend

10~13세 어린이가 AI 작동 원리를 손으로 만져서 배우는 놀이터.

## 개발

```bash
npm install
npm run dev        # http://localhost:3000
npm run test       # 단위 테스트
npm run test:e2e   # 브라우저 E2E (3100 포트, test 스키마)
npm run build
```

## 데이터

서버 코드만 Supabase에 붙는다. 브라우저는 DB에 직접 닿지 않고, 권한 판단은
Route Handler가 한다. `service_role` 키는 `lib/supabase.ts`에서만 읽으며,
그 파일의 `server-only` import가 클라이언트 번들로 새어 나가면 빌드를 막는다.

| 환경변수 | 쓰임 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 주소 |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용. RLS를 우회하므로 절대 클라이언트로 내보내지 않는다 |
| `SESSION_SECRET` | 세션 쿠키 서명. 바뀌면 모든 아이가 로그아웃된다 |
| `SUPABASE_SCHEMA` | 안 주면 `public`. E2E만 `test`로 띄운다 |

**E2E는 `test` 스키마를 쓴다.** 실제 계정을 만들고 지우는 코드라 운영 데이터와
물리적으로 갈라둔다. `playwright.config.ts`가 3100 포트에 `SUPABASE_SCHEMA=test`로
서버를 직접 띄우고, 이미 떠 있는 서버를 빌리지 않는다 -- 빌리면 그 서버가
`public`을 보고 있을 수 있다.

## 구조

| 폴더 | 역할 |
|---|---|
| `app/` | 라우트. `/`는 랜딩, `/lesson/[lessonId]`는 레슨 |
| `components/` | `LessonRunner`가 레슨 스텝을 진행하고, `steps/`가 각 화면을 그린다 |
| `playgrounds/` | 놀이터. 레슨을 모르고 이벤트만 올려보낸다 |
| `lib/` | zod 스키마, 콘텐츠 로더, 진도 저장 |
| `lessons/` | 레슨 JSON. 문구·난이도는 여기만 고친다 |
| `datasets/` | 미리 계산된 임베딩 값. 손으로 고치지 않는다 |
| `copy/ui.ts` | UI 고정 문자열 |

## 콘텐츠 고치기

- **문구·난이도**: `lessons/*.json`만 고친다. 코드를 열지 않는다
- **새 개념 추가**: 데이터셋이 기존 두 종류(`words` 좌표형, `passages` 유사도형) 중 하나로 표현되면 `playgrounds/`에 컴포넌트를 만들고 `playgrounds/registry.ts`에 등록한 뒤 레슨 JSON을 추가하면 된다. 구조가 다른 데이터가 필요하면 `lib/dataset-schema.ts`의 `datasetSchema` union에 갈래를 하나 더 붙이고, 그 갈래에 맞는 `goal.kind`를 `lib/lesson-schema.ts`에 추가한 뒤 `lib/content.ts`의 `goalDatasetKind`와 `assertPlayable`을 함께 고친다
- **단어·문장 목록**: `../tools/embed/words.yaml`(레슨 1), `../tools/embed/passages.yaml`(레슨 2)을 고치고 재생성한다. **좌표·각도·유사도를 손으로 고치지 않는다**

레슨 JSON의 오타, 등록되지 않은 놀이터 이름, 한글 이름 없는 배지, 데이터셋 항목 수보다 큰 `goal.min`, 데이터셋 종류와 어긋난 `goal.kind`, `passages` 수와 길이가 다른 `sims`는 전부 **빌드가 막는다.** 아이에게 도달하지 않는다.

설계 문서: `../docs/superpowers/specs/2026-08-21-nolai-design.md`
