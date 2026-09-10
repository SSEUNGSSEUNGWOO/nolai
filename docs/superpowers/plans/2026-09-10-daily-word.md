# 오늘의 단어와 리더보드 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 매일 한국 시간 자정에 바뀌는 숨은 단어를 사전 안의 단어로 맞히는 `/daily` 화면, 그 API 셋, 매일 리셋되는 리더보드, 내 방의 연속 참여 일수·최소 시도 기록을 만든다. 설계 문서 17장 "순서" 3번이다.

**Architecture:** 정답 365개와 정답별 이웃 1000개는 `tools/embed/build_daily.py`가 로컬 벡터로 미리 계산해 `daily_words` 테이블에 넣는다(런타임에 이웃을 구하지 않는다). 아이의 시도는 `guesses` 테이블에 쌓이고(비회원은 기기 localStorage), 유사도는 실험실과 같은 `word_similarity()`, 순위는 `neighbors` 배열의 위치다. 리더보드·어제 판·내 기록은 SQL 함수 셋이 집계하고 Route Handler가 중계한다. 정답 id는 그날이 끝나기 전엔 어떤 응답에도 담기지 않는다.

**Tech Stack:** 앞 계획과 같다. Python 쪽은 numpy만 더 쓴다(이미 있다).

**읽어야 할 것:** 설계 문서 17장 "오늘의 단어"·"리더보드"·"데이터", `components/lab/LabClient.tsx`·`WordPicker.tsx`(그대로 쓴다), `lib/words.ts`(rpc·시도 제한 패턴), `lib/room.ts`(내 방 로딩), `e2e/lab.spec.ts`(사전 E2E 패턴), `e2e/support/db.ts`.

**하지 않는 것:** 누적 종합 순위. 닉네임 겹침 구분자. 시도 횟수 제한. 이벤트 로그. 어제 이전의 판 열람.

**규칙 (17장 표 그대로):** 시도 무제한. 온도는 순위로: 정답 / 10위 안 "뜨거워" / 100위 안 "따뜻해" / 1000위 안 "미지근해" / 밖 "차가워". 힌트는 20번 넘게 헤매면 지금까지 최고 순위의 절반 순위 단어 하나. 리더보드는 시도 횟수 오름차순, 힌트 쓰면 표시, 상위 10명 + "나: N명 중 M등", 못 맞힌 아이는 "오늘 K명이 맞혔어"만. 날짜는 한국 시간.

---

## 파일

| 파일 | 역할 |
|---|---|
| `supabase/migrations/0007_daily.sql` (생성) | `daily_words`·`guesses`, 함수 `daily_board`·`daily_popular`·`daily_history`. `public`·`test` |
| `tools/embed/build_dictionary.py` (수정) | `--upload` 때 벡터를 `.cache/vectors.npy`에 남긴다 |
| `tools/embed/build_daily.py` (생성) + `test_build_daily.py` | 정답 365개 고르기, 이웃 1000개, `daily_words` 업로드 |
| `frontend/lib/daily.ts` (생성) + `.test.ts` | `todayKst`·`temperatureOf`·`streakOf`·`bestTriesOf` (순수 함수) |
| `frontend/lib/daily-server.ts` (생성) | server-only. 오늘 정답 조회, 시도 기록, 집계 rpc 래퍼 |
| `frontend/app/api/daily/route.ts`, `guess/route.ts`, `hint/route.ts` (생성) | API 셋 |
| `frontend/copy/ui.ts` (수정) | `daily` 문구 |
| `frontend/components/daily/DailyClient.tsx` (생성) | 화면 본체 |
| `frontend/app/daily/page.tsx` (생성) | 라우트 |
| `frontend/lib/room.ts`, `app/room/page.tsx` (수정) | 연속 참여 일수·최소 시도 |
| `frontend/app/play/page.tsx` (수정) | 오늘의 단어로 가는 문 |
| `frontend/e2e/daily.spec.ts` (생성) | 비회원 시도·정답·가입 뒤 리더보드 |
| `CLAUDE.md`, `frontend/README.md`, 설계 문서 17장 (수정) | 기록 |

---

### Task 1: 마이그레이션 `0007_daily.sql`

**Files:**
- Create: `supabase/migrations/0007_daily.sql`

- [x] **Step 1: 파일 작성**

