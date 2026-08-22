import { z } from "zod";
import { currentKidId } from "@/lib/auth/current";
import { getLesson } from "@/lib/content";
import { completeLesson, saveArtifact } from "@/lib/room";
import { parseArtifact } from "@/lib/artifact";

const body = z.strictObject({
  lessonId: z.string().min(1),
  // 모양 검사는 서버가 한다(lib/artifact.ts). 여기서는 있는지만 본다.
  artifact: z.unknown().optional(),
});

export async function POST(request: Request) {
  const kidId = await currentKidId();
  if (!kidId) return Response.json({ error: "not_signed_in" }, { status: 401 });

  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  // 배지를 클라이언트가 보내게 두면 아무 배지나 달라고 할 수 있다. 레슨 id만
  // 받고, 그 레슨이 무슨 배지를 주는지는 서버가 콘텐츠에서 읽는다.
  let lesson;
  try {
    lesson = getLesson(parsed.data.lessonId);
  } catch {
    return Response.json({ error: "unknown_lesson" }, { status: 400 });
  }

  const reward = lesson.steps.find((step) => step.type === "reward");
  const badge = reward && reward.type === "reward" ? reward.badge : "";

  await completeLesson(kidId, lesson.id, badge);

  // 결과물이 모양에 안 맞으면 조용히 버린다. 레슨을 끝낸 것은 사실이고,
  // 작품 하나 때문에 배지를 못 받게 하는 것이 더 나쁘다.
  const artifact = parseArtifact(lesson, parsed.data.artifact);
  if (artifact) await saveArtifact(kidId, lesson.id, artifact);

  return Response.json({ ok: true, artifactSaved: artifact !== null });
}
