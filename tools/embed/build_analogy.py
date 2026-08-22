"""관계 계산(유추)의 답을 미리 구해 데이터셋으로 만든다.

실행:  uv run python build_analogy.py [파일.yaml]
출력:  ../../frontend/datasets/<id>.json

아이가 고를 수 있는 조합이 관계 x 단어로 정해져 있으므로 답을 전부 미리
구해 담는다. 브라우저에서 1024차원 벡터를 다루게 하면 파일이 커지고, 계산이
달라지면 미리 재보고 쓴 문구가 화면과 어긋난다.
"""

from __future__ import annotations

import json
import sys

import numpy as np
import yaml

from build_dataset import HERE, MODEL, OUT_DIR, embed

TOP_K = 3


def main() -> None:
    name = sys.argv[1] if len(sys.argv) > 1 else "analogy.yaml"
    source = yaml.safe_load((HERE / name).read_text(encoding="utf-8"))

    relations = source["relations"]
    subjects = source["subjects"]

    # 컴퓨터가 답으로 고를 수 있는 말. 관계와 단어 자신은 답에서 뺀다.
    vocabulary = list(
        dict.fromkeys(
            source["vocabulary"]
            + [s["label"] for s in subjects]
            + [w for r in relations for w in (r["from"], r["to"])]
        )
    )

    vectors = embed(vocabulary)
    unit = vectors / np.linalg.norm(vectors, axis=1, keepdims=True)
    index = {word: i for i, word in enumerate(vocabulary)}

    answers = {}
    for relation in relations:
        for subject in subjects:
            query = (
                unit[index[subject["label"]]]
                - unit[index[relation["from"]]]
                + unit[index[relation["to"]]]
            )
            query = query / np.linalg.norm(query)
            scores = unit @ query

            banned = {subject["label"], relation["from"], relation["to"]}
            ranked = [
                (vocabulary[i], float(scores[i]))
                for i in np.argsort(-scores)
                if vocabulary[i] not in banned
            ][:TOP_K]

            answers[f"{relation['id']}|{subject['id']}"] = [
                {"label": label, "score": round(score, 4)} for label, score in ranked
            ]

    # 어울리는 조합이 얼마나 맞는지 알려준다. 문구를 쓸 때 근거가 된다.
    fit = {"gender": "family", "capital": "country", "opposite": "adjective"}
    for relation in relations:
        group = fit.get(relation["id"])
        if group is None:
            continue
        matched = [s for s in subjects if s["group"] == group]
        tops = [answers[f"{relation['id']}|{s['id']}"][0]["label"] for s in matched]
        print(f"  [{relation['label']}] + {group}: " + ", ".join(
            f"{s['label']}→{t}" for s, t in zip(matched, tops)
        ))

    dataset = {
        "kind": "analogy",
        "id": source["id"],
        "model": MODEL,
        "relations": [
            {"id": r["id"], "label": r["label"], "from": r["from"], "to": r["to"]}
            for r in relations
        ],
        "subjects": [
            {"id": s["id"], "label": s["label"], "emoji": s["emoji"], "group": s["group"]}
            for s in subjects
        ],
        "answers": answers,
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"{source['id']}.json"
    out_path.write_text(json.dumps(dataset, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {out_path} ({len(relations)}x{len(subjects)} = {len(answers)} 조합)")


if __name__ == "__main__":
    main()
