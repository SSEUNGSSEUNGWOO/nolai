import "server-only";

import { serverSupabase } from "@/lib/supabase";
import { generateCode, hashCode, verifyCode } from "./code";
import { isValidNickname } from "./nickname";

/**
 * 한 닉네임을 쓸 수 있는 아이의 수.
 *
 * 로그인은 닉네임으로 후보를 좁힌 뒤 후보마다 scrypt를 돌린다. scrypt는 한 번에
 * 40~120ms라 후보가 많아지면 로그인이 느려지고, 동시에 남의 닉네임으로 요청을
 * 보내 서버 CPU를 태우는 통로가 된다. 그래서 후보 수 자체를 가입 시점에 막는다.
 *
 * 지금 조합이 1600개이므로 수용량은 8000명이다. 모자라면 nickname.ts의 풀을
 * 늘리면 된다 -- 40x40을 60x60으로 바꾸면 18000명이 되고, 스키마는 그대로다.
 */
const MAX_KIDS_PER_NICKNAME = 5;

/**
 * 로그인 때 실제로 검사하는 후보 수.
 *
 * 위 상한보다 넉넉하게 잡는다. 두 아이가 같은 순간에 가입하면 상한 검사가
 * 동시에 통과해 6명이 될 수 있는데, 그때 마지막에 가입한 아이가 로그인하지
 * 못하면 안 된다.
 */
const LOGIN_CANDIDATE_LIMIT = 8;

export type SignupResult =
  | { ok: true; kidId: string; nickname: string; code: string }
  | { ok: false; reason: "invalid_nickname" | "nickname_full" };

/**
 * 아이를 새로 만든다. 비밀코드는 여기서 만들어 한 번만 돌려주고, 저장은
 * 해시만 한다 -- 이후로는 서버도 원문을 모른다.
 */
export async function createKid(nickname: string): Promise<SignupResult> {
  // 화면이 고르기만 허용해도 요청은 손으로 만들 수 있다. 여기가 진짜 관문이다.
  if (!isValidNickname(nickname)) return { ok: false, reason: "invalid_nickname" };

  const db = serverSupabase();

  const { count, error: countError } = await db
    .from("kids")
    .select("id", { count: "exact", head: true })
    .eq("nickname", nickname);

  if (countError) throw countError;
  if ((count ?? 0) >= MAX_KIDS_PER_NICKNAME) {
    return { ok: false, reason: "nickname_full" };
  }

  const code = generateCode();
  const { data, error } = await db
    .from("kids")
    .insert({ nickname, code_hash: await hashCode(code) })
    .select("id")
    .single();

  if (error) throw error;

  return { ok: true, kidId: data.id as string, nickname, code };
}

/**
 * 닉네임과 코드가 둘 다 맞는 아이를 찾는다. 없으면 null.
 *
 * 코드만으로 로그인하지 않는 이유는 설계 문서 4장에 있다 -- 아무 코드나 찍으면
 * 남의 방에 들어가게 된다.
 *
 * 후보가 여럿일 때는 먼저 만든 계정을 택한다(created_at 오름차순). 서로 다른
 * 아이가 같은 닉네임에 같은 코드까지 받을 확률은 극히 낮지만, 그때 어느 쪽으로
 * 갈지는 정해져 있어야 한다.
 */
export async function authenticate(
  nickname: string,
  code: string,
): Promise<string | null> {
  if (!isValidNickname(nickname)) return null;

  const db = serverSupabase();
  const { data, error } = await db
    .from("kids")
    .select("id, code_hash")
    .eq("nickname", nickname)
    .order("created_at", { ascending: true })
    .limit(LOGIN_CANDIDATE_LIMIT);

  if (error) throw error;

  for (const candidate of data ?? []) {
    if (await verifyCode(code, candidate.code_hash as string)) {
      return candidate.id as string;
    }
  }

  return null;
}

/**
 * 시도 횟수를 하나 소비하고 아직 허용 범위인지 알려준다.
 *
 * 세는 일을 DB에 맡기는 이유: Vercel의 서버리스 인스턴스는 요청마다 다를 수
 * 있어 메모리 카운터가 인스턴스별로 따로 논다. 제한이 있는 척만 하게 된다.
 */
export async function consumeAttempt(
  bucket: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const db = serverSupabase();
  const { data, error } = await db.rpc("consume_attempt", {
    p_bucket: bucket,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) throw error;

  return data === true;
}