```sql
-- 오늘의 단어 (설계 문서 17장)
--
-- daily_words: 날짜별 정답과 정답의 이웃 1000개(가까운 순). tools/embed/build_daily.py가
-- 365일치를 미리 채운다. 이웃을 미리 두는 이유: 온도·순위 힌트가 "정답 기준 몇 위"라
-- 요청마다 1000개 최근접을 돌리면 낭비다. 정답 id는 그날이 끝나기 전엔 어떤 응답에도
-- 담기지 않는다 -- 서버 코드가 지킨다.
--
-- guesses: 로그인한 아이의 시도. 비회원은 기기에만 남긴다. 같은 단어를 다시 넣어도
-- 행이 늘지 않는다(pk). hinted가 참인 행은 힌트로 받은 단어다.
--
-- 2026-09-10에 운영 DB에 적용했고 이 파일은 그 기록이다. test 스키마를 건드리므로
-- 0003 머리말의 PostgREST reload 두 줄을 같이 보낸다.

create table public.daily_words (
  date      date primary key,
  word_id   integer not null references public.words(id),
  neighbors integer[] not null
);

create table public.guesses (
  kid_id     uuid not null references public.kids(id) on delete cascade,
  date       date not null,
  word_id    integer not null references public.words(id),
  similarity real not null,
  rank       integer,
  hinted     boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (kid_id, date, word_id)
);

create index guesses_date_idx on public.guesses (date);

alter table public.daily_words enable row level security;
alter table public.guesses     enable row level security;

/** 그날 맞힌 아이들. 시도 수 오름차순. 동점 공동 순위는 서버 코드가 매긴다. */
create or replace function public.daily_board(p_date date)
returns table (kid_id uuid, nickname text, tries integer, hinted boolean)
language sql
stable
set search_path = public
as $$
  select g.kid_id, k.nickname, count(*)::integer as tries, bool_or(g.hinted) as hinted
  from public.guesses g
  join public.daily_words d on d.date = g.date
  join public.kids k on k.id = g.kid_id
  where g.date = p_date
  group by g.kid_id, k.nickname
  having bool_or(g.word_id = d.word_id)
  order by tries asc, min(g.created_at) asc
  limit 1000;
$$;

/** 그날 아이들이 가장 많이 넣은 단어. 정답은 뺀다. 어제 판 공개용. */
create or replace function public.daily_popular(p_date date, p_count integer)
returns table (word_id integer, word text, guessers integer)
language sql
stable
set search_path = public
as $$
  select g.word_id, w.word, count(distinct g.kid_id)::integer as guessers
  from public.guesses g
  join public.daily_words d on d.date = g.date
  join public.words w on w.id = g.word_id
  where g.date = p_date and g.word_id <> d.word_id
  group by g.word_id, w.word
  order by guessers desc, w.word asc
  limit p_count;
$$;

/** 한 아이의 날짜별 시도 수와 맞혔는지. 내 방의 연속 참여·최소 시도용. 최근 400일. */
create or replace function public.daily_history(p_kid uuid)
returns table (date date, tries integer, solved boolean)
language sql
stable
set search_path = public
as $$
  select g.date, count(*)::integer as tries, bool_or(g.word_id = d.word_id) as solved
  from public.guesses g
  join public.daily_words d on d.date = g.date
  where g.kid_id = p_kid
  group by g.date
  order by g.date desc
  limit 400;
$$;

revoke execute on function public.daily_board(date) from public, anon, authenticated;
revoke execute on function public.daily_popular(date, integer) from public, anon, authenticated;
revoke execute on function public.daily_history(uuid) from public, anon, authenticated;

-- test 스키마. 구조는 public과 같아야 한다(0003 머리말).

create table test.daily_words (
  date      date primary key,
  word_id   integer not null references test.words(id),
  neighbors integer[] not null
);

create table test.guesses (
  kid_id     uuid not null references test.kids(id) on delete cascade,
  date       date not null,
  word_id    integer not null references test.words(id),
  similarity real not null,
  rank       integer,
  hinted     boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (kid_id, date, word_id)
);

create index guesses_date_idx on test.guesses (date);

alter table test.daily_words enable row level security;
alter table test.guesses     enable row level security;

create or replace function test.daily_board(p_date date)
returns table (kid_id uuid, nickname text, tries integer, hinted boolean)
language sql
stable
set search_path = test
as $$
  select g.kid_id, k.nickname, count(*)::integer as tries, bool_or(g.hinted) as hinted
  from test.guesses g
  join test.daily_words d on d.date = g.date
  join test.kids k on k.id = g.kid_id
  where g.date = p_date
  group by g.kid_id, k.nickname
  having bool_or(g.word_id = d.word_id)
  order by tries asc, min(g.created_at) asc
  limit 1000;
$$;

create or replace function test.daily_popular(p_date date, p_count integer)
returns table (word_id integer, word text, guessers integer)
language sql
stable
set search_path = test
as $$
  select g.word_id, w.word, count(distinct g.kid_id)::integer as guessers
  from test.guesses g
  join test.daily_words d on d.date = g.date
  join test.words w on w.id = g.word_id
  where g.date = p_date and g.word_id <> d.word_id
  group by g.word_id, w.word
  order by guessers desc, w.word asc
  limit p_count;
$$;

create or replace function test.daily_history(p_kid uuid)
returns table (date date, tries integer, solved boolean)
language sql
stable
set search_path = test
as $$
  select g.date, count(*)::integer as tries, bool_or(g.word_id = d.word_id) as solved
  from test.guesses g
  join test.daily_words d on d.date = g.date
  where g.kid_id = p_kid
  group by g.date
  order by g.date desc
  limit 400;
$$;

grant all privileges on table test.daily_words, test.guesses to service_role;
grant execute on function test.daily_board(date) to service_role;
grant execute on function test.daily_popular(date, integer) to service_role;
grant execute on function test.daily_history(uuid) to service_role;
revoke execute on function test.daily_board(date) from public, anon, authenticated;
revoke execute on function test.daily_popular(date, integer) from public, anon, authenticated;
revoke execute on function test.daily_history(uuid) from public, anon, authenticated;
```

- [x] **Step 2: 운영 DB에 적용** — SQL Editor(또는 MCP)에 그대로 실행하고 `notify pgrst, 'reload config'; notify pgrst, 'reload schema';`.

- [x] **Step 3: 적용 확인** — `tools/embed/`에서:

```bash
uv run python -c "
import sys; sys.stdout.reconfigure(encoding='utf-8')
from build_dictionary import read_env, ENV_FILE, Supabase
env = read_env(ENV_FILE)
for schema in ['public', 'test']:
    db = Supabase(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY'], schema)
    print(schema, db._request('POST', '/rest/v1/rpc/daily_board', {'p_date': '2026-01-01'})[2])
    print(schema, db._request('GET', '/rest/v1/daily_words?select=date&limit=1')[2])
"
```

Expected: 네 줄 모두 `[]`. 오류가 나면 함수나 테이블이 그 스키마에 없는 것이다.

- [x] **Step 4: 커밋**

```bash
git add supabase/migrations/0007_daily.sql
git commit -m "db: daily_words·guesses와 집계 함수 셋 — 오늘의 단어"
```

---

### Task 2: 벡터 캐시와 `build_daily.py` (TDD)

**Files:**
- Modify: `tools/embed/build_dictionary.py`
- Create: `tools/embed/build_daily.py`
- Create: `tools/embed/test_build_daily.py`
- Modify: `tools/embed/.gitignore` (`daily-review.tsv`)

- [x] **Step 1: `--upload`가 벡터를 남기게**

`build_dictionary.py`의 `upload()`에서 `vectors = embed(...)` 바로 뒤에:

```python
    # build_daily.py가 다시 임베딩하지 않도록 남긴다. 순서는 words와 같다.
    np.save(CACHE.parent / "vectors.npy", vectors)
    (CACHE.parent / "vectors-ids.json").write_text(json.dumps([w["id"] for w in words]), encoding="utf-8")
```

파일 위 import에 `import numpy as np`.

- [x] **Step 2: 실패하는 테스트**

`tools/embed/test_build_daily.py`:

```python
import numpy as np

from build_daily import assign_dates, neighbor_ids, pick_answers


def _unit(rows):
    v = np.array(rows, dtype=float)
    return v / np.linalg.norm(v, axis=1, keepdims=True)


def test_neighbor_ids_returns_closest_first_excluding_self():
    ids = [10, 20, 30, 40]
    vectors = _unit([[1, 0], [0.9, 0.1], [0, 1], [-1, 0]])

    assert neighbor_ids(vectors, ids, index=0, count=2) == [20, 30]


def test_pick_answers_prefers_words_with_rich_neighborhood():
    # 0·1·2는 서로 가깝고(이웃이 풍부), 3은 혼자 멀리 있다
    ids = [1, 2, 3, 4]
    vectors = _unit([[1, 0], [0.95, 0.05], [0.9, 0.1], [0, 1]])
    words = [
        {"id": 1, "word": "강아지", "grade": 1},
        {"id": 2, "word": "고양이", "grade": 1},
        {"id": 3, "word": "호랑이", "grade": 2},
        {"id": 4, "word": "외톨이", "grade": 1},
    ]

    picked = pick_answers(words, vectors, ids, count=3, top=2, max_grade=2, seed=1)

    assert {w["id"] for w in picked} == {1, 2, 3}


def test_pick_answers_skips_single_syllable_and_high_grade():
    ids = [1, 2, 3]
    vectors = _unit([[1, 0], [0.9, 0.1], [0.8, 0.2]])
    words = [
        {"id": 1, "word": "가", "grade": 1},
        {"id": 2, "word": "가게", "grade": 1},
        {"id": 3, "word": "군밤", "grade": 3},
    ]

    assert [w["id"] for w in pick_answers(words, vectors, ids, count=5, top=2, max_grade=2, seed=1)] == [2]


def test_assign_dates_starts_at_given_day_and_is_consecutive():
    dates = assign_dates("2026-09-11", 3)

    assert dates == ["2026-09-11", "2026-09-12", "2026-09-13"]
```

