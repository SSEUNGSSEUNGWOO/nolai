import { describe, it, expect } from "vitest";
import {
  getLesson,
  getDataset,
  listLessons,
  assertPlayable,
  assertPlaygroundExists,
  assertBadgeNamesExist,
} from "./content";

describe("content 로더", () => {
  it("embedding-map 레슨을 검증해서 읽는다", () => {
    const lesson = getLesson("embedding-map");
    expect(lesson.title).toBe("비슷한 말끼리 모여라");
    expect(lesson.steps[0].type).toBe("hook");
  });

  it("레슨이 참조하는 데이터셋이 실제로 존재한다", () => {
    const lesson = getLesson("embedding-map");
    const dataset = getDataset(lesson.dataset);
    expect(dataset.words.length).toBeGreaterThanOrEqual(10);
  });

  it("없는 레슨을 요청하면 에러를 던진다", () => {
    expect(() => getLesson("nope")).toThrow(/nope/);
  });

  it("레슨 목록을 order 순으로 돌려준다", () => {
    const orders = listLessons().map((l) => l.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it("실제 레슨과 데이터셋 조합은 끝까지 진행 가능하다", () => {
    const lesson = getLesson("embedding-map");
    expect(() =>
      assertPlayable(lesson, getDataset(lesson.dataset)),
    ).not.toThrow();
  });

  it("데이터셋 단어 수보다 minPlaced가 크면 거부한다", () => {
    const lesson = getLesson("embedding-map");
    const dataset = getDataset(lesson.dataset);
    const tooFew = { ...dataset, words: dataset.words.slice(0, 2) };

    expect(() => assertPlayable(lesson, tooFew)).toThrow(/minPlaced/);
  });

  it("레슨이 참조하는 놀이터가 실제로 등록돼 있다", () => {
    expect(() =>
      assertPlaygroundExists(getLesson("embedding-map")),
    ).not.toThrow();
  });

  it("등록되지 않은 놀이터를 참조하면 거부한다", () => {
    const lesson = { ...getLesson("embedding-map"), playground: "EmbedingMap" };
    expect(() => assertPlaygroundExists(lesson)).toThrow(/EmbedingMap/);
  });

  it("레슨이 주는 배지에 한글 이름이 있다", () => {
    expect(() =>
      assertBadgeNamesExist(getLesson("embedding-map")),
    ).not.toThrow();
  });

  it("한글 이름이 없는 배지를 주면 거부한다", () => {
    const lesson = getLesson("embedding-map");
    const broken = {
      ...lesson,
      steps: lesson.steps.map((step) =>
        step.type === "reward" ? { ...step, badge: "unknown-badge" } : step,
      ),
    };

    expect(() => assertBadgeNamesExist(broken)).toThrow(/unknown-badge/);
  });
});
