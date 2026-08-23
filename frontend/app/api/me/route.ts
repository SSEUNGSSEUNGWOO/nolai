import { currentKidId } from "@/lib/auth/current";
import { loadRoom, deleteKid } from "@/lib/room";
import { clearedSessionCookie } from "@/lib/auth/request";
import { cookies } from "next/headers";

export async function GET() {
  const kidId = await currentKidId();
  if (!kidId) return Response.json({ kid: null });

  const room = await loadRoom(kidId);

  // 서명은 유효한데 계정이 없다 -- 지워진 계정의 오래된 쿠키다.
  return Response.json({ kid: room });
}

/**
 * 내 방을 통째로 지운다. 진도·배지·작품은 외래키 cascade로 함께 사라진다.
 * 아이가 직접 누를 수 있어야 한다 -- 개인정보처리방침의 삭제 권리를 버튼
 * 하나로 지킨다. 되돌릴 수 없으므로 화면에서 한 번 더 묻는다.
 */
export async function DELETE() {
  const kidId = await currentKidId();
  if (!kidId) return Response.json({ ok: false }, { status: 401 });

  await deleteKid(kidId);
  (await cookies()).set(clearedSessionCookie());

  return Response.json({ ok: true });
}
