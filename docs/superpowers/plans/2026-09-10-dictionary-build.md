# 단어 실험실 사전 빌드 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 국립국어원 등급 목록에서 1~3등급 일반어 명사를 골라 KURE-v1로 임베딩하고, Supabase `words` 테이블(pgvector)과 클라이언트용 `dictionary.json`을 만든다. 설계 문서 17장 "순서" 1번이다.

**Architecture:** `tools/embed/build_dictionary.py` 하나가 xlsx 다운로드 → 거르기 → 검토용 TSV → id 부여 → 클라이언트 JSON → (플래그) 임베딩·업로드까지 한다. 순수 함수(거르기·id 부여·env 파싱)는 pytest로 고정하고, 모델·네트워크가 필요한 부분은 실행으로 검증한다. DB 쪽은 마이그레이션 `0005_words.sql`이 `public`·`test` 두 스키마에 같은 테이블과 최근접 함수를 만든다.

**Tech Stack:** Python 3.12 / uv / openpyxl / sentence-transformers(KURE-v1, 로컬 GPU) / Supabase PostgREST(urllib, 표준 라이브러리) / pgvector.

**읽어야 할 것:** 설계 문서 17장(`docs/superpowers/specs/2026-08-21-nolai-design.md`), 기존 빌더 `tools/embed/build_dataset.py`(`MODEL`·`embed`를 재사용한다), 마이그레이션 `supabase/migrations/0003_test_schema.sql` 머리말(test 스키마 규칙).

**하지 않는 것:** 실험실 화면·API, 오늘의 단어, 리더보드. 4등급 추가. HNSW 인덱스(5천 행은 전수 비교가 수 ms다).

---

## 파일

| 파일 | 역할 |
|---|---|
| `supabase/migrations/0005_words.sql` (생성) | pgvector 켜기, `public.words`·`test.words`, `nearest_words()` 함수 |
| `tools/embed/build_dictionary.py` (생성) | 빌더 본체 |
| `tools/embed/test_build_dictionary.py` (생성) | 순수 함수 테스트 |
| `tools/embed/dictionary-exclude.yaml` (생성) | 사람이 뺀 단어 목록. 커밋한다 |
| `tools/embed/.gitignore` (수정) | `.cache/`, `dictionary-review.tsv` 추가 |
| `tools/embed/pyproject.toml` (수정) | `uv add openpyxl` |
| `frontend/datasets/dictionary.json` (생성, 빌드 산출물) | `{id, word}` 목록. 커밋한다 |
| `frontend/README.md`, `CLAUDE.md` (수정) | 빌더 표에 한 줄 |
| 설계 문서 17장 "열린 것" (수정) | 최종 크기 기록 |

---

### Task 1: 마이그레이션 `0005_words.sql`

**Files:**
- Create: `supabase/migrations/0005_words.sql`

- [x] **Step 1: 파일 작성**

