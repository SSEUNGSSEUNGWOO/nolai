import { describe, it, expect } from "vitest";
import { parseArtifact } from "./artifact";
import { getLesson } from "./content";

const lesson1 = getLesson("embedding-map");
const lesson2 = getLesson("nearest-search");

describe("parseArtifact — 좌표형 레슨", () => {
  it("데이터셋에 있는 단어 id만 담은 결과물을 통과시킨다", () => {
    expect(parseArtifact(lesson1, {
      datasetId: "words-animals-vehicles",
      placedIds: ["dog", "cat"],
    })).toEqual({ datasetId: "words-animals-vehicles", placedIds: ["dog", "cat"] });
  });

  it("빈 목록도 결과물이다", () => {
    expect(parseArtifact(lesson1, {
      datasetId: "words-animals-vehicles",
      placedIds: [],
    })).not.toBeNull();
  });

  it("데이터셋에 없는 id를 거부한다", () => {
    expect(parseArtifact(lesson1, {
      datasetId: "words-animals-vehicles",
      placedIds: ["dog", "ghost"],
    })).toBeNull();
  });

  it("다른 데이터셋을 가리키면 거부한다", () => {
    expect(parseArtifact(lesson1, {
      datasetId: "animal-facts",
      placedIds: ["dog"],
    })).toBeNull();
  });

  it("자유 텍스트가 섞이면 거부한다", () => {
    // 이 서비스에 자유 입력이 없다는 전제를 지키는 검사다
    expect(parseArtifact(lesson1, {
      datasetId: "words-animals-vehicles",
      placedIds: ["dog"],
      memo: "김민수 010-0000-0000",
    })).toBeNull();
  });

  it("id가 아닌 값을 거부한다", () => {
    expect(parseArtifact(lesson1, {
      datasetId: "words-animals-vehicles",
      placedIds: ["김민수"],
    })).toBeNull();
  });

  it("같은 단어를 여러 번 담으면 거부한다", () => {
    expect(parseArtifact(lesson1, {
      datasetId: "words-animals-vehicles",
      placedIds: ["dog", "dog", "dog"],
    })).toBeNull();
  });

  it("레슨 2의 모양을 레슨 1에 넣으면 거부한다", () => {
    expect(parseArtifact(lesson1, {
      datasetId: "words-animals-vehicles",
      questionIds: ["q01"],
    })).toBeNull();
  });

  it("결과물이 아예 아니면 거부한다", () => {
    for (const bad of [null, undefined, 0, "", "문자열", [], {}]) {
      expect(parseArtifact(lesson1, bad)).toBeNull();
    }
  });
});

describe("parseArtifact — 문장형 레슨", () => {
  it("데이터셋에 있는 질문 id만 담은 결과물을 통과시킨다", () => {
    expect(parseArtifact(lesson2, {
      datasetId: "animal-facts",
      questionIds: ["q01", "q08"],
    })).toEqual({ datasetId: "animal-facts", questionIds: ["q01", "q08"] });
  });

  it("없는 질문 id를 거부한다", () => {
    expect(parseArtifact(lesson2, {
      datasetId: "animal-facts",
      questionIds: ["q99"],
    })).toBeNull();
  });

  it("레슨 1의 모양을 레슨 2에 넣으면 거부한다", () => {
    expect(parseArtifact(lesson2, {
      datasetId: "animal-facts",
      placedIds: ["dog"],
    })).toBeNull();
  });
});

const lesson3 = getLesson("teach-sorter");

describe("parseArtifact — 가르치기 레슨", () => {
  it("단어와 상자 짝을 담은 결과물을 통과시킨다", () => {
    expect(parseArtifact(lesson3, {
      datasetId: "words-teach",
      taught: [
        { wordId: "dog", categoryId: "animal" },
        { wordId: "car", categoryId: "vehicle" },
      ],
    })).not.toBeNull();
  });

  it("데이터셋에 없는 상자를 거부한다", () => {
    expect(parseArtifact(lesson3, {
      datasetId: "words-teach",
      taught: [{ wordId: "dog", categoryId: "ghost" }],
    })).toBeNull();
  });

  it("데이터셋에 없는 단어를 거부한다", () => {
    expect(parseArtifact(lesson3, {
      datasetId: "words-teach",
      taught: [{ wordId: "ghost", categoryId: "animal" }],
    })).toBeNull();
  });

  it("자유 텍스트를 상자 이름으로 넣지 못한다", () => {
    expect(parseArtifact(lesson3, {
      datasetId: "words-teach",
      taught: [{ wordId: "dog", categoryId: "김민수" }],
    })).toBeNull();
  });

  it("같은 단어를 두 상자에 넣으면 거부한다", () => {
    expect(parseArtifact(lesson3, {
      datasetId: "words-teach",
      taught: [
        { wordId: "dog", categoryId: "animal" },
        { wordId: "dog", categoryId: "vehicle" },
      ],
    })).toBeNull();
  });
});