- [x] **Step 3: 실패 확인** — `uv run pytest test_build_daily.py -q` → `ModuleNotFoundError`

- [x] **Step 4: 구현**

`tools/embed/build_daily.py`:

```python
"""오늘의 단어 365개와 정답별 이웃 1000개를 만들어 daily_words에 넣는다.

실행:  uv run python build_daily.py [시작날짜 YYYY-MM-DD]   # 기본값 내일(한국 시간)
       uv run python build_daily.py 2026-09-11 --upload [--schema test]
입력:  .cache/vectors.npy, .cache/vectors-ids.json (build_dictionary.py --upload가 남긴다)
출력:  daily-review.tsv (날짜·정답·이웃 5개. 사람이 훑는다. 커밋하지 않는다)

정답 고르기(설계 문서 17장 "열린 것"): 1~2등급, 두 글자 이상, 이웃 100위 안 유사도 평균이
높은 순으로 상위 600개를 뽑아 섞고 365개를 쓴다. "탁자"처럼 이웃이 심심한 단어를 피한다.
"""

from __future__ import annotations

import json
import random
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import numpy as np

from build_dictionary import CACHE, CLIENT_JSON, ENV_FILE, REVIEW_FILE, Supabase, load_excludes, EXCLUDE_FILE, read_env

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

HERE = Path(__file__).parent
DAILY_REVIEW = HERE / "daily-review.tsv"
ANSWER_COUNT = 365
NEIGHBOR_COUNT = 1000
CANDIDATE_TOP = 600
RICHNESS_K = 100
KST = timezone(timedelta(hours=9))


def neighbor_ids(vectors: np.ndarray, ids: list[int], index: int, count: int) -> list[int]:
    """index번째 단어와 가까운 순 count개의 id. 자기 자신은 뺀다. 벡터는 정규화돼 있다."""
    sims = vectors @ vectors[index]
    sims[index] = -np.inf
    order = np.argsort(-sims)[:count]
    return [ids[j] for j in order]


def richness(vectors: np.ndarray, index: int, k: int) -> float:
    sims = vectors @ vectors[index]
    sims[index] = -np.inf
    return float(np.sort(sims)[-k:].mean())


def pick_answers(
    words: list[dict], vectors: np.ndarray, ids: list[int], count: int, top: int, max_grade: int, seed: int
) -> list[dict]:
    """이웃이 풍부한 순 top개를 뽑아 섞고 count개를 돌려준다."""
    at = {word_id: i for i, word_id in enumerate(ids)}
    candidates = [
        w for w in words
        if w["grade"] <= max_grade and len(w["word"]) >= 2 and w["id"] in at
    ]
    k = min(RICHNESS_K, len(ids) - 1)
    scored = sorted(candidates, key=lambda w: richness(vectors, at[w["id"]], k), reverse=True)[:top]
    random.Random(seed).shuffle(scored)
    return scored[:count]


def assign_dates(start: str, count: int) -> list[str]:
    first = date.fromisoformat(start)
    return [(first + timedelta(days=i)).isoformat() for i in range(count)]


def tomorrow_kst() -> str:
    return (datetime.now(KST).date() + timedelta(days=1)).isoformat()


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    start = args[0] if args else tomorrow_kst()
    schema = sys.argv[sys.argv.index("--schema") + 1] if "--schema" in sys.argv else "public"

    vectors = np.load(CACHE.parent / "vectors.npy")
    ids = json.loads((CACHE.parent / "vectors-ids.json").read_text(encoding="utf-8"))
    client = json.loads(CLIENT_JSON.read_text(encoding="utf-8"))
    # 등급은 검토용 TSV에 있다. 클라이언트 JSON엔 없다.
    grade_of = {}
    for line in REVIEW_FILE.read_text(encoding="utf-8").splitlines():
        word, grade, _ = line.split("\t", 2)
        grade_of[word] = int(grade)
    excluded = load_excludes(EXCLUDE_FILE)
    words = [
        {"id": w["id"], "word": w["word"], "grade": grade_of.get(w["word"], 9)}
        for w in client["words"] if w["word"] not in excluded
    ]

    answers = pick_answers(words, vectors, ids, ANSWER_COUNT, CANDIDATE_TOP, max_grade=2, seed=42)
    dates = assign_dates(start, len(answers))
    at = {word_id: i for i, word_id in enumerate(ids)}
    rows = []
    lines = []
    for day, answer in zip(dates, answers):
        near = neighbor_ids(vectors, ids, at[answer["id"]], NEIGHBOR_COUNT)
        rows.append({"date": day, "word_id": answer["id"], "neighbors": near})
        word_of = {w["id"]: w["word"] for w in client["words"]}
        lines.append(f"{day}\t{answer['word']}\t" + ", ".join(word_of[i] for i in near[:5]))
    DAILY_REVIEW.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"{len(rows)} days from {start} → {DAILY_REVIEW.name}")

    if "--upload" in sys.argv:
        env = read_env(ENV_FILE)
        db = Supabase(env["NEXT_PUBLIC_SUPABASE_URL"], env["SUPABASE_SERVICE_ROLE_KEY"], schema)
        for i in range(0, len(rows), 50):
            status, _, _ = db._request(
                "POST", "/rest/v1/daily_words", rows[i : i + 50],
                {"Prefer": "resolution=merge-duplicates,return=minimal"},
            )
            assert status in (200, 201), status
        _, headers, _ = db._request(
            "GET", "/rest/v1/daily_words?select=date", extra={"Prefer": "count=exact", "Range": "0-0"}
        )
        print(f"{schema}.daily_words: {headers['Content-Range'].split('/')[1]} rows")


if __name__ == "__main__":
    main()
```

- [x] **Step 5: 통과 확인** — `uv run pytest test_build_daily.py -q` → `4 passed`

- [x] **Step 6: 벡터 캐시 만들고 365개 뽑아 훑기**

```bash
uv run python build_dictionary.py --upload --schema test      # vectors.npy를 남긴다 (2분)
uv run python build_daily.py
head -10 daily-review.tsv
```