```sql
-- 단어 실험실 사전 (설계 문서 17장)
--
-- 5천 개 남짓한 단어의 원본 임베딩(KURE-v1, 1024차원)을 담는다. 서버는 이 벡터로
-- 코사인 유사도만 계산하고, 벡터 자체는 어떤 응답에도 내려보내지 않는다.
-- 테이블은 tools/embed/build_dictionary.py --upload 가 채운다. 손으로 고치지 않는다.
--
-- 인덱스를 두지 않는다. 5천 행 전수 비교는 수 ms다.
-- ponytail: 5만 행을 넘으면 hnsw (embedding vector_cosine_ops) 를 단다.
--
-- 2026-09-10에 MCP로 운영 DB에 적용했고 이 파일은 그 기록이다. test 스키마를
-- 건드리므로 0003 머리말의 PostgREST reload 두 줄을 같이 보낸다.

create extension if not exists vector with schema extensions;

create table public.words (
  id        integer primary key,
  word      text not null unique,
  grade     smallint not null,
  model     text not null,
  embedding extensions.vector(1024) not null
);

alter table public.words enable row level security;

/**
 * p_word_id와 가까운 단어를 유사도 내림차순으로 p_count개 돌려준다. 자기 자신은 뺀다.
 * similarity = 1 - 코사인 거리. 0~1 사이 실수.
 */
create or replace function public.nearest_words(p_word_id integer, p_count integer)
returns table (id integer, word text, similarity real)
language sql
stable
set search_path = public, extensions
as $$
  select w.id, w.word, (1 - (w.embedding <=> t.embedding))::real as similarity
  from public.words t
  join public.words w on w.id <> t.id
  where t.id = p_word_id
  order by w.embedding <=> t.embedding
  limit p_count;
$$;

revoke execute on function public.nearest_words(integer, integer)
  from public, anon, authenticated;

-- test 스키마. 구조는 public과 같아야 한다(0003 머리말).

create table test.words (
  id        integer primary key,
  word      text not null unique,
  grade     smallint not null,
  model     text not null,
  embedding extensions.vector(1024) not null
);

alter table test.words enable row level security;

create or replace function test.nearest_words(p_word_id integer, p_count integer)
returns table (id integer, word text, similarity real)
language sql
stable
set search_path = test, extensions
as $$
  select w.id, w.word, (1 - (w.embedding <=> t.embedding))::real as similarity
  from test.words t
  join test.words w on w.id <> t.id
  where t.id = p_word_id
  order by w.embedding <=> t.embedding
  limit p_count;
$$;

grant all privileges on table test.words to service_role;
grant execute on function test.nearest_words(integer, integer) to service_role;
revoke execute on function test.nearest_words(integer, integer)
  from public, anon, authenticated;
```

- [x] **Step 2: 운영 DB에 적용**

Supabase MCP(`mcp__plugin_supabase_supabase__*`)로 위 SQL을 그대로 실행한다. 이어서 0003 머리말의 두 줄을 보낸다.

```sql
notify pgrst, 'reload config';
notify pgrst, 'reload schema';
```

MCP 연결이 안 되면 Supabase 대시보드 SQL Editor에 붙여넣는다. 어느 쪽이든 파일 머리말의 날짜를 실제 적용일로 맞춘다.

- [x] **Step 3: 적용 확인**

MCP 또는 SQL Editor에서:

```sql
select count(*) from public.words;          -- 0
select count(*) from test.words;            -- 0
select * from public.nearest_words(1, 5);   -- 빈 결과, 오류 없음
```

Expected: 세 문장 모두 오류 없이 실행된다. `nearest_words`가 `operator does not exist: extensions.vector <=> extensions.vector`를 내면 함수의 `search_path`에 `extensions`가 빠진 것이다.

- [x] **Step 4: 커밋**

```bash
git add supabase/migrations/0005_words.sql
git commit -m "db: words 테이블과 nearest_words 함수 — 단어 실험실 사전 (pgvector)"
```

---

### Task 2: 거르기·id 부여·env 파싱 (순수 함수, TDD)

**Files:**
- Create: `tools/embed/build_dictionary.py`
- Create: `tools/embed/test_build_dictionary.py`
- Modify: `tools/embed/.gitignore`

- [x] **Step 1: 실패하는 테스트 작성**

`tools/embed/test_build_dictionary.py`:

