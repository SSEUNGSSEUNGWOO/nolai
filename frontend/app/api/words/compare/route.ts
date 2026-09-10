import { isWordId, wordOf } from "@/lib/dictionary";
import { allowWordsRequest, wordSimilarity } from "@/lib/words";

/** GET /api/words/compare?a=1&b=2 → 두 단어의 유사도. 로그인 불필요. */
export async function GET(request: Request) {
  if (!(await allowWordsRequest(request))) {
    return Response.json({ error: "too_many_attempts" }, { status: 429 });
  }

  const params = new URL(request.url).searchParams;
  const a = Number(params.get("a"));
  const b = Number(params.get("b"));
  if (!isWordId(a) || !isWordId(b) || a === b) {
    return Response.json({ error: "unknown_word" }, { status: 400 });
  }

  const similarity = await wordSimilarity(a, b);
  if (similarity === null) {
    return Response.json({ error: "unknown_word" }, { status: 400 });
  }

  return Response.json({ a: wordOf(a), b: wordOf(b), similarity });
}
