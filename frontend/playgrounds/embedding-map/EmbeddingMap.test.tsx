import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import EmbeddingMap from "./EmbeddingMap";
import type { Dataset } from "@/lib/dataset-schema";

const data: Dataset = {
  id: "test",
  model: "nlpai-lab/KURE-v1",
  projection: "mds",
  categories: [
    { id: "animal", label: "동물", color: "#FF6B6B" },
    { id: "vehicle", label: "탈것", color: "#4ECDC4" },
  ],
  words: [
    { id: "dog", label: "강아지", emoji: "🐶", category: "animal", x: 0.2, y: 0.2 },
    { id: "cat", label: "고양이", emoji: "🐱", category: "animal", x: 0.25, y: 0.24 },
    { id: "car", label: "자동차", emoji: "🚗", category: "vehicle", x: 0.85, y: 0.8 },
  ],
};

function setup() {
  const onEvent = vi.fn();
  const onArtifact = vi.fn();
  render(<EmbeddingMap data={data} onEvent={onEvent} onArtifact={onArtifact} />);
  return { onEvent, onArtifact };
}

beforeEach(() => {
  // jsdom은 레이아웃을 계산하지 않으므로 지도 영역 크기를 고정한다
  Element.prototype.getBoundingClientRect = vi.fn(() => ({
    left: 0, top: 0, width: 400, height: 400,
    right: 400, bottom: 400, x: 0, y: 0, toJSON: () => ({}),
  })) as unknown as () => DOMRect;
});

describe("EmbeddingMap", () => {
  it("처음에는 모든 단어가 서랍에 있고 지도는 비어 있다", () => {
    setup();
    expect(screen.getAllByTestId(/^drawer-word-/)).toHaveLength(3);
    expect(screen.queryAllByTestId(/^placed-word-/)).toHaveLength(0);
  });

  it("단어를 지도에 놓으면 지도로 옮겨간다", () => {
    setup();
    fireEvent.click(screen.getByTestId("drawer-word-dog"));

    expect(screen.getByTestId("placed-word-dog")).toBeInTheDocument();
    expect(screen.queryByTestId("drawer-word-dog")).not.toBeInTheDocument();
  });

  it("단어를 놓을 때마다 placed 이벤트를 올려보낸다", () => {
    const { onEvent } = setup();
    fireEvent.click(screen.getByTestId("drawer-word-dog"));

    expect(onEvent).toHaveBeenCalledWith({
      type: "placed",
      payload: { wordId: "dog", placedCount: 1 },
    });
  });

  it("가까운 두 단어 사이에만 선이 생긴다", () => {
    setup();
    fireEvent.click(screen.getByTestId("drawer-word-dog"));
    fireEvent.click(screen.getByTestId("drawer-word-cat"));
    expect(screen.getAllByTestId(/^link-/)).toHaveLength(1);

    fireEvent.click(screen.getByTestId("drawer-word-car"));
    expect(screen.getAllByTestId(/^link-/)).toHaveLength(1);
  });

  it("모든 단어를 놓으면 작품을 올려보낸다", () => {
    const { onArtifact } = setup();
    fireEvent.click(screen.getByTestId("drawer-word-dog"));
    fireEvent.click(screen.getByTestId("drawer-word-cat"));
    fireEvent.click(screen.getByTestId("drawer-word-car"));

    expect(onArtifact).toHaveBeenCalledWith({
      kind: "embedding-map",
      payload: { datasetId: "test", placedIds: ["dog", "cat", "car"] },
    });
  });
});