```python
from pathlib import Path

from build_dictionary import apply_excludes, assign_ids, read_env, select_words


def _row(word, grade=1, pos="명사", field="일반어", meaning="뜻"):
    return {"word": word, "grade": grade, "pos": pos, "field": field, "meaning": meaning}


def test_select_keeps_only_general_nouns_up_to_max_grade():
    rows = [
        _row("가게", grade=1),
        _row("가루약", grade=2, field="전문어(약학)"),
        _row("가까이", grade=1, pos="부사/명사"),
        _row("달리다", grade=1, pos="동사"),
        _row("가건물", grade=4),
        _row("군밤", grade=3),
    ]

    assert [w["word"] for w in select_words(rows, max_grade=3)] == ["가게", "군밤"]


def test_select_merges_homographs_keeping_lowest_grade_and_its_meaning():
    rows = [
        _row("가구", grade=3, meaning="집안 식구"),
        _row("가구", grade=1, meaning="집안 살림에 쓰는 기구"),
    ]

    merged = select_words(rows, max_grade=3)

    assert len(merged) == 1
    assert merged[0]["grade"] == 1
    assert merged[0]["meaning"] == "집안 살림에 쓰는 기구"


def test_select_sorts_by_word():
    rows = [_row("나무"), _row("가게"), _row("다리")]

    assert [w["word"] for w in select_words(rows, max_grade=3)] == ["가게", "나무", "다리"]


def test_apply_excludes_drops_listed_words():
    words = [{"word": "가게"}, {"word": "바보"}, {"word": "나무"}]

    assert [w["word"] for w in apply_excludes(words, {"바보"})] == ["가게", "나무"]


def test_assign_ids_keeps_existing_ids_and_appends_new_ones():
    # 작품이 id를 저장하므로, 단어를 빼거나 더해도 남은 단어의 id는 바뀌면 안 된다.
    words = [{"word": "가게"}, {"word": "나무"}, {"word": "새말"}]
    existing = {"가게": 1, "다리": 2, "나무": 3}

    out = assign_ids(words, existing)

    assert [(w["word"], w["id"]) for w in out] == [("가게", 1), ("나무", 3), ("새말", 4)]


def test_assign_ids_starts_at_one_when_nothing_exists():
    out = assign_ids([{"word": "가게"}, {"word": "나무"}], {})

    assert [w["id"] for w in out] == [1, 2]


def test_read_env_strips_quotes_and_skips_comments(tmp_path: Path):
    env_file = tmp_path / ".env.local"
    env_file.write_text(
        '# 주석\nNEXT_PUBLIC_SUPABASE_URL=https://x.supabase.co\n'
        'SUPABASE_SERVICE_ROLE_KEY="abc"\n\nBROKEN LINE\n',
        encoding="utf-8",
    )

    env = read_env(env_file)

    assert env == {
        "NEXT_PUBLIC_SUPABASE_URL": "https://x.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "abc",
    }
```

- [x] **Step 2: 실패 확인**

Run (`tools/embed/`에서): `uv run pytest test_build_dictionary.py -q`
Expected: `ModuleNotFoundError: No module named 'build_dictionary'`

- [x] **Step 3: 최소 구현**

`tools/embed/build_dictionary.py`:

```python
"""국립국어원 기초 어휘 등급 목록에서 단어 실험실 사전을 만든다.

실행:  uv run python build_dictionary.py                 # 거르기 → 검토용 TSV → 클라이언트 JSON
       uv run python build_dictionary.py --upload        # + 임베딩해서 Supabase public.words에 넣는다
       uv run python build_dictionary.py --upload --schema test
출력:  dictionary-review.tsv                  (검토용. 커밋하지 않는다)
       ../../frontend/datasets/dictionary.json ({id, word} 목록. 커밋한다)

설계 문서 17장. 출처 xlsx는 공공누리 제1유형(출처 표시)이다.
"""

from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path

import yaml

from build_dataset import MODEL, OUT_DIR, embed

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

HERE = Path(__file__).parent
SOURCE_URL = (
    "https://www.korean.go.kr/common/download.do?file_path=reportData"
    "&c_file_name=1d6d75b9-45cb-49d4-989f-1483c332573a.xlsx"
)
CACHE = HERE / ".cache" / "vocab-2023.xlsx"
SHEET = "전체(1~5등급), 40,000개"
EXCLUDE_FILE = HERE / "dictionary-exclude.yaml"
REVIEW_FILE = HERE / "dictionary-review.tsv"
CLIENT_JSON = OUT_DIR / "dictionary.json"
ENV_FILE = HERE.parent.parent / "frontend" / ".env.local"

# 설계 문서 17장: 타겟(초4~중1)이 이미 아는 말까지만. 4등급은 이웃 품질이 얇을 때 더한다.
MAX_GRADE = 3


def select_words(rows: list[dict], max_grade: int) -> list[dict]:
    """일반어 명사만 남기고 같은 표기는 하나로 합친다(가장 낮은 등급, 그 뜻풀이).

    임베딩은 표기 하나에 벡터 하나라 동형어를 따로 둘 수 없다. 다의어를 막지 않는
    이유는 17장 규칙 4.
    """
    chosen: dict[str, dict] = {}

    for row in rows:
        if row["grade"] > max_grade:
            continue
        if row["pos"] != "명사" or "전문어" in row["field"]:
            continue

        word = row["word"]
        if word not in chosen or row["grade"] < chosen[word]["grade"]:
            chosen[word] = {"word": word, "grade": row["grade"], "meaning": row["meaning"]}

    return sorted(chosen.values(), key=lambda w: w["word"])


def apply_excludes(words: list[dict], excluded: set[str]) -> list[dict]:
    return [w for w in words if w["word"] not in excluded]


def assign_ids(words: list[dict], existing: dict[str, int]) -> list[dict]:
    """이미 id를 받은 단어는 그 id를 지킨다. 작품이 id를 저장하므로 바뀌면 안 된다.

    새 단어는 지금까지 쓴 가장 큰 id 다음부터 받는다. 빠진 단어의 id는 비워 둔다.
    """
    next_id = max(existing.values(), default=0) + 1
    out = []

    for w in words:
        word_id = existing.get(w["word"])
        if word_id is None:
            word_id = next_id
            next_id += 1
        out.append({**w, "id": word_id})

    return out


def read_env(path: Path) -> dict[str, str]:
    """frontend/.env.local의 KEY=value 줄만 읽는다. 따옴표는 벗긴다."""
    env: dict[str, str] = {}

    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip().strip('"')

    return env
```