Expected: `365 days from 2026-09-11 → daily-review.tsv`. 훑을 것: 첫 날들의 정답이 아이가 아는 말인가, 이웃 5개가 그럴듯한가, "-이"·"-것" 같은 접미어 단어가 정답에 있으면 `dictionary-exclude.yaml`이 아니라 여기서만 빼고 싶으므로 `pick_answers`의 후보 조건에 `not w["word"].endswith(("것", "이"))`를 넣을지 판단한다. 문제가 없으면 그대로 간다.

- [x] **Step 7: test 스키마에 올리고 다시 돌려 멱등 확인**

```bash
uv run python build_daily.py --upload --schema test
uv run python build_daily.py --upload --schema test
```

Expected: 두 번 다 `test.daily_words: 365 rows`.

- [x] **Step 8: `.gitignore`와 커밋**

`tools/embed/.gitignore`에 `daily-review.tsv` 추가.

```bash
git add tools/embed/build_dictionary.py tools/embed/build_daily.py tools/embed/test_build_daily.py tools/embed/.gitignore
git commit -m "tools: build_daily — 이웃이 풍부한 정답 365개와 이웃 1000개를 daily_words에"
```

---

### Task 3: `lib/daily.ts` 순수 함수 (TDD)

**Files:**
- Create: `frontend/lib/daily.ts`, `frontend/lib/daily.test.ts`

- [x] **Step 1: 실패하는 테스트**

```ts
import { describe, it, expect } from "vitest";
import { bestTriesOf, streakOf, temperatureOf, todayKst } from "./daily";

describe("todayKst", () => {
  it("UTC 자정 전이라도 한국 시간으로 날짜를 센다", () => {
    // 2026-09-10 16:00Z = 2026-09-11 01:00 KST
    expect(todayKst(Date.UTC(2026, 8, 10, 16, 0))).toBe("2026-09-11");
    expect(todayKst(Date.UTC(2026, 8, 10, 14, 59))).toBe("2026-09-10");
  });
});

describe("temperatureOf", () => {
  it("정답·10·100·1000위 경계로 나눈다", () => {
    expect(temperatureOf(0)).toBe("correct");
    expect(temperatureOf(1)).toBe("hot");
    expect(temperatureOf(10)).toBe("hot");
    expect(temperatureOf(11)).toBe("warm");
    expect(temperatureOf(100)).toBe("warm");
    expect(temperatureOf(101)).toBe("lukewarm");
    expect(temperatureOf(1000)).toBe("lukewarm");
    expect(temperatureOf(null)).toBe("cold");
  });
});

describe("streakOf / bestTriesOf", () => {
  const history = [
    { date: "2026-09-10", tries: 7, solved: true },
    { date: "2026-09-09", tries: 30, solved: false },
    { date: "2026-09-08", tries: 4, solved: true },
    { date: "2026-09-05", tries: 2, solved: true },
  ];

  it("오늘 또는 어제부터 이어진 날 수를 센다", () => {
    expect(streakOf(history, "2026-09-10")).toBe(3);
    expect(streakOf(history, "2026-09-11")).toBe(3); // 오늘 아직 안 했어도 어제까지 이어졌으면 유지
    expect(streakOf(history, "2026-09-13")).toBe(0);
    expect(streakOf([], "2026-09-10")).toBe(0);
  });

  it("맞힌 날 중 가장 적은 시도", () => {
    expect(bestTriesOf(history)).toBe(2);
    expect(bestTriesOf([{ date: "2026-09-10", tries: 5, solved: false }])).toBeNull();
  });
});
```

- [x] **Step 2: 실패 확인** — `npx vitest run lib/daily.test.ts`

- [x] **Step 3: 구현**

```ts
/** 오늘의 단어의 날짜·온도·기록 계산. 서버와 화면이 같이 쓴다. DB를 모른다. */

export type Temperature = "correct" | "hot" | "warm" | "lukewarm" | "cold";

/** 한국 시간 기준 YYYY-MM-DD. 서버(UTC)와 아이의 폰이 같은 날짜를 봐야 한다. */
export function todayKst(now: number = Date.now()): string {
  return new Date(now + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** rank 0은 정답, null은 이웃 1000개 밖. 설계 문서 17장 표. */
export function temperatureOf(rank: number | null): Temperature {
  if (rank === 0) return "correct";
  if (rank === null) return "cold";
  if (rank <= 10) return "hot";
  if (rank <= 100) return "warm";
  if (rank <= 1000) return "lukewarm";
  return "cold";
}

export interface DayRecord {
  date: string;
  tries: number;
  solved: boolean;
}

function dayBefore(date: string): string {
  return new Date(Date.parse(date) - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** 오늘(또는 오늘 아직 안 했으면 어제)부터 거꾸로 이어진 참여 일수. 맞혔는지는 안 따진다. */
export function streakOf(history: DayRecord[], today: string): number {
  const played = new Set(history.map((h) => h.date));
  let day = played.has(today) ? today : dayBefore(today);
  let streak = 0;
  while (played.has(day)) {
    streak += 1;
    day = dayBefore(day);
  }
  return streak;
}

export function bestTriesOf(history: DayRecord[]): number | null {
  const solved = history.filter((h) => h.solved).map((h) => h.tries);
  return solved.length > 0 ? Math.min(...solved) : null;
}
```

- [x] **Step 4: 통과 확인** → `5 passed` (describe 3개, it 5개)

- [x] **Step 5: 커밋** — `git add lib/daily.ts lib/daily.test.ts && git commit -m "daily: 날짜·온도·연속 참여 계산"`

---

### Task 4: `lib/daily-server.ts`와 API 셋

**Files:**
- Create: `frontend/lib/daily-server.ts`
- Create: `frontend/app/api/daily/route.ts`, `guess/route.ts`, `hint/route.ts`

- [x] **Step 1: `lib/daily-server.ts`**

