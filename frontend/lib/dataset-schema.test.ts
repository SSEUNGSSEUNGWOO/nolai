import { describe, it, expect } from "vitest";
import { datasetSchema } from "./dataset-schema";

const valid = {
  id: "words-animals-vehicles",
  model: "nlpai-lab/KURE-v1",
  projection: "mds",
  categories: [
    { id: "animal", label: "동물", color: "#FF6B6B" },
    { id: "vehicle", label: "탈것", color: "#4ECDC4" },
  ],
  words: [
    { id: "dog", label: "강아지", emoji: "🐶", category: "animal", x: 0.2, y: 0.3 },
    { id: "car", label: "자동차", emoji: "🚗", category: "vehicle", x: 0.8, y: 0.6 },
  ],
};

describe("datasetSchema", () => {
  it("올바른 데이터셋을 통과시킨다", () => {
    expect(datasetSchema.parse(valid).words).toHaveLength(2);
  });

  it("좌표가 0~1 범위를 벗어나면 거부한다", () => {
    const bad = {
      ...valid,
      words: [{ ...valid.words[0], x: 1.5 }, valid.words[1]],
    };
    expect(() => datasetSchema.parse(bad)).toThrow();
  });

  it("정의되지 않은 카테고리를 참조하면 거부한다", () => {
    const bad = {
      ...valid,
      words: [{ ...valid.words[0], category: "ghost" }, valid.words[1]],
    };
    expect(() => datasetSchema.parse(bad)).toThrow(/category/);
  });
});