- [x] **Step 4: 통과 확인**

Run: `uv run pytest test_build_dictionary.py -q`
Expected: `7 passed`

- [x] **Step 5: `.gitignore`에 캐시와 검토 파일 추가**

`tools/embed/.gitignore` 끝에:

```
.cache/
dictionary-review.tsv
```

- [x] **Step 6: 커밋**

```bash
git add tools/embed/build_dictionary.py tools/embed/test_build_dictionary.py tools/embed/.gitignore
git commit -m "tools: build_dictionary — 등급 목록 거르기·id 부여·env 파싱"
```

---

### Task 3: xlsx 다운로드·읽기·검토용 TSV·클라이언트 JSON

**Files:**
- Modify: `tools/embed/build_dictionary.py`
- Modify: `tools/embed/test_build_dictionary.py`
- Modify: `tools/embed/pyproject.toml` (`uv add openpyxl`)
- Create: `tools/embed/dictionary-exclude.yaml`

- [x] **Step 1: openpyxl 추가**

Run (`tools/embed/`에서): `uv add openpyxl`
Expected: `pyproject.toml`의 `dependencies`에 `openpyxl>=3.1.x`가 생기고 `uv.lock`이 바뀐다.

- [x] **Step 2: 실패하는 테스트 추가**

`test_build_dictionary.py` 끝에:

```python
def test_read_source_parses_grade_pos_field_and_first_meaning(tmp_path: Path):
    import openpyxl

    from build_dictionary import SHEET, read_source

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = SHEET
    ws.append(["등급", "어휘", "표준동형어번호수정", "품사", "어종", "원어", "의미", "분야"])
    ws.append(["1등급", "가게", 0, "명사", "고유어", None, "「1」작은 가게.\n「2」노점.", "일반어"])
    # 4등급 시트는 등급 칸에 공백이 붙어 있다("4등급 ")
    ws.append(["4등급 ", "가건물", 0, "명사", "한자어", "假建物", "임시 건물.", "일반어"])
    ws.append([None, None, None, None, None, None, None, None])
    path = tmp_path / "v.xlsx"
    wb.save(path)

    rows = read_source(path)

    assert rows == [
        {"word": "가게", "grade": 1, "pos": "명사", "field": "일반어", "meaning": "「1」작은 가게."},
        {"word": "가건물", "grade": 4, "pos": "명사", "field": "일반어", "meaning": "임시 건물."},
    ]


def test_write_client_json_and_load_existing_ids_roundtrip(tmp_path: Path):
    from build_dictionary import load_existing_ids, write_client_json

    path = tmp_path / "dictionary.json"
    words = [{"id": 1, "word": "가게", "grade": 1, "meaning": "x"}, {"id": 2, "word": "나무", "grade": 2, "meaning": "y"}]

    write_client_json(words, path)

    data = json.loads(path.read_text(encoding="utf-8"))
    assert data["kind"] == "dictionary"
    assert data["words"] == [{"id": 1, "word": "가게"}, {"id": 2, "word": "나무"}]
    assert load_existing_ids(path) == {"가게": 1, "나무": 2}
    assert load_existing_ids(tmp_path / "missing.json") == {}
```

