"""앞말 다음에 무엇이 왔는지 세어 데이터셋으로 만든다.

실행:  uv run python build_stories.py [파일.yaml]
출력:  ../../frontend/datasets/<id>.json

임베딩을 쓰지 않는다. 이 레슨이 보여주려는 것은 "본 것을 세어서 다음을
고른다"이고, 그 셈은 여기서 실제로 한다. 확률은 지어낸 값이 아니라 이 문장들의
진짜 빈도다.
"""

from __future__ import annotations

import json
import sys
from collections import Counter, defaultdict

import yaml

from build_dataset import HERE, OUT_DIR


def main() -> None:
    name = sys.argv[1] if len(sys.argv) > 1 else "stories.yaml"
    source = yaml.safe_load((HERE / name).read_text(encoding="utf-8"))

    counts: dict[str, Counter] = defaultdict(Counter)
    for sentence in source["sentences"]:
        tokens = sentence.split()
        for head, tail in zip(tokens, tokens[1:]):
            counts[head][tail] += 1

    next_words = {}
    for head, tail_counts in counts.items():
        total = sum(tail_counts.values())
        next_words[head] = [
            {"word": word, "count": count, "p": round(count / total, 4)}
            for word, count in tail_counts.most_common()
        ]

    # 시작할 수 있는 말 = 문장의 첫 단어. 아이는 여기서 출발한다.
    starts = list(dict.fromkeys(s.split()[0] for s in source["sentences"]))

    choices = [len(v) for v in next_words.values()]
    many = sum(1 for c in choices if c >= 2)
    print(f"  앞말 {len(next_words)}개, 그중 고를 것이 둘 이상인 것 {many}개")
    print(f"  시작할 수 있는 말 {len(starts)}개")
    if many < 5:
        print("  ⚠ 고를 것이 여럿인 앞말이 적습니다. 놀이가 단조로워집니다")

    dataset = {
        "kind": "nextword",
        "id": source["id"],
        "sentenceCount": len(source["sentences"]),
        "starts": starts,
        "next": next_words,
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"{source['id']}.json"
    out_path.write_text(json.dumps(dataset, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {out_path}")


if __name__ == "__main__":
    main()
