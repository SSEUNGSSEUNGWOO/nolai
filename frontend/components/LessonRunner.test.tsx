import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LessonRunner from "./LessonRunner";
import { getLesson, getDataset } from "@/lib/content";

const lesson = getLesson("embedding-map");
const rawDataset = getDataset(lesson.dataset);
if (rawDataset.kind !== "words") {
  throw new Error("레슨 1은 words 데이터셋이어야 합니다");
}
const dataset = rawDataset;

beforeEach(() => {
  Element.prototype.getBoundingClientRect = vi.fn(() => ({
    left: 0, top: 0, width: 400, height: 400,
    right: 400, bottom: 400, x: 0, y: 0, toJSON: () => ({}),
  })) as unknown as () => DOMRect;
});

function renderRunner() {
  const onComplete = vi.fn();
  render(<LessonRunner lesson={lesson} dataset={dataset} onComplete={onComplete} />);
  return { onComplete };
}

describe("LessonRunner", () => {
  it("훅 스텝부터 시작한다", () => {
    renderRunner();
    expect(screen.getByText(/어떻게 알아듣지/)).toBeInTheDocument();
  });

  it("훅을 지나면 놀이터가 나온다", () => {
    renderRunner();
    fireEvent.click(screen.getByRole("button", { name: "궁금해!" }));
    expect(screen.getByTestId("word-drawer")).toBeInTheDocument();
  });

  it("goal.min을 채우기 전에는 '다 했어요' 버튼이 없다", () => {
    renderRunner();
    fireEvent.click(screen.getByRole("button", { name: "궁금해!" }));

    fireEvent.click(screen.getByTestId("drawer-word-dog"));
    expect(screen.queryByRole("button", { name: "다 했어요" })).not.toBeInTheDocument();
  });

  it("goal.min을 채우면 '다 했어요' 버튼이 나오고 이름 붙이기로 넘어간다", () => {
    renderRunner();
    fireEvent.click(screen.getByRole("button", { name: "궁금해!" }));

    const minPlaced = 9;
    dataset.words.slice(0, minPlaced).forEach((word) => {
      fireEvent.click(screen.getByTestId(`drawer-word-${word.id}`));
    });

    fireEvent.click(screen.getByRole("button", { name: "다 했어요" }));
    expect(screen.getByText("임베딩")).toBeInTheDocument();
  });

  it("마지막 보상까지 끝내면 onComplete를 부른다", () => {
    const { onComplete } = renderRunner();
    fireEvent.click(screen.getByRole("button", { name: "궁금해!" }));

    dataset.words.slice(0, 9).forEach((word) => {
      fireEvent.click(screen.getByTestId(`drawer-word-${word.id}`));
    });
    fireEvent.click(screen.getByRole("button", { name: "다 했어요" }));
    fireEvent.click(screen.getByRole("button", { name: "알겠어!" }));
    fireEvent.click(screen.getByRole("button", { name: "강아지 근처" }));
    fireEvent.click(screen.getByRole("button", { name: "다음으로" }));
    fireEvent.click(screen.getByRole("button", { name: "좋아!" }));

    expect(onComplete).toHaveBeenCalledWith({
      lessonId: "embedding-map",
      badge: "map-explorer",
    });
  });
});