파일 맨 위 import에 `import json`을 추가한다.

- [x] **Step 3: 실패 확인**

Run: `uv run pytest test_build_dictionary.py -q`
Expected: `ImportError: cannot import name 'read_source'` (2 failed)

- [x] **Step 4: 구현**

`build_dictionary.py`의 `read_env` 아래에 추가:

```python
def download_source(url: str, cache: Path) -> Path:
    if not cache.exists():
        cache.parent.mkdir(parents=True, exist_ok=True)
        print(f"downloading {url}")
        urllib.request.urlretrieve(url, cache)
    return cache


def read_source(path: Path) -> list[dict]:
    """xlsx의 전체 시트를 {word, grade, pos, field, meaning} 행으로 읽는다.

    등급 칸은 "1등급"·"4등급 "처럼 뒤에 공백이 붙기도 한다. 뜻풀이는 첫 줄만 —
    검토용이지 아이에게 보이지 않는다.
    """
    import openpyxl

    ws = openpyxl.load_workbook(path, read_only=True)[SHEET]
    rows = []

    for cells in ws.iter_rows(min_row=2, values_only=True):
        if not cells[1]:
            continue
        rows.append(
            {
                "word": str(cells[1]).strip(),
                "grade": int(str(cells[0]).strip()[0]),
                "pos": str(cells[3] or "").strip(),
                "field": str(cells[7] or ""),
                "meaning": str(cells[6] or "").split("\n")[0],
            }
        )

    return rows


def load_excludes(path: Path) -> set[str]:
    if not path.exists():
        return set()
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    return {str(w) for w in data.get("exclude", [])}


def load_existing_ids(path: Path) -> dict[str, int]:
    if not path.exists():
        return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    return {w["word"]: w["id"] for w in data["words"]}


def write_review(words: list[dict], path: Path) -> None:
    """사람이 훑을 표. 단어·등급·첫 뜻풀이."""
    lines = [f"{w['word']}\t{w['grade']}\t{w['meaning']}" for w in words]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_client_json(words: list[dict], path: Path) -> None:
    """자동완성용. id와 표기만 — 벡터도 등급도 내려보내지 않는다."""
    data = {
        "kind": "dictionary",
        "model": MODEL,
        "source": "국립국어원, 국어 기초 어휘 선정 및 어휘 등급화 목록(2023), 공공누리 제1유형",
        "words": [{"id": w["id"], "word": w["word"]} for w in words],
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False) + "\n", encoding="utf-8")
```

- [x] **Step 5: 통과 확인**

Run: `uv run pytest test_build_dictionary.py -q`
Expected: `9 passed`

- [x] **Step 6: 빈 제외 목록 파일**

`tools/embed/dictionary-exclude.yaml`:

```yaml
# 단어 실험실 사전에서 사람이 뺀 단어 (설계 문서 17장 규칙 3).
#
# 기준: 욕설·비하는 뺀다. 질병·죽음·성은 "그 단어를 아이 화면의 자동완성 목록에
# 띄워도 되는가"로 판단한다. 애매하면 남긴다 -- 사전은 배우는 말이지 금칙어가
# 아니다. 뺀 이유를 옆에 적는다. Task 5에서 채운다.
exclude: []
```

- [x] **Step 7: `main` 작성 (업로드 없이)**

`build_dictionary.py` 끝에:

```python
def build() -> list[dict]:
    rows = read_source(download_source(SOURCE_URL, CACHE))
    words = apply_excludes(select_words(rows, MAX_GRADE), load_excludes(EXCLUDE_FILE))
    words = assign_ids(words, load_existing_ids(CLIENT_JSON))

    write_review(words, REVIEW_FILE)
    write_client_json(words, CLIENT_JSON)
    print(f"{len(words)} words → {CLIENT_JSON.name}, {REVIEW_FILE.name}")

    return words


def main() -> None:
    build()


if __name__ == "__main__":
    main()
```

- [x] **Step 8: 실행해서 산출물 확인**

Run: `uv run python build_dictionary.py`
Expected: 첫 실행은 xlsx(6MB)를 받는다. 마지막 줄 `5298 words → dictionary.json, dictionary-review.tsv`. 숫자는 설계 문서 17장 "확인한 사실"의 5,298(표기 기준)과 같아야 한다 — 다르면 거르기 조건이 문서와 어긋난 것이다.

