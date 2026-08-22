import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import NearestSearch from "./NearestSearch";
import type { PassagesDataset } from "@/lib/dataset-schema";

const data: PassagesDataset = {
  kind: "passages",
  id: "test-facts",
  model: "nlpai-lab/KURE-v1",
  projection: "radial",
  simRange: { min: 0.3, max: 0.8 },
  passages: [
    { id: "p1", text: "코끼리는 코로 물을 마신다.", angle: 0 },
    { id: "p2", text: "기차는 선로 위를 달린다.", angle: 0.25 },
    { id: "p3", text: "펭귄은 헤엄을 친다.", angle: 0.5 },
    { id: "p4", text: "치타는 빠르게 달린다.", angle: 0.75 },
  ],
  questions: [
    { id: "q1", text: "코끼리는 물을 어떻게 마셔?", sims: [0.8, 0.4, 0.5, 0.35] },
    { id: "q2", text: "제일 빠른 동물은?", sims: [0.32, 0.6, 0.4, 0.78] },
  ],
};

function renderPlayground() {
  const onEvent = vi.fn();
  const onArtifact = vi.fn();
  render(<NearestSearch data={data} onEvent={onEvent} onArtifact={onArtifact} />);
  return { onEvent, onArtifact };
}

describe("NearestSearch", () => {
  it("질문을 고르기 전에는 순위 목록이 없다", () => {
    renderPlayground();

    expect(screen.queryByTestId("match-list")).not.toBeInTheDocument();
    expect(screen.queryByTestId("question-marker")).not.toBeInTheDocument();
  });

  it("문장은 질문을 고르기 전에도 전부 화면에 있다", () => {
    renderPlayground();

    data.passages.forEach((passage) => {
      expect(screen.getByTestId(`passage-dot-${passage.id}`)).toBeInTheDocument();
    });
  });

  it("질문을 고르면 유사도가 높은 순으로 세 문장을 보여준다", () => {
    renderPlayground();
    fireEvent.click(screen.getByTestId("question-q1"));

    expect(screen.getByTestId("match-1")).toHaveTextContent("코끼리는 코로 물을 마신다.");
    expect(screen.getByTestId("match-2")).toHaveTextContent("펭귄은 헤엄을 친다.");
    expect(screen.getByTestId("match-3")).toHaveTextContent("기차는 선로 위를 달린다.");
  });

  it("상위 세 문장에만 순위 표시가 붙는다", () => {
    renderPlayground();
    fireEvent.click(screen.getByTestId("question-q1"));

    expect(screen.getByTestId("passage-dot-p1")).toHaveAttribute("data-rank", "1");
    expect(screen.getByTestId("passage-dot-p3")).toHaveAttribute("data-rank", "2");
    expect(screen.getByTestId("passage-dot-p2")).toHaveAttribute("data-rank", "3");
    expect(screen.getByTestId("passage-dot-p4")).not.toHaveAttribute("data-rank");
  });

  it("질문을 바꾸면 순위도 따라 바뀐다", () => {
    renderPlayground();
    fireEvent.click(screen.getByTestId("question-q1"));
    fireEvent.click(screen.getByTestId("question-q2"));

    expect(screen.getByTestId("match-1")).toHaveTextContent("치타는 빠르게 달린다.");
    expect(screen.getByTestId("passage-dot-p4")).toHaveAttribute("data-rank", "1");
  });

  it("질문을 고를 때마다 searched 이벤트를 올려보낸다", () => {
    const { onEvent } = renderPlayground();

    fireEvent.click(screen.getByTestId("question-q1"));
    expect(onEvent).toHaveBeenCalledWith({
      type: "searched",
      payload: { questionId: "q1", count: 1 },
    });

    fireEvent.click(screen.getByTestId("question-q2"));
    expect(onEvent).toHaveBeenCalledWith({
      type: "searched",
      payload: { questionId: "q2", count: 2 },
    });
  });

  it("같은 질문을 다시 골라도 해본 개수는 늘지 않는다", () => {
    const { onEvent } = renderPlayground();

    fireEvent.click(screen.getByTestId("question-q1"));
    fireEvent.click(screen.getByTestId("question-q2"));
    fireEvent.click(screen.getByTestId("question-q1"));

    expect(onEvent).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("match-1")).toHaveTextContent("코끼리는 코로 물을 마신다.");
  });

  it("골라본 질문을 산출물로 올려보낸다", () => {
    const { onArtifact } = renderPlayground();

    fireEvent.click(screen.getByTestId("question-q1"));

    expect(onArtifact).toHaveBeenCalledWith({
      kind: "nearest-search",
      payload: { datasetId: "test-facts", questionIds: ["q1"] },
    });
  });
});
