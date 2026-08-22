import { describe, it, expect } from "vitest";
import { parseArtifact } from "./artifact";
import { getLesson, listLessons } from "./content";

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

describe("parseArtifact — 모든 레슨을 덮는다", () => {
  // 레슨을 늘릴 때 결과물 모양을 여기 추가하지 않으면 작품이 조용히 버려진다.
  // 화면에도 에러가 안 뜨고 내 방만 비어 있다. 실제로 레슨 5에서 그럴 뻔했다.
  const samples: Record<string, unknown> = {
    "embedding-map": {
      datasetId: "words-animals-vehicles",
      placedIds: ["dog"],
    },
    "nearest-search": { datasetId: "animal-facts", questionIds: ["q01"] },
    "teach-sorter": {
      datasetId: "words-teach",
      taught: [{ wordId: "dog", categoryId: "animal" }],
    },
    "answer-gaps": { datasetId: "animal-facts-gaps", questionIds: ["g01"] },
    "like-recommender": { datasetId: "likes-kid", likedIds: ["pizza"] },
    "pixel-zoom": { datasetId: "pixel-art", imageIds: ["heart"] },
    "pixel-coarse": { datasetId: "pixel-art", imageIds: ["star"] },
    "wave-zoom": { datasetId: "sounds-simple", soundIds: ["do"] },
    "token-split": { datasetId: "text-pieces", itemIds: ["t01"] },
    "self-cluster": { datasetId: "words-cluster", triedGroupings: [3] },
    "analogy-lab": { datasetId: "analogy-basic", tried: ["gender|king"] },
    "compare-meter": { datasetId: "words-compare", compared: ["big|small"] },
    "feeling-duel": { datasetId: "feeling-duel", judged: ["f01"] },
    "bit-lights": { datasetId: "bits-basic", made: [65] },
    "word-weaver": {
      datasetId: "story-next",
      sentences: [["나는", "학교에", "갔어요"]],
    },
    "translate-map": {
      datasetId: "words-translate",
      placedIds: ["dog_ko", "dog_en"],
    },
  };

  it("레슨마다 결과물 예시가 준비돼 있다", () => {
    expect(Object.keys(samples).sort()).toEqual(
      listLessons().map((lesson) => lesson.id).sort(),
    );
  });

  it("모든 레슨의 결과물이 저장 가능한 모양으로 통과한다", () => {
    for (const [lessonId, payload] of Object.entries(samples)) {
      expect(parseArtifact(getLesson(lessonId), payload), lessonId).not.toBeNull();
    }
  });
});

describe("parseArtifact — 그림 레슨", () => {
  const lesson6 = getLesson("pixel-zoom");

  it("데이터셋에 있는 그림 id를 통과시킨다", () => {
    expect(parseArtifact(lesson6, {
      datasetId: "pixel-art",
      imageIds: ["heart", "star"],
    })).not.toBeNull();
  });

  it("없는 그림을 거부한다", () => {
    expect(parseArtifact(lesson6, {
      datasetId: "pixel-art",
      imageIds: ["ghost"],
    })).toBeNull();
  });

  it("자유 텍스트를 거부한다", () => {
    expect(parseArtifact(lesson6, {
      datasetId: "pixel-art",
      imageIds: ["heart"],
      memo: "김민수",
    })).toBeNull();
  });
});
