import { z } from "zod";
import type { Dataset } from "./dataset-schema";
import type { Lesson } from "./lesson-schema";
import { getDataset } from "./content";

/**
 * 아이가 만든 결과물의 모양을 서버가 다시 정한다.
 *
 * artifacts.payload는 jsonb라 클라이언트가 보낸 것을 그대로 넣으면 무엇이든
 * 들어간다. 그러면 이 서비스에 자유 텍스트 입력이 없다는 전제가 깨진다 --
 * 닉네임에서 그렇게 막아둔 실명이 여기로 들어올 수 있다.
 *
 * 그래서 **id 목록만** 받고, 그 id가 데이터셋에 실제로 있는지까지 확인한다.
 * 문자열을 지어내서 넣을 자리가 없다.
 */
const wordsArtifact = z.strictObject({
  datasetId: z.string().min(1),
  placedIds: z.array(z.string().min(1)).max(200),
});

/** 컴퓨터는 0과 1뿐이야 -- 어떤 숫자를 만들어봤는지. */
const bitsArtifact = z.strictObject({
  datasetId: z.string().min(1),
  made: z.array(z.number().int().nonnegative()).max(60),
});

/** AI랑 기분 맞히기 대결 -- 어떤 문장에서 AI와 대결했는지. */
const duelArtifact = z.strictObject({
  datasetId: z.string().min(1),
  judged: z.array(z.string().min(1)).max(60),
});

/** AI는 글을 이렇게 써 -- 어떤 문장을 만들어봤는지. */
const sentenceArtifact = z.strictObject({
  datasetId: z.string().min(1),
  sentences: z.array(z.array(z.string().min(1)).min(1)).max(20),
});

/** 반대말인데 왜 가까워? -- 어떤 두 단어를 재봤는지. */
const similarityArtifact = z.strictObject({
  datasetId: z.string().min(1),
  compared: z.array(z.string().min(1)).max(60),
});

/** 뜻으로 계산하기 -- 어떤 식을 만들어봤는지. */
const analogyArtifact = z.strictObject({
  datasetId: z.string().min(1),
  tried: z.array(z.string().min(1)).max(60),
});

/** 안 가르쳐도 나눠 -- 무리를 몇 개로 나눠봤는지. */
const clustersArtifact = z.strictObject({
  datasetId: z.string().min(1),
  triedGroupings: z.array(z.number().int().positive()).max(20),
});

/** AI는 글을 조각으로 읽어 -- 어떤 글을 조각내봤는지. */
const tokensArtifact = z.strictObject({
  datasetId: z.string().min(1),
  itemIds: z.array(z.string().min(1)).max(50),
});

/** 소리도 숫자야 -- 어떤 소리를 들어봤는지. */
const soundsArtifact = z.strictObject({
  datasetId: z.string().min(1),
  soundIds: z.array(z.string().min(1)).max(50),
});

/** 그림도 숫자야·칸이 많을수록 또렷해 -- 어떤 그림을 들여다봤는지. */
const pixelsArtifact = z.strictObject({
  datasetId: z.string().min(1),
  imageIds: z.array(z.string().min(1)).max(50),
});

/** 내 취향을 어떻게 알까 -- 어떤 것에 하트를 눌렀는지. */
const likesArtifact = z.strictObject({
  datasetId: z.string().min(1),
  likedIds: z.array(z.string().min(1)).max(200),
});

/** 컴퓨터에게 가르쳐주기 -- 어느 단어를 어느 상자에 넣어 가르쳤는지. */
const teachArtifact = z.strictObject({
  datasetId: z.string().min(1),
  taught: z
    .array(
      z.strictObject({
        wordId: z.string().min(1),
        categoryId: z.string().min(1),
      }),
    )
    .max(200),
});

const passagesArtifact = z.strictObject({
  datasetId: z.string().min(1),
  questionIds: z.array(z.string().min(1)).max(200),
});

