import { describe, it, expect, beforeEach } from "vitest";
import { clientIp } from "./request";

beforeEach(() => {
  process.env.SESSION_SECRET = "test-secret-test-secret-test-secret-12345";
});

function req(forwarded?: string) {
  return new Request("http://x", { headers: forwarded ? { "x-forwarded-for": forwarded } : {} });
}

describe("clientIp", () => {
  it("IP 원문을 돌려주지 않는다", () => {
    // 이 값은 auth_attempts에 영구히 남는다. 원문이면 IP 보관이 된다.
    const key = clientIp(req("203.0.113.7"));
    expect(key).not.toContain("203.0.113.7");
    expect(key).toMatch(/^[0-9a-f]{32}$/);
  });

  it("같은 IP는 같은 열쇠, 다른 IP는 다른 열쇠다", () => {
    expect(clientIp(req("203.0.113.7"))).toBe(clientIp(req("203.0.113.7, 10.0.0.1")));
    expect(clientIp(req("203.0.113.7"))).not.toBe(clientIp(req("203.0.113.8")));
  });

  it("헤더가 없어도 한 버킷으로 센다", () => {
    expect(clientIp(req())).toBe(clientIp(req()));
  });
});