```bash
head -5 dictionary-review.tsv
python -c "import json;d=json.load(open('../../frontend/datasets/dictionary.json',encoding='utf-8'));print(len(d['words']),d['words'][0],d['words'][-1])"
ls -la ../../frontend/datasets/dictionary.json
```

Expected: TSV 첫 줄이 `가게\t1\t「1」작은 규모로 물건을 파는 집.`처럼 가나다순. JSON 첫 단어 id 1, 마지막 id 5404. 파일 크기 150KB 안팎.

- [x] **Step 9: 프론트 테스트가 새 JSON에 안 걸리는지 확인**

Run (`frontend/`에서): `npx vitest run lib/content.test.ts lib/dataset-schema.test.ts`
Expected: 통과. `datasets/` 폴더를 훑는 테스트는 없다(전부 `content.ts`가 import한 것만 본다).

- [x] **Step 10: 커밋**

```bash
git add tools/embed/build_dictionary.py tools/embed/test_build_dictionary.py tools/embed/pyproject.toml tools/embed/uv.lock tools/embed/dictionary-exclude.yaml frontend/datasets/dictionary.json
git commit -m "tools: build_dictionary — xlsx 읽기·검토용 TSV·dictionary.json (1~3등급 일반어 명사 5,404)"
```

---

### Task 4: 임베딩·업로드·검증 (`--upload`)

**Files:**
- Modify: `tools/embed/build_dictionary.py`

- [x] **Step 1: 업로드 함수 추가**

`build()` 위에:

```python
def to_rows(words: list[dict], vectors) -> list[dict]:
    return [
        {
            "id": w["id"],
            "word": w["word"],
            "grade": w["grade"],
            "model": MODEL,
            "embedding": [round(float(x), 6) for x in vectors[i]],
        }
        for i, w in enumerate(words)
    ]


class Supabase:
    """PostgREST에 service_role로 붙는 최소 클라이언트. 표준 라이브러리만 쓴다."""

    def __init__(self, url: str, key: str, schema: str):
        self.url, self.key, self.schema = url.rstrip("/"), key, schema

    def _request(self, method: str, path: str, body=None, extra: dict | None = None):
        headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            # 읽기는 Accept-Profile, 쓰기·rpc는 Content-Profile이 스키마를 고른다.
            "Accept-Profile": self.schema,
            "Content-Profile": self.schema,
            **(extra or {}),
        }
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(f"{self.url}{path}", data=data, headers=headers, method=method)
        with urllib.request.urlopen(req) as res:
            return res.status, dict(res.headers), res.read().decode()

    def upsert_words(self, rows: list[dict], batch: int = 200) -> None:
        for i in range(0, len(rows), batch):
            status, _, _ = self._request(
                "POST",
                "/rest/v1/words",
                rows[i : i + batch],
                {"Prefer": "resolution=merge-duplicates,return=minimal"},
            )
            assert status in (200, 201), status
            print(f"  upserted {min(i + batch, len(rows))}/{len(rows)}")

    def count_words(self) -> int:
        _, headers, _ = self._request(
            "GET", "/rest/v1/words?select=id", extra={"Prefer": "count=exact", "Range": "0-0"}
        )
        return int(headers["Content-Range"].split("/")[1])

    def nearest(self, word_id: int, count: int) -> list[dict]:
        _, _, body = self._request(
            "POST", "/rest/v1/rpc/nearest_words", {"p_word_id": word_id, "p_count": count}
        )
        return json.loads(body)


def upload(words: list[dict], schema: str) -> None:
    env = read_env(ENV_FILE)
    db = Supabase(env["NEXT_PUBLIC_SUPABASE_URL"], env["SUPABASE_SERVICE_ROLE_KEY"], schema)

    vectors = embed([w["word"] for w in words])
    db.upsert_words(to_rows(words, vectors))

    # 검증 1: 행 수가 맞는가
    total = db.count_words()
    assert total == len(words), f"{schema}.words has {total} rows, expected {len(words)}"

    # 검증 2: DB의 <=>가 로컬 코사인과 같은 답을 내는가 -- 벡터가 깨지지 않고 들어갔다는 증거
    probe = next(w for w in words if w["word"] == "강아지")
    from_db = [n["word"] for n in db.nearest(probe["id"], 5)]
    sims = vectors @ vectors[words.index(probe)]
    sims[words.index(probe)] = -1
    local = [words[j]["word"] for j in sims.argsort()[::-1][:5]]
    assert from_db == local, f"db {from_db} != local {local}"

    print(f"{schema}.words: {total} rows. 강아지 → {', '.join(from_db)}")
```