export type WordsArtifact = z.infer<typeof wordsArtifact>;
export type TeachArtifact = z.infer<typeof teachArtifact>;
export type LikesArtifact = z.infer<typeof likesArtifact>;
export type PixelsArtifact = z.infer<typeof pixelsArtifact>;
export type SoundsArtifact = z.infer<typeof soundsArtifact>;
export type TokensArtifact = z.infer<typeof tokensArtifact>;
export type ClustersArtifact = z.infer<typeof clustersArtifact>;
export type AnalogyArtifact = z.infer<typeof analogyArtifact>;
export type SimilarityArtifact = z.infer<typeof similarityArtifact>;
export type SentenceArtifact = z.infer<typeof sentenceArtifact>;
export type DuelArtifact = z.infer<typeof duelArtifact>;
export type BitsArtifact = z.infer<typeof bitsArtifact>;
export type PassagesArtifact = z.infer<typeof passagesArtifact>;
export type ArtifactPayload =
  | WordsArtifact
  | TeachArtifact
  | LikesArtifact
  | PixelsArtifact
  | SoundsArtifact
  | TokensArtifact
  | ClustersArtifact
  | AnalogyArtifact
  | SimilarityArtifact
  | SentenceArtifact
  | DuelArtifact
  | BitsArtifact
  | PassagesArtifact;

/**
 * 레슨이 쓰는 데이터셋 종류에 맞는 결과물인지 확인한다.
 *
 * 통과하면 저장 가능한 payload를, 아니면 null을 돌려준다. 예외를 던지지
 * 않는다 -- 결과물을 못 담는 것이 레슨 완료 자체를 막아서는 안 된다.
 */
