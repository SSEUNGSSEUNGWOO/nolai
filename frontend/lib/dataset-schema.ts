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

/**
 * 레슨 6·9 -- 그림을 이루는 칸(픽셀).
 *
 * 이 데이터셋만은 모델이 만들지 않는다. 손으로 그린 픽셀 아트다. 6장의
 * "모든 숫자는 진짜다"는 여기서도 지켜진다 -- 아이에게 보여주는 색 숫자가
 * 화면에 실제로 칠해지는 그 색이기 때문이다. 좌표형 데이터셋과 달리 손으로
 * 고쳐도 되는 유일한 데이터셋이다.
 */
const pixelsDataset = z.strictObject({
  kind: z.literal("pixels"),
  id: z.string().min(1),
  /** 글자 하나가 색 하나를 가리킨다. rows가 이 글자들로만 이루어져야 한다. */
  palette: z.record(z.string().length(1), z.string().regex(/^#[0-9A-Fa-f]{6}$/)),
  images: z
    .array(
      z.strictObject({
        id: z.string().min(1),
        label: z.string().min(1),
        emoji: z.string().min(1),
        rows: z.array(z.string().min(1)).min(2),
      }),
    )
    .min(1),
});

/**
 * 레슨 8 -- 소리를 이루는 숫자.
 *
 * 샘플 값을 담지 않고 만드는 방법(주파수·배음)만 담는다. 화면에 그리는 값과
 * 귀에 들리는 값을 브라우저가 **한 번 계산해 함께 쓰기 위해서**다. 값을 미리
 * 저장해두면 소리를 낼 때 다시 계산하게 되고, 둘이 어긋날 여지가 생긴다.
 */
const soundsDataset = z.strictObject({
  kind: z.literal("sounds"),
  id: z.string().min(1),
  /** 초당 샘플 수. 보여주기용이라 실제 음악 파일보다 낮게 잡는다. */
  sampleRate: z.number().int().positive(),
  /** 소리를 들려주는 길이. */
  playMs: z.number().int().positive(),
  /** 화면에 그리는 샘플 수. 너무 많으면 물결이 뭉개져 보이지 않는다. */
  showSamples: z.number().int().positive(),
  sounds: z
    .array(
      z.strictObject({
        id: z.string().min(1),
        label: z.string().min(1),
        emoji: z.string().min(1),
        frequency: z.number().positive(),
        harmonics: z.number().int().positive(),
      }),
    )
    .min(1),
});

/**
 * 레슨 9 -- AI가 글을 읽는 조각(토큰).
 *
 * 조각과 번호는 레슨 1~5가 쓰는 것과 **같은 모델의 토크나이저**에서 나온다.
 * 다른 모델을 쓰면 "이 조각이 곧 AI가 보는 글"이라는 말이 이 서비스 안에서
 * 거짓이 된다.
 */
const tokensDataset = z.strictObject({
  kind: z.literal("tokens"),
  id: z.string().min(1),
  model: z.string().min(1),
  items: z
    .array(
      z.strictObject({
        id: z.string().min(1),
        text: z.string().min(1),
        pieces: z
          .array(
            z.strictObject({
              text: z.string(),
              /** 앞에 띄어쓰기가 있었는지. 화면에서 따로 알려준다. */
              spaced: z.boolean(),
              number: z.number().int().nonnegative(),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
});

/**
 * 레슨 11 -- 컴퓨터가 스스로 나눈 무리.
 *
 * 무리 배정은 미리 계산해 담는다. 브라우저에서 k-means를 돌리면 구현이 달라
 * 다른 답이 나올 수 있고, 그러면 미리 재보고 쓴 문구가 화면과 어긋난다.
 */
const clustersDataset = z.strictObject({
  kind: z.literal("clusters"),
  id: z.string().min(1),
  model: z.string().min(1),
  projection: z.literal("mds"),
  categories: z.array(category).min(1),
  words: z.array(word).min(2),
  /** 무리 개수(문자열 키) → 단어마다의 무리 번호. words와 순서가 같다. */
  groupings: z.record(z.string(), z.array(z.number().int().nonnegative())),
});

/**
 * 레슨 12 -- 관계 계산(유추).
 *
 * 아이가 고를 수 있는 조합이 관계 x 단어로 정해져 있으므로 답을 전부 미리
 * 구해 담는다. 브라우저에서 1024차원 벡터를 다루면 파일이 커지고, 계산이
 * 달라지면 미리 재보고 쓴 문구가 화면과 어긋난다.
 */
const analogyDataset = z.strictObject({
  kind: z.literal("analogy"),
  id: z.string().min(1),
  model: z.string().min(1),
  relations: z
    .array(
      z.strictObject({
        id: z.string().min(1),
        label: z.string().min(1),
        from: z.string().min(1),
        to: z.string().min(1),
      }),
    )
    .min(1),
  subjects: z
    .array(
      z.strictObject({
        id: z.string().min(1),
        label: z.string().min(1),
        emoji: z.string().min(1),
        /** 어느 무리의 말인지. 관계와 어울리는지 판단하는 데 쓴다. */
        group: z.string().min(1),
      }),
    )
    .min(1),
  /** "관계id|단어id" → 가까운 순으로 고른 답. */
  answers: z.record(
    z.string(),
    z
      .array(
        z.strictObject({
          label: z.string().min(1),
          score: z.number(),
        }),
      )
      .min(1),
  ),
});

/**
 * 레슨 13 -- 두 단어가 얼마나 닮았는지.
 *
 * 2D로 누르지 않고 원래 공간의 값을 그대로 담는다. 이 레슨이 보여주려는
 * 차이가 투영 과정에서 사라지기 때문이다(반대말을 지도에 놓아봤을 때 6쌍 중
 * 2쌍만 붙었고, 쌍을 줄이면 오히려 더 벌어졌다).
 */
const similarityDataset = z.strictObject({
  kind: z.literal("similarity"),
  id: z.string().min(1),
  model: z.string().min(1),
  categories: z.array(category).min(1),
  words: z
    .array(
      z.strictObject({
        id: z.string().min(1),
        label: z.string().min(1),
        emoji: z.string().min(1),
        category: z.string().min(1),
      }),
    )
    .min(2),
  /** "단어id|단어id" → 코사인 유사도. 순서는 words 순서를 따른다. */
  sims: z.record(z.string(), z.number().min(-1).max(1)),
});

/**
 * 레슨 14 -- 앞말 다음에 무엇이 왔는지.
 *
 * 임베딩을 쓰지 않는 유일한 언어 데이터셋이다. 이 레슨이 보여주려는 것은
 * "본 것을 세어서 다음을 고른다"이고, 확률은 지어낸 값이 아니라 담아둔
 * 문장들의 진짜 빈도다.
 */
const nextWordDataset = z.strictObject({
  kind: z.literal("nextword"),
  id: z.string().min(1),
  /** 몇 문장에서 세었는지. 아이에게 그대로 말해준다. */
  sentenceCount: z.number().int().positive(),
  starts: z.array(z.string().min(1)).min(1),
  next: z.record(
    z.string(),
    z
      .array(
        z.strictObject({
          word: z.string().min(1),
          count: z.number().int().positive(),
          p: z.number().min(0).max(1),
        }),
      )
      .min(1),
  ),
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
  .discriminatedUnion("kind", [
    wordsDataset,
    passagesDataset,
    pixelsDataset,
    soundsDataset,
    tokensDataset,
    clustersDataset,
    analogyDataset,
    similarityDataset,
    nextWordDataset,
  ])
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

    if (data.kind === "nextword") {
      data.starts.forEach((start, i) => {
        // 시작할 수 있다는데 이어갈 말이 없으면 아이가 첫 걸음에서 막힌다.
        if (!data.next[start]) {
          ctx.addIssue({
            code: "custom",
            message: `시작말 "${start}" 다음에 올 말이 없습니다`,
            path: ["starts", i],
          });
        }
      });

      Object.entries(data.next).forEach(([head, options]) => {
        const total = options.reduce((sum, one) => sum + one.p, 0);
        // 확률을 손으로 고치면 합이 1에서 벗어난다. 그때 화면의 막대가 거짓이 된다.
        if (Math.abs(total - 1) > 0.01) {
          ctx.addIssue({
            code: "custom",
            message: `"${head}" 다음 확률의 합이 ${total.toFixed(3)}입니다`,
            path: ["next", head],
          });
        }
      });
      return;
    }

    if (data.kind === "similarity") {
      reportDuplicateIds(data.words, "words", ctx);

      // 아이가 고를 수 있는 모든 쌍에 값이 있어야 한다. 없으면 화면이 빈다.
      data.words.forEach((a, i) => {
        data.words.slice(i + 1).forEach((b) => {
          const has =
            data.sims[`${a.id}|${b.id}`] !== undefined ||
            data.sims[`${b.id}|${a.id}`] !== undefined;
          if (!has) {
            ctx.addIssue({
              code: "custom",
              message: `${a.id}와 ${b.id}의 값이 없습니다`,
              path: ["sims"],
            });
          }
        });
      });
      return;
    }

    if (data.kind === "analogy") {
      reportDuplicateIds(data.relations, "relations", ctx);
      reportDuplicateIds(data.subjects, "subjects", ctx);

      // 아이가 고를 수 있는 조합에 답이 없으면 화면이 비어 있게 된다.
      data.relations.forEach((relation) => {
        data.subjects.forEach((subject) => {
          const key = `${relation.id}|${subject.id}`;
          if (!data.answers[key]) {
            ctx.addIssue({
              code: "custom",
            message: `조합 ${key}의 답이 없습니다`,
              path: ["answers", key],
            });
          }
        });
      });
      return;
    }

    if (data.kind === "clusters") {
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

      Object.entries(data.groupings).forEach(([k, assigned]) => {
        // 배정이 단어 수와 다르면 엉뚱한 단어가 엉뚱한 무리로 간다.
        if (assigned.length !== data.words.length) {
          ctx.addIssue({
            code: "custom",
            message: `무리 ${k}개의 배정 수(${assigned.length})가 단어 수(${data.words.length})와 다릅니다`,
            path: ["groupings", k],
          });
          return;
        }

        const used = new Set(assigned).size;
        if (used !== Number(k)) {
          ctx.addIssue({
            code: "custom",
            message: `무리를 ${k}개로 나눴다는데 실제로는 ${used}개입니다`,
            path: ["groupings", k],
          });
        }
      });
      return;
    }

    if (data.kind === "tokens") {
      reportDuplicateIds(data.items, "items", ctx);

      data.items.forEach((item, i) => {
        // 조각을 도로 붙이면 원래 글이 나와야 한다. 안 그러면 아이에게
        // 보여주는 조각이 그 글의 조각이 아니다.
        const joined = item.pieces
          .map((piece) => (piece.spaced ? " " : "") + piece.text)
          .join("")
          .trim();

        if (joined !== item.text) {
          ctx.addIssue({
            code: "custom",
            message: `조각을 붙이면 "${joined}"이 되는데 원래 글은 "${item.text}"입니다`,
            path: ["items", i, "pieces"],
          });
        }
      });
      return;
    }

    if (data.kind === "sounds") {
      reportDuplicateIds(data.sounds, "sounds", ctx);

      data.sounds.forEach((sound, i) => {
        // 한 물결에 샘플이 두 개도 안 들어가면 화면에서 물결로 보이지 않고
        // 소리도 제대로 나지 않는다(나이퀴스트).
        if (sound.frequency * 2 >= data.sampleRate) {
          ctx.addIssue({
            code: "custom",
            message:
              `${sound.frequency}Hz는 sampleRate(${data.sampleRate})의 절반보다 ` +
              `높습니다. 물결이 보이지 않습니다`,
            path: ["sounds", i, "frequency"],
          });
        }
      });
      return;
    }

    if (data.kind === "pixels") {
      reportDuplicateIds(data.images, "images", ctx);

      const known = new Set(Object.keys(data.palette));
      data.images.forEach((image, i) => {
        const width = image.rows[0].length;

        image.rows.forEach((row, r) => {
          // 줄 길이가 다르면 격자가 아니라 들쭉날쭉한 모양이 된다.
          if (row.length !== width) {
            ctx.addIssue({
              code: "custom",
              message: `${r}번째 줄의 길이(${row.length})가 첫 줄(${width})과 다릅니다`,
              path: ["images", i, "rows", r],
            });
          }

          for (const char of row) {
            if (!known.has(char)) {
              ctx.addIssue({
                code: "custom",
                message: `팔레트에 없는 글자: ${char}`,
                path: ["images", i, "rows", r],
              });
            }
          }
        });
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
export type PixelsDataset = Extract<Dataset, { kind: "pixels" }>;
export type SoundsDataset = Extract<Dataset, { kind: "sounds" }>;
export type TokensDataset = Extract<Dataset, { kind: "tokens" }>;
export type ClustersDataset = Extract<Dataset, { kind: "clusters" }>;
export type AnalogyDataset = Extract<Dataset, { kind: "analogy" }>;
export type SimilarityDataset = Extract<Dataset, { kind: "similarity" }>;
export type NextWordDataset = Extract<Dataset, { kind: "nextword" }>;
export type DatasetWord = z.infer<typeof word>;
export type DatasetCategory = z.infer<typeof category>;
export type DatasetPassage = z.infer<typeof passage>;
export type DatasetQuestion = z.infer<typeof question>;
