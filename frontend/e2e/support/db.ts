import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

/**
 * E2E는 실제 Supabase 프로젝트를 쓴다. 별도의 테스트 프로젝트가 없기 때문이다.
 *
 * 그래서 정리는 **이 테스트가 만든 닉네임만** 지운다. 테이블을 통째로 비우는
 * 코드는 여기에 두지 않는다 -- 언젠가 진짜 아이의 데이터가 들어왔을 때
 * 테스트를 한 번 돌리는 것으로 다 날아가면 안 된다.
 */
function env(): { url: string; key: string } {
  const raw = readFileSync(path.resolve(__dirname, "../../.env.local"), "utf8");
  const values = Object.fromEntries(
    raw
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const at = line.indexOf("=");
        return [line.slice(0, at), line.slice(at + 1).replace(/^"|"$/g, "")];
      }),
  );

  return {
    url: values.NEXT_PUBLIC_SUPABASE_URL,
    key: values.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export function testDb() {
  const { url, key } = env();

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function deleteKidsByNickname(nickname: string): Promise<void> {
  if (!nickname) return;

  // progress·badges·artifacts는 외래키의 on delete cascade가 함께 지운다.
  const { error } = await testDb().from("kids").delete().eq("nickname", nickname);
  if (error) throw error;
}

/**
 * 시도 제한 카운터를 지운다. 안 지우면 한 시간에 열 번까지만 돌릴 수 있다.
 *
 * 접두어로 지운다. 로컬에서 IP는 ::1로 잡히고 CI에서는 또 다르므로 정확한
 * 버킷 이름을 테스트가 미리 알 수 없다. 이건 아이의 데이터가 아니라 카운터라
 * 통째로 지워도 잃는 것이 없다 -- kids는 여전히 닉네임으로 정확히 지운다.
 */
export async function clearAttempts(prefixes: string[]): Promise<void> {
  for (const prefix of prefixes) {
    const { error } = await testDb()
      .from("auth_attempts")
      .delete()
      .like("bucket", `${prefix}%`);
    if (error) throw error;
  }
}
