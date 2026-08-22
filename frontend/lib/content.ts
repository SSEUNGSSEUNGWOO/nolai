import { lessonSchema, type Lesson } from "./lesson-schema";
import { datasetSchema, type Dataset } from "./dataset-schema";
import { getPlayground } from "@/playgrounds/registry";
import { badgeNames } from "@/copy/ui";

import embeddingMapLesson from "@/lessons/embedding-map.json";
import nearestSearchLesson from "@/lessons/nearest-search.json";
import teachSorterLesson from "@/lessons/teach-sorter.json";
import answerGapsLesson from "@/lessons/answer-gaps.json";
import likeRecommenderLesson from "@/lessons/like-recommender.json";
import pixelZoomLesson from "@/lessons/pixel-zoom.json";
import pixelCoarseLesson from "@/lessons/pixel-coarse.json";
import waveZoomLesson from "@/lessons/wave-zoom.json";
import tokenSplitLesson from "@/lessons/token-split.json";
import translateMapLesson from "@/lessons/translate-map.json";
import selfClusterLesson from "@/lessons/self-cluster.json";
import analogyLabLesson from "@/lessons/analogy-lab.json";
import compareMeterLesson from "@/lessons/compare-meter.json";
import wordWeaverLesson from "@/lessons/word-weaver.json";
import feelingDuelLesson from "@/lessons/feeling-duel.json";
import wordsAnimalsVehicles from "@/datasets/words-animals-vehicles.json";
import animalFacts from "@/datasets/animal-facts.json";
import wordsTeach from "@/datasets/words-teach.json";
import animalFactsGaps from "@/datasets/animal-facts-gaps.json";
import likesKid from "@/datasets/likes-kid.json";
import pixelArt from "@/datasets/pixel-art.json";
import soundsSimple from "@/datasets/sounds-simple.json";
import textPieces from "@/datasets/text-pieces.json";
import wordsTranslate from "@/datasets/words-translate.json";
import wordsCluster from "@/datasets/words-cluster.json";
import analogyBasic from "@/datasets/analogy-basic.json";
import wordsCompare from "@/datasets/words-compare.json";
import storyNext from "@/datasets/story-next.json";
import feelingDuel from "@/datasets/feeling-duel.json";

const rawLessons: Record<string, unknown> = {
  "embedding-map": embeddingMapLesson,
  "nearest-search": nearestSearchLesson,
  "teach-sorter": teachSorterLesson,
  "answer-gaps": answerGapsLesson,
  "like-recommender": likeRecommenderLesson,
  "pixel-zoom": pixelZoomLesson,
  "pixel-coarse": pixelCoarseLesson,
  "wave-zoom": waveZoomLesson,
  "token-split": tokenSplitLesson,
  "translate-map": translateMapLesson,
  "self-cluster": selfClusterLesson,
  "analogy-lab": analogyLabLesson,
  "compare-meter": compareMeterLesson,
  "word-weaver": wordWeaverLesson,
  "feeling-duel": feelingDuelLesson,
};

const rawDatasets: Record<string, unknown> = {
  "words-animals-vehicles": wordsAnimalsVehicles,
  "animal-facts": animalFacts,
  "words-teach": wordsTeach,
  "animal-facts-gaps": animalFactsGaps,
  "likes-kid": likesKid,
  "pixel-art": pixelArt,
  "sounds-simple": soundsSimple,
  "text-pieces": textPieces,
  "words-translate": wordsTranslate,
  "words-cluster": wordsCluster,
  "analogy-basic": analogyBasic,
  "words-compare": wordsCompare,
  "story-next": storyNext,
  "feeling-duel": feelingDuel,
};

/** 목표 종류마다 셀 수 있는 것을 담고 있는 데이터셋 종류가 정해져 있다. */
const goalDatasetKind = {
  placed: "words",
  searched: "passages",
  taught: "words",
  liked: "words",
  looked: "pixels",
  heard: "sounds",
  split: "tokens",
  grouped: "clusters",
  calculated: "analogy",
  compared: "similarity",
  wrote: "nextword",
  judged: "sentiment",
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

    // 데이터셋 종류마다 아이가 셀 수 있는 것이 다르다. 새 종류를 더하면
    // 여기도 함께 늘려야 한다 -- 안 그러면 타입 검사가 먼저 막는다.
    const available =
      dataset.kind === "words"
        ? dataset.words.length
        : dataset.kind === "passages"
          ? dataset.questions.length
          : dataset.kind === "pixels"
            ? dataset.images.length
            : dataset.kind === "sounds"
              ? dataset.sounds.length
              : dataset.kind === "tokens"
                ? dataset.items.length
                : dataset.kind === "clusters"
                  ? Object.keys(dataset.groupings).length
                  : dataset.kind === "analogy"
                    ? Object.keys(dataset.answers).length
                    : dataset.kind === "similarity"
                      ? Object.keys(dataset.sims).length
                      : dataset.kind === "nextword"
                        ? dataset.starts.length
                        : dataset.sentences.length;

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
