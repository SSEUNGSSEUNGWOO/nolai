"""단어 쌍의 닮은 정도를 미리 재서 데이터셋으로 만든다.

실행:  uv run python build_compare.py [파일.yaml]
출력:  ../../frontend/datasets/<id>.json

2D로 누르지 않는다. 원래 공간의 코사인 유사도를 그대로 담는다 -- 이 레슨이
보여주려는 차이가 투영 과정에서 사라지기 때문이다(반대말을 지도에 놓아봤을 때
6쌍 중 2쌍만 붙었다).
"""

from __future__ import annotations

import json
import sys
from itertools import combinations

import numpy as np
import yaml

from build_dataset import HERE, MODEL, OUT_DIR, embed


def main() -> None:
    name = sys.argv[1] if len(sys.argv) > 1 else "compare.yaml"
    source = yaml.safe_load((HERE / name).read_text(encoding="utf-8"))
    words = source["words"]

    vectors = embed([w["label"] for w in words])
    index = {w["id"]: i for i, w in enumerate(words)}

    sims = {}
    for a, b in combinations(words, 2):
        value = float(vectors[index[a["id"]]] @ vectors[index[b["id"]]])
        sims[f"{a['id']}|{b['id']}"] = round(value, 4)

    # 같은 갈래(반대말 포함)와 다른 갈래의 평균을 알려준다. 문구의 근거다.
    same = [v for k, v in sims.items()
            if next(w for w in words if w["id"] == k.split("|")[0])["category"]
            == next(w for w in words if w["id"] == k.split("|")[1])["category"]]
    other = [v for k, v in sims.items()
             if next(w for w in words if w["id"] == k.split("|")[0])["category"]
             != next(w for w in words if w["id"] == k.split("|")[1])["category"]]
    print(f"  같은 주제끼리 평균 {np.mean(same):.3f} (최소 {min(same):.3f})")
    print(f"  다른 주제끼리 평균 {np.mean(other):.3f} (최대 {max(other):.3f})")
    print(f"  겹침: {'없음' if min(same) > max(other) else '있음'}")

    dataset = {
        "kind": "similarity",
        "id": source["id"],
        "model": MODEL,
        "categories": source["categories"],
        "words": [
            {"id": w["id"], "label": w["label"], "emoji": w["emoji"], "category": w["category"]}
            for w in words
        ],
        "sims": sims,
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"{source['id']}.json"
    out_path.write_text(json.dumps(dataset, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {out_path} ({len(words)} words, {len(sims)} pairs)")


if __name__ == "__main__":
    main()
