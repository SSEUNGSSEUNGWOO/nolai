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
# o_file_name이 없으면 서버가 200으로 HTML 안내 페이지를 준다. 값은 아무거나 된다.
SOURCE_URL = (
    "https://www.korean.go.kr/common/download.do?file_path=reportData"
    "&c_file_name=1d6d75b9-45cb-49d4-989f-1483c332573a.xlsx&o_file_name=vocab.xlsx"
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


def download_source(url: str, cache: Path) -> Path:
    if not cache.exists():
        cache.parent.mkdir(parents=True, exist_ok=True)
        print(f"downloading {url}")
        with urllib.request.urlopen(url) as res:
            data = res.read()
        # xlsx는 zip이다. 서버가 HTML 안내 페이지를 200으로 주는 경우를 여기서 잡는다.
        if not data.startswith(b"PK"):
            raise RuntimeError(f"xlsx가 아닌 응답({len(data)}바이트). URL을 확인하세요.")
        cache.write_bytes(data)
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
