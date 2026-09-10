import { z } from "zod";
import { currentKidId } from "@/lib/auth/current";
import { parseLabArtifact } from "@/lib/artifact";
import { DICTIONARY_ID, LAB_ID } from "@/lib/dictionary";
import { saveArtifact } from "@/lib/room";
import { allowWordsRequest } from "@/lib/words";

const body = z.strictObject({
  pairs: z.array(z.tuple([z.number().int(), z.number().int()])).min(1).max(50),
});

/**
 * POST /api/words/save {pairs: [[a, b], ...]} → 내 방에 실험실 작품으로 남긴다.
 *
 * 로그인이 있어야 한다. 비회원의 발견은 기기에도 남기지 않는다 -- 17장의
 * "발견 저장은 내 방에"가 방을 만들 이유 하나이기 때문이다.
 */
export async function POST(request: Request) {
  const kidId = await currentKidId();
  if (!kidId) return Response.json({ error: "not_signed_in" }, { status: 401 });

  if (!(await allowWordsRequest(request))) {
    return Response.json({ error: "too_many_attempts" }, { status: 429 });
  }

  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  // datasetId는 클라이언트가 아니라 서버가 붙인다. 모양 검사는 artifact.ts가 한다.
  const artifact = parseLabArtifact({ datasetId: DICTIONARY_ID, pairs: parsed.data.pairs });
  if (!artifact) return Response.json({ error: "invalid_request" }, { status: 400 });

  await saveArtifact(kidId, LAB_ID, artifact);

  return Response.json({ ok: true });
}
