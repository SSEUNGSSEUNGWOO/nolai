import { cookies } from "next/headers";
import { clearedSessionCookie } from "@/lib/auth/request";

export async function POST() {
  (await cookies()).set(clearedSessionCookie());

  return Response.json({ ok: true });
}
