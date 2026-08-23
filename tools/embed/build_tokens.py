"""문장을 AI가 읽는 조각으로 쪼개 데이터셋으로 만든다.

실행:  uv run python build_tokens.py [파일.yaml]
출력:  ../../frontend/datasets/<id>.json

다른 레슨이 쓰는 임베딩과 **같은 모델의 토크나이저**를 쓴다. 다른 모델을 쓰면
"이 조각이 곧 AI가 보는 글"이라는 말이 이 서비스 안에서 거짓이 된다.
"""

from __future__ import annotations

import json
import sys

import yaml
from transformers import AutoTokenizer

from build_dataset import HERE, MODEL, OUT_DIR


def main() -> None:
    name = sys.argv[1] if len(sys.argv) > 1 else "tokens.yaml"
    source = yaml.safe_load((HERE / name).read_text(encoding="utf-8"))

    tokenizer = AutoTokenizer.from_pretrained(MODEL)
    items = []

    for item in source["items"]:
        ids = tokenizer.encode(item["text"], add_special_tokens=False)
        pieces = tokenizer.convert_ids_to_tokens(ids)

        items.append(
            {
                "id": item["id"],
                "text": item["text"],
                # "▁"는 앞에 띄어쓰기가 있었다는 표시다. 아이에게는 그대로
                # 보여줄 수 없으므로 따로 알려준다.
                "pieces": [
                    {
                        "text": piece.replace("▁", ""),
                        "spaced": piece.startswith("▁"),
                        "number": int(number),
                    }
                    for piece, number in zip(pieces, ids)
                ],
            }
        )

    counts = sorted(len(i["pieces"]) for i in items)
    print(f"조각 수: 최소 {counts[0]}, 최대 {counts[-1]}")
    if counts[0] > 1:
        print("⚠ 1조각짜리가 하나도 없습니다. 대비가 없으면 보여줄 것이 없습니다")
    if counts[-1] < 5:
        print("⚠ 많이 쪼개지는 것이 없습니다. 대비가 약합니다")

    dataset = {
        "kind": "tokens",
        "id": source["id"],
        "model": MODEL,
        "items": items,
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"{source['id']}.json"
    out_path.write_text(
        json.dumps(dataset, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"wrote {out_path} ({len(items)} items)")


if __name__ == "__main__":
    main()
