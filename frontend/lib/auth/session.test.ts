import { describe, it, expect } from "vitest";
import {
  SESSION_MAX_AGE_SECONDS,
  signSession,
  verifySession,
} from "./session";

const SECRET = "a".repeat(64);
const KID = "9a67d778-4261-45ec-b8c4-6664f0b25c1f";
const NOW = 1_700_000_000_000;

describe("signSession / verifySession", () => {
  it("방금 서명한 세션에서 kid_id를 되찾는다", () => {
    expect(verifySession(signSession(KID, SECRET, NOW), SECRET, NOW)).toBe(KID);
  });

  it("쿠키가 없으면 null이다", () => {
    expect(verifySession(undefined, SECRET, NOW)).toBeNull();
    expect(verifySession("", SECRET, NOW)).toBeNull();
  });

  it("kid_id를 바꿔치기하면 거부한다", () => {
    const token = signSession(KID, SECRET, NOW);
    const forged = token.replace(KID, "00000000-0000-0000-0000-000000000000");

    expect(verifySession(forged, SECRET, NOW)).toBeNull();
  });

  it("만료 시각을 늘려도 거부한다", () => {
    const [kid, expiresAt, sig] = signSession(KID, SECRET, NOW).split(".");
    const stretched = `${kid}.${Number(expiresAt) + 1}.${sig}`;

    expect(verifySession(stretched, SECRET, NOW)).toBeNull();
  });

  it("다른 열쇠로 서명한 세션을 거부한다", () => {
    const token = signSession(KID, "b".repeat(64), NOW);

    expect(verifySession(token, SECRET, NOW)).toBeNull();
  });

  it("만료되면 거부한다", () => {
    const token = signSession(KID, SECRET, NOW);
    const afterExpiry = NOW + SESSION_MAX_AGE_SECONDS * 1000 + 1;

    expect(verifySession(token, SECRET, afterExpiry)).toBeNull();
  });

  it("만료 직전에는 통과한다", () => {
    const token = signSession(KID, SECRET, NOW);
    const justBefore = NOW + SESSION_MAX_AGE_SECONDS * 1000 - 1;

    expect(verifySession(token, SECRET, justBefore)).toBe(KID);
  });

  it("형식이 깨진 쿠키에 예외를 던지지 않는다", () => {
    // 쿠키가 깨졌다고 화면이 죽으면 아이는 아무것도 할 수 없다
    for (const broken of ["x", "a.b", "a.b.c.d", "...", "a.b.c"]) {
      expect(() => verifySession(broken, SECRET, NOW)).not.toThrow();
      expect(verifySession(broken, SECRET, NOW)).toBeNull();
    }
  });

  it("서명 길이가 달라도 예외를 던지지 않는다", () => {
    const token = signSession(KID, SECRET, NOW);
    const truncated = token.slice(0, -5);

    expect(() => verifySession(truncated, SECRET, NOW)).not.toThrow();
    expect(verifySession(truncated, SECRET, NOW)).toBeNull();
  });
});