```ts
import "server-only";

import { serverSupabase } from "@/lib/supabase";
import { wordSimilarity } from "@/lib/words";
import { isWordId, wordOf, type DictWord } from "@/lib/dictionary";
import type { DayRecord } from "@/lib/daily";

interface DailyWord {
  date: string;
  wordId: number;
  neighbors: number[];
}

/** 그날의 정답. 없으면 null(365일치가 떨어졌다는 뜻 -- build_daily.py를 다시 돌린다). */
export async function dailyWord(date: string): Promise<DailyWord | null> {
  const { data, error } = await serverSupabase()
    .from("daily_words")
    .select("date, word_id, neighbors")
    .eq("date", date)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return { date: data.date as string, wordId: data.word_id as number, neighbors: data.neighbors as number[] };
}

export interface Judged {
  word: DictWord;
  similarity: number;
  /** 0 = 정답, 1~1000 = 이웃 순위, null = 밖 */
  rank: number | null;
}

/** 시도 하나를 채점한다. 정답 id는 여기서만 보고 밖으로 안 나간다. */
export async function judge(daily: DailyWord, guessId: number): Promise<Judged> {
  const word = wordOf(guessId)!;
  if (guessId === daily.wordId) return { word, similarity: 1, rank: 0 };

  const similarity = (await wordSimilarity(daily.wordId, guessId)) ?? 0;
  const at = daily.neighbors.indexOf(guessId);

  return { word, similarity, rank: at === -1 ? null : at + 1 };
}

export async function recordGuess(kidId: string, date: string, judged: Judged, hinted: boolean): Promise<void> {
  const { error } = await serverSupabase().from("guesses").upsert(
    {
      kid_id: kidId,
      date,
      word_id: judged.word.id,
      similarity: judged.similarity,
      rank: judged.rank,
      hinted,
    },
    { onConflict: "kid_id,date,word_id", ignoreDuplicates: true },
  );
  if (error) throw error;
}

export interface GuessRow {
  word: DictWord;
  similarity: number;
  rank: number | null;
  hinted: boolean;
}

export async function myGuesses(kidId: string, date: string): Promise<GuessRow[]> {
  const { data, error } = await serverSupabase()
    .from("guesses")
    .select("word_id, similarity, rank, hinted")
    .eq("kid_id", kidId)
    .eq("date", date)
    .order("similarity", { ascending: false });
  if (error) throw error;

  return (data ?? [])
    .filter((row) => isWordId(row.word_id))
    .map((row) => ({
      word: wordOf(row.word_id as number)!,
      similarity: row.similarity as number,
      rank: row.rank as number | null,
      hinted: row.hinted as boolean,
    }));
}

export interface BoardRow {
  kidId: string;
  nickname: string;
  tries: number;
  hinted: boolean;
}

export async function board(date: string): Promise<BoardRow[]> {
  const { data, error } = await serverSupabase().rpc("daily_board", { p_date: date });
  if (error) throw error;

  return ((data ?? []) as { kid_id: string; nickname: string; tries: number; hinted: boolean }[]).map((r) => ({
    kidId: r.kid_id,
    nickname: r.nickname,
    tries: r.tries,
    hinted: r.hinted,
  }));
}

export async function popular(date: string, count: number): Promise<{ word: string; guessers: number }[]> {
  const { data, error } = await serverSupabase().rpc("daily_popular", { p_date: date, p_count: count });
  if (error) throw error;

  return ((data ?? []) as { word: string; guessers: number }[]).map((r) => ({ word: r.word, guessers: r.guessers }));
}

export async function dailyHistory(kidId: string): Promise<DayRecord[]> {
  const { data, error } = await serverSupabase().rpc("daily_history", { p_kid: kidId });
  if (error) throw error;

  return ((data ?? []) as { date: string; tries: number; solved: boolean }[]).map((r) => ({
    date: r.date,
    tries: r.tries,
    solved: r.solved,
  }));
}
```

- [x] **Step 2: `GET /api/daily`**

`frontend/app/api/daily/route.ts`:

```ts
import { currentKidId } from "@/lib/auth/current";
import { todayKst, temperatureOf } from "@/lib/daily";
import { board, dailyWord, myGuesses, popular } from "@/lib/daily-server";
import { wordOf } from "@/lib/dictionary";
import { allowWordsRequest } from "@/lib/words";

const TOP = 10;
const POPULAR = 5;

function dayBefore(date: string): string {
  return new Date(Date.parse(date) - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * 오늘 판의 상태. 정답 id는 담지 않는다 -- 어제 판의 정답만 단어로 공개한다.
 * 리더보드 순위는 동점 공동 순위: 나보다 시도가 적은 아이 수 + 1.
 */
export async function GET(request: Request) {
  if (!(await allowWordsRequest(request))) {
    return Response.json({ error: "too_many_attempts" }, { status: 429 });
  }

  const today = todayKst();
  const yesterday = dayBefore(today);
  const kidId = await currentKidId();

  const [daily, rows, mine, yesterdayWord, yesterdayPopular] = await Promise.all([
    dailyWord(today),
    board(today),
    kidId ? myGuesses(kidId, today) : Promise.resolve([]),
    dailyWord(yesterday),
    popular(yesterday, POPULAR),
  ]);

  const me = kidId ? rows.find((r) => r.kidId === kidId) : undefined;
  const myRank = me ? rows.filter((r) => r.tries < me.tries).length + 1 : null;

  return Response.json({
    date: today,
    available: daily !== null,
    signedIn: kidId !== null,
    guesses: mine.map((g) => ({ ...g, temperature: temperatureOf(g.rank) })),
    solved: mine.some((g) => g.rank === 0),
    board: {
      top: rows.slice(0, TOP).map(({ nickname, tries, hinted }) => ({ nickname, tries, hinted })),
      solvedCount: rows.length,
      me: me ? { rank: myRank, tries: me.tries, hinted: me.hinted } : null,
    },
    yesterday: yesterdayWord
      ? { word: wordOf(yesterdayWord.wordId)?.word ?? null, popular: yesterdayPopular }
      : null,
  });
}
```

- [x] **Step 3: `POST /api/daily/guess`**

```ts
import { z } from "zod";
import { currentKidId } from "@/lib/auth/current";
import { todayKst, temperatureOf } from "@/lib/daily";
import { dailyWord, judge, myGuesses, recordGuess } from "@/lib/daily-server";
import { isWordId } from "@/lib/dictionary";
import { allowWordsRequest } from "@/lib/words";

const body = z.strictObject({ wordId: z.number().int() });

/** 시도 하나. 비회원도 채점은 받지만 기록되지 않는다. */
export async function POST(request: Request) {
  if (!(await allowWordsRequest(request))) {
    return Response.json({ error: "too_many_attempts" }, { status: 429 });
  }

  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isWordId(parsed.data.wordId)) {
    return Response.json({ error: "unknown_word" }, { status: 400 });
  }

  const today = todayKst();
  const daily = await dailyWord(today);
  if (!daily) return Response.json({ error: "no_word_today" }, { status: 404 });

  const judged = await judge(daily, parsed.data.wordId);

  const kidId = await currentKidId();
  let tries: number | null = null;
  if (kidId) {
    await recordGuess(kidId, today, judged, false);
    tries = (await myGuesses(kidId, today)).length;
  }

  return Response.json({ ...judged, temperature: temperatureOf(judged.rank), tries });
}
```

- [x] **Step 4: `POST /api/daily/hint`**

