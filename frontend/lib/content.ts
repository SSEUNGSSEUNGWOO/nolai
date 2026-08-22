import { lessonSchema, type Lesson } from "./lesson-schema";
import { datasetSchema, type Dataset } from "./dataset-schema";
import { getPlayground } from "@/playgrounds/registry";
import { badgeNames } from "@/copy/ui";

import embeddingMapLesson from "@/lessons/embedding-map.json";
import wordsAnimalsVehicles from "@/datasets/words-animals-vehicles.json";

const rawLessons: Record<string, unknown> = {
  "embedding-map": embeddingMapLesson,
};

const rawDatasets: Record<string, unknown> = {
  "words-animals-vehicles": wordsAnimalsVehicles,
};

/** 목표 종류마다 셀 수 있는 것을 담고 있는 데이터셋 종류가 정해져 있다. */
const goalDatasetKind = {
  placed: "words",
  searched: "passages",
} as const;

export function getDataset(id: string): Dataset {
  const raw = rawDatasets[id];
  if (!raw) throw new Error(`알 수 없는 데이터셋: ${id}`);
  return datasetSchema.parse(raw);
}

/**
 * 레슨이 자기 데이터셋으로 실제로 끝까지 진행 가능한지 확인한다.
 *
 * 두 가지 소프트락을 막는다. (1) 목표 종류와 데이터셋 종류가 어긋나면 아이가
 * 무엇을 해도 러너가 기다리는 이벤트가 올라오지 않는다. (2) 목표치가 데이터셋이
 * 가진 개수보다 크면 전부 해도 목표를 못 채운다. 둘 다 화면에는 에러가 뜨지
 * 않고 그냥 다음으로 넘어가지 못한다. 스키마는 두 파일을 따로 보므로 이 검사는
 * 여기서만 할 수 있다.
 */
export function assertPlayable(lesson: Lesson, dataset: Dataset): void {
  lesson.steps.forEach((step) => {
    if (step.type !== "play") return;

    const expectedKind = goalDatasetKind[step.goal.kind];
    if (dataset.kind !== expectedKind) {
      throw new Error(
        `레슨 ${lesson.id}: goal.kind가 "${step.goal.kind}"인데 ` +
          `데이터셋 ${dataset.id}는 "${dataset.kind}" 종류입니다. ` +
          `"${expectedKind}" 종류가 필요합니다.`,
      );
    }

    const available =
      dataset.kind === "words"
        ? dataset.words.length
        : dataset.questions.length;

    if (step.goal.min > available) {
      throw new Error(
        `레슨 ${lesson.id}: goal.min(${step.goal.min})이 ` +
          `데이터셋 항목 수(${available})보다 많습니다. ` +
          `아이가 전부 해도 다음으로 넘어갈 수 없습니다.`,
      );
    }
  });
}

/**
 * 레슨이 참조하는 놀이터가 레지스트리에 실제로 있는지 확인한다.
 *
 * 이게 없으면 레슨 JSON의 오타("EmbedingMap")를 아이가 그 레슨을 열 때까지
 * 아무도 모른다. 화면이 비어 있을 뿐 에러도 안 난다.
 */
export function assertPlaygroundExists(lesson: Lesson): void {
  getPlayground(lesson.playground);
}

/**
 * 레슨이 주는 배지에 한글 이름이 있는지 확인한다.
 *
 * 없으면 아이의 보상 화면에 "map-explorer" 같은 영문 id가 그대로 뜬다.
 * 다른 콘텐츠 검사와 같은 급의 문제라 로드 시점에 막는다.
 */
export function assertBadgeNamesExist(lesson: Lesson): void {
  lesson.steps.forEach((step) => {
    if (step.type !== "reward") return;

    if (!badgeNames[step.badge]) {
      throw new Error(
        `레슨 ${lesson.id}: 배지 "${step.badge}"에 한글 이름이 없습니다. ` +
          `copy/ui.ts의 badgeNames에 추가하세요.`,
      );
    }
  });
}

export function getLesson(id: string): Lesson {
  const raw = rawLessons[id];
  if (!raw) throw new Error(`알 수 없는 레슨: ${id}`);

  const lesson = lessonSchema.parse(raw);
  assertPlayable(lesson, getDataset(lesson.dataset));
  assertPlaygroundExists(lesson);
  assertBadgeNamesExist(lesson);

  return lesson;
}

export function listLessons(): Lesson[] {
  return Object.keys(rawLessons)
    .map(getLesson)
    .sort((a, b) => a.order - b.order);
}
