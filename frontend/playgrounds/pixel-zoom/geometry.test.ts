import { describe, it, expect } from "vitest";
import { coarsen, expand, toColors, toRgb } from "./geometry";

const palette = { ".": "#FFFFFF", R: "#FF0000", K: "#000000" };

describe("toRgb", () => {
  it("색을 숫자 셋으로 푼다", () => {
    expect(toRgb("#FF6B6B")).toEqual({ r: 255, g: 107, b: 107 });
  });

  it("흰색과 검은색을 제대로 읽는다", () => {
    expect(toRgb("#FFFFFF")).toEqual({ r: 255, g: 255, b: 255 });
    expect(toRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
  });
});

describe("toColors", () => {
  it("글자 격자를 색 격자로 바꾼다", () => {
    expect(toColors(["R.", ".R"], palette)).toEqual([
      ["#FF0000", "#FFFFFF"],
      ["#FFFFFF", "#FF0000"],
    ]);
  });
});

describe("coarsen", () => {
  it("1이면 그대로 둔다", () => {
    const colors = toColors(["R.", ".R"], palette);
    expect(coarsen(colors, 1)).toEqual(colors);
  });

  it("덩어리의 평균 색을 낸다", () => {
    // 빨강 둘과 흰색 둘의 평균. 빨강 채널은 양쪽 다 255라 그대로 FF이고,
    // 초록·파랑만 절반으로 내려간다.
    const colors = toColors(["R.", ".R"], palette);
    expect(coarsen(colors, 2)).toEqual([["#FF8080"]]);
  });

  it("칸 수가 size로 줄어든다", () => {
    const colors = toColors(["....", "....", "....", "...."], palette);
    const coarse = coarsen(colors, 2);
    expect(coarse).toHaveLength(2);
    expect(coarse[0]).toHaveLength(2);
  });

  it("나누어떨어지지 않으면 남은 칸만 쓴다", () => {
    const colors = toColors(["RRR", "RRR", "RRR"], palette);
    const coarse = coarsen(colors, 2);
    expect(coarse).toHaveLength(2);
    expect(coarse[0]).toHaveLength(2);
    // 전부 같은 색이라 평균도 그 색이다
    expect(coarse[1][1]).toBe("#FF0000");
  });

  it("한 가지 색만 있으면 굵게 해도 그 색이다", () => {
    const colors = toColors(["KKKK", "KKKK", "KKKK", "KKKK"], palette);
    expect(coarsen(colors, 4)).toEqual([["#000000"]]);
  });
});

describe("expand", () => {
  it("굵어진 격자를 원래 크기로 되편다", () => {
    const coarse = [["#FF0000", "#000000"]];
    expect(expand(coarse, 2, 2, 4)).toEqual([
      ["#FF0000", "#FF0000", "#000000", "#000000"],
      ["#FF0000", "#FF0000", "#000000", "#000000"],
    ]);
  });
});
