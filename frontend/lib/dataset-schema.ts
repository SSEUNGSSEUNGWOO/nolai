import { z } from "zod";

/** 지도 위 위치. 사전 계산된 값이며 손으로 고치지 않는다. */
const coord = {
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
};

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
  ...coord,
});

const passage = z.strictObject({
  id: z.string().min(1),
  text: z.string().min(1),
  ...coord,
});

const question = z.strictObject({
  id: z.string().min(1),
  text: z.string().min(1),
  ...coord,
  /** 원본 임베딩 공간에서 가까운 순서대로 고른 passage id. 사전 계산값이다. */
  top: z.array(z.string().min(1)).min(1),
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

/** 레슨 2 — 질문을 골라 가장 가까운 문장을 찾는다. */
const passagesDataset = z.strictObject({
  kind: z.literal("passages"),
  id: z.string().min(1),
  model: z.string().min(1),
  projection: z.literal("mds"),
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

    // top이 존재하지 않는 passage를 가리키면 아이가 질문을 골랐을 때 답이
    // 비어 있는 채로 검색이 끝난다. 화면에는 에러가 안 뜨고 아무 일도 안 난다.
    const known = new Set(data.passages.map((p) => p.id));
    data.questions.forEach((q, i) => {
      q.top.forEach((id, j) => {
        if (!known.has(id)) {
          ctx.addIssue({
            code: "custom",
            message: `알 수 없는 passage: ${id}`,
            path: ["questions", i, "top", j],
          });
        }
      });

      if (new Set(q.top).size !== q.top.length) {
        ctx.addIssue({
          code: "custom",
          message: "top에 같은 passage가 두 번 들어 있습니다",
          path: ["questions", i, "top"],
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
