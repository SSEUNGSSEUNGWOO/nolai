import { z } from "zod";

const category = z.strictObject({
  id: z.string().min(1),
  label: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

const word = z.strictObject({
  id: z.string().min(1),
  label: z.string().min(1),
  emoji: z.string().min(1),
  category: z.string().min(1),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

const passage = z.strictObject({
  id: z.string().min(1),
  text: z.string().min(1),
  /** 화면에서 이 문장이 늘 놓이는 방향. 0 이상 1 미만의 회전수다. */
  angle: z.number().min(0).lt(1),
});

const question = z.strictObject({
  id: z.string().min(1),
  text: z.string().min(1),
  /** passages와 같은 순서로 늘어놓은 코사인 유사도. 사전 계산값이다. */
  sims: z.array(z.number().min(-1).max(1)).min(2),
});

/** 레슨 1 — 단어를 지도 위에 놓는다. */
const wordsDataset = z.strictObject({
  kind: z.literal("words"),
  id: z.string().min(1),
  model: z.string().min(1),
  projection: z.literal("mds"),
  categories: z.array(category).min(1),
  words: z.array(word).min(2),
});

/**
 * 레슨 2 — 질문을 골라 가장 가까운 문장을 찾는다.
 *
 * 좌표를 담지 않는다. 질문이 늘 화면 한가운데 서고 문장은 실제 유사도를
 * 반지름으로 삼아 둘러서므로, 배치는 화면에서 계산한다. 2D 지도로 눌러 두면
 * 유사도 차이가 사라져 화면에서 먼 문장이 1등이 되는 일이 생긴다.
 */
const passagesDataset = z.strictObject({
  kind: z.literal("passages"),
  id: z.string().min(1),
  model: z.string().min(1),
  projection: z.literal("radial"),
  /** 유사도를 반지름으로 바꿀 때 쓰는 전역 기준. 질문마다 따로 재지 않는다. */
  simRange: z.strictObject({
    min: z.number().min(-1).max(1),
    max: z.number().min(-1).max(1),
  }),
  passages: z.array(passage).min(2),
  questions: z.array(question).min(1),
});

function reportDuplicateIds(
  items: { id: string }[],
  path: string,
  ctx: z.RefinementCtx,
): void {
  const seen = new Set<string>();
  items.forEach((item, i) => {
    if (seen.has(item.id)) {
      ctx.addIssue({
        code: "custom",
        message: `${path} id가 중복됩니다: ${item.id}`,
        path: [path, i, "id"],
      });
    }
    seen.add(item.id);
  });
}

export const datasetSchema = z
  .discriminatedUnion("kind", [wordsDataset, passagesDataset])
  .superRefine((data, ctx) => {
    if (data.kind === "words") {
      reportDuplicateIds(data.categories, "categories", ctx);
      reportDuplicateIds(data.words, "words", ctx);

      const known = new Set(data.categories.map((c) => c.id));
      data.words.forEach((w, i) => {
        if (!known.has(w.category)) {
          ctx.addIssue({
            code: "custom",
            message: `알 수 없는 category: ${w.category}`,
            path: ["words", i, "category"],
          });
        }
      });
      return;
    }

    reportDuplicateIds(data.passages, "passages", ctx);
    reportDuplicateIds(data.questions, "questions", ctx);

    if (data.simRange.min >= data.simRange.max) {
      ctx.addIssue({
        code: "custom",
        message: "simRange.min이 max보다 작아야 합니다",
        path: ["simRange"],
      });
    }

    // sims는 passages와 자리를 맞춰 읽는다. 길이가 어긋나면 엉뚱한 문장의
    // 유사도를 읽게 되는데, 화면에는 에러가 아니라 이상한 순위로만 나타난다.
    data.questions.forEach((q, i) => {
      if (q.sims.length !== data.passages.length) {
        ctx.addIssue({
          code: "custom",
          message:
            `sims 길이(${q.sims.length})가 passages 수(${data.passages.length})와 ` +
            `다릅니다`,
          path: ["questions", i, "sims"],
        });
      }
    });
  });

export type Dataset = z.infer<typeof datasetSchema>;
export type WordsDataset = Extract<Dataset, { kind: "words" }>;
export type PassagesDataset = Extract<Dataset, { kind: "passages" }>;
export type DatasetWord = z.infer<typeof word>;
export type DatasetCategory = z.infer<typeof category>;
export type DatasetPassage = z.infer<typeof passage>;
export type DatasetQuestion = z.infer<typeof question>;
