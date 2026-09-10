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

from build_dictionary import (
    CACHE,
    CLIENT_JSON,
    ENV_FILE,
    EXCLUDE_FILE,
    REVIEW_FILE,
    Supabase,
    load_excludes,
    read_env,
)

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
    words: list[dict],
    vectors: np.ndarray,
    ids: list[int],
    count: int,
    top: int,
    max_grade: int,
    seed: int,
) -> list[dict]:
    """이웃이 풍부한 순 top개를 뽑아 섞고 count개를 돌려준다."""
    at = {word_id: i for i, word_id in enumerate(ids)}
    candidates = [
        w for w in words if w["grade"] <= max_grade and len(w["word"]) >= 2 and w["id"] in at
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
    # --schema 뒤의 값은 인자가 아니다
    if "--schema" in sys.argv:
        args = [a for a in args if a != sys.argv[sys.argv.index("--schema") + 1]]
    start = args[0] if args else tomorrow_kst()
    schema = sys.argv[sys.argv.index("--schema") + 1] if "--schema" in sys.argv else "public"

    vectors = np.load(CACHE.parent / "vectors.npy")
    ids = json.loads((CACHE.parent / "vectors-ids.json").read_text(encoding="utf-8"))
    client = json.loads(CLIENT_JSON.read_text(encoding="utf-8"))
    # 등급은 검토용 TSV에 있다. 클라이언트 JSON엔 없다.
    grade_of: dict[str, int] = {}
    for line in REVIEW_FILE.read_text(encoding="utf-8").splitlines():
        word, grade, _ = line.split("\t", 2)
        grade_of[word] = int(grade)
    excluded = load_excludes(EXCLUDE_FILE)
    words = [
        {"id": w["id"], "word": w["word"], "grade": grade_of.get(w["word"], 9)}
        for w in client["words"]
        if w["word"] not in excluded
    ]
    word_of = {w["id"]: w["word"] for w in client["words"]}

    answers = pick_answers(words, vectors, ids, ANSWER_COUNT, CANDIDATE_TOP, max_grade=2, seed=42)
    dates = assign_dates(start, len(answers))
    at = {word_id: i for i, word_id in enumerate(ids)}
    rows = []
    lines = []
    for day, answer in zip(dates, answers):
        near = neighbor_ids(vectors, ids, at[answer["id"]], NEIGHBOR_COUNT)
        rows.append({"date": day, "word_id": answer["id"], "neighbors": near})
        lines.append(f"{day}\t{answer['word']}\t" + ", ".join(word_of[i] for i in near[:5]))
    DAILY_REVIEW.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"{len(rows)} days from {start} → {DAILY_REVIEW.name}")

    if "--upload" in sys.argv:
        env = read_env(ENV_FILE)
        db = Supabase(env["NEXT_PUBLIC_SUPABASE_URL"], env["SUPABASE_SERVICE_ROLE_KEY"], schema)
        for i in range(0, len(rows), 50):
            status, _, _ = db._request(
                "POST",
                "/rest/v1/daily_words",
                rows[i : i + 50],
                {"Prefer": "resolution=merge-duplicates,return=minimal"},
            )
            assert status in (200, 201), status
        _, headers, _ = db._request(
            "GET", "/rest/v1/daily_words?select=date", extra={"Prefer": "count=exact", "Range": "0-0"}
        )
        print(f"{schema}.daily_words: {headers['Content-Range'].split('/')[1]} rows")


if __name__ == "__main__":
    main()
