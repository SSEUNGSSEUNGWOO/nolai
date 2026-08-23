import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { badgeNames } from "@/copy/ui";
import { badgeArt, mascotArt, wordArt, lessonArt, EMPTY_SHELF_ART, ILLUSTRATED_WORDS } from "./art";
import { getDataset, listLessons } from "./content";

const pub = (url: string) => path.join(__dirname, "../public", url);

describe("그림 파일", () => {
  it("모든 배지에 그림이 있다", () => {
    // 없으면 보상 화면에 깨진 이미지가 뜬다. 배지를 더하면 tools/art/batch.sh에도 더해야 한다.
    for (const badge of Object.keys(badgeNames)) {
      expect(existsSync(pub(badgeArt(badge))), badge).toBe(true);
    }
  });

  it("마스코트 표정·포즈 일곱 개가 있다", () => {
    for (const mood of ["base", "curious", "happy", "surprised", "wave", "point", "think"] as const) {
      expect(existsSync(pub(mascotArt(mood))), mood).toBe(true);
    }
  });

  it("그림이 있다고 한 단어는 전부 파일이 있다", () => {
    for (const id of ILLUSTRATED_WORDS) {
      expect(existsSync(pub(wordArt(id)!)), id).toBe(true);
    }
  });

  it("그림 레슨의 단어는 빠짐없이 그림이 있다", () => {
    // 한 칩만 이모지면 그 칩이 튀어 보인다. 단어를 더하면 words.sh와 목록에도 더한다.
    for (const datasetId of ["words-animals-vehicles", "words-teach", "words-cluster", "likes-kid"]) {
      const d = getDataset(datasetId);
      // 좌표형(words)과 무리형(clusters) 둘 다 같은 모양의 단어 목록을 가진다
      if (d.kind !== "words" && d.kind !== "clusters") throw new Error(datasetId);
      for (const w of d.words) expect(wordArt(w.id), `${datasetId}/${w.id}`).not.toBeNull();
    }
  });

  it("번역 레슨의 단어는 그림이 없다", () => {
    // 강아지와 dog가 같은 그림이면 "같은 그림이 같은 자리"가 되어 답을 미리 준다.
    const d = getDataset("words-translate");
    if (d.kind !== "words") throw new Error("words");
    for (const w of d.words) expect(wordArt(w.id), w.id).toBeNull();
  });

  it("모든 레슨에 썸네일이 있다", () => {
    // 없으면 첫 화면 카드 하나만 비어 보인다. 레슨을 더하면 extras.sh에도 더한다.
    for (const lesson of listLessons()) {
      expect(existsSync(pub(lessonArt(lesson.id))), lesson.id).toBe(true);
    }
    expect(existsSync(pub(EMPTY_SHELF_ART))).toBe(true);
  });
});
