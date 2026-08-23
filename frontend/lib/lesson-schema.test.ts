import { describe, it, expect } from "vitest";
import { lessonSchema } from "./lesson-schema";

const validLesson = {
  id: "embedding-map",
  order: 1,
  lang: "ko",
  title: "비슷한 말끼리 모여라",
  playground: "EmbeddingMap",
  dataset: "words-animals-vehicles",
  steps: [
    { type: "hook", owl: "컴퓨터는 '강아지'라는 말을 몰라." },
    { type: "play", owl: ["아무거나 끌어다 놔봐!"], goal: { kind: "placed", min: 5 } },
    { type: "name", concept: "임베딩", body: "말을 숫자로 바꿔서 기억해." },
    {
      type: "challenge",
      question: "'호랑이'는 어디에 놓일까?",
      choices: ["강아지 근처", "자동차 근처"],
      answer: 0,
      explain: "호랑이도 동물이니까!",
    },
    { type: "reward", badge: "map-explorer" },
  ],
};

describe("lessonSchema", () => {
  it("올바른 레슨을 통과시킨다", () => {
    expect(lessonSchema.parse(validLesson).id).toBe("embedding-map");
  });

  it("모르는 스텝 타입을 거부한다", () => {
    const bad = { ...validLesson, steps: [{ type: "dance", owl: "hi" }] };
    expect(() => lessonSchema.parse(bad)).toThrow();
  });

  it("challenge의 answer가 choices 범위를 벗어나면 거부한다", () => {
    const bad = {
      ...validLesson,
      steps: [
        {
          type: "challenge",
          question: "q",
          choices: ["a", "b"],
          answer: 5,
          explain: "e",
        },
      ],
    };
    expect(() => lessonSchema.parse(bad)).toThrow(/answer/);
  });

  it("play 스텝의 owl 대사가 비어 있으면 거부한다", () => {
    const bad = {
      ...validLesson,
      steps: [{ type: "play", owl: [], goal: { kind: "placed", min: 1 } }],
    };
    expect(() => lessonSchema.parse(bad)).toThrow();
  });

  it("goal.min이 0이면 거부한다", () => {
    const bad = {
      ...validLesson,
      steps: [{ type: "play", owl: ["가"], goal: { kind: "placed", min: 0 } }],
    };
    expect(() => lessonSchema.parse(bad)).toThrow();
  });

  it("choices가 2개 미만이면 거부한다", () => {
    const bad = {
      ...validLesson,
      steps: [
        {
          type: "challenge",
          question: "q",
          choices: ["하나뿐"],
          answer: 0,
          explain: "e",
        },
      ],
    };
    expect(() => lessonSchema.parse(bad)).toThrow();
  });

  it("도전 선택지가 중복되면 거부한다", () => {
    const bad = {
      ...validLesson,
      steps: [
        {
          type: "challenge",
          question: "q",
          choices: ["같은 답", "다른 답", "같은 답"],
          answer: 0,
          explain: "e",
        },
      ],
    };
    expect(() => lessonSchema.parse(bad)).toThrow(/중복/);
  });

  it("보상 스텝이 없으면 거부한다", () => {
    const bad = {
      ...validLesson,
      steps: validLesson.steps.filter((s) => s.type !== "reward"),
    };
    expect(() => lessonSchema.parse(bad)).toThrow(/보상/);
  });

  it("보상 스텝이 마지막이 아니면 거부한다", () => {
    const reward = { type: "reward", badge: "map-explorer" };
    const bad = {
      ...validLesson,
      steps: [reward, ...validLesson.steps.filter((s) => s.type !== "reward")],
    };
    expect(() => lessonSchema.parse(bad)).toThrow(/마지막/);
  });

  it("스텝의 오타를 해당 필드만 짚어서 알려준다", () => {
    const bad = {
      ...validLesson,
      steps: [{ type: "play", owl: ["가"], goal: { kind: "placed", minn: 5 } }],
    };

    const result = lessonSchema.safeParse(bad);
    expect(result.success).toBe(false);

    const issues = JSON.stringify(result.error!.issues);
    expect(issues).toMatch(/minn/);
    // 다른 스텝 타입의 필드가 섞여 나오면 안 된다
    expect(issues).not.toMatch(/concept|badge|question/);
  });

  describe("예측·확인 스텝", () => {
    const predict = { type: "predict", question: "호랑이는 어디로?", choices: ["강아지 근처", "자동차 근처"], answer: 0 };
    const reveal = { type: "reveal", right: "맞았어!", wrong: "아니었네!" };
    const [hook, play, name, , reward] = validLesson.steps;

    it("예측 → 놀이 → 확인 순서를 통과시킨다", () => {
      expect(() => lessonSchema.parse({ ...validLesson, steps: [hook, predict, play, reveal, name, reward] })).not.toThrow();
    });

    it("확인 앞에 예측이 없으면 거부한다", () => {
      // 러너가 돌아볼 예측이 없다.
      expect(() => lessonSchema.parse({ ...validLesson, steps: [hook, play, reveal, name, reward] })).toThrow(/예측/);
    });

    it("예측이 놀이 뒤에 오면 거부한다", () => {
      // 확인할 놀이가 이미 끝났다 -- 예측이 아니라 그냥 문제다.
      expect(() => lessonSchema.parse({ ...validLesson, steps: [hook, play, predict, reveal, name, reward] })).toThrow(/놀이/);
    });

    it("예측의 answer가 choices 범위를 벗어나면 거부한다", () => {
      expect(() => lessonSchema.parse({ ...validLesson, steps: [hook, { ...predict, answer: 5 }, play, reveal, name, reward] })).toThrow(/범위/);
    });
  });
});
