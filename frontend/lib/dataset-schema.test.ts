import { describe, it, expect } from "vitest";
import { datasetSchema } from "./dataset-schema";

const valid = {
  kind: "words",
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
    const parsed = datasetSchema.parse(valid);
    if (parsed.kind !== "words") throw new Error("words 데이터셋이어야 합니다");
    expect(parsed.words).toHaveLength(2);
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

  it("word id가 중복되면 거부한다", () => {
    const bad = {
      ...valid,
      words: [valid.words[0], { ...valid.words[1], id: "dog" }],
    };
    expect(() => datasetSchema.parse(bad)).toThrow(/중복/);
  });

  it("category id가 중복되면 거부한다", () => {
    const bad = {
      ...valid,
      categories: [
        ...valid.categories,
        { id: "animal", label: "동물2", color: "#000000" },
      ],
    };
    expect(() => datasetSchema.parse(bad)).toThrow(/중복/);
  });
});

const validPassages = {
  kind: "passages",
  id: "animal-facts",
  model: "nlpai-lab/KURE-v1",
  projection: "radial",
  simRange: { min: 0.25, max: 0.72 },
  passages: [
    { id: "p1", text: "코끼리는 코로 물을 마신다.", angle: 0 },
    { id: "p2", text: "기차는 선로 위를 달린다.", angle: 0.5 },
  ],
  questions: [
    { id: "q1", text: "코끼리는 물을 어떻게 마셔?", sims: [0.71, 0.3] },
  ],
};

describe("datasetSchema — passages", () => {
  it("올바른 문장 데이터셋을 통과시킨다", () => {
    const parsed = datasetSchema.parse(validPassages);
    if (parsed.kind !== "passages") throw new Error("passages 데이터셋이어야 합니다");
    expect(parsed.questions[0].sims).toEqual([0.71, 0.3]);
  });

  it("sims 길이가 passages 수와 다르면 거부한다", () => {
    const bad = {
      ...validPassages,
      questions: [{ ...validPassages.questions[0], sims: [0.71] }],
    };
    expect(() => datasetSchema.parse(bad)).toThrow(/sims 길이/);
  });

  it("angle이 한 바퀴를 넘으면 거부한다", () => {
    const bad = {
      ...validPassages,
      passages: [{ ...validPassages.passages[0], angle: 1 }, validPassages.passages[1]],
    };
    expect(() => datasetSchema.parse(bad)).toThrow();
  });

  it("simRange가 뒤집혀 있으면 거부한다", () => {
    const bad = { ...validPassages, simRange: { min: 0.72, max: 0.25 } };
    expect(() => datasetSchema.parse(bad)).toThrow(/simRange/);
  });

  it("passage id가 중복되면 거부한다", () => {
    const bad = {
      ...validPassages,
      passages: [validPassages.passages[0], { ...validPassages.passages[1], id: "p1" }],
    };
    expect(() => datasetSchema.parse(bad)).toThrow(/중복/);
  });

  it("kind가 없으면 거부한다", () => {
    const noKind: Record<string, unknown> = { ...validPassages };
    delete noKind.kind;
    expect(() => datasetSchema.parse(noKind)).toThrow();
  });
});
