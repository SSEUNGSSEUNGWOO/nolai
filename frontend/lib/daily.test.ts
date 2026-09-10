import { describe, it, expect } from "vitest";
import { bestTriesOf, streakOf, temperatureOf, todayKst } from "./daily";

describe("todayKst", () => {
  it("UTC 자정 전이라도 한국 시간으로 날짜를 센다", () => {
    // 2026-09-10 16:00Z = 2026-09-11 01:00 KST
    expect(todayKst(Date.UTC(2026, 8, 10, 16, 0))).toBe("2026-09-11");
    expect(todayKst(Date.UTC(2026, 8, 10, 14, 59))).toBe("2026-09-10");
  });
});

describe("temperatureOf", () => {
  it("정답·10·100·1000위 경계로 나눈다", () => {
    expect(temperatureOf(0)).toBe("correct");
    expect(temperatureOf(1)).toBe("hot");
    expect(temperatureOf(10)).toBe("hot");
    expect(temperatureOf(11)).toBe("warm");
    expect(temperatureOf(100)).toBe("warm");
    expect(temperatureOf(101)).toBe("lukewarm");
    expect(temperatureOf(1000)).toBe("lukewarm");
    expect(temperatureOf(null)).toBe("cold");
  });
});

describe("streakOf / bestTriesOf", () => {
  const history = [
    { date: "2026-09-10", tries: 7, solved: true },
    { date: "2026-09-09", tries: 30, solved: false },
    { date: "2026-09-08", tries: 4, solved: true },
    { date: "2026-09-05", tries: 2, solved: true },
  ];

  it("오늘 또는 어제부터 이어진 날 수를 센다", () => {
    expect(streakOf(history, "2026-09-10")).toBe(3);
    expect(streakOf(history, "2026-09-11")).toBe(3); // 오늘 아직 안 했어도 어제까지 이어졌으면 유지
    expect(streakOf(history, "2026-09-13")).toBe(0);
    expect(streakOf([], "2026-09-10")).toBe(0);
  });

  it("맞힌 날 중 가장 적은 시도", () => {
    expect(bestTriesOf(history)).toBe(2);
    expect(bestTriesOf([{ date: "2026-09-10", tries: 5, solved: false }])).toBeNull();
  });
});
