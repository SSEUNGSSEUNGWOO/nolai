"""문장마다 감정 분석 모델의 답을 미리 받아 데이터셋으로 만든다.

실행:  uv run python build_feelings.py [파일.yaml]
출력:  ../../frontend/datasets/<id>.json

레슨 1~13이 쓰는 임베딩 모델이 아니라 **감정 분석 전용 모델**을 쓴다. 임베딩은
감정의 극성을 담지 않아서(신남의 이웃이 화남이었다) 이 레슨을 만들 수 없었다.

모델이 틀리는 문장이 이 레슨의 핵심이므로, 빌드할 때 몇 개나 틀리는지 세어
알려준다. 하나도 안 틀리면 보여줄 것이 없다.
"""

from __future__ import annotations

import json
import sys

import yaml
from transformers import pipeline

from build_dataset import HERE, OUT_DIR


def main() -> None:
    name = sys.argv[1] if len(sys.argv) > 1 else "feelings.yaml"
    source = yaml.safe_load((HERE / name).read_text(encoding="utf-8"))

    classifier = pipeline(
        "text-classification", model=source["model_id"], top_k=None
    )

    sentences = []
    wrong = []
    for item in source["sentences"]:
        scores = classifier(item["text"])[0]
        best = max(scores, key=lambda one: one["score"])
        # LABEL_1이 긍정이다. 라벨 이름이 뜻을 안 담고 있어 여기서 옮긴다.
        verdict = "good" if best["label"] == "LABEL_1" else "bad"

        sentences.append(
            {
                "id": item["id"],
                "text": item["text"],
                "answer": item["answer"],
                "aiSays": verdict,
                "confidence": round(float(best["score"]), 4),
            }
        )
        if verdict != item["answer"]:
            wrong.append(item["text"])

    print(f"  AI가 맞힘: {len(sentences) - len(wrong)}/{len(sentences)}")
    for text in wrong:
        print(f"  AI가 틀림: {text}")
    if not wrong:
        print("  ⚠ 하나도 안 틀립니다. 이 레슨은 보여줄 것이 없습니다")

    dataset = {
        "kind": "sentiment",
        "id": source["id"],
        "model": source["model_id"],
        "sentences": sentences,
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"{source['id']}.json"
    out_path.write_text(json.dumps(dataset, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {out_path} ({len(sentences)} sentences)")


if __name__ == "__main__":
    main()
