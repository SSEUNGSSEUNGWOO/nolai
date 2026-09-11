import { cookies } from "next/headers";
import { z } from "zod";
import { createKid, consumeAttempt } from "@/lib/auth/account";
import { clientIp, issuedSessionCookie } from "@/lib/auth/request";
import { requireSessionSecret, signSession } from "@/lib/auth/session";

/**
 * 한 곳에서 계정을 대량으로 찍어내지 못하게 한다. 교실은 공인 IP 하나로
 * 25명이 한 시간 안에 방을 만들므로 그보다 넉넉하다(설계 문서 14장, 2026-09-10).
 */
const SIGNUPS_PER_HOUR = 40;

const body = z.strictObject({ nickname: z.string().min(1) });

export async function POST(request: Request) {
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const allowed = await consumeAttempt(
    `signup-ip:${clientIp(request)}`,
    SIGNUPS_PER_HOUR,
    60 * 60,
  );
  if (!allowed) {
    return Response.json({ error: "too_many_attempts" }, { status: 429 });
  }

  const result = await createKid(parsed.data.nickname);
  if (!result.ok) {
    return Response.json({ error: result.reason }, { status: 400 });
  }

  const token = signSession(result.kidId, requireSessionSecret());
  (await cookies()).set(issuedSessionCookie(token));

  // 비밀코드는 여기서 딱 한 번 나간다. 서버도 이후로는 원문을 모른다.
  return Response.json({ kidId: result.kidId, nickname: result.nickname, code: result.code });
}
