import { isWordId, wordOf } from "@/lib/dictionary";
import { allowWordsRequest, nearestWords } from "@/lib/words";

const NEAR_COUNT = 20;

/** GET /api/words/near?id=123 → 그 단어와 가까운 20개. 로그인 불필요. */
export async function GET(request: Request) {
  if (!(await allowWordsRequest(request))) {
    return Response.json({ error: "too_many_attempts" }, { status: 429 });
  }

  // Number("")는 0, Number("abc")는 NaN -- 둘 다 사전에 없다.
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!isWordId(id)) {
    return Response.json({ error: "unknown_word" }, { status: 400 });
  }

  const near = await nearestWords(id, NEAR_COUNT);

  return Response.json({ word: wordOf(id), near });
}
