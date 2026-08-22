import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

/**
 * E2E는 같은 Supabase 프로젝트의 **test 스키마**를 쓴다.
 *
 * 운영 데이터는 public에 있고 이 파일은 test만 본다. 스키마가 다르므로 여기
 * 코드가 잘못되어도 진짜 아이의 데이터에 닿지 못한다. 별도 프로젝트를 쓰면
 * 더 깨끗하지만 월 $10이 계속 나가고, 지금 막으려는 것은 그 한 가지뿐이다.
 *
 * 그래도 정리는 이 테스트가 만든 닉네임만 지운다 -- 스키마가 갈렸다고 해서
 * 통째로 비우는 습관을 남기고 싶지 않다.
 */
const TEST_SCHEMA = "test";
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
    db: { schema: TEST_SCHEMA },
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
