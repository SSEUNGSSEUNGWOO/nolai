import { describe, it, expect } from "vitest";
import { recommend, type Item } from "./geometry";

const items: Item[] = [
  { id: "pizza", x: 0.1, y: 0.1 },
  { id: "ramen", x: 0.15, y: 0.12 },
  { id: "gimbap", x: 0.2, y: 0.15 },
  { id: "soccer", x: 0.9, y: 0.9 },
  { id: "basket", x: 0.85, y: 0.88 },
];

describe("recommend", () => {
  it("좋아한 것과 가까운 순으로 고른다", () => {
    expect(recommend(items, ["pizza"], 2).map((r) => r.id)).toEqual([
      "ramen",
      "gimbap",
    ]);
  });

  it("좋아한 것은 추천하지 않는다", () => {
    const ids = recommend(items, ["pizza", "ramen"], 5).map((r) => r.id);
    expect(ids).not.toContain("pizza");
    expect(ids).not.toContain("ramen");
  });

  it("어느 좋아요 때문에 추천됐는지 알려준다", () => {
    // 아이에게 "왜 이걸 줬는지"를 보여주는 재료다
    const [first] = recommend(items, ["soccer"], 1);
    expect(first).toEqual({ id: "basket", viaId: "soccer" });
  });

  it("취향이 갈리면 양쪽에서 골라준다", () => {
    // 평균점을 쓰면 둘 사이 빈 자리에서 가까운 것을 고르게 된다
    const ids = recommend(items, ["pizza", "soccer"], 3).map((r) => r.id);
    expect(ids).toContain("ramen");
    expect(ids).toContain("basket");
  });

  it("좋아한 것이 없으면 아무것도 추천하지 않는다", () => {
    expect(recommend(items, [], 3)).toEqual([]);
  });

  it("남은 것보다 많이 요청해도 있는 만큼만 준다", () => {
    expect(recommend(items, ["pizza"], 99)).toHaveLength(4);
  });
});
