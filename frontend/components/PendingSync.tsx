"use client";

import { useEffect } from "react";
import { flushPending, readPending } from "@/lib/pending";

/**
 * 서버에 못 보낸 레슨 완료(lib/pending.ts)를 다음 방문과 네트워크 재연결 때
 * 다시 보낸다. 화면은 없다. 대기열이 비어 있으면 아무 요청도 하지 않는다.
 */
export default function PendingSync() {
  useEffect(() => {
    async function run() {
      if (readPending().length === 0) return;

      const me = await fetch("/api/me")
        .then((response) => response.json())
        .catch(() => null);
      const kidId: unknown = me?.kid?.id;
      if (typeof kidId !== "string") return;

      await flushPending(kidId);
    }

    void run();
    window.addEventListener("online", run);
    return () => window.removeEventListener("online", run);
  }, []);

  return null;
}
