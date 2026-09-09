import { cookies } from "next/headers";
import { z } from "zod";
import { authenticate, consumeAttempt } from "@/lib/auth/account";
import { isValidNickname } from "@/lib/auth/nickname";
import { isWellFormedCode, normalizeCode } from "@/lib/auth/code";
import { clientIp, issuedSessionCookie } from "@/lib/auth/request";
import { requireSessionSecret, signSession } from "@/lib/auth/session";

/** 설계 문서 11장의 분당 5회. 무차별 시도를 실제로 막는 쪽은 닉네임당이다. */
const ATTEMPTS_PER_NICKNAME_PER_MINUTE = 5;

/**
 * IP당은 훨씬 넉넉하다. 교실은 공인 IP 하나를 25명이 나눠 쓰므로 5회면
 * 여섯 번째 아이부터 막힌다(설계 문서 14장, 2026-09-10).
 */
const ATTEMPTS_PER_IP_PER_MINUTE = 30;

const body = z.strictObject({
  nickname: z.string().min(1),
  code: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const { nickname } = parsed.data;
  const code = normalizeCode(parsed.data.code);

  // 닉네임은 시도 제한 버킷 이름에 들어가 DB에 남는다. 목록에 없는 문자열을
  // 먼저 걸러야 손으로 만든 요청의 아무 글자나 저장되지 않는다.
  if (!isValidNickname(nickname)) {
    return Response.json({ error: "invalid_credentials" }, { status: 401 });
  }

  // IP와 닉네임을 둘 다 센다. IP만 세면 IP를 바꿔가며 한 닉네임을 때리는
  // 공격을 못 막고, 닉네임만 세면 여러 닉네임을 훑는 공격을 못 막는다.
  const buckets: [string, number][] = [
    [`login-ip:${clientIp(request)}`, ATTEMPTS_PER_IP_PER_MINUTE],
    [`login-nick:${nickname}`, ATTEMPTS_PER_NICKNAME_PER_MINUTE],
  ];
  for (const [bucket, limit] of buckets) {
    if (!(await consumeAttempt(bucket, limit, 60))) {
      return Response.json({ error: "too_many_attempts" }, { status: 429 });
    }
  }

  // 형식이 틀린 코드는 DB를 보지 않는다. scrypt를 돌릴 이유가 없다.
  if (!isWellFormedCode(code)) {
    return Response.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const kidId = await authenticate(nickname, code);
  if (!kidId) {
    // 닉네임이 없는 것인지 코드가 틀린 것인지 구별해주지 않는다.
    return Response.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const token = signSession(kidId, requireSessionSecret());
  (await cookies()).set(issuedSessionCookie(token));

  return Response.json({ nickname });
}
