import "server-only";

import { serverSupabase } from "@/lib/supabase";
import { wordSimilarity } from "@/lib/words";
import { isWordId, wordOf, type DictWord } from "@/lib/dictionary";
import type { DayRecord } from "@/lib/daily";

interface DailyWord {
  date: string;
  wordId: number;
  neighbors: number[];
}

/** 그날의 정답. 없으면 null(365일치가 떨어졌다는 뜻 -- build_daily.py를 다시 돌린다). */
export async function dailyWord(date: string): Promise<DailyWord | null> {
  const { data, error } = await serverSupabase()
    .from("daily_words")
    .select("date, word_id, neighbors")
    .eq("date", date)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    date: data.date as string,
    wordId: data.word_id as number,
    neighbors: data.neighbors as number[],
  };
}

export interface Judged {
  word: DictWord;
  similarity: number;
  /** 0 = 정답, 1~1000 = 이웃 순위, null = 밖 */
  rank: number | null;
}

/** 시도 하나를 채점한다. 정답 id는 여기서만 보고 밖으로 안 나간다. */
export async function judge(daily: DailyWord, guessId: number): Promise<Judged> {
  const word = wordOf(guessId)!;
  if (guessId === daily.wordId) return { word, similarity: 1, rank: 0 };

  const similarity = (await wordSimilarity(daily.wordId, guessId)) ?? 0;
  const at = daily.neighbors.indexOf(guessId);

  return { word, similarity, rank: at === -1 ? null : at + 1 };
}

export async function recordGuess(
  kidId: string,
  date: string,
  judged: Judged,
  hinted: boolean,
): Promise<void> {
  const { error } = await serverSupabase().from("guesses").upsert(
    {
      kid_id: kidId,
      date,
      word_id: judged.word.id,
      similarity: judged.similarity,
      rank: judged.rank,
      hinted,
    },
    { onConflict: "kid_id,date,word_id", ignoreDuplicates: true },
  );
  if (error) throw error;
}

export interface GuessRow {
  word: DictWord;
  similarity: number;
  rank: number | null;
  hinted: boolean;
}

export async function myGuesses(kidId: string, date: string): Promise<GuessRow[]> {
  const { data, error } = await serverSupabase()
    .from("guesses")
    .select("word_id, similarity, rank, hinted")
    .eq("kid_id", kidId)
    .eq("date", date)
    .order("similarity", { ascending: false });
  if (error) throw error;

  return (data ?? [])
    .filter((row) => isWordId(row.word_id))
    .map((row) => ({
      word: wordOf(row.word_id as number)!,
      similarity: row.similarity as number,
      rank: row.rank as number | null,
      hinted: row.hinted as boolean,
    }));
}

export interface BoardRow {
  kidId: string;
  nickname: string;
  tries: number;
  hinted: boolean;
}

export async function board(date: string): Promise<BoardRow[]> {
  const { data, error } = await serverSupabase().rpc("daily_board", { p_date: date });
  if (error) throw error;

  return (
    (data ?? []) as { kid_id: string; nickname: string; tries: number; hinted: boolean }[]
  ).map((r) => ({ kidId: r.kid_id, nickname: r.nickname, tries: r.tries, hinted: r.hinted }));
}

export async function popular(
  date: string,
  count: number,
): Promise<{ word: string; guessers: number }[]> {
  const { data, error } = await serverSupabase().rpc("daily_popular", {
    p_date: date,
    p_count: count,
  });
  if (error) throw error;

  return ((data ?? []) as { word: string; guessers: number }[]).map((r) => ({
    word: r.word,
    guessers: r.guessers,
  }));
}

export async function dailyHistory(kidId: string): Promise<DayRecord[]> {
  const { data, error } = await serverSupabase().rpc("daily_history", { p_kid: kidId });
  if (error) throw error;

  return ((data ?? []) as { date: string; tries: number; solved: boolean }[]).map((r) => ({
    date: r.date,
    tries: r.tries,
    solved: r.solved,
  }));
}
