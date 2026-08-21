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

    mds = MDS(
        n_components=2,
        metric="precomputed",
        init="random",
        random_state=42,
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
