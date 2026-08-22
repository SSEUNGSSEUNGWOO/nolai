"use client";

import { useSyncExternalStore } from "react";
import {
  isMuted,
  mutedServerSnapshot,
  setMuted,
  subscribeMuted,
  unlockAudio,
} from "@/lib/sound";
import { ui } from "@/copy/ui";

/**
 * 설계 문서 9장이 요구한 음소거 버튼. 교실·도서관에서 쓸 수 있어야 한다.
 *
 * 소리가 나는 곳(레슨 화면) 머리말에 둔다. 소리가 나기 전에 눈에 들어와야
 * 하므로 보상 화면에 두면 늦다.
 */
export default function MuteButton() {
  // localStorage는 서버에 없다. useSyncExternalStore가 서버 스냅샷과 브라우저
  // 값을 나눠 다루므로 하이드레이션이 어긋나지 않고 깜빡임도 없다.
  const muted = useSyncExternalStore(
    subscribeMuted,
    isMuted,
    mutedServerSnapshot,
  );

  return (
    <button
      type="button"
      data-testid="mute"
      data-muted={muted ? "true" : "false"}
      aria-label={muted ? ui.soundOn : ui.soundOff}
      className="rounded-full border-2 border-ink bg-paper px-2 py-1 text-base leading-none"
      onClick={() => {
        setMuted(!muted);
        // 켜는 순간이 사용자 조작이다. 여기서 깨워두면 보상 때 바로 소리가 난다.
        if (muted) unlockAudio();
      }}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
