import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TeachSorter from "./TeachSorter";
import type { WordsDataset } from "@/lib/dataset-schema";

const data: WordsDataset = {
  kind: "words",
  id: "test-teach",
  model: "nlpai-lab/KURE-v1",
  projection: "mds",
  categories: [
    { id: "animal", label: "동물", color: "#FF6B6B" },
    { id: "vehicle", label: "탈것", color: "#4ECDC4" },
  ],
  words: [
    { id: "dog", label: "강아지", emoji: "🐶", category: "animal", x: 0.1, y: 0.1 },
    { id: "cat", label: "고양이", emoji: "🐱", category: "animal", x: 0.15, y: 0.12 },
    { id: "car", label: "자동차", emoji: "🚗", category: "vehicle", x: 0.9, y: 0.9 },
    { id: "bus", label: "버스", emoji: "🚌", category: "vehicle", x: 0.85, y: 0.88 },
  ],
};

function renderPlayground() {
  const onEvent = vi.fn();
  const onArtifact = vi.fn();
  render(<TeachSorter data={data} onEvent={onEvent} onArtifact={onArtifact} />);
  return { onEvent, onArtifact };
}

describe("TeachSorter", () => {
  it("처음에는 모든 단어가 서랍에 있다", () => {
    renderPlayground();
    for (const word of data.words) {
      expect(screen.getByTestId(`word-${word.id}`)).toBeInTheDocument();
    }
  });

  it("단어를 고르기 전에는 상자를 누를 수 없다", () => {
    renderPlayground();
    expect(screen.getByTestId("box-animal")).toBeDisabled();
  });

  it("단어를 고르고 상자를 누르면 그 상자에 들어간다", () => {
    renderPlayground();
    fireEvent.click(screen.getByTestId("word-dog"));
    fireEvent.click(screen.getByTestId("box-animal"));

    expect(screen.getByTestId("taught-dog")).toBeInTheDocument();
    expect(screen.queryByTestId("word-dog")).not.toBeInTheDocument();
  });

  it("가르칠 때마다 taught 이벤트를 올려보낸다", () => {
    const { onEvent } = renderPlayground();
    fireEvent.click(screen.getByTestId("word-dog"));
    fireEvent.click(screen.getByTestId("box-animal"));

    expect(onEvent).toHaveBeenCalledWith({
      type: "taught",
      payload: { wordId: "dog", count: 1 },
    });
  });

  it("같은 단어를 다시 누르면 선택이 풀린다", () => {
    renderPlayground();
    fireEvent.click(screen.getByTestId("word-dog"));
    expect(screen.getByTestId("word-dog")).toHaveAttribute("data-picked", "true");

    fireEvent.click(screen.getByTestId("word-dog"));
    expect(screen.getByTestId("word-dog")).not.toHaveAttribute("data-picked");
  });

  it("가르친 뒤에 물어보면 나머지를 닮은 예시 쪽으로 넣는다", () => {
    renderPlayground();
    fireEvent.click(screen.getByTestId("word-dog"));
    fireEvent.click(screen.getByTestId("box-animal"));
    fireEvent.click(screen.getByTestId("word-car"));
    fireEvent.click(screen.getByTestId("box-vehicle"));
    fireEvent.click(screen.getByTestId("ask-computer"));

    expect(screen.getByTestId("guessed-cat")).toHaveAttribute("data-right", "true");
    expect(screen.getByTestId("guessed-bus")).toHaveAttribute("data-right", "true");
  });

  it("한쪽만 가르치면 컴퓨터가 틀린다", () => {
    // 이 레슨이 하려는 말이다 -- 안 보여준 것은 알 수 없다
    renderPlayground();
    fireEvent.click(screen.getByTestId("word-dog"));
    fireEvent.click(screen.getByTestId("box-animal"));
    fireEvent.click(screen.getByTestId("ask-computer"));

    // 예시가 동물뿐이라 자동차·버스까지 동물 상자로 간다
    expect(screen.getByTestId("guessed-car")).toHaveAttribute("data-right", "false");
    expect(screen.getByTestId("guessed-bus")).toHaveAttribute("data-right", "false");
  });

  it("새로 가르치면 컴퓨터의 답을 다시 받아야 한다", () => {
    renderPlayground();
    fireEvent.click(screen.getByTestId("word-dog"));
    fireEvent.click(screen.getByTestId("box-animal"));
    fireEvent.click(screen.getByTestId("ask-computer"));
    expect(screen.getByTestId("guessed-car")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("word-car"));
    fireEvent.click(screen.getByTestId("box-vehicle"));
    expect(screen.queryByTestId("guessed-bus")).not.toBeInTheDocument();
    expect(screen.getByTestId("ask-computer")).toBeInTheDocument();
  });

  it("가르친 내용을 산출물로 올려보낸다", () => {
    const { onArtifact } = renderPlayground();
    fireEvent.click(screen.getByTestId("word-dog"));
    fireEvent.click(screen.getByTestId("box-animal"));

    expect(onArtifact).toHaveBeenCalledWith({
      kind: "teach-sorter",
      payload: {
        datasetId: "test-teach",
        taught: [{ wordId: "dog", categoryId: "animal" }],
      },
    });
  });
});
