import "server-only";

import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "./session";

/**
 * 요청을 보낸 쪽을 시도 제한의 열쇠로 삼는다.
 *
 * x-forwarded-for는 원래 클라이언트가 지어낼 수 있는 헤더지만, Vercel은 자기
 * 엣지에서 이 값을 덮어쓰므로 배포 환경에서는 믿을 수 있다. 로컬 개발에서는
 * 헤더가 없어 모두 한 버킷을 쓰는데, 그래도 동작은 같다.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();

  return first && first.length > 0 ? first : "unknown";
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
