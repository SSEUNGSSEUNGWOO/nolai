import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { badgeNames } from "@/copy/ui";
import { badgeArt, mascotArt } from "./art";

const pub = (url: string) => path.join(__dirname, "../public", url);

describe("그림 파일", () => {
  it("모든 배지에 그림이 있다", () => {
    // 없으면 보상 화면에 깨진 이미지가 뜬다. 배지를 더하면 tools/art/batch.sh에도 더해야 한다.
    for (const badge of Object.keys(badgeNames)) {
      expect(existsSync(pub(badgeArt(badge))), badge).toBe(true);
    }
  });

  it("마스코트 표정 네 개가 있다", () => {
    for (const mood of ["base", "curious", "happy", "surprised"] as const) {
      expect(existsSync(pub(mascotArt(mood))), mood).toBe(true);
    }
  });
});
