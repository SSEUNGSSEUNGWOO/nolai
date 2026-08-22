import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "nolai_session";

/**
 * 1년. 설계 문서 4장이 코드 분실의 완화책으로 삼은 값이다 — 같은 기기를 쓰는
 * 한 아이가 비밀코드를 다시 칠 일이 없어야 한다.
 */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/**
 * 쿠키에 kid_id를 그냥 담으면 아이가 값을 바꿔 남의 방에 들어간다. httpOnly는
 * 자바스크립트의 접근만 막을 뿐, 브라우저 개발자 도구나 curl로 쿠키를 직접
 * 만드는 것은 못 막는다. 그래서 서버만 아는 열쇠로 서명한다.
 *
 * 서버에 세션 표를 두지 않는다(무상태). 그 대가로 개별 세션을 강제 종료할 수
 * 없는데, 이 서비스에는 그럴 일이 없다 — 로그아웃은 쿠키를 지우면 끝이고,
 * 계정을 통째로 지우면 kid_id가 사라져 서명이 유효해도 조회가 실패한다.
 */
function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function signSession(
  kidId: string,
  secret: string,
  now: number = Date.now(),
): string {
  const expiresAt = now + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${kidId}.${expiresAt}`;

  return `${payload}.${sign(payload, secret)}`;
}

/**
 * 유효하면 kid_id를, 아니면 null을 돌려준다. 예외를 던지지 않는다 — 쿠키가
 * 깨졌다고 화면이 죽으면 아이는 아무것도 할 수 없게 된다. 로그아웃된 것처럼
 * 보이는 편이 낫다.
 */
export function verifySession(
  token: string | undefined,
  secret: string,
  now: number = Date.now(),
): string | null {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [kidId, expiresAtRaw, signature] = parts;
  const expected = sign(`${kidId}.${expiresAtRaw}`, secret);

  // 길이가 다르면 timingSafeEqual이 예외를 던진다. 먼저 걸러낸다.
  if (signature.length !== expected.length) return null;
  if (
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return null;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return null;

  return kidId;
}

/** 서명 열쇠가 없으면 세션이 통째로 위조 가능해진다. 조용히 넘어가지 않는다. */
export function requireSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET이 없거나 너무 짧습니다(32자 이상). .env.local을 확인하세요.",
    );
  }

  return secret;
}
