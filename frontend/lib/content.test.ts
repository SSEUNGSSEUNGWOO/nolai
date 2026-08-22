import { describe, it, expect } from "vitest";
import {
  getLesson,
  getDataset,
  listLessons,
  assertPlayable,
  assertPlaygroundExists,
  assertBadgeNamesExist,
} from "./content";

/** 이 파일의 검사는 좌표형(words) 데이터셋을 전제한다. 좁혀서 꺼낸다. */
function wordsDataset(id: string) {
  const dataset = getDataset(id);
  if (dataset.kind !== "words") {
    throw new Error(`${id}는 words 데이터셋이 아닙니다`);
  }
  return dataset;
}

describe("content 로더", () => {
  it("embedding-map 레슨을 검증해서 읽는다", () => {
    const lesson = getLesson("embedding-map");
    expect(lesson.title).toBe("비슷한 말끼리 모여라");
    expect(lesson.steps[0].type).toBe("hook");
  });

  it("레슨이 참조하는 데이터셋이 실제로 존재한다", () => {
    const lesson = getLesson("embedding-map");
    const dataset = wordsDataset(lesson.dataset);
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

  it("데이터셋 항목 수보다 goal.min이 크면 거부한다", () => {
    const lesson = getLesson("embedding-map");
    const dataset = wordsDataset(lesson.dataset);
    const tooFew = { ...dataset, words: dataset.words.slice(0, 2) };

    expect(() => assertPlayable(lesson, tooFew)).toThrow(/goal.min/);
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

describe("assertPlayable — 목표와 데이터셋 종류", () => {
  const passages = {
    kind: "passages" as const,
    id: "animal-facts",
    model: "nlpai-lab/KURE-v1",
    projection: "radial" as const,
    simRange: { min: 0.25, max: 0.72 },
    passages: [
      { id: "p1", text: "코끼리는 코로 물을 마신다.", angle: 0 },
      { id: "p2", text: "기차는 선로 위를 달린다.", angle: 0.5 },
    ],
    questions: [
      { id: "q1", text: "코끼리는 물을 어떻게 마셔?", sims: [0.71, 0.3] },
    ],
  };

  it("goal.kind와 데이터셋 종류가 어긋나면 거부한다", () => {
    // 레슨 1은 goal.kind가 "placed"라 words 데이터셋이 필요하다.
    // passages를 물리면 아이가 무엇을 해도 진도가 안 나간다.
    const lesson = getLesson("embedding-map");
    expect(() => assertPlayable(lesson, passages)).toThrow(/passages/);
  });
});

describe("content 로더 — 레슨 2", () => {
  it("nearest-search 레슨을 검증해서 읽는다", () => {
    const lesson = getLesson("nearest-search");
    expect(lesson.title).toBe("가장 가까운 걸 찾아줘");
    expect(lesson.playground).toBe("NearestSearch");
  });

  it("레슨 2의 데이터셋은 문장 종류다", () => {
    const dataset = getDataset(getLesson("nearest-search").dataset);
    expect(dataset.kind).toBe("passages");
  });

  it("레슨 2와 데이터셋 조합은 끝까지 진행 가능하다", () => {
    const lesson = getLesson("nearest-search");
    expect(() =>
      assertPlayable(lesson, getDataset(lesson.dataset)),
    ).not.toThrow();
  });

  it("레슨 2의 배지에도 한글 이름이 있다", () => {
    expect(() =>
      assertBadgeNamesExist(getLesson("nearest-search")),
    ).not.toThrow();
  });
});

describe("content 로더 — 레슨 3", () => {
  it("teach-sorter 레슨을 검증해서 읽는다", () => {
    const lesson = getLesson("teach-sorter");
    expect(lesson.title).toBe("컴퓨터에게 가르쳐주기");
    expect(lesson.playground).toBe("TeachSorter");
  });

  it("가르치기 목표는 좌표형 데이터셋을 쓴다", () => {
    const lesson = getLesson("teach-sorter");
    expect(() =>
      assertPlayable(lesson, getDataset(lesson.dataset)),
    ).not.toThrow();
  });

  it("세 레슨이 order 순으로 나온다", () => {
    expect(listLessons().map((l) => l.id)).toEqual([
      "embedding-map",
      "nearest-search",
      "teach-sorter",
    ]);
  });
});
