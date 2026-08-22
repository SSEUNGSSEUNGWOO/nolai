import { describe, it, expect } from "vitest";
import { samplesOf, samplesPerWave, toPolyline } from "./geometry";

describe("samplesOf", () => {
  it("요청한 개수만큼 만든다", () => {
    expect(samplesOf(440, 1, 8000, 160)).toHaveLength(160);
  });

  it("첫 값은 0에서 시작한다", () => {
    expect(samplesOf(440, 1, 8000, 10)[0]).toBeCloseTo(0);
  });

  it("-1과 1 사이를 벗어나지 않는다", () => {
    for (const harmonics of [1, 3, 5]) {
      for (const value of samplesOf(261.6, harmonics, 8000, 500)) {
        expect(Math.abs(value)).toBeLessThanOrEqual(1);
      }
    }
  });

  it("한 물결 뒤에 같은 값으로 돌아온다", () => {
    // 사인파는 되풀이된다. 이것이 "물결"이라는 말의 근거다.
    const sampleRate = 8000;
    const frequency = 400; // 한 물결 = 정확히 20 샘플
    const samples = samplesOf(frequency, 1, sampleRate, 41);

    expect(samples[20]).toBeCloseTo(samples[0], 5);
    expect(samples[25]).toBeCloseTo(samples[5], 5);
  });

  it("배음을 겹치면 물결 모양이 달라진다", () => {
    const plain = samplesOf(261.6, 1, 8000, 100);
    const rough = samplesOf(261.6, 5, 8000, 100);

    expect(rough).not.toEqual(plain);
  });

  it("주파수가 높으면 물결이 촘촘하다", () => {
    expect(samplesPerWave(880, 8000)).toBeLessThan(samplesPerWave(261.6, 8000));
  });
});

describe("toPolyline", () => {
  it("가로는 0에서 100까지 편다", () => {
    const points = toPolyline([0, 0, 0]).split(" ");
    expect(points[0]).toMatch(/^0\.00,/);
    expect(points[2]).toMatch(/^100\.00,/);
  });

  it("+1은 위쪽, -1은 아래쪽이다", () => {
    const [top, bottom] = toPolyline([1, -1]).split(" ");
    expect(Number(top.split(",")[1])).toBeLessThan(50);
    expect(Number(bottom.split(",")[1])).toBeGreaterThan(50);
  });

  it("0은 한가운데다", () => {
    expect(toPolyline([0, 0]).split(" ")[0]).toBe("0.00,50.00");
  });

  it("점이 하나면 선을 그리지 않는다", () => {
    expect(toPolyline([0])).toBe("");
  });
});
