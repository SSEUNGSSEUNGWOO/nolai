import { describe, it, expect } from "vitest";
import {
  getLesson,
  getDataset,
  listLessons, lessonGroups, listLessonGroups,
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
    // embedding-map은 goal.kind가 "placed"라 words 데이터셋이 필요하다.
    // passages를 물리면 아이가 무엇을 해도 진도가 안 나간다.
    const lesson = getLesson("embedding-map");
    expect(() => assertPlayable(lesson, passages)).toThrow(/passages/);
  });
});

describe("content 로더 — 가장 가까운 걸 찾아줘", () => {
  it("nearest-search 레슨을 검증해서 읽는다", () => {
    const lesson = getLesson("nearest-search");
    expect(lesson.title).toBe("가장 가까운 걸 찾아줘");
    expect(lesson.playground).toBe("NearestSearch");
  });

  it("데이터셋은 문장 종류다", () => {
    const dataset = getDataset(getLesson("nearest-search").dataset);
    expect(dataset.kind).toBe("passages");
  });

  it("데이터셋 조합은 끝까지 진행 가능하다", () => {
    const lesson = getLesson("nearest-search");
    expect(() =>
      assertPlayable(lesson, getDataset(lesson.dataset)),
    ).not.toThrow();
  });

  it("배지에도 한글 이름이 있다", () => {
    expect(() =>
      assertBadgeNamesExist(getLesson("nearest-search")),
    ).not.toThrow();
  });
});

describe("content 로더 — 컴퓨터에게 가르쳐주기", () => {
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

});

describe("content 로더 — 없는 건 못 찾아", () => {
  it("answer-gaps 레슨을 검증해서 읽는다", () => {
    const lesson = getLesson("answer-gaps");
    expect(lesson.title).toBe("없는 건 못 찾아");
    // 놀이터를 새로 만들지 않고 가장 가까운 걸 찾아줘의 것을 그대로 쓴다
    expect(lesson.playground).toBe("NearestSearch");
  });

  it("없는 건 못 찾아는 가장 가까운 걸 찾아줘와 같은 문장 모음을 쓴다", () => {
    // 문장이 다르면 "답이 없어서 틀린 것"인지 "문장이 달라서 틀린 것"인지
    // 구별할 수 없다
    const search = getDataset(getLesson("nearest-search").dataset);
    const gaps = getDataset(getLesson("answer-gaps").dataset);
    if (search.kind !== "passages" || gaps.kind !== "passages") {
      throw new Error("둘 다 passages여야 합니다");
    }

    expect(gaps.passages.map((p) => p.text)).toEqual(
      search.passages.map((p) => p.text),
    );
  });

});

describe("content 로더 — 내 취향을 어떻게 알까", () => {
  it("like-recommender 레슨을 검증해서 읽는다", () => {
    const lesson = getLesson("like-recommender");
    expect(lesson.title).toBe("내 취향을 어떻게 알까");
    expect(lesson.playground).toBe("LikeRecommender");
  });

  it("레슨 순서가 1부터 빈틈없이 이어진다", () => {
    // 목록을 손으로 적어두면 레슨을 늘릴 때마다 이 테스트부터 깨진다.
    // 정말 지켜야 하는 것은 순서가 겹치거나 비지 않는다는 것이다.
    const orders = listLessons().map((lesson) => lesson.order);

    expect(orders).toEqual(orders.map((_, index) => index + 1));
  });

  it("레슨 id가 겹치지 않는다", () => {
    const ids = listLessons().map((lesson) => lesson.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("레슨 사이의 참조", () => {
  it("본문이 다른 레슨을 번호로 부르지 않는다", () => {
    // 번호로 부르면 순서를 바꾸는 순간 그 문장이 거짓이 된다. 실제로
    // self-cluster가 "1번에서 본 지도"라고 적고 있다가 걸렸다. 제목으로 부른다.
    for (const lesson of listLessons()) {
      for (const step of lesson.steps) {
        const text =
          step.type === "name"
            ? step.body
            : step.type === "challenge"
              ? `${step.question} ${step.explain}`
              : "";

        expect(text, `${lesson.id}`).not.toMatch(/\d+번(에서|처럼|을|은|이|의|,|\s|$)/);
      }
    }
  });

  it("본문이 부르는 레슨 제목이 실제로 있다", () => {
    const titles = listLessons().map((one) => one.title);

    for (const lesson of listLessons()) {
      const name = lesson.steps.find((step) => step.type === "name");
      if (name?.type !== "name") continue;

      // 따옴표로 감싼 것 중 레슨 제목처럼 보이는 것을 확인한다
      for (const quoted of name.body.match(/"([^"]+)"/g) ?? []) {
        const inner = quoted.slice(1, -1);
        if (inner.length < 5) continue;
        expect(titles, `${lesson.id}가 부르는 "${inner}"`).toContain(inner);
      }
    }
  });
});

describe("첫 화면 묶음", () => {
  it("모든 레슨이 정확히 한 묶음에 속한다", () => {
    // 레슨을 추가하고 묶음에 안 넣으면 첫 화면에서 조용히 사라진다.
    const grouped = lessonGroups.flatMap((group) => group.lessonIds);
    const all = listLessons().map((lesson) => lesson.id);

    expect([...grouped].sort()).toEqual([...all].sort());
    expect(new Set(grouped).size).toBe(grouped.length);
  });

  it("묶음 안팎의 순서가 레슨 order와 같다", () => {
    // 묶음을 펼친 순서가 곧 아이가 보는 순서다. order와 어긋나면 첫 화면의
    // 번호가 1, 2, 5, 3처럼 뒤섞인다.
    const flattened = listLessonGroups().flatMap((group) => group.lessons);
    expect(flattened.map((lesson) => lesson.order)).toEqual(
      flattened.map((_, index) => index + 1),
    );
  });
});
