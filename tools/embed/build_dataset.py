"""단어 목록을 임베딩해 2D 좌표 데이터셋으로 만든다.

실행:  uv run python build_dataset.py
출력:  ../../frontend/datasets/<id>.json

모델은 로컬에서 돌아간다. API 키가 필요 없다.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import torch
import yaml
from sentence_transformers import SentenceTransformer
from sklearn.manifold import MDS

MODEL = "nlpai-lab/KURE-v1"
HERE = Path(__file__).parent
OUT_DIR = HERE.parent.parent / "frontend" / "datasets"


def normalize_coords(raw: np.ndarray, margin: float) -> np.ndarray:
    """2D 좌표를 [margin, 1-margin] 범위로 정규화한다.

    한 축의 값이 모두 같으면 그 축은 0.5로 고정한다.
    """
    span = 1.0 - 2.0 * margin
    out = np.empty_like(raw, dtype=float)

    for axis in range(raw.shape[1]):
        col = raw[:, axis]
        lo, hi = col.min(), col.max()
        if hi - lo < 1e-12:
            out[:, axis] = 0.5
        else:
            out[:, axis] = margin + (col - lo) / (hi - lo) * span

    return out


def cosine_distance_matrix(vectors: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    unit = vectors / norms
    similarity = unit @ unit.T
    return np.clip(1.0 - similarity, 0.0, 2.0)


def embed(labels: list[str]) -> np.ndarray:
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"loading {MODEL} on {device}")

    model = SentenceTransformer(MODEL, device=device)
    return model.encode(
        labels,
        normalize_embeddings=True,
        convert_to_numpy=True,
        show_progress_bar=True,
    )


def main() -> None:
    source = yaml.safe_load((HERE / "words.yaml").read_text(encoding="utf-8"))
    words = source["words"]
    labels = [w["label"] for w in words]

    vectors = embed(labels)
    distances = cosine_distance_matrix(vectors)

    # init="classical_mds"인 이유:
    # 기본값 'random'은 n=18 같은 작은 점 집합에서 SMACOF가 지역 최솟값에
    # 빠져 특정 카테고리만 압축이 덜 되는 현상이 있었다. 원본 1024차원에서는
    # 세 카테고리 응집도가 0.38~0.47로 비슷한데, random 초기화 2D에서는
    # 0.22 / 0.25 / 0.43으로 과일만 안 눌렸다. classical 초기화는 셋 다
    # 고르게 압축하고(0.22 / 0.26 / 0.26) 결정적이다.
    #
    # random_state를 쓰지 않는 이유:
    # init 배열이 주어지면 sklearn의 _smacof_single은 그 배열을 그대로
    # 시작점으로 쓰고, random_state는 init=None일 때만 초기 좌표를 뽑는 데
    # 쓰인다(sklearn/manifold/_mds.py 확인). classical_mds init을 쓰는 한
    # random_state는 결과에 아무 영향이 없는 죽은 인자라 남겨두지 않는다.
    #
    # n_init=1인 이유:
    # 명시적 init 배열을 넘기면 n_init은 항상 1로 강제되고, n_init != 1이면
    # sklearn이 경고를 낸다. 기본값이 이미 1이라 지금은 경고가 없지만,
    # 값을 명시해두면 sklearn이 기본값을 다시 바꿔도 경고가 나지 않는다.
    mds = MDS(
        n_components=2,
        metric="precomputed",
        init="classical_mds",
        n_init=1,
        normalized_stress="auto",
    )
    coords = normalize_coords(mds.fit_transform(distances), margin=0.08)

    dataset = {
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
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"{source['id']}.json"
    out_path.write_text(
        json.dumps(dataset, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"wrote {out_path} ({len(words)} words)")


if __name__ == "__main__":
    main()