```ts
import { z } from "zod";
import { currentKidId } from "@/lib/auth/current";
import { todayKst, temperatureOf } from "@/lib/daily";
import { dailyWord, judge, myGuesses, recordGuess } from "@/lib/daily-server";
import { allowWordsRequest } from "@/lib/words";

/** 비회원은 자기 최고 순위를 보내온다. 로그인한 아이는 서버 기록에서 읽는다. */
const body = z.strictObject({ bestRank: z.number().int().positive().max(1001).optional() });

const OUTSIDE = 1001;

/**
 * 힌트: 지금까지 최고 순위의 절반 순위에 있는 이웃 하나. 정답(0위)은 절대 주지 않는다.
 * 로그인한 아이는 힌트 단어가 hinted=true 시도로 기록돼 리더보드에 표시된다.
 */
export async function POST(request: Request) {
  if (!(await allowWordsRequest(request))) {
    return Response.json({ error: "too_many_attempts" }, { status: 429 });
  }

  const parsed = body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });

  const today = todayKst();
  const daily = await dailyWord(today);
  if (!daily) return Response.json({ error: "no_word_today" }, { status: 404 });

  const kidId = await currentKidId();
  let best = parsed.data.bestRank ?? OUTSIDE;
  if (kidId) {
    const ranks = (await myGuesses(kidId, today)).map((g) => g.rank).filter((r): r is number => r !== null && r > 0);
    best = ranks.length > 0 ? Math.min(...ranks) : OUTSIDE;
  }

  // 절반 순위. 최고가 1위면 더 줄 게 없다 -- 2위를 준다.
  const target = Math.max(1, Math.floor(best / 2));
  const hintId = daily.neighbors[best <= 1 ? 1 : target - 1];
  if (hintId === undefined) return Response.json({ error: "no_hint" }, { status: 404 });

  const judged = await judge(daily, hintId);
  if (kidId) await recordGuess(kidId, today, judged, true);

  return Response.json({ ...judged, temperature: temperatureOf(judged.rank), hinted: true });
}
```

- [x] **Step 5: lint·커밋**

```bash
npm run lint
git add lib/daily-server.ts app/api/daily
git commit -m "daily: /api/daily·guess·hint — 채점·기록·리더보드 집계 중계"
```

---

### Task 5: 문구·화면·라우트

**Files:**
- Modify: `frontend/copy/ui.ts`
- Create: `frontend/components/daily/DailyClient.tsx`, `frontend/app/daily/page.tsx`
- Modify: `frontend/app/play/page.tsx`

- [x] **Step 1: 문구**

`copy/ui.ts` 끝에:

```ts
/** 오늘의 단어(/daily) 문구. 아이 화면이라 반말. */
export const daily = {
  title: "오늘의 단어",
  door: "숨은 단어를 맞혀봐. 넣을 때마다 얼마나 가까운지 알려줘!",
  owl: "오늘의 단어가 숨어 있어. 아무 단어나 넣어봐. 가까울수록 뜨거워져!",
  note: "점수는 이 모델이 비슷하다고 본 정도야. 말뜻의 정답은 아니야.",
  guessLabel: "넣을 단어",
  temperature: {
    correct: "정답! 🎉",
    hot: "뜨거워 🔥",
    warm: "따뜻해 ☀️",
    lukewarm: "미지근해 🌤️",
    cold: "차가워 ❄️",
  },
  rankInside: (rank: number) => `${rank}위`,
  rankOutside: "1000위 밖",
  tries: (n: number) => `${n}번 넣었어`,
  solvedTitle: "맞혔어!",
  solvedBody: (tries: number) => `${tries}번 만에 맞혔어. 내일 또 새 단어가 나와!`,
  hint: "힌트 볼래?",
  hinted: "힌트로 받은 말",
  noWord: "오늘은 단어가 준비 안 됐어. 내일 다시 와줘!",
  boardTitle: "오늘 순위",
  boardSolved: (n: number) => `오늘 ${n}명이 맞혔어`,
  boardMe: (rank: number, total: number) => `나: ${total}명 중 ${rank}등`,
  boardGuest: "방을 만들면 순위에 올라가",
  boardHintMark: "💡",
  yesterdayTitle: "어제 판",
  yesterdayAnswer: (word: string) => `어제 단어는 "${word}"였어`,
  yesterdayPopular: "아이들이 많이 넣은 말",
  yesterdayWhy: "왜 이 말들이 가까웠을까? 실험실에서 재봐!",
  toLab: "단어 실험실로",
  loadFailed: "지금은 잴 수 없어. 잠시 뒤에 다시 해볼래?",
  roomStreak: (days: number) => `연속 ${days}일 참여`,
  roomBest: (tries: number) => `최소 ${tries}번 만에 정답`,
} as const;
```

