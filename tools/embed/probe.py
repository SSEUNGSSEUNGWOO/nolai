"""레슨 후보를 만들기 전에 데이터로 먼저 재본다.

실행:  uv run python probe.py [후보파일.yaml]

이 프로젝트에서 레슨을 만들 때마다 계획이 데이터에 반박당했다. 예시를 늘릴수록
정확도가 떨어졌고(레슨 3), 편향은 아예 시연되지 않았으며(레슨 4), 갈래를 넷
넣었더니 한 쌍이 붙었다(레슨 5). 매번 손으로 스크립트를 짜서 알아냈다.

그래서 그 검사들을 한곳에 모았다. 후보를 yaml로 적어 던지면 "이 레슨이 하려는
말이 데이터에서 사실인가"를 숫자로 돌려준다. **통과한 것만 만든다.**

검사 종류
  cluster    같은 갈래끼리 뭉치는가 (레슨 1 계열)
  classify   예시 몇 개로 나머지를 맞히는가 (레슨 3 계열)
  recommend  좋아한 것과 같은 갈래를 골라주는가 (레슨 5 계열)
  search     질문의 1등이 의도한 답인가 (레슨 2·4 계열)
"""

from __future__ import annotations

import sys
from collections import Counter
from pathlib import Path

import numpy as np
import yaml
from sklearn.manifold import MDS

from build_dataset import HERE, cosine_distance_matrix, embed, normalize_coords

# 이 값을 넘어야 "만들 만하다"고 본다. 지금까지 만든 레슨의 실제 값에서 왔다.
THRESHOLDS = {
    "cluster": 0.80,     # 레슨 1의 카테고리 이웃 일치율
    "classify": 0.85,    # 레슨 3은 16/16이었다
    "recommend": 0.85,   # 레슨 5는 27/30 = 0.90
    "search": 0.90,      # 레슨 2는 20/20이었다
}


def project(labels: list[str]) -> np.ndarray:
    """레슨과 똑같은 방법으로 2D 좌표를 만든다. 다르게 재면 의미가 없다."""
    vectors = embed(labels)
    mds = MDS(
        n_components=2,
        metric="precomputed",
        init="classical_mds",
        n_init=1,
        normalized_stress="auto",
    )
    return normalize_coords(mds.fit_transform(cosine_distance_matrix(vectors)), margin=0.08)


def _nearest(target: int, pool: list[int], coords: np.ndarray) -> int:
    return min(pool, key=lambda i: float(np.linalg.norm(coords[i] - coords[target])))


def check_cluster(spec: dict, coords: np.ndarray) -> tuple[float, list[str]]:
    """단어마다 가장 가까운 이웃이 같은 갈래인지 본다."""
    cats = [w["category"] for w in spec["words"]]
    notes = []
    ok = 0

    for i in range(len(cats)):
        others = [j for j in range(len(cats)) if j != i]
        near = _nearest(i, others, coords)
        if cats[near] == cats[i]:
            ok += 1
        else:
            notes.append(f"{spec['words'][i]['label']}({cats[i]}) → 이웃 {spec['words'][near]['label']}({cats[near]})")

    return ok / len(cats), notes


def check_classify(spec: dict, coords: np.ndarray) -> tuple[float, list[str]]:
    """갈래마다 예시를 하나씩 주고 나머지를 맞히는지 본다."""
    cats = [w["category"] for w in spec["words"]]
    taught = []
    for category in dict.fromkeys(cats):
        taught.append(next(i for i, c in enumerate(cats) if c == category))

    notes = []
    ok = 0
    rest = [i for i in range(len(cats)) if i not in taught]

    for i in rest:
        near = _nearest(i, taught, coords)
        if cats[near] == cats[i]:
            ok += 1
        else:
            notes.append(f"{spec['words'][i]['label']} → {cats[near]} (진짜 {cats[i]})")

    return ok / len(rest), notes


def check_recommend(spec: dict, coords: np.ndarray) -> tuple[float, list[str]]:
    """하나를 좋아했을 때 상위 3개가 같은 갈래인지 본다."""
    cats = [w["category"] for w in spec["words"]]
    notes = []
    hits = total = 0

    for i in range(len(cats)):
        others = [j for j in range(len(cats)) if j != i]
        ranked = sorted(others, key=lambda j: float(np.linalg.norm(coords[j] - coords[i])))[:3]
        for j in ranked:
            total += 1
            if cats[j] == cats[i]:
                hits += 1
            else:
                notes.append(f"{spec['words'][i]['label']} → {spec['words'][j]['label']}({cats[j]})")

    return hits / total, notes


CHECKS = {
    "cluster": check_cluster,
    "classify": check_classify,
    "recommend": check_recommend,
}


def main() -> None:
    name = sys.argv[1] if len(sys.argv) > 1 else "probe.yaml"
    source = yaml.safe_load((HERE / name).read_text(encoding="utf-8"))
    lines = []

    for spec in source["candidates"]:
        kind = spec["type"]
        if kind not in CHECKS:
            lines.append(f"{spec['id']}: 모르는 검사 종류 {kind}")
            continue

        coords = project([w["label"] for w in spec["words"]])
        score, notes = CHECKS[kind](spec, coords)
        need = THRESHOLDS[kind]
        mark = "통과" if score >= need else "미달"

        counts = Counter(w["category"] for w in spec["words"])
        lines.append(
            f"[{mark}] {spec['id']} ({kind})  {score:.2f} / 기준 {need:.2f}"
            f"  단어 {len(spec['words'])}개, 갈래 {len(counts)}개"
        )
        for note in notes[:5]:
            lines.append(f"        · {note}")
        if len(notes) > 5:
            lines.append(f"        · … 외 {len(notes) - 5}건")

    Path(HERE / "probe-result.txt").write_text("\n".join(lines), encoding="utf-8")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
