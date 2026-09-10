import { describe, it, expect } from "vitest";
import { isWordId, searchWords, wordOf, LAB_ID, DICTIONARY_ID } from "./dictionary";

describe("dictionary", () => {
  it("사전에 있는 id만 통과시킨다", () => {
    const first = searchWords("강아지", 1)[0];
    expect(isWordId(first.id)).toBe(true);
    expect(isWordId(999999)).toBe(false);
    expect(isWordId("1")).toBe(false);
    expect(wordOf(first.id)?.word).toBe("강아지");
  });

  it("앞글자가 맞는 것을 먼저, 포함하는 것을 뒤에 준다", () => {
    const found = searchWords("고양", 8).map((w) => w.word);
    expect(found[0]).toBe("고양이");
    expect(found).toContain("도둑고양이");
    expect(found.indexOf("고양이")).toBeLessThan(found.indexOf("도둑고양이"));
  });

  it("빈 검색어는 아무것도 주지 않고, limit을 넘기지 않는다", () => {
    expect(searchWords("   ")).toEqual([]);
    expect(searchWords("가", 5)).toHaveLength(5);
  });

  it("상수가 서버·화면·내 방에서 같은 값이다", () => {
    expect(LAB_ID).toBe("word-lab");
    expect(DICTIONARY_ID).toBe("dictionary");
  });
});
