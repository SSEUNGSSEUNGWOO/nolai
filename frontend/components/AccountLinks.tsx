"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { account } from "@/copy/ui";

const linkClass =
  "rounded-pop border-[2.5px] border-ink px-4 py-2 text-sm font-extrabold text-ink shadow-[0_3px_0_var(--color-ink)]";

/**
 * 랜딩은 SEO 대상이라(설계 문서 3장) 정적으로 두고 싶다. 세션은 서버에서
 * 읽어야 하는데 그러면 페이지가 요청마다 그려진다. 그래서 로그인 여부만
 * 브라우저에서 물어본다.
 */
export default function AccountLinks() {
  const [nickname, setNickname] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((response) => response.json())
      .then((data) => setNickname(data.kid?.nickname ?? null))
      .catch(() => setNickname(null))
      .finally(() => setLoaded(true));
  }, []);

  // 다 불러오기 전에는 아무것도 그리지 않는다. "만들기"가 잠깐 보였다가
  // "내 방"으로 바뀌면 아이가 잘못 누른다.
  if (!loaded) return <div className="h-9" />;

  if (nickname) {
    return (
      <Link href="/room" data-testid="to-room" className={`${linkClass} bg-candy-yellow`}>
        {nickname}의 {account.roomTitle}
      </Link>
    );
  }

  return (
    <div className="flex gap-2">
      <Link href="/join" data-testid="to-join" className={`${linkClass} bg-candy-teal`}>
        {account.join}
      </Link>
      <Link href="/login" data-testid="to-login" className={`${linkClass} bg-paper`}>
        {account.login}
      </Link>
    </div>
  );
}
