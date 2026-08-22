import { describe, it, expect, beforeEach } from "vitest";
import { isMuted, playReward, setMuted, unlockAudio } from "./sound";

beforeEach(() => window.localStorage.clear());

describe("음소거 상태", () => {
  it("처음에는 소리가 켜져 있다", () => {
    expect(isMuted()).toBe(false);
  });

  it("끄면 유지된다", () => {
    setMuted(true);
    expect(isMuted()).toBe(true);
  });

  it("다시 켤 수 있다", () => {
    setMuted(true);
    setMuted(false);
    expect(isMuted()).toBe(false);
  });

  it("저장값이 망가져 있어도 소리가 켜진 것으로 본다", () => {
    window.localStorage.setItem("nolai:muted", "이상한값");
    expect(isMuted()).toBe(false);
  });
});

describe("소리를 못 내는 환경", () => {
  it("AudioContext가 없어도 예외를 던지지 않는다", () => {
    // jsdom에는 Web Audio가 없다. 소리를 못 내는 것이 놀이를 막으면 안 된다.
    expect(() => unlockAudio()).not.toThrow();
    expect(() => playReward()).not.toThrow();
  });

  it("음소거면 소리를 내려 시도하지 않는다", () => {
    setMuted(true);
    expect(() => playReward()).not.toThrow();
  });
});