- [x] **Step 2: `DailyClient.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { daily, lab } from "@/copy/ui";
import { type Temperature } from "@/lib/daily";
import { type DictWord } from "@/lib/dictionary";
import { popButton } from "@/components/steps/styles";
import MascotBubble from "@/components/MascotBubble";
import WordPicker from "@/components/lab/WordPicker";

interface Guess {
  word: DictWord;
  similarity: number;
  rank: number | null;
  hinted: boolean;
  temperature: Temperature;
}

interface State {
  date: string;
  available: boolean;
  signedIn: boolean;
  guesses: Guess[];
  solved: boolean;
  board: {
    top: { nickname: string; tries: number; hinted: boolean }[];
    solvedCount: number;
    me: { rank: number; tries: number; hinted: boolean } | null;
  };
  yesterday: { word: string | null; popular: { word: string; guessers: number }[] } | null;
}

const HINT_AFTER = 20;
const localKey = (date: string) => `nolai:daily:${date}`;
const toScore = (similarity: number) => Math.round(similarity * 100);

/** 비회원의 오늘 시도. 기기에만 남는다. 못 읽으면 빈 목록. */
function readLocal(date: string): Guess[] {
  try {
    const raw = window.localStorage.getItem(localKey(date));
    return raw ? (JSON.parse(raw) as Guess[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(date: string, guesses: Guess[]) {
  try {
    window.localStorage.setItem(localKey(date), JSON.stringify(guesses));
  } catch {
    // 못 남기면 새로고침에 사라질 뿐이다
  }
}

const bg: Record<Temperature, string> = {
  correct: "bg-candy-teal",
  hot: "bg-candy-red",
  warm: "bg-candy-yellow",
  lukewarm: "bg-cream",
  cold: "bg-paper",
};

/**
 * 오늘의 단어. 설계 문서 17장. 꼬맨틀 방식 -- 숨은 단어를 넣을 때마다 유사도·온도·순위가
 * 나오고, 그걸로 좁혀 간다. 시도는 무제한, 20번 넘게 헤매면 힌트.
 */
export default function DailyClient() {
  const [state, setState] = useState<State | null>(null);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [pick, setPick] = useState<DictWord | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/daily").catch(() => null);
    if (!response?.ok) {
      setError(daily.loadFailed);
      return;
    }
    const data = (await response.json()) as State;
    setState(data);
    setGuesses(data.signedIn ? data.guesses : readLocal(data.date));
  }

  useEffect(() => {
    void load();
  }, []);

  const solved = guesses.some((g) => g.rank === 0);

  function add(guess: Guess) {
    setGuesses((previous) => {
      if (previous.some((g) => g.word.id === guess.word.id)) return previous;
      const next = [...previous, guess].sort((a, b) => b.similarity - a.similarity);
      if (state && !state.signedIn) writeLocal(state.date, next);
      return next;
    });
  }

  async function submit(word: DictWord | null) {
    setPick(word);
    if (!word || busy || solved) return;
    setBusy(true);
    setError(null);
    const response = await fetch("/api/daily/guess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordId: word.id }),
    }).catch(() => null);
    setBusy(false);
    setPick(null);
    if (!response?.ok) {
      setError(daily.loadFailed);
      return;
    }
    const judged = (await response.json()) as Guess;
    add({ ...judged, hinted: false });
    if (judged.rank === 0) void load(); // 순위판을 새로 받는다
  }

  async function hint() {
    setBusy(true);
    const ranks = guesses.map((g) => g.rank).filter((r): r is number => r !== null && r > 0);
    const bestRank = ranks.length > 0 ? Math.min(...ranks) : undefined;
    const response = await fetch("/api/daily/hint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bestRank ? { bestRank } : {}),
    }).catch(() => null);
    setBusy(false);
    if (!response?.ok) {
      setError(daily.loadFailed);
      return;
    }
    add({ ...((await response.json()) as Guess), hinted: true });
  }

  if (error && !state) return <p className="text-sm font-extrabold">{error}</p>;
  if (!state) return null;
  if (!state.available) return <MascotBubble text={daily.noWord} />;

  const tries = guesses.length;

  return (
    <div className="flex flex-col gap-6">
      <MascotBubble text={daily.owl} />
      {error && <p className="text-sm font-extrabold">{error}</p>}

      {solved ? (
        <section data-testid="daily-solved" className="rounded-pop border-[3px] border-ink bg-candy-teal p-4 shadow-[0_4px_0_var(--color-ink)]">
          <p className="text-xl font-black">{daily.solvedTitle}</p>
          <p className="text-sm font-extrabold">{daily.solvedBody(tries)}</p>
        </section>
      ) : (
        <section className="flex flex-col gap-2">
          <WordPicker label={daily.guessLabel} value={pick} onPick={submit} />
          <p className="text-xs text-muted">{daily.tries(tries)}</p>
          {tries >= HINT_AFTER && (
            <button type="button" data-testid="daily-hint" className={popButton} disabled={busy} onClick={hint}>
              {daily.hint}
            </button>
          )}
        </section>
      )}

      {guesses.length > 0 && (
        <ol data-testid="daily-guesses" className="flex flex-col gap-1">
          {guesses.map((g) => (
            <li
              key={g.word.id}
              data-temperature={g.temperature}
              className={`flex items-center justify-between rounded-pop border-2 border-ink px-3 py-1 text-sm font-extrabold ${bg[g.temperature]}`}
            >
              <span>
                {g.hinted && `${daily.boardHintMark} `}
                {g.word.word}
              </span>
              <span className="flex items-center gap-2">
                <span className="text-xs">{g.rank === null ? daily.rankOutside : g.rank === 0 ? "" : daily.rankInside(g.rank)}</span>
                <span className="font-mono">{toScore(g.similarity)}</span>
                <span>{daily.temperature[g.temperature]}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
      <p className="text-xs text-muted">{daily.note}</p>

      <section data-testid="daily-board" className="flex flex-col gap-2">
        <h2 className="text-lg font-extrabold">{daily.boardTitle}</h2>
        <p className="text-sm text-muted">{daily.boardSolved(state.board.solvedCount)}</p>
        {state.board.top.length > 0 && (
          <ol className="flex flex-col gap-1">
            {state.board.top.map((row, index) => (
              <li key={`${row.nickname}-${index}`} className="flex items-center gap-2 rounded-pop border-2 border-ink bg-paper px-3 py-1 text-sm font-extrabold">
                <span className="w-6 text-muted">{index + 1}</span>
                <span className="flex-1">{row.nickname}</span>
                <span className="font-mono">{row.tries}번{row.hinted && ` ${daily.boardHintMark}`}</span>
              </li>
            ))}
          </ol>
        )}
        {state.board.me ? (
          <p data-testid="daily-me" className="text-sm font-extrabold">
            {daily.boardMe(state.board.me.rank, state.board.solvedCount)}
          </p>
        ) : (
          !state.signedIn && (
            <Link href="/join" className="text-sm font-extrabold underline">
              {daily.boardGuest}
            </Link>
          )
        )}
      </section>

      {state.yesterday?.word && (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-extrabold">{daily.yesterdayTitle}</h2>
          <p className="text-sm font-extrabold">{daily.yesterdayAnswer(state.yesterday.word)}</p>
          {state.yesterday.popular.length > 0 && (
            <>
              <p className="text-xs text-muted">{daily.yesterdayPopular}</p>
              <ul className="flex flex-wrap gap-1">
                {state.yesterday.popular.map((p) => (
                  <li key={p.word} className="rounded-full border-2 border-ink bg-cream px-2 py-0.5 text-xs font-extrabold">
                    {p.word} · {p.guessers}
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="text-xs text-muted">{daily.yesterdayWhy}</p>
          <Link href="/lab" className="text-sm font-extrabold underline">
            {daily.toLab} ({lab.title})
          </Link>
        </section>
      )}
    </div>
  );
}
```

- [x] **Step 3: `/daily` 라우트** — `app/lab/page.tsx`를 본떠 `app/daily/page.tsx`. 제목 `daily.title`, 마스코트 `mascotArt("think")`, 본문 `<DailyClient />`. `robots: noindex`.

- [x] **Step 4: `/play`의 문** — 실험실 문 바로 위에 같은 모양으로 `href="/daily"`, 이모지 🎯, `daily.title`·`daily.door`, `data-testid="daily-door"`. 실험실 문은 `bg-candy-yellow` 그대로, 오늘의 단어는 `bg-candy-teal`.

- [x] **Step 5: 눈으로 본다** — `npm run dev`(포트가 3001로 밀리면 그 주소)로 `/daily`. 운영 `public.daily_words`는 아직 비어 있으므로 "오늘은 단어가 준비 안 됐어"가 보여야 한다. 그 뒤 Task 6까지 끝내고 E2E 서버(test 스키마)에서 실제 흐름을 본다. 서버는 끝나면 반드시 끈다(PID까지).

- [x] **Step 6: lint·커밋**

```bash
git add copy/ui.ts components/daily app/daily app/play/page.tsx
git commit -m "daily: /daily 화면 — 넣을 때마다 온도·순위, 힌트, 오늘 순위, 어제 판"
```

---

### Task 6: 내 방 기록

**Files:**
- Modify: `frontend/lib/room.ts`, `frontend/app/room/page.tsx`

- [x] **Step 1: `loadRoom`에 기록 추가**

`Room` 인터페이스에 `dailyStreak: number; dailyBest: number | null;`. `loadRoom`의 `Promise.all`에 `dailyHistory(kidId)`를 넣고(`import { dailyHistory } from "./daily-server"`, `import { bestTriesOf, streakOf, todayKst } from "./daily"`), 반환에:

