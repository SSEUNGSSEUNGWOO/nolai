import "server-only";

import { serverSupabase } from "@/lib/supabase";
import { consumeAttempt } from "@/lib/auth/account";
import { clientIp } from "@/lib/auth/request";

export interface NearWord {
  id: number;
  word: string;
  similarity: number;
}

/** 0005_words.sql의 nearest_words(). 자기 자신은 빠져 있다. */
export async function nearestWords(wordId: number, count: number): Promise<NearWord[]> {
  const { data, error } = await serverSupabase().rpc("nearest_words", {
    p_word_id: wordId,
    p_count: count,
  });
  if (error) throw error;

  return (data ?? []) as NearWord[];
}

/** 0006_word_similarity.sql. 둘 중 하나라도 없으면 null. */
export async function wordSimilarity(a: number, b: number): Promise<number | null> {
  const { data, error } = await serverSupabase().rpc("word_similarity", { p_a: a, p_b: b });
  if (error) throw error;

  return typeof data === "number" ? data : null;
}

/**
 * 실험실 API의 IP당 시도 제한. 로그인 없이 부를 수 있는 API라 이것만이 문이다.
 *
 * 분당 120회 -- 아이 하나가 1초에 두 번씩 눌러도 안 걸리고, 교실 25명이 한
 * IP를 나눠 써도 한 명당 분당 네댓 번은 된다. 스크립트로 사전을 통째로 긁는
 * 것은 막는다(7천 단어 × 20 이웃을 다 긁으려면 한 시간).
 */
const REQUESTS_PER_IP_PER_MINUTE = 120;

export async function allowWordsRequest(request: Request): Promise<boolean> {
  return consumeAttempt(`words-ip:${clientIp(request)}`, REQUESTS_PER_IP_PER_MINUTE, 60);
}
