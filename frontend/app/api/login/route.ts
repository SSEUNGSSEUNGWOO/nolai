import { cookies } from "next/headers";
import { z } from "zod";
import { authenticate, consumeAttempt } from "@/lib/auth/account";
import { isWellFormedCode, normalizeCode } from "@/lib/auth/code";
import { clientIp, issuedSessionCookie } from "@/lib/auth/request";
import { requireSessionSecret, signSession } from "@/lib/auth/session";

/** 설계 문서 11장의 "IP당 분당 5회". */
const ATTEMPTS_PER_MINUTE = 5;

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

  // IP와 닉네임을 둘 다 센다. IP만 세면 IP를 바꿔가며 한 닉네임을 때리는
  // 공격을 못 막고, 닉네임만 세면 여러 닉네임을 훑는 공격을 못 막는다.
  for (const bucket of [`login-ip:${clientIp(request)}`, `login-nick:${nickname}`]) {
    if (!(await consumeAttempt(bucket, ATTEMPTS_PER_MINUTE, 60))) {
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
