"use client";

import { useState } from "react";
import Link from "next/link";
import type { Lesson } from "@/lib/lesson-schema";
import type { Dataset } from "@/lib/dataset-schema";
import LessonRunner, { type LessonResult } from "@/components/LessonRunner";
import { completeLesson } from "@/lib/local-progress";
import { ui } from "@/copy/ui";

export default function LessonClient({
  lesson,
  dataset,
}: {
  lesson: Lesson;
  dataset: Dataset;
}) {
  const [done, setDone] = useState(false);

  function handleComplete(result: LessonResult) {
    completeLesson(result.lessonId, result.badge);
    setDone(true);

    // 로그인한 아이면 서버에도 남긴다. 로그인 안 했으면 401이 오는데 그대로
    // 흘려보낸다 -- localStorage에는 이미 들어갔고, 나중에 계정을 만들 때
    // /api/sync가 옮겨준다.
    fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: result.lessonId }),
    }).catch(() => {});
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 px-5 py-6">
      <header className="flex items-center justify-between text-sm font-extrabold">
        <Link href="/">← 놀AI</Link>
        <span>{lesson.title}</span>
      </header>

      {done ? (
        <div className="flex flex-col items-center gap-4 py-16">
          <p className="text-xl font-black">{ui.lessonComplete}</p>
          <Link
            href="/"
            className="rounded-pop border-[2.5px] border-ink bg-candy-teal px-5 py-2 font-extrabold text-ink shadow-[0_3px_0_var(--color-ink)]"
          >
            처음으로
          </Link>
        </div>
      ) : (
        <LessonRunner
          lesson={lesson}
          dataset={dataset}
          onComplete={handleComplete}
        />
      )}
    </main>
  );
}
