import { z } from "zod";

const hookStep = z.strictObject({
  type: z.literal("hook"),
  owl: z.string().min(1),
});

/**
 * 놀이터마다 "충분히 놀았다"의 기준이 다르다. 임베딩 지도는 단어를 놓은 수,
 * 벡터검색은 질문을 골라본 수,
 * 가르치기는 상자에 넣어준 예시 수다. kind는 놀이터가 올려보내는 이벤트 이름과
 * 같으며, LessonRunner는 그 이름의 이벤트만 세어 목표 달성을 판단한다.
 */
const goal = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("placed"),
    min: z.number().int().positive(),
  }),
  z.strictObject({
    kind: z.literal("searched"),
    min: z.number().int().positive(),
  }),
  z.strictObject({
    kind: z.literal("taught"),
    min: z.number().int().positive(),
  }),
  z.strictObject({
    kind: z.literal("liked"),
    min: z.number().int().positive(),
  }),
  z.strictObject({
    kind: z.literal("looked"),
    min: z.number().int().positive(),
  }),
  // 칸 크기를 바꿔본 횟수(처음 크기 제외). 그림 보기(looked)와 같은 놀이터, 다른 조작.
  z.strictObject({
    kind: z.literal("resized"),
    min: z.number().int().positive(),
  }),
  z.strictObject({
    kind: z.literal("heard"),
    min: z.number().int().positive(),
  }),
  z.strictObject({
    kind: z.literal("split"),
    min: z.number().int().positive(),
  }),
  z.strictObject({
    kind: z.literal("grouped"),
    min: z.number().int().positive(),
  }),
  z.strictObject({
    kind: z.literal("calculated"),
    min: z.number().int().positive(),
  }),
  z.strictObject({
    kind: z.literal("compared"),
    min: z.number().int().positive(),
  }),
  z.strictObject({
    kind: z.literal("wrote"),
    min: z.number().int().positive(),
  }),
  z.strictObject({
    kind: z.literal("judged"),
    min: z.number().int().positive(),
  }),
  z.strictObject({
    kind: z.literal("made"),
    min: z.number().int().positive(),
  }),
]);

const playStep = z.strictObject({
  type: z.literal("play"),
  owl: z.array(z.string().min(1)).min(1),
  goal,
});

const nameStep = z.strictObject({
  type: z.literal("name"),
  concept: z.string().min(1),
  body: z.string().min(1),
});

const challengeStep = z.strictObject({
  type: z.literal("challenge"),
  question: z.string().min(1),
  choices: z.array(z.string().min(1)).min(2),
  answer: z.number().int().nonnegative(),
  explain: z.string().min(1),
});

/**
 * 놀이 전에 아이가 먼저 찍어보는 스텝. 맞고 틀림을 여기서 말하지 않는다 --
 * 놀이에서 직접 확인하고 reveal에서 돌아본다. 틀린 예측이 제일 강한 학습이다.
 */
const predictStep = z.strictObject({
  type: z.literal("predict"),
  question: z.string().min(1),
  choices: z.array(z.string().min(1)).min(2),
  answer: z.number().int().nonnegative(),
});

/** predict에서 찍은 것을 놀이 뒤에 돌아보는 스텝. */
const revealStep = z.strictObject({
  type: z.literal("reveal"),
  right: z.string().min(1),
  wrong: z.string().min(1),
});

const rewardStep = z.strictObject({
  type: z.literal("reward"),
  badge: z.string().min(1),
});

export const lessonStepSchema = z.discriminatedUnion("type", [
  hookStep,
  playStep,
  nameStep,
  challengeStep,
  predictStep,
  revealStep,
  rewardStep,
]);

export const lessonSchema = z
  .strictObject({
    id: z.string().min(1),
    order: z.number().int().positive(),
    lang: z.literal("ko"),
    title: z.string().min(1),
    playground: z.string().min(1),
    dataset: z.string().min(1),
    steps: z.array(lessonStepSchema).min(1),
  })
  .superRefine((lesson, ctx) => {
    const rewardIndexes = lesson.steps
      .map((step, index) => (step.type === "reward" ? index : -1))
      .filter((index) => index !== -1);

    if (rewardIndexes.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "보상(reward) 스텝이 정확히 하나 있어야 합니다",
        path: ["steps"],
      });
    } else if (rewardIndexes.length > 1) {
      ctx.addIssue({
        code: "custom",
        message: "보상(reward) 스텝은 정확히 하나여야 합니다",
        path: ["steps"],
      });
    } else if (rewardIndexes[0] !== lesson.steps.length - 1) {
      ctx.addIssue({
        code: "custom",
        message: "보상(reward) 스텝은 마지막 스텝이어야 합니다",
        path: ["steps"],
      });
    }

    // 예측은 놀이 앞에, 확인은 예측 뒤에. 순서가 틀리면 러너가 없는 예측을
    // 돌아보거나 확인할 놀이가 없다.
    const predictIndex = lesson.steps.findIndex((step) => step.type === "predict");
    const revealIndex = lesson.steps.findIndex((step) => step.type === "reveal");
    const playIndex = lesson.steps.findIndex((step) => step.type === "play");
    if (lesson.steps.filter((step) => step.type === "predict").length > 1) {
      ctx.addIssue({ code: "custom", message: "예측(predict) 스텝은 하나만 둘 수 있습니다", path: ["steps"] });
    }
    if (revealIndex !== -1 && (predictIndex === -1 || predictIndex > revealIndex)) {
      ctx.addIssue({ code: "custom", message: "확인(reveal) 스텝 앞에 예측(predict) 스텝이 있어야 합니다", path: ["steps", revealIndex] });
    }
    if (predictIndex !== -1 && (playIndex === -1 || playIndex < predictIndex)) {
      ctx.addIssue({ code: "custom", message: "예측(predict) 스텝은 놀이(play) 스텝보다 앞에 있어야 합니다", path: ["steps", predictIndex] });
    }

    lesson.steps.forEach((step, index) => {
      if (step.type !== "challenge" && step.type !== "predict") return;

      if (step.answer >= step.choices.length) {
        ctx.addIssue({
          code: "custom",
          message: "answer가 choices 범위를 벗어났습니다",
          path: ["steps", index, "answer"],
        });
      }

      if (new Set(step.choices).size !== step.choices.length) {
        ctx.addIssue({
          code: "custom",
          message: "choices에 중복된 선택지가 있습니다",
          path: ["steps", index, "choices"],
        });
      }
    });
  });

export type Lesson = z.infer<typeof lessonSchema>;
export type LessonStep = z.infer<typeof lessonStepSchema>;
export type PlayGoal = z.infer<typeof goal>;
