import { z } from "zod";
import { currentKidId } from "@/lib/auth/current";
import { getLesson, listLessons } from "@/lib/content";
import { completeLesson } from "@/lib/room";

/**
 * 계정을 만들기 전에 논 진도를 서버로 옮긴다.
 *
 * 아이는 로그인 없이도 레슨을 끝낼 수 있고(설계 문서 3장 "첫 방문 60초 안에
 * 놀이터까지"), 그 진도는 localStorage에 쌓인다. 가입·로그인 직후 이걸
 * 보내주지 않으면 "계정을 만들었더니 지금까지 논 게 사라졌다"가 된다.
 *
 * 아이가 완료하지 않은 레슨을 완료했다고 보낼 수도 있다. 막지 않는다 --
 * 이 서비스에는 점수도 경쟁도 없어서 위조해봐야 자기 방에 배지가 하나 더 생길
 * 뿐이고, 그걸 막으려면 서버가 놀이 과정을 따라다녀야 한다. 다만 없는 레슨
 * id는 거른다. 그대로 두면 내 방에 정체불명의 배지가 뜬다.
 */
const body = z.strictObject({
  completedLessons: z.array(z.string().min(1)).max(100),
});

export async function POST(request: Request) {
  const kidId = await currentKidId();
  if (!kidId) return Response.json({ error: "not_signed_in" }, { status: 401 });

  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const known = new Set(listLessons().map((lesson) => lesson.id));
  const merged: string[] = [];

  for (const lessonId of new Set(parsed.data.completedLessons)) {
    if (!known.has(lessonId)) continue;

    const lesson = getLesson(lessonId);
    const reward = lesson.steps.find((step) => step.type === "reward");
    await completeLesson(
      kidId,
      lesson.id,
      reward && reward.type === "reward" ? reward.badge : "",
    );
    merged.push(lesson.id);
  }

  return Response.json({ merged });
}
