import { describe, it, expect } from "vitest";
import { guessAll, type Example, type Point } from "./geometry";

const examples: Example[] = [
  { id: "dog", x: 0.2, y: 0.2, categoryId: "animal" },
  { id: "car", x: 0.8, y: 0.8, categoryId: "vehicle" },
];

describe("guessAll", () => {
  it("가장 가까운 예시의 상자를 따른다", () => {
    const targets: Point[] = [
      { id: "cat", x: 0.25, y: 0.22 },
      { id: "bus", x: 0.75, y: 0.79 },
    ];

    expect(guessAll(targets, examples)).toEqual([
      { id: "cat", categoryId: "animal", viaId: "dog" },
      { id: "bus", categoryId: "vehicle", viaId: "car" },
    ]);
  });

  it("따라간 예시를 함께 알려준다", () => {
    // 아이에게 "왜 그렇게 갔는지"를 보여주는 재료다
    const [guess] = guessAll([{ id: "cat", x: 0.21, y: 0.21 }], examples);
    expect(guess.viaId).toBe("dog");
  });

  it("가르친 게 없으면 아무것도 정하지 않는다", () => {
    expect(guessAll([{ id: "cat", x: 0.5, y: 0.5 }], [])).toEqual([]);
  });

  it("예시가 하나뿐이면 전부 그 상자로 간다", () => {
    const targets: Point[] = [
      { id: "cat", x: 0.1, y: 0.1 },
      { id: "bus", x: 0.9, y: 0.9 },
    ];
    const guesses = guessAll(targets, [examples[0]]);

    expect(guesses.map((g) => g.categoryId)).toEqual(["animal", "animal"]);
  });

  it("거리가 같으면 먼저 가르친 예시를 따른다", () => {
    // 같은 화면을 다시 열었을 때 답이 달라지면 아이가 혼란스럽다
    const tie: Example[] = [
      { id: "first", x: 0, y: 0, categoryId: "a" },
      { id: "second", x: 2, y: 0, categoryId: "b" },
    ];
    const [guess] = guessAll([{ id: "middle", x: 1, y: 0 }], tie);

    expect(guess.viaId).toBe("first");
  });

  it("가르칠 단어가 없으면 빈 목록이다", () => {
    expect(guessAll([], examples)).toEqual([]);
  });
});
