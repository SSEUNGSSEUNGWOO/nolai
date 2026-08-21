import { describe, it, expect } from "vitest";
import {
  toNormalized,
  distance,
  linkStyle,
  buildLinks,
  LINK_THRESHOLD,
} from "./geometry";

const rect = { left: 100, top: 50, width: 400, height: 200 };

describe("toNormalized", () => {
  it("화면 좌표를 0~1 좌표로 바꾼다", () => {
    expect(toNormalized({ x: 300, y: 150 }, rect)).toEqual({ x: 0.5, y: 0.5 });
  });

  it("영역 밖 좌표를 0~1로 자른다", () => {
    expect(toNormalized({ x: 0, y: 0 }, rect)).toEqual({ x: 0, y: 0 });
    expect(toNormalized({ x: 9999, y: 9999 }, rect)).toEqual({ x: 1, y: 1 });
  });
});

describe("distance", () => {
  it("두 점 사이 유클리드 거리를 잰다", () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
});

describe("linkStyle", () => {
  it("가까울수록 선이 굵어진다", () => {
    const near = linkStyle(0.02);
    const far = linkStyle(LINK_THRESHOLD * 0.9);
    expect(near!.width).toBeGreaterThan(far!.width);
  });

  it("임계값보다 멀면 선을 그리지 않는다", () => {
    expect(linkStyle(LINK_THRESHOLD + 0.01)).toBeNull();
  });
});

describe("buildLinks", () => {
  it("가까운 쌍만 연결하고 쌍을 중복하지 않는다", () => {
    const links = buildLinks([
      { id: "a", x: 0.1, y: 0.1 },
      { id: "b", x: 0.12, y: 0.1 },
      { id: "c", x: 0.9, y: 0.9 },
    ]);

    expect(links).toHaveLength(1);
    expect(links[0].fromId).toBe("a");
    expect(links[0].toId).toBe("b");
  });

  it("점이 하나뿐이면 연결이 없다", () => {
    expect(buildLinks([{ id: "a", x: 0.5, y: 0.5 }])).toEqual([]);
  });
});
