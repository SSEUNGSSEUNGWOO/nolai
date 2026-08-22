import { describe, it, expect } from "vitest";
import {
  MAX_RADIUS,
  MIN_RADIUS,
  nearnessOf,
  pointAt,
  radiusOf,
  topIndexes,
} from "./geometry";

const range = { min: 0.25, max: 0.75 };

describe("radiusOf", () => {
  it("가장 가까운 유사도는 중심에 가장 붙는다", () => {
    expect(radiusOf(0.75, range)).toBeCloseTo(MIN_RADIUS);
  });

  it("가장 먼 유사도는 가장 바깥에 놓인다", () => {
    expect(radiusOf(0.25, range)).toBeCloseTo(MAX_RADIUS);
  });

  it("유사도가 클수록 거리가 짧다", () => {
    expect(radiusOf(0.7, range)).toBeLessThan(radiusOf(0.4, range));
  });

  it("기준 밖의 값도 화면 안에 가둔다", () => {
    expect(radiusOf(2, range)).toBeCloseTo(MIN_RADIUS);
    expect(radiusOf(-2, range)).toBeCloseTo(MAX_RADIUS);
  });

  it("기준의 폭이 0이면 가운데 거리로 둔다", () => {
    const flat = radiusOf(0.5, { min: 0.5, max: 0.5 });
    expect(flat).toBeGreaterThan(MIN_RADIUS);
    expect(flat).toBeLessThan(MAX_RADIUS);
  });
});

describe("pointAt", () => {
  it("각도 0은 중심의 오른쪽이다", () => {
    const point = pointAt(0, 0.4);
    expect(point.x).toBeCloseTo(0.9);
    expect(point.y).toBeCloseTo(0.5);
  });

  it("반 바퀴는 중심의 왼쪽이다", () => {
    const point = pointAt(0.5, 0.4);
    expect(point.x).toBeCloseTo(0.1);
    expect(point.y).toBeCloseTo(0.5);
  });

  it("거리가 0이면 중심이다", () => {
    expect(pointAt(0.3, 0)).toEqual({ x: 0.5, y: 0.5 });
  });

  it("어떤 각도에서도 화면을 벗어나지 않는다", () => {
    for (let turn = 0; turn < 1; turn += 0.05) {
      const point = pointAt(turn, MAX_RADIUS);
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(1);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThanOrEqual(1);
    }
  });
});

describe("topIndexes", () => {
  it("유사도가 높은 순으로 고른다", () => {
    expect(topIndexes([0.5, 0.1, 0.9, 0.3], 3)).toEqual([2, 0, 3]);
  });

  it("k개만 돌려준다", () => {
    expect(topIndexes([0.5, 0.1, 0.9, 0.3], 1)).toEqual([2]);
  });

  it("동점이면 원래 순서를 지킨다", () => {
    expect(topIndexes([0.5, 0.5, 0.5], 3)).toEqual([0, 1, 2]);
  });
});

describe("nearnessOf", () => {
  it("가장 가까우면 1, 가장 멀면 0이다", () => {
    expect(nearnessOf(0.75, range)).toBeCloseTo(1);
    expect(nearnessOf(0.25, range)).toBeCloseTo(0);
  });

  it("반지름과 같은 자를 쓴다", () => {
    // 다른 자를 쓰면 화면에서 가까운 점의 막대가 짧게 나온다
    for (const sim of [0.3, 0.5, 0.7]) {
      const expected = MAX_RADIUS - nearnessOf(sim, range) * (MAX_RADIUS - MIN_RADIUS);
      expect(radiusOf(sim, range)).toBeCloseTo(expected);
    }
  });

  it("기준 밖의 값을 0~1 안에 가둔다", () => {
    expect(nearnessOf(2, range)).toBe(1);
    expect(nearnessOf(-2, range)).toBe(0);
  });
});