export function parseArtifact(lesson: Lesson, raw: unknown): ArtifactPayload | null {
  const dataset: Dataset = getDataset(lesson.dataset);

  if (dataset.kind === "words") {
    // 좌표형 데이터셋을 쓰는 레슨이 둘이고 결과물 모양이 다르다. 어느
    // 쪽이든 통과하면 받는다 -- 어차피 둘 다 id만 담는다.
    const likes = likesArtifact.safeParse(raw);
    if (likes.success) {
      if (likes.data.datasetId !== dataset.id) return null;

      const known = new Set(dataset.words.map((word) => word.id));
      if (!likes.data.likedIds.every((id) => known.has(id))) return null;
      if (new Set(likes.data.likedIds).size !== likes.data.likedIds.length) {
        return null;
      }

      return likes.data;
    }

    const teach = teachArtifact.safeParse(raw);
    if (teach.success) {
      if (teach.data.datasetId !== dataset.id) return null;

      const knownWords = new Set(dataset.words.map((word) => word.id));
      const knownCategories = new Set(dataset.categories.map((c) => c.id));
      const ok = teach.data.taught.every(
        (t) => knownWords.has(t.wordId) && knownCategories.has(t.categoryId),
      );
      if (!ok) return null;

      const ids = teach.data.taught.map((t) => t.wordId);
      if (new Set(ids).size !== ids.length) return null;

      return teach.data;
    }

    const parsed = wordsArtifact.safeParse(raw);
    if (!parsed.success) return null;
    if (parsed.data.datasetId !== dataset.id) return null;

    const known = new Set(dataset.words.map((word) => word.id));
    if (!parsed.data.placedIds.every((id) => known.has(id))) return null;

    // 같은 단어를 여러 번 담아 보내 저장 공간을 늘리지 못하게 한다.
    if (new Set(parsed.data.placedIds).size !== parsed.data.placedIds.length) {
      return null;
    }

    return parsed.data;
  }

  if (dataset.kind === "bits") {
    const bits = bitsArtifact.safeParse(raw);
    if (!bits.success) return null;
    if (bits.data.datasetId !== dataset.id) return null;

    const limit = 2 ** dataset.bitCount - 1;
    if (!bits.data.made.every((n) => n <= limit)) return null;
    if (new Set(bits.data.made).size !== bits.data.made.length) return null;

    return bits.data;
  }

  if (dataset.kind === "sentiment") {
    const duel = duelArtifact.safeParse(raw);
    if (!duel.success) return null;
    if (duel.data.datasetId !== dataset.id) return null;

    const known = new Set(dataset.sentences.map((one) => one.id));
    if (!duel.data.judged.every((id) => known.has(id))) return null;
    if (new Set(duel.data.judged).size !== duel.data.judged.length) return null;

    return duel.data;
  }

  if (dataset.kind === "nextword") {
    const made = sentenceArtifact.safeParse(raw);
    if (!made.success) return null;
    if (made.data.datasetId !== dataset.id) return null;

    // 아이가 실제로 고를 수 있었던 말인지 확인한다. 임의의 글자를 넣어
    // 내 방에 자기 문장을 쓰는 통로가 되면 안 된다.
    const known = new Set([
      ...dataset.starts,
      ...Object.values(dataset.next).flatMap((o) => o.map((one) => one.word)),
    ]);
    const ok = made.data.sentences.every((words) =>
      words.every((word) => known.has(word)),
    );
    if (!ok) return null;

    return made.data;
  }

  if (dataset.kind === "similarity") {
    const parsedSim = similarityArtifact.safeParse(raw);
    if (!parsedSim.success) return null;
    if (parsedSim.data.datasetId !== dataset.id) return null;

    const known = new Set(dataset.words.map((w) => w.id));
    const ok = parsedSim.data.compared.every((pair) => {
      const [a, b] = pair.split("|");
      return known.has(a) && known.has(b) && a !== b;
    });
    if (!ok) return null;
    if (new Set(parsedSim.data.compared).size !== parsedSim.data.compared.length) {
      return null;
    }

    return parsedSim.data;
  }

  if (dataset.kind === "analogy") {
    const analogy = analogyArtifact.safeParse(raw);
    if (!analogy.success) return null;
    if (analogy.data.datasetId !== dataset.id) return null;

    const known = new Set(Object.keys(dataset.answers));
    if (!analogy.data.tried.every((key) => known.has(key))) return null;
    if (new Set(analogy.data.tried).size !== analogy.data.tried.length) {
      return null;
    }

    return analogy.data;
  }

  if (dataset.kind === "clusters") {
    const clusters = clustersArtifact.safeParse(raw);
    if (!clusters.success) return null;
    if (clusters.data.datasetId !== dataset.id) return null;

    const known = new Set(Object.keys(dataset.groupings).map(Number));
    if (!clusters.data.triedGroupings.every((k) => known.has(k))) return null;
    if (
      new Set(clusters.data.triedGroupings).size !==
      clusters.data.triedGroupings.length
    ) {
      return null;
    }

    return clusters.data;
  }

  if (dataset.kind === "tokens") {
    const tokens = tokensArtifact.safeParse(raw);
    if (!tokens.success) return null;
    if (tokens.data.datasetId !== dataset.id) return null;

    const known = new Set(dataset.items.map((item) => item.id));
    if (!tokens.data.itemIds.every((id) => known.has(id))) return null;
    if (new Set(tokens.data.itemIds).size !== tokens.data.itemIds.length) {
      return null;
    }

    return tokens.data;
  }

  if (dataset.kind === "sounds") {
    const sounds = soundsArtifact.safeParse(raw);
    if (!sounds.success) return null;
    if (sounds.data.datasetId !== dataset.id) return null;

    const known = new Set(dataset.sounds.map((sound) => sound.id));
    if (!sounds.data.soundIds.every((id) => known.has(id))) return null;
    if (new Set(sounds.data.soundIds).size !== sounds.data.soundIds.length) {
      return null;
    }

    return sounds.data;
  }

  if (dataset.kind === "pixels") {
    const pixels = pixelsArtifact.safeParse(raw);
    if (!pixels.success) return null;
    if (pixels.data.datasetId !== dataset.id) return null;

    const known = new Set(dataset.images.map((image) => image.id));
    if (!pixels.data.imageIds.every((id) => known.has(id))) return null;
    if (new Set(pixels.data.imageIds).size !== pixels.data.imageIds.length) {
      return null;
    }

    return pixels.data;
  }

  const parsed = passagesArtifact.safeParse(raw);
  if (!parsed.success) return null;
  if (parsed.data.datasetId !== dataset.id) return null;

  const known = new Set(dataset.questions.map((question) => question.id));
  if (!parsed.data.questionIds.every((id) => known.has(id))) return null;

  if (new Set(parsed.data.questionIds).size !== parsed.data.questionIds.length) {
    return null;
  }

  return parsed.data;
}
