"use client";

import Link from "next/link";
import { account } from "@/copy/ui";
import type { Me } from "./useMe";

const linkClass =
  "rounded-pop border-[2.5px] border-ink px-4 py-2 text-sm font-extrabold text-ink shadow-[0_3px_0_var(--color-ink)]";

export default function AccountLinks({ me, loaded }: { me: Me | null; loaded: boolean }) {
  const nickname = me?.nickname ?? null;
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
