import { z } from "zod";
import { currentKidId } from "@/lib/auth/current";
import { todayKst, temperatureOf } from "@/lib/daily";
import { dailyWord, judge, myGuesses, recordGuess } from "@/lib/daily-server";
import { allowWordsRequest } from "@/lib/words";

/** 비회원은 자기 최고 순위를 보내온다. 로그인한 아이는 서버 기록에서 읽는다. */
const body = z.strictObject({ bestRank: z.number().int().positive().max(1001).optional() });

const OUTSIDE = 1001;

/**
 * 힌트: 지금까지 최고 순위의 절반 순위에 있는 이웃 하나. 정답(0위)은 절대 주지 않는다.
 * 로그인한 아이는 힌트 단어가 hinted=true 시도로 기록돼 리더보드에 표시된다.
 */
export async function POST(request: Request) {
  if (!(await allowWordsRequest(request))) {
    return Response.json({ error: "too_many_attempts" }, { status: 429 });
  }

  const parsed = body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });

  const today = todayKst();
  const daily = await dailyWord(today);
  if (!daily) return Response.json({ error: "no_word_today" }, { status: 404 });

  const kidId = await currentKidId();
  let best = parsed.data.bestRank ?? OUTSIDE;
  if (kidId) {
    const ranks = (await myGuesses(kidId, today))
      .map((g) => g.rank)
      .filter((r): r is number => r !== null && r > 0);
    best = ranks.length > 0 ? Math.min(...ranks) : OUTSIDE;
  }

  // 절반 순위. 최고가 1위면 더 줄 게 없다 -- 2위를 준다.
  const target = Math.max(1, Math.floor(best / 2));
  const hintId = daily.neighbors[best <= 1 ? 1 : target - 1];
  if (hintId === undefined) return Response.json({ error: "no_hint" }, { status: 404 });

  const judged = await judge(daily, hintId);
  if (kidId) await recordGuess(kidId, today, judged, true);

  return Response.json({ ...judged, temperature: temperatureOf(judged.rank), hinted: true });
}
