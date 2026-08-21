import { z } from "zod";

const hookStep = z.strictObject({
  type: z.literal("hook"),
  owl: z.string().min(1),
});

const playStep = z.strictObject({
  type: z.literal("play"),
  owl: z.array(z.string().min(1)).min(1),
  goal: z.strictObject({ minPlaced: z.number().int().positive() }),
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

const rewardStep = z.strictObject({
  type: z.literal("reward"),
  badge: z.string().min(1),
});

export const lessonStepSchema = z.discriminatedUnion("type", [
  hookStep,
  playStep,
  nameStep,
  challengeStep,
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

    lesson.steps.forEach((step, index) => {
      if (step.type !== "challenge") return;

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
