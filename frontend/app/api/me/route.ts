import { currentKidId } from "@/lib/auth/current";
import { loadRoom } from "@/lib/room";

export async function GET() {
  const kidId = await currentKidId();
  if (!kidId) return Response.json({ kid: null });

  const room = await loadRoom(kidId);

  // 서명은 유효한데 계정이 없다 -- 지워진 계정의 오래된 쿠키다.
  return Response.json({ kid: room });
}
