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

const passagesArtifact = z.strictObject({
  datasetId: z.string().min(1),
  questionIds: z.array(z.string().min(1)).max(200),
});

export type WordsArtifact = z.infer<typeof wordsArtifact>;
export type PassagesArtifact = z.infer<typeof passagesArtifact>;
export type ArtifactPayload = WordsArtifact | PassagesArtifact;

/**
 * 레슨이 쓰는 데이터셋 종류에 맞는 결과물인지 확인한다.
 *
 * 통과하면 저장 가능한 payload를, 아니면 null을 돌려준다. 예외를 던지지
 * 않는다 -- 결과물을 못 담는 것이 레슨 완료 자체를 막아서는 안 된다.
 */
export function parseArtifact(lesson: Lesson, raw: unknown): ArtifactPayload | null {
  const dataset: Dataset = getDataset(lesson.dataset);

  if (dataset.kind === "words") {
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