`main`을 바꾼다:

```python
def main() -> None:
    words = build()

    if "--upload" in sys.argv:
        schema = sys.argv[sys.argv.index("--schema") + 1] if "--schema" in sys.argv else "public"
        upload(words, schema)
```

- [x] **Step 2: 테스트로 `to_rows` 고정**

`test_build_dictionary.py` 끝에:

```python
def test_to_rows_pairs_each_word_with_its_vector():
    import numpy as np

    from build_dictionary import MODEL, to_rows

    words = [{"id": 1, "word": "가게", "grade": 1}, {"id": 2, "word": "나무", "grade": 2}]
    vectors = np.array([[0.5, 0.25], [1.0, 0.0]])

    rows = to_rows(words, vectors)

    assert rows == [
        {"id": 1, "word": "가게", "grade": 1, "model": MODEL, "embedding": [0.5, 0.25]},
        {"id": 2, "word": "나무", "grade": 2, "model": MODEL, "embedding": [1.0, 0.0]},
    ]
```

Run: `uv run pytest test_build_dictionary.py -q`
Expected: `10 passed`

- [x] **Step 3: test 스키마에 먼저 올려서 끝까지 도는지 본다**

Run: `uv run python build_dictionary.py --upload --schema test`
Expected: 모델 로드(`loading nlpai-lab/KURE-v1 on cuda`), 진행 막대, `upserted 200/5404 … 5404/5404`, 마지막 줄 `test.words: 5404 rows. 강아지 → 개, 고양이, 개집, 강아지풀, 애완동물` 같은 것. 이웃 단어는 실제 결과이며 여기 적은 것과 달라도 된다. **assert가 터지면** 벡터가 깨진 것이다 — `Content-Profile`이 안 먹어 public에 들어갔거나(0003 머리말의 reload를 안 보냈을 때), pgvector가 JSON 배열을 못 받은 것이다(그러면 `embedding`을 `str(list)`로 바꿔 다시 시도한다).

- [x] **Step 4: 재실행이 멱등인지 확인**

Run: `uv run python build_dictionary.py --upload --schema test`
Expected: 같은 결과, 행 수 그대로 5404 (upsert라 늘지 않는다).

- [x] **Step 5: 커밋**

```bash
git add tools/embed/build_dictionary.py tools/embed/test_build_dictionary.py
git commit -m "tools: build_dictionary --upload — 임베딩해서 words 테이블에 넣고 DB 최근접이 로컬과 같은지 검증"
```

---

### Task 5: 사람이 훑기 (규칙 3)

**Files:**
- Modify: `tools/embed/dictionary-exclude.yaml`

- [x] **Step 1: 검토용 TSV를 훑어 제외 후보를 만든다**

`tools/embed/dictionary-review.tsv`(5,404줄)를 처음부터 끝까지 읽는다. 5,404줄은 한 번에 읽을 수 있는 크기다 — 표본 추출하지 않는다. 기준은 `dictionary-exclude.yaml` 머리말 그대로다.

- 뺀다: 욕설, 비하·차별어(장애·인종·성별·직업 비하), 노골적 성 표현, 폭력 미화.
- 남긴다: "죽음·병원·약·전쟁"처럼 아이가 책에서 만나는 말. "새끼"(동물 새끼)처럼 뜻풀이가 중립인 말.
- 애매하면 남긴다.

후보마다 이유 한 줄을 붙여 yaml에 쓴다:

```yaml
exclude:
  - 바보      # 비하어
  - 거지      # 비하로 쓰임
```

- [x] **Step 2: 다시 빌드해 id가 흔들리지 않았는지 본다**

Run: `uv run python build_dictionary.py`
Expected: `(5404 - 뺀 수) words`. `dictionary.json`에서 뺀 단어만 사라지고 남은 단어의 id는 그대로다:

