"""문장 조각과 질문 카드를 임베딩해 벡터검색 데이터셋으로 만든다.

실행:  uv run python build_passages.py [파일.yaml]
       기본값은 passages.yaml. gaps.yaml도 같은 빌더를 쓴다.
       use_passages_from을 적으면 문장은 그 파일에서 가져오고 질문만 자기 것을 쓴다.
출력:  ../../frontend/datasets/<id>.json

이 데이터셋은 지도가 아니라 **방사 배치**용이다. 질문이 화면 한가운데 놓이고,
문장은 질문과의 실제 코사인 유사도를 반지름으로 삼아 둘러선다. 가까울수록
중심에 붙는다. 화면에서 가까워 보이는 것이 곧 진짜 1등이다.

MDS로 2D 지도를 만들어 봤더니 질문 20개 중 15개에서 원본 1등이 화면상 7~29등에
놓였다. 원본 유사도 범위가 0.28~0.71로 좁아(문장이 전부 동물 사실이다) 2D로
누르면 순위 차이가 사라지기 때문이다. 그래서 거리를 투영에 맡기지 않는다.

각도는 문장이 늘 같은 방향에 있게 하려고만 쓴다. MDS 2D에서 중심을 기준으로
잰 각도 순서를 그대로 두되 간격만 고르게 편다 — 각도는 이 레슨에서 뜻을 나르지
않고(뜻은 거리가 나른다), 고르게 펴야 점이 겹치지 않는다.
"""

from __future__ import annotations

import json
import sys

import numpy as np
import yaml
from sklearn.manifold import MDS

from build_dataset import (
    HERE,
    MODEL,
    OUT_DIR,
    cosine_distance_matrix,
    embed,
    normalize_coords,
)

TOP_K = 3

# 1등과 2등의 유사도 차이가 이보다 작으면 순위가 사실상 동점이다.
TIGHT_RACE = 0.02


def even_angles(coords: np.ndarray) -> np.ndarray:
    """2D 좌표를 중심 기준 각도로 정렬한 뒤, 그 순서대로 한 바퀴를 고르게 나눈다.

    돌려주는 값은 0 이상 1 미만의 회전수(turn)다. 이웃한 각도를 받은 문장끼리는
    원래 공간에서도 비슷한 방향에 있었다는 뜻이지만, 간격 자체는 의미가 없다.
    """
    centered = coords - coords.mean(axis=0)
    raw = np.arctan2(centered[:, 1], centered[:, 0])

    order = np.argsort(raw)
    angles = np.empty(len(coords), dtype=float)
    for slot, index in enumerate(order):
        angles[index] = slot / len(coords)

    return angles


def top_matches(
    similarity: np.ndarray, passage_ids: list[str], k: int
) -> list[list[str]]:
    """질문마다 유사도가 높은 순으로 passage id를 k개 고른다.

    similarity[i][j] = 질문 i와 문장 j의 코사인 유사도. 행 순서는 질문 순서와,
    열 순서는 passage_ids 순서와 같아야 한다.
    """
    order = np.argsort(-similarity, axis=1)[:, :k]
    return [[passage_ids[j] for j in row] for row in order]


def flag_tight_races(similarity: np.ndarray, threshold: float) -> list[dict]:
    """1등과 2등이 사실상 동점인 질문을 찾는다.

    격차가 없는데도 아이에게 1등·2등이라고 번호를 붙여 보여주면 노이즈를 순위로
    파는 셈이다. 하드 실패가 아니라 사람이 보고 판단할 목록이다 — 질문 문구를
    다듬을 수도 있고, 둘 다 답이 되는 질문이라 그대로 두는 게 맞을 수도 있다.
    """
    tight = []

    for i, row in enumerate(similarity):
        ranked = np.sort(row)[::-1]
        gap = float(ranked[0] - ranked[1])
        if gap < threshold:
            tight.append({"question_index": i, "gap": gap})

    return tight


def main() -> None:
    name = sys.argv[1] if len(sys.argv) > 1 else "passages.yaml"
    source = yaml.safe_load((HERE / name).read_text(encoding="utf-8"))

    # gaps.yaml은 passages.yaml과 **같은 문장 모음**을 써야 한다. 문장이 다르면
    # "답이 없어서 틀린 것"인지 "문장이 달라서 틀린 것"인지 구별할 수 없다.
    origin = source.get("use_passages_from")
    if origin:
        passages = yaml.safe_load(
            (HERE / origin).read_text(encoding="utf-8")
        )["passages"]
    else:
        passages = source["passages"]

    questions = source["questions"]

    passage_ids = [p["id"] for p in passages]
    texts = [p["text"] for p in passages] + [q["text"] for q in questions]

    vectors = embed(texts)
    passage_vectors = vectors[: len(passages)]
    question_vectors = vectors[len(passages) :]

    # embed()가 normalize_embeddings=True로 뽑으므로 내적이 곧 코사인 유사도다.
    similarity = question_vectors @ passage_vectors.T

    # 각도는 문장끼리의 관계에서만 뽑는다. 질문은 늘 중심이라 지도에 넣지 않는다.
    passage_distances = cosine_distance_matrix(passage_vectors)
    mds = MDS(
        n_components=2,
        metric="precomputed",
        init="classical_mds",
        n_init=1,
        normalized_stress="auto",
    )
    coords = normalize_coords(mds.fit_transform(passage_distances), margin=0.0)
    angles = even_angles(coords)

    tight = flag_tight_races(similarity, TIGHT_RACE)
    if tight:
        top_ids = top_matches(similarity, passage_ids, 2)
        text_of = {p["id"]: p["text"] for p in passages}
        print("\n" + "=" * 60)
        print(f"⚠ 1·2등이 거의 동점: {len(tight)}개")
        print("=" * 60)
        for entry in tight:
            i = entry["question_index"]
            first, second = top_ids[i]
            print(
                f"  {questions[i]['id']} {questions[i]['text']} (격차 {entry['gap']:.3f})\n"
                f"    1등 {first}: {text_of[first]}\n"
                f"    2등 {second}: {text_of[second]}"
            )
        print("=" * 60 + "\n")

    dataset = {
        "kind": "passages",
        "id": source["id"],
        "model": MODEL,
        "projection": "radial",
        # 유사도를 반지름으로 바꿀 때 쓰는 전역 기준. 질문마다 따로 정규화하면
        # 어떤 질문에서든 1등이 중심에 딱 붙어 보여, 실제로는 답이 애매한
        # 질문까지 확신에 차 보인다. 전체를 하나의 자로 재야 정직하다.
        "simRange": {
            "min": round(float(similarity.min()), 4),
            "max": round(float(similarity.max()), 4),
        },
        "passages": [
            {
                "id": p["id"],
                "text": p["text"],
                "angle": round(float(angles[i]), 4),
            }
            for i, p in enumerate(passages)
        ],
        "questions": [
            {
                "id": q["id"],
                "text": q["text"],
                # passages와 같은 순서다. 이 파일은 항상 통째로 다시 만든다.
                "sims": [round(float(s), 4) for s in similarity[i]],
            }
            for i, q in enumerate(questions)
        ],
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"{source['id']}.json"
    out_path.write_text(
        json.dumps(dataset, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"wrote {out_path} ({len(passages)} passages, {len(questions)} questions)")

    if tight:
        print(f"⚠ 1·2등이 거의 동점: {len(tight)}개")


if __name__ == "__main__":
    main()
