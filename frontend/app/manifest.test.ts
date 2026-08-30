import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import manifest from "./manifest";

describe("PWA manifest", () => {
  const m = manifest();

  it("선언한 아이콘 파일이 public/에 실제로 있다", () => {
    // 없으면 설치는 되는데 홈 화면에 깨진 아이콘이 뜬다. 빌드는 모른다.
    for (const icon of m.icons ?? []) {
      expect(existsSync(path.join(__dirname, "../public", icon.src)), icon.src).toBe(true);
    }
  });

  it("설치에 필요한 것이 다 있다", () => {
    expect(m.display).toBe("standalone");
    expect(m.start_url).toBe("/play");
    expect(m.icons?.some((i) => i.sizes === "512x512")).toBe(true);
    expect(m.icons?.some((i) => i.purpose === "maskable")).toBe(true);
  });
});
