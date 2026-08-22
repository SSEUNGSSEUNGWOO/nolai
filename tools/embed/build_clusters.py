"""컴퓨터가 스스로 나눈 무리를 미리 계산한다.

실행:  uv run python build_clusters.py [파일.yaml]
출력:  ../../frontend/datasets/<id>.json

브라우저에서 k-means를 돌리지 않고 여기서 미리 계산하는 이유: 다른 구현은
다른 답을 낸다. 미리 재보고 문구를 쓴 그 결과가 아이 화면에 그대로 나와야 한다.
"""

from __future__ import annotations

import json
import sys
from collections import Counter

import yaml
from sklearn.cluster import KMeans
from sklearn.manifold import MDS

from build_dataset import HERE, MODEL, OUT_DIR, cosine_distance_matrix, embed, normalize_coords


def main() -> None:
    name = sys.argv[1] if len(sys.argv) > 1 else "cluster.yaml"
    source = yaml.safe_load((HERE / name).read_text(encoding="utf-8"))
    words = source["words"]

    vectors = embed([w["label"] for w in words])
    mds = MDS(
        n_components=2,
        metric="precomputed",
        init="classical_mds",
        n_init=1,
        normalized_stress="auto",
    )
    coords = normalize_coords(mds.fit_transform(cosine_distance_matrix(vectors)), margin=0.08)

    groupings = {}
    for k in source["groupings"]:
        # 지도에 보이는 자리를 그대로 나눈다. 원본 공간에서 나누면 화면에서
        # 붙어 있는 것이 다른 무리로 가서 아이가 납득하지 못한다.
        labels = KMeans(n_clusters=k, n_init=10, random_state=0).fit_predict(coords)
        groupings[str(k)] = [int(c) for c in labels]

        # 사람 기준과 얼마나 맞는지 알려준다. 문구를 쓸 때 근거가 된다.
        by_group: dict[int, list[str]] = {}
        for w, c in zip(words, labels):
            by_group.setdefault(int(c), []).append(w["category"])
        agree = sum(Counter(v).most_common(1)[0][1] for v in by_group.values())
        print(f"  무리 {k}개: 사람 기준과 {agree}/{len(words)} 일치")

    dataset = {
        "kind": "clusters",
        "id": source["id"],
        "model": MODEL,
        "projection": "mds",
        "categories": source["categories"],
        "words": [
            {
                "id": w["id"],
                "label": w["label"],
                "emoji": w["emoji"],
                "category": w["category"],
                "x": round(float(coords[i][0]), 4),
                "y": round(float(coords[i][1]), 4),
            }
            for i, w in enumerate(words)
        ],
        "groupings": groupings,
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"{source['id']}.json"
    out_path.write_text(json.dumps(dataset, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {out_path} ({len(words)} words, k={source['groupings']})")


if __name__ == "__main__":
    main()
