"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { account } from "@/copy/ui";

/**
 * 내 방을 통째로 지운다. 되돌릴 수 없으므로 두 번 누르게 한다 -- 브라우저
 * confirm()은 아이가 읽기에 낯설고 설치된 앱에서는 모양이 제각각이라 직접 그린다.
 */
export default function DeleteRoomButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        data-testid="delete-room"
        className="text-sm font-extrabold text-muted underline"
        onClick={() => setConfirming(true)}
      >
        {account.deleteRoom}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-pop border-[2.5px] border-ink bg-paper p-3 text-sm">
      <p className="font-extrabold">{account.deleteRoomConfirm}</p>
      <div className="flex gap-2">
        <button
          type="button"
          data-testid="delete-room-confirm"
          className="rounded-pop border-[2.5px] border-ink bg-candy-red px-3 py-1 font-extrabold shadow-[0_3px_0_var(--color-ink)]"
          onClick={async () => {
            await fetch("/api/me", { method: "DELETE" });
            router.push("/play");
            router.refresh();
          }}
        >
          {account.deleteRoomYes}
        </button>
        <button
          type="button"
          className="rounded-pop border-[2.5px] border-ink bg-paper px-3 py-1 font-extrabold shadow-[0_3px_0_var(--color-ink)]"
          onClick={() => setConfirming(false)}
        >
          {account.deleteRoomNo}
        </button>
      </div>
    </div>
  );
}
