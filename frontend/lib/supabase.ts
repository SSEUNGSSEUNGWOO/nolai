import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * service_role 키를 쓰는 서버 전용 클라이언트.
 *
 * 이 키는 RLS를 통째로 우회한다. 브라우저 번들에 한 글자라도 새어 나가면 남의
 * 아이 데이터가 전부 열린다. 맨 위의 "server-only" import가 클라이언트
 * 컴포넌트에서 이 파일을 부르면 빌드를 실패시킨다 -- 런타임에 발견하면 이미
 * 배포된 뒤다.
 *
 * 권한 판단은 전부 이 위의 Route Handler가 한다. DB는 "서버가 요청한 것"이면
 * 무엇이든 해주므로, kid_id를 세션에서 꺼내 쓰는 책임이 서버 코드에 있다.
 */
let cached: SupabaseClient | null = null;

export function serverSupabase(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 없습니다. " +
        ".env.local(로컬)과 Vercel 환경변수(배포)를 확인하세요.",
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return cached;
}
