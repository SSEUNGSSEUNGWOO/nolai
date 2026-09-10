import { z } from "zod";
import { currentKidId } from "@/lib/auth/current";
import { todayKst, temperatureOf } from "@/lib/daily";
import { dailyWord, judge, myGuesses, recordGuess } from "@/lib/daily-server";
import { isWordId } from "@/lib/dictionary";
import { allowWordsRequest } from "@/lib/words";

const body = z.strictObject({ wordId: z.number().int() });

/** 시도 하나. 비회원도 채점은 받지만 기록되지 않는다. */
export async function POST(request: Request) {
  if (!(await allowWordsRequest(request))) {
    return Response.json({ error: "too_many_attempts" }, { status: 429 });
  }

  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isWordId(parsed.data.wordId)) {
    return Response.json({ error: "unknown_word" }, { status: 400 });
  }

  const today = todayKst();
  const daily = await dailyWord(today);
  if (!daily) return Response.json({ error: "no_word_today" }, { status: 404 });

  const judged = await judge(daily, parsed.data.wordId);

  const kidId = await currentKidId();
  let tries: number | null = null;
  if (kidId) {
    await recordGuess(kidId, today, judged, false);
    tries = (await myGuesses(kidId, today)).length;
  }

  return Response.json({ ...judged, temperature: temperatureOf(judged.rank), tries });
}
