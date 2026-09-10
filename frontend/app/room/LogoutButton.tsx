"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { account } from "@/copy/ui";
import { clearProgress, readProgress } from "@/lib/local-progress";

/**
 * 나가기. 순서가 중요하다.
 *
 * 1. 기기 진도를 서버에 한 번 더 합친다 -- 레슨 완료 때 서버 저장이 실패했을
 *    수 있고, 아래 3에서 기기 진도를 지우면 그 기록은 영영 사라진다.
 * 2. 쿠키를 지운다. 실패하면 이동하지 않는다 -- 쿠키가 남은 채 화면만 바뀌면
 *    다음 아이가 이 계정으로 놀게 된다.
 * 3. 기기 진도를 지운다. 안 지우면 다음 아이가 로그인할 때 /api/sync가 합친다.
 */
export default function LogoutButton() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    setFailed(false);

    const local = readProgress();
    const synced =
      local.completedLessons.length === 0 ||
      (await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedLessons: local.completedLessons }),
      })
        .then((response) => response.ok)
        .catch(() => false));

    const loggedOut =
      synced &&
      (await fetch("/api/logout", { method: "POST" })
        .then((response) => response.ok)
        .catch(() => false));

    if (!loggedOut) {
      setBusy(false);
      setFailed(true);
      return;
    }

    clearProgress();
    router.push("/play");
    router.refresh();
  }

  return (
    <span className="flex items-center gap-2">
      {failed && <span className="text-xs text-muted">{account.logoutFailed}</span>}
      <button
        type="button"
        data-testid="logout"
        disabled={busy}
        className="text-sm font-extrabold text-muted underline disabled:opacity-50"
        onClick={logout}
      >
        {account.logout}
      </button>
    </span>
  );
}
