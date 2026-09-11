"use client";

import { useState } from "react";
import Link from "next/link";
import type { Lesson } from "@/lib/lesson-schema";
import type { Dataset } from "@/lib/dataset-schema";
import LessonRunner, { type LessonResult } from "@/components/LessonRunner";
import { completeLesson } from "@/lib/local-progress";
import { enqueuePending, sendPending, type SendOutcome } from "@/lib/pending";
import { useMe } from "@/components/useMe";
import { ui } from "@/copy/ui";
import MuteButton from "@/components/MuteButton";

export default function LessonClient({
  lesson,
  dataset,
}: {
  lesson: Lesson;
  dataset: Dataset;
}) {
  const { me } = useMe();
  const [done, setDone] = useState(false);
  const [outcome, setOutcome] = useState<SendOutcome | null>(null);
  const [stored, setStored] = useState(true);

  function handleComplete(result: LessonResult) {
    completeLesson(result.lessonId, result.badge);

    // 브라우저에 먼저 넣고 서버로 보낸다. 통신이 끊기거나 로그인 전이면 대기열에
    // 남아 다음 방문·로그인 때 다시 나간다(lib/pending.ts).
    const queued = enqueuePending({
      lessonId: result.lessonId,
      artifact: result.artifact?.payload ?? null,
      owner: me?.id ?? null,
    });
    setStored(queued.stored);
    setDone(true);
    void sendPending(queued.item).then(setOutcome);
  }

  // 로그인한 아이인데 서버에 못 남겼을 때만 알린다. 손님은 원래 서버에 안 간다.
  // 브라우저에도 못 남겼으면(저장소 가득 참) 보관했다고 말하면 거짓말이다.
  const notice =
    me !== null && outcome === "kept"
      ? stored
        ? { testId: "kept-locally", text: ui.lessonKeptLocally }
        : { testId: "not-saved", text: ui.lessonNotSaved }
      : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 px-5 py-6 lg:max-w-5xl">
      <header className="flex items-center justify-between text-sm font-extrabold">
        <Link href="/play">← {ui.landingTitle}</Link>
        <span className="flex items-center gap-2">
          {lesson.title}
          <MuteButton />
        </span>
      </header>

      {done ? (
        <div className="flex flex-col items-center gap-4 py-16">
          <p className="text-xl font-black">{ui.lessonComplete}</p>
          {notice && (
            <p data-testid={notice.testId} className="text-sm font-extrabold text-muted">
              {notice.text}
            </p>
          )}
          <Link
            href="/play"
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
