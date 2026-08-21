import { describe, it, expect } from "vitest";
import { getPlayground } from "./registry";

describe("놀이터 레지스트리", () => {
  it("EmbeddingMap을 이름으로 찾는다", () => {
    expect(getPlayground("EmbeddingMap")).toBeTypeOf("function");
  });

  it("없는 놀이터를 요청하면 에러를 던진다", () => {
    expect(() => getPlayground("Nope")).toThrow(/Nope/);
  });
});
