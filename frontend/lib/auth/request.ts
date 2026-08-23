import "server-only";

import { createHmac } from "node:crypto";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, requireSessionSecret } from "./session";

/**
 * 요청을 보낸 쪽을 시도 제한의 열쇠로 삼는다. IP 자체가 아니라 그 해시다.
 *
 * x-forwarded-for는 원래 클라이언트가 지어낼 수 있는 헤더지만, Vercel은 자기
 * 엣지에서 이 값을 덮어쓰므로 배포 환경에서는 믿을 수 있다. 로컬 개발에서는
 * 헤더가 없어 모두 한 버킷을 쓰는데, 그래도 동작은 같다.
 *
 * 해시하는 이유: 버킷은 auth_attempts 테이블에 남고 행은 지워지지 않는다.
 * 원문을 넣으면 IP를 영구 보관하는 셈이 된다. 같은 IP는 같은 해시가 되므로
 * 세는 데는 지장이 없고, 비밀키 없이는 되돌릴 수 없다.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  const ip = first && first.length > 0 ? first : "unknown";

  return createHmac("sha256", requireSessionSecret()).update(ip).digest("hex").slice(0, 32);
}

export function sessionCookie(value: string, maxAge: number) {
  return {
    name: SESSION_COOKIE,
    value,
    httpOnly: true,
    // 로컬 개발은 http라 secure를 켜면 쿠키가 아예 저장되지 않는다.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function issuedSessionCookie(token: string) {
  return sessionCookie(token, SESSION_MAX_AGE_SECONDS);
}

/** maxAge 0이면 브라우저가 즉시 지운다. */
export function clearedSessionCookie() {
  return sessionCookie("", 0);
}
