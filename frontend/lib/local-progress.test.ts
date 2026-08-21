import { describe, it, expect, beforeEach } from "vitest";
import { readProgress, completeLesson, isCompleted } from "./local-progress";

beforeEach(() => {
  localStorage.clear();
});

describe("local-progress", () => {
  it("처음에는 완료한 레슨이 없다", () => {
    expect(readProgress().completedLessons).toEqual([]);
  });

  it("레슨을 완료하면 기록된다", () => {
    completeLesson("embedding-map", "map-explorer");
    expect(isCompleted("embedding-map")).toBe(true);
    expect(readProgress().badges).toEqual(["map-explorer"]);
  });

  it("같은 레슨을 두 번 완료해도 중복 기록하지 않는다", () => {
    completeLesson("embedding-map", "map-explorer");
    completeLesson("embedding-map", "map-explorer");
    expect(readProgress().completedLessons).toEqual(["embedding-map"]);
    expect(readProgress().badges).toEqual(["map-explorer"]);
  });

  it("저장값이 깨져 있으면 빈 진도로 되돌린다", () => {
    localStorage.setItem("nolai:progress", "{{{ 망가진 JSON");
    expect(readProgress().completedLessons).toEqual([]);
  });
});
