import "server-only";

import { cookies } from "next/headers";
import { SESSION_COOKIE, requireSessionSecret, verifySession } from "./session";

/**
 * 지금 요청을 보낸 아이의 id. 로그인하지 않았으면 null.
 *
 * 서명이 유효한지만 본다. 계정이 지워졌으면 id는 살아 있어도 조회가 비어 나온다.
 */
export async function currentKidId(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;

  return verifySession(token, requireSessionSecret());
}
