/**
 * 그림 파일의 주소. 전부 public/art/에 있고 tools/art/export.js가 만든다.
 * 주소를 한 곳에서 만들어야 파일 이름을 바꿀 때 화면 네 군데를 뒤지지 않는다.
 * 배지 그림이 실제로 있는지는 lib/art.test.ts가 badgeNames 전부에 대해 확인한다.
 */
export type MascotMood = "base" | "curious" | "happy" | "surprised" | "wave" | "point" | "think";

export function mascotArt(mood: MascotMood): string {
  return `/art/mascot-${mood}.webp`;
}

export function badgeArt(badge: string): string {
  return `/art/badge-${badge}.webp`;
}

/**
 * 그림이 있는 단어. tools/art/words.sh의 목록과 같아야 하고, 그 파일이 실제로
 * 있는지는 lib/art.test.ts가 본다. 번역 레슨의 단어(dog_ko, dog_en)는 일부러
 * 없다 -- 같은 그림 둘이면 "같은 그림이 같은 자리"가 되어 답을 미리 준다.
 * 반대말 레슨(크다·덥다)은 형용사라 그림이 애매해 이모지를 둔다.
 */
export const ILLUSTRATED_WORDS = new Set([
  "dog", "cat", "rabbit", "tiger", "elephant", "chick", "fish", "penguin", "whale", "shark", "octopus", "crab", "jellyfish",
  "car", "bus", "train", "bike", "airplane", "truck", "helicopter", "rocket", "balloon", "glider",
  "strawberry", "banana", "grape", "watermelon", "tangerine",
  "pizza", "tteok", "icecream", "gimbap", "chocolate", "ramen", "burger", "dumpling",
  "soccer", "baseball", "swim", "taekwondo", "pingpong", "basket", "badminton", "volleyball",
  "lego", "origami", "drawing", "clay", "knit", "puzzle", "blocks", "beads",
]);

/** 그림이 없는 단어는 null -- 부르는 쪽이 이모지로 돌아간다. */
export function wordArt(wordId: string): string | null {
  return ILLUSTRATED_WORDS.has(wordId) ? `/art/word-${wordId}.webp` : null;
}

/** 첫 화면 카드의 레슨 썸네일. 모든 레슨에 있어야 한다 -- lib/art.test.ts가 본다. */
export function lessonArt(lessonId: string): string {
  return `/art/thumb-${lessonId}.webp`;
}

/** 내 방에 배지가 하나도 없을 때. */
export const EMPTY_SHELF_ART = "/art/empty-shelf.webp";

/** 놀이터 빈 무대의 소품. 조작 전 흰 상자에 "뭘 하는 곳인지"를 그림으로 둔다. */
export type PropName = "box-open" | "scale" | "faces" | "scissors" | "typewriter";
export function propArt(name: PropName): string {
  return `/art/prop-${name}.webp`;
}
