import { currentKidId } from "@/lib/auth/current";
import { todayKst, temperatureOf } from "@/lib/daily";
import { board, dailyWord, myGuesses, popular } from "@/lib/daily-server";
import { wordOf } from "@/lib/dictionary";
import { allowWordsRequest } from "@/lib/words";

const TOP = 10;
const POPULAR = 5;

function dayBefore(date: string): string {
  return new Date(Date.parse(date) - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * 오늘 판의 상태. 정답 id는 담지 않는다 -- 어제 판의 정답만 단어로 공개한다.
 * 리더보드 순위는 동점 공동 순위: 나보다 시도가 적은 아이 수 + 1.
 */
export async function GET(request: Request) {
  if (!(await allowWordsRequest(request))) {
    return Response.json({ error: "too_many_attempts" }, { status: 429 });
  }

  const today = todayKst();
  const yesterday = dayBefore(today);
  const kidId = await currentKidId();

  const [daily, rows, mine, yesterdayWord, yesterdayPopular] = await Promise.all([
    dailyWord(today),
    board(today),
    kidId ? myGuesses(kidId, today) : Promise.resolve([]),
    dailyWord(yesterday),
    popular(yesterday, POPULAR),
  ]);

  const me = kidId ? rows.find((r) => r.kidId === kidId) : undefined;
  const myRank = me ? rows.filter((r) => r.tries < me.tries).length + 1 : null;

  return Response.json({
    date: today,
    available: daily !== null,
    signedIn: kidId !== null,
    guesses: mine.map((g) => ({ ...g, temperature: temperatureOf(g.rank) })),
    solved: mine.some((g) => g.rank === 0),
    board: {
      top: rows.slice(0, TOP).map(({ nickname, tries, hinted }) => ({ nickname, tries, hinted })),
      solvedCount: rows.length,
      me: me ? { rank: myRank, tries: me.tries, hinted: me.hinted } : null,
    },
    yesterday: yesterdayWord
      ? { word: wordOf(yesterdayWord.wordId)?.word ?? null, popular: yesterdayPopular }
      : null,
  });
}
