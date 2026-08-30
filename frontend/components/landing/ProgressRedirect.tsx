"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { readProgress } from "@/lib/local-progress";

/**
 * 이 기기에서 이미 레슨을 끝낸 아이는 랜딩을 건너뛴다. 진도는 localStorage에만
 * 있어 서버가 모르므로 브라우저에서 판단한다. 아무것도 그리지 않는다.
 */
export default function ProgressRedirect() {
  const router = useRouter();
  useEffect(() => {
    if (readProgress().completedLessons.length > 0) router.replace("/play");
  }, [router]);
  return null;
}
