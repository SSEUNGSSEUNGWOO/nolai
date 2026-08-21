# 놀AI frontend

10~13세 어린이가 AI 작동 원리를 손으로 만져서 배우는 놀이터.

## 개발

```bash
npm install
npm run dev        # http://localhost:3000
npm run test       # 단위 테스트
npm run test:e2e   # 브라우저 E2E
npm run build
```

## 구조

| 폴더 | 역할 |
|---|---|
| `app/` | 라우트. `/`는 랜딩, `/lesson/[lessonId]`는 레슨 |
| `components/` | `LessonRunner`가 레슨 스텝을 진행하고, `steps/`가 각 화면을 그린다 |
| `playgrounds/` | 놀이터. 레슨을 모르고 이벤트만 올려보낸다 |
| `lib/` | zod 스키마, 콘텐츠 로더, 진도 저장 |
| `lessons/` | 레슨 JSON. 문구·난이도는 여기만 고친다 |
| `datasets/` | 미리 계산된 임베딩 좌표. 손으로 고치지 않는다 |
| `copy/ui.ts` | UI 고정 문자열 |

## 콘텐츠 고치기

- **문구·난이도**: `lessons/*.json`만 고친다. 코드를 열지 않는다
- **새 개념 추가**: 기존 좌표 형태의 `Dataset`을 그대로 쓰는 놀이터라면 `playgrounds/`에 컴포넌트를 만들고 `playgrounds/registry.ts`에 등록한 뒤 레슨 JSON을 추가하면 된다. 짝맞추기·순서맞추기처럼 구조가 다른 놀이터는 `lib/content.ts`의 `getDataset`(하드코딩된 `datasetSchema`)과 `assertPlayable`, `LessonRunner`의 `dataset: Dataset` prop 타입도 함께 고쳐야 한다
- **단어 목록**: `../tools/embed/words.yaml`을 고치고 재생성한다. **좌표를 손으로 고치지 않는다**

레슨 JSON의 오타, 등록되지 않은 놀이터 이름, 한글 이름 없는 배지, 데이터셋 단어 수보다 큰 `minPlaced`는 전부 **빌드가 막는다.** 아이에게 도달하지 않는다.

설계 문서: `../docs/superpowers/specs/2026-08-21-nolai-design.md`
