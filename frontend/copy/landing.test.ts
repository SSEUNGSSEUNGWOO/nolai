import { describe, expect, it } from "vitest";
import { listLessons, lessonGroups } from "@/lib/content";
import { curriculum, lessonBlurbs } from "./landing";

describe("부모·교사 랜딩 문구", () => {
  it("모든 레슨에 설명이 있고, 없는 레슨을 설명하지 않는다", () => {
    const ids = listLessons().map((lesson) => lesson.id).sort();
    expect(Object.keys(lessonBlurbs).sort()).toEqual(ids);
  });

  it("교육과정 표의 레슨은 전부 실제 레슨이다", () => {
    const ids = new Set(lessonGroups.flatMap((group) => group.lessonIds));
    for (const row of curriculum) {
      for (const id of row.lessonIds) expect(ids.has(id), id).toBe(true);
    }
  });

  it("설명이 레슨을 번호로 부르지 않는다", () => {
    // 순서는 바뀐다. 번호로 부르면 그 문장이 거짓이 된다. lib/content.test.ts와 같은 규칙.
    for (const [id, blurb] of Object.entries(lessonBlurbs)) {
      expect(blurb, id).not.toMatch(/레슨\s*\d/);
    }
  });
});