```bash
git diff --stat ../../frontend/datasets/dictionary.json
git diff ../../frontend/datasets/dictionary.json | grep '^[-+]' | grep -c '"id"'
```

Expected: 두 번째 명령이 뺀 단어 수와 같다(추가된 줄 0).

- [x] **Step 3: 승우님 확인**

제외 목록과 이유를 사용자에게 보여주고 승인을 받는다. 어린이 서비스의 어휘 정책은 코드가 아니라 사람의 결정이다.

- [x] **Step 4: 커밋**

```bash
git add tools/embed/dictionary-exclude.yaml frontend/datasets/dictionary.json
git commit -m "content: 사전 검토 — 비하어·욕설 N개 제외"
```

---

### Task 6: 운영 업로드·문서·마무리

**Files:**
- Modify: `frontend/README.md` (빌더 표)
- Modify: `CLAUDE.md` (명령 절)
- Modify: `docs/superpowers/specs/2026-08-21-nolai-design.md` (17장 "열린 것")

- [x] **Step 1: 운영(public)에 올린다**

Run: `uv run python build_dictionary.py --upload`
Expected: `public.words: N rows. 강아지 → …`. N은 Task 5 이후 단어 수.

- [x] **Step 2: test 스키마도 같은 목록으로 맞춘다**

Run: `uv run python build_dictionary.py --upload --schema test`

Task 5에서 뺀 단어는 upsert로는 안 지워진다. 두 스키마 모두 MCP/SQL Editor에서 정리한다:

```sql
delete from public.words where word in ('바보', '거지');   -- Task 5의 제외 목록 그대로
delete from test.words   where word in ('바보', '거지');
select count(*) from public.words;   -- dictionary.json의 단어 수와 같아야 한다
```

- [x] **Step 3: README 표에 한 줄**

`frontend/README.md`의 빌더 표 마지막 줄(`stories.yaml` 행) 아래에:

```markdown
| (국립국어원 xlsx, 자동 다운로드) | `dictionary` | 단어 실험실 사전 (설계 문서 17장) | `build_dictionary.py` — `--upload`가 Supabase `words`에도 넣는다 |
```

`CLAUDE.md`의 "데이터셋 재생성" 항목 끝에 한 문장:

```
단어 실험실 사전은 `uv run python build_dictionary.py --upload`로 만들고 Supabase `words` 테이블에 넣는다 — 뺄 단어는 `dictionary-exclude.yaml`에 이유와 함께 적는다.
```

- [x] **Step 4: 설계 문서 17장 "열린 것" 갱신**

`- ~~등급↔학년 대응과 최종 크기~~ …` 줄을 다음으로 바꾼다:

```markdown
- ~~등급↔학년 대응과 최종 크기~~ — 확인했다. 위 "확인한 사실". 최종 사전은 N개(2026-09-10, 사람이 훑어 M개 제외, `tools/embed/dictionary-exclude.yaml`)
- ~~부적절어를 사람이 훑는 기준~~ — `dictionary-exclude.yaml` 머리말에 적었다: 욕설·비하는 빼고, 질병·죽음·성은 자동완성에 띄워도 되는가로 판단하며, 애매하면 남긴다
```

- [x] **Step 5: 전체 테스트**

```bash
cd tools/embed && uv run pytest -q          # 24 passed
cd ../../frontend && npm run test            # 통과
npm run lint && npm run build                # 통과
```

- [x] **Step 6: 커밋, 그리고 push 확인**

```bash
git add frontend/README.md CLAUDE.md docs/superpowers/specs/2026-08-21-nolai-design.md
git commit -m "docs: 단어 실험실 사전 빌더를 README·CLAUDE.md·17장에 기록"
```

push는 곧 배포이니 사용자에게 확인받는다. 이 계획은 화면을 바꾸지 않으므로 배포 결과는 같다.

---

## 다음 계획

17장 "순서" 2번 — 실험실 화면과 API(`/api/words/near`, `/api/words/compare`, `/lab`). 이 계획의 `nearest_words()`를 그대로 쓴다. 비교용 함수 `word_similarity(a, b)`는 그때 마이그레이션 `0006`으로 더한다.
