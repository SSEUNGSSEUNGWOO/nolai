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

  it("놓을 때마다 현재 지도 상태를 작품으로 올려보낸다", () => {
    const { onArtifact } = setup();

    fireEvent.click(screen.getByTestId("drawer-word-dog"));
    expect(onArtifact).toHaveBeenLastCalledWith({
      kind: "embedding-map",
      payload: { datasetId: "test", placedIds: ["dog"] },
    });

    fireEvent.click(screen.getByTestId("drawer-word-cat"));
    expect(onArtifact).toHaveBeenLastCalledWith({
      kind: "embedding-map",
      payload: { datasetId: "test", placedIds: ["dog", "cat"] },
    });

    expect(onArtifact).toHaveBeenCalledTimes(2);
  });

  it("배치된 칩은 초점을 받지 않는다", () => {
    setup();
    fireEvent.click(screen.getByTestId("drawer-word-dog"));

    // 서랍의 칩은 누를 수 있어야 하고
    expect(screen.getByTestId("drawer-word-cat").tagName).toBe("BUTTON");
    // 지도에 놓인 칩은 죽은 정거장이 되면 안 된다
    expect(screen.getByTestId("chip-dog").tagName).toBe("SPAN");
  });

  it("드래그해서 지도 안에 놓으면 배치된다", () => {
    setup();
    const chip = screen.getByTestId("drawer-word-dog");

    fireEvent.pointerDown(chip, { pointerId: 1, clientX: 10, clientY: 380, buttons: 1 });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 200, clientY: 200, buttons: 1 });
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 200, clientY: 200 });

    expect(screen.getByTestId("placed-word-dog")).toBeInTheDocument();
  });

  it("지도 밖에서 손을 떼면 배치되지 않는다", () => {
    setup();
    const chip = screen.getByTestId("drawer-word-dog");

    fireEvent.pointerDown(chip, { pointerId: 1, clientX: 10, clientY: 380, buttons: 1 });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 900, clientY: 900, buttons: 1 });
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 900, clientY: 900 });

    expect(screen.queryByTestId("placed-word-dog")).not.toBeInTheDocument();
    expect(screen.getByTestId("drawer-word-dog")).toBeInTheDocument();
  });

  it("드래그하는 동안 손가락을 따라다니는 칩이 보인다", () => {
    setup();

    fireEvent.pointerDown(screen.getByTestId("drawer-word-dog"), {
      pointerId: 1,
      clientX: 10,
      clientY: 380,
      buttons: 1,
    });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 120, clientY: 150, buttons: 1 });

    expect(screen.getByTestId("drag-ghost")).toBeInTheDocument();
  });

  it("창 밖에서 손을 뗐다 돌아오면 유령 칩이 사라진다", () => {
    setup();

    fireEvent.pointerDown(screen.getByTestId("drawer-word-dog"), {
      pointerId: 1,
      clientX: 10,
      clientY: 380,
    });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 120, clientY: 150, buttons: 1 });
    expect(screen.getByTestId("drag-ghost")).toBeInTheDocument();

    // 창 밖에서 버튼을 뗀 뒤 다시 들어옴 — pointerup은 못 받았다
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 200, clientY: 200, buttons: 0 });

    expect(screen.queryByTestId("drag-ghost")).not.toBeInTheDocument();
    // 단어는 배치되지 않고 서랍에 남아야 한다
    expect(screen.getByTestId("drawer-word-dog")).toBeInTheDocument();
    expect(screen.queryByTestId("placed-word-dog")).not.toBeInTheDocument();
  });

  it("드래그가 취소되면 유령 칩이 사라진다", () => {
    setup();

    fireEvent.pointerDown(screen.getByTestId("drawer-word-dog"), {
      pointerId: 1,
      clientX: 10,
      clientY: 380,
    });
    expect(screen.getByTestId("drag-ghost")).toBeInTheDocument();

    fireEvent.pointerCancel(window, { pointerId: 1 });

    expect(screen.queryByTestId("drag-ghost")).not.toBeInTheDocument();
    expect(screen.getByTestId("drawer-word-dog")).toBeInTheDocument();
  });

  it("다른 손가락의 이벤트는 진행 중인 드래그를 끝내지 않는다", () => {
    setup();

    // 첫 손가락으로 강아지를 집는다
    fireEvent.pointerDown(screen.getByTestId("drawer-word-dog"), {
      pointerId: 1,
      clientX: 10,
      clientY: 380,
      buttons: 1,
    });
    fireEvent.pointerMove(window, {
      pointerId: 1,
      clientX: 120,
      clientY: 150,
      buttons: 1,
    });
    expect(screen.getByTestId("drag-ghost")).toBeInTheDocument();

    // 두 번째 손가락이 지도 안에서 떼어진다 — 첫 손가락은 아직 눌려 있다
    fireEvent.pointerUp(window, { pointerId: 2, clientX: 200, clientY: 200 });

    // 강아지는 배치되지 않아야 하고, 드래그는 계속되어야 한다
    expect(screen.queryByTestId("placed-word-dog")).not.toBeInTheDocument();
    expect(screen.getByTestId("drag-ghost")).toBeInTheDocument();

    // 첫 손가락으로 떼면 그때 배치된다
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 200, clientY: 200 });
    expect(screen.getByTestId("placed-word-dog")).toBeInTheDocument();
  });
});
