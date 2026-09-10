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
