import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import LessonList, { type LessonGroupView } from "./LessonList";

const groups: LessonGroupView[] = [
  { title: "첫 묶음", lessons: [
    { id: "a", order: 1, title: "가" },
    { id: "b", order: 2, title: "나" },
  ] },
  { title: "둘째 묶음", lessons: [{ id: "c", order: 3, title: "다" }] },
];

function mockMe(kid: { nickname: string; completedLessons: string[] } | null) {
  vi.stubGlobal("fetch", vi.fn(async () => ({ json: async () => ({ kid }) })));
}

beforeEach(() => window.localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe("LessonList", () => {
  it("묶음 제목과 레슨을 전부 그린다", () => {
    mockMe(null);
    render(<LessonList groups={groups} />);
    expect(screen.getByText("첫 묶음")).toBeInTheDocument();
    expect(screen.getByText("둘째 묶음")).toBeInTheDocument();
    expect(screen.getByTestId("lesson-c")).toHaveTextContent("3");
    expect(screen.getByTestId("lesson-c")).toHaveTextContent("다");
  });

  it("아무것도 안 했으면 첫 레슨이 다음이다", async () => {
    mockMe(null);
    render(<LessonList groups={groups} />);
    await waitFor(() => expect(screen.getByTestId("lesson-a")).toHaveAttribute("data-next", "true"));
    expect(screen.getByTestId("lesson-b")).not.toHaveAttribute("data-next");
  });

  it("브라우저 진도와 서버 진도를 합쳐서 본다", async () => {
    // 로그인 전에 한 것은 브라우저에만, 다른 기기에서 한 것은 서버에만 있다.
    window.localStorage.setItem("nolai:progress", JSON.stringify({ completedLessons: ["a"], badges: [] }));
    mockMe({ nickname: "용감한 토끼", completedLessons: ["b"] });
    render(<LessonList groups={groups} />);

    await waitFor(() => expect(screen.getByTestId("lesson-c")).toHaveAttribute("data-next", "true"));
    expect(screen.getByTestId("lesson-a")).toHaveAttribute("data-done", "true");
    expect(screen.getByTestId("lesson-b")).toHaveAttribute("data-done", "true");
    expect(screen.getByTestId("lesson-c")).not.toHaveAttribute("data-done");
  });

  it("다 끝냈으면 다음이 없다", async () => {
    mockMe({ nickname: "용감한 토끼", completedLessons: ["a", "b", "c"] });
    render(<LessonList groups={groups} />);
    await waitFor(() => expect(screen.getByTestId("lesson-c")).toHaveAttribute("data-done", "true"));
    expect(document.querySelector("[data-next]")).toBeNull();
  });

  it("진도를 불러오기 전에는 아무것도 다음으로 찍지 않는다", () => {
    // 첫 레슨이 노랗게 떴다가 불러온 뒤 다른 레슨으로 튀면 아이가 잘못 누른다.
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    render(<LessonList groups={groups} />);
    expect(document.querySelector("[data-next]")).toBeNull();
  });
});