```ts
    dailyStreak: streakOf(days, todayKst()),
    dailyBest: bestTriesOf(days),
```

- [x] **Step 2: 내 방 화면** — 배지 섹션 위에:

```tsx
      {(room.dailyStreak > 0 || room.dailyBest !== null) && (
        <p data-testid="daily-record" className="text-sm font-extrabold">
          🎯 {room.dailyStreak > 0 && daily.roomStreak(room.dailyStreak)}
          {room.dailyStreak > 0 && room.dailyBest !== null && " · "}
          {room.dailyBest !== null && daily.roomBest(room.dailyBest)}
        </p>
      )}
```

`import { account, badgeNames, daily, lab, ui } from "@/copy/ui";`

- [x] **Step 3: 단위 테스트·lint** — `npm run test && npm run lint`

- [x] **Step 4: 커밋** — `git commit -m "daily: 내 방에 연속 참여 일수와 최소 시도"`

---

### Task 7: E2E

**Files:**
- Create: `frontend/e2e/daily.spec.ts`

- [x] **Step 1: 테스트**

```ts
import { test, expect, type Page } from "@playwright/test";
import { clearAttempts, deleteKidsByNickname, testDb } from "./support/db";
import dictionary from "../datasets/dictionary.json";

/**
 * test 스키마에 오늘의 단어를 "강아지"로 심고 논다. 이웃은 DB의 nearest_words로 만든다.
 * 실험실 E2E와 같은 사전을 쓴다.
 */
const created: string[] = [];
const dog = dictionary.words.find((w) => w.word === "강아지")!.id;

function todayKst(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

test.beforeAll(async () => {
  const db = testDb();
  const { data, error } = await db.rpc("nearest_words", { p_word_id: dog, p_count: 1000 });
  if (error) throw error;
  const neighbors = (data as { id: number }[]).map((r) => r.id);
  const { error: upsertError } = await db
    .from("daily_words")
    .upsert({ date: todayKst(), word_id: dog, neighbors }, { onConflict: "date" });
  if (upsertError) throw upsertError;
});

test.afterEach(async () => {
  for (const nickname of created.splice(0)) {
    await deleteKidsByNickname(nickname);
  }
  await clearAttempts(["signup-ip:", "words-ip:"]);
});

async function guess(page: Page, word: string) {
  await page.getByRole("textbox", { name: "넣을 단어" }).fill(word);
  await page.getByRole("button", { name: word, exact: true }).click();
}

test("넣을 때마다 온도가 나오고, 정답을 넣으면 맞힌 화면이 뜬다", async ({ page }) => {
  await page.goto("/daily");
  await guess(page, "고양이");
  const rows = page.getByTestId("daily-guesses").getByRole("listitem");
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toHaveAttribute("data-temperature", /hot|warm/);

  await guess(page, "책상");
  await expect(rows).toHaveCount(2);
  // 유사도 내림차순 -- 고양이가 위
  await expect(rows.first()).toContainText("고양이");

  await guess(page, "강아지");
  await expect(page.getByTestId("daily-solved")).toContainText("3번 만에");
  await expect(page.getByText("방을 만들면 순위에 올라가")).toBeVisible();
});

test("비회원의 시도는 새로고침해도 남는다", async ({ page }) => {
  await page.goto("/daily");
  await guess(page, "고양이");
  await page.reload();
  await expect(page.getByTestId("daily-guesses").getByRole("listitem")).toHaveCount(1);
});

test("방을 만들고 맞히면 오늘 순위에 오르고 내 방에 기록이 남는다", async ({ page }) => {
  await page.goto("/join");
  const candidate = page.locator('[data-testid^="nickname-"]').first();
  const nickname = (await candidate.innerText()).trim();
  created.push(nickname);
  await candidate.click();
  await expect(page.getByTestId("issued-code")).toBeVisible();

  await page.goto("/daily");
  await guess(page, "고양이");
  await guess(page, "강아지");
  await expect(page.getByTestId("daily-solved")).toContainText("2번 만에");
  await expect(page.getByTestId("daily-board")).toContainText(nickname);
  await expect(page.getByTestId("daily-me")).toContainText("등");

  await page.goto("/room");
  await expect(page.getByTestId("daily-record")).toContainText("연속 1일 참여");
  await expect(page.getByTestId("daily-record")).toContainText("최소 2번 만에 정답");
});

test("정답 id는 응답에 없고, 없는 단어는 400", async ({ request }) => {
  const state = await (await request.get("/api/daily")).json();
  expect(JSON.stringify(state)).not.toContain(`"wordId"`);
  expect((await request.post("/api/daily/guess", { data: { wordId: 999999 } })).status()).toBe(400);
});
```

`tsconfig`가 JSON import를 허용하므로(`lib/dictionary.ts`가 이미 한다) `dictionary.json` import는 된다. 안 되면 `readFileSync`로 읽는다.

- [x] **Step 2: 실행** — `npx playwright test e2e/daily.spec.ts` → `4 passed`. 남은 dev 서버가 있으면 먼저 죽인다.

- [x] **Step 3: 전체 E2E** — `npm run test:e2e` → 90 passed (86 + 4)

- [x] **Step 4: 커밋** — `git commit -m "test: 오늘의 단어 E2E — 온도·정답·비회원 유지·리더보드·내 방 기록"`

---

### Task 8: 운영 데이터와 문서

- [x] **Step 1: 운영에 365일치** — `tools/embed/`에서 `uv run python build_daily.py --upload` (시작일은 기본값 내일. **오늘 것도 원하면 오늘 날짜를 인자로**). Expected `public.daily_words: 365 rows`.

- [x] **Step 2: 문서** — `CLAUDE.md` 라우트 줄에 `/daily` 오늘의 단어(17장), 명령 절에 `build_daily.py` 한 문장("365일치가 떨어지기 전에 다시 돌린다"). `frontend/README.md`의 단어 실험실 소절 아래에 "오늘의 단어" 소절(파일 표). 17장 "순서" 3번에 완료 표시, "열린 것"에서 `오늘의 단어 365개를 고르는 기준` 항목을 "이웃 100위 안 유사도 평균 상위 600개에서 무작위 365개(`build_daily.py`)"로 해결 처리.

- [x] **Step 3: 전체 검증** — `npm run test && npm run lint && npm run build`, `uv run pytest -q`

- [x] **Step 4: 커밋, push 확인** — 화면이 바뀌므로 사용자 확인 후 push. push 뒤 폰에서 `/daily`.

---

## 다음

17장의 세 단계가 끝난다. 그다음은 관찰이다 — `guesses`의 날짜 분포(연속 참여)와 실험실 작품 저장 시각으로 "다시 오는가"를 본다. 추적 스크립트는 넣지 않는다.
