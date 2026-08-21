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
    lesson.steps.forEach((step, index) => {
      if (step.type !== "challenge") return;

      if (step.answer >= step.choices.length) {
        ctx.addIssue({
          code: "custom",
          message: "answer가 choices 범위를 벗어났습니다",
          path: ["steps", index, "answer"],
        });
      }
    });
  });

export type Lesson = z.infer<typeof lessonSchema>;
export type LessonStep = z.infer<typeof lessonStepSchema>;
