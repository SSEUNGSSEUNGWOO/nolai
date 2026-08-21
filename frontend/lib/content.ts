import { lessonSchema, type Lesson } from "./lesson-schema";
import { datasetSchema, type Dataset } from "./dataset-schema";

import embeddingMapLesson from "@/lessons/embedding-map.json";
import wordsAnimalsVehicles from "@/datasets/words-animals-vehicles.json";

const rawLessons: Record<string, unknown> = {
  "embedding-map": embeddingMapLesson,
};

const rawDatasets: Record<string, unknown> = {
  "words-animals-vehicles": wordsAnimalsVehicles,
};

export function getDataset(id: string): Dataset {
  const raw = rawDatasets[id];
  if (!raw) throw new Error(`알 수 없는 데이터셋: ${id}`);
  return datasetSchema.parse(raw);
}

/**
 * 레슨이 자기 데이터셋으로 실제로 끝까지 진행 가능한지 확인한다.
 *
 * play 스텝의 minPlaced가 데이터셋 단어 수보다 크면, 아이가 단어를 전부
 * 놓아도 목표를 못 채워 다음 단계로 못 넘어간다 — 소프트락이다.
 * 스키마는 두 파일을 따로 보므로 이 검사는 여기서만 할 수 있다.
 */
export function assertPlayable(lesson: Lesson, dataset: Dataset): void {
  lesson.steps.forEach((step) => {
    if (step.type !== "play") return;

    if (step.goal.minPlaced > dataset.words.length) {
      throw new Error(
        `레슨 ${lesson.id}: minPlaced(${step.goal.minPlaced})가 ` +
          `데이터셋 단어 수(${dataset.words.length})보다 많습니다. ` +
          `아이가 전부 놓아도 다음으로 넘어갈 수 없습니다.`,
      );
    }
  });
}

export function getLesson(id: string): Lesson {
  const raw = rawLessons[id];
  if (!raw) throw new Error(`알 수 없는 레슨: ${id}`);

  const lesson = lessonSchema.parse(raw);
  assertPlayable(lesson, getDataset(lesson.dataset));

  return lesson;
}

export function listLessons(): Lesson[] {
  return Object.keys(rawLessons)
    .map(getLesson)
    .sort((a, b) => a.order - b.order);
}
