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

export const datasetSchema = z
  .strictObject({
    id: z.string().min(1),
    model: z.string().min(1),
    projection: z.literal("mds"),
    categories: z.array(category).min(1),
    words: z.array(word).min(2),
  })
  .superRefine((data, ctx) => {
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
  });

export type Dataset = z.infer<typeof datasetSchema>;
export type DatasetWord = z.infer<typeof word>;
export type DatasetCategory = z.infer<typeof category>;
