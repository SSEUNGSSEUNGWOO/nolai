import { z } from "zod";
import { currentKidId } from "@/lib/auth/current";
import { getLesson } from "@/lib/content";
import { completeLesson } from "@/lib/room";

const body = z.strictObject({ lessonId: z.string().min(1) });

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

  return Response.json({ ok: true });
}
