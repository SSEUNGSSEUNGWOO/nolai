"use client";

import Link from "next/link";
import Image from "next/image";
import { lessonArt } from "@/lib/art";
import { useEffect, useState } from "react";
import { readProgress } from "@/lib/local-progress";
import { ui } from "@/copy/ui";
import AccountLinks from "./AccountLinks";
import { useMe } from "./useMe";

export interface LessonGroupView {
  title: string;
  lessons: { id: string; order: number; title: string }[];
}

/**
 * 첫 화면의 레슨 목록. 묶음 제목, 끝낸 레슨의 체크, 다음에 할 레슨의 강조를 그린다.
 *
 * 진도는 두 곳에 있다. 계정이 없어도 localStorage에 남고, 계정이 있으면 서버에도
 * 남는다. 다른 기기에서 한 것은 서버에만 있고, 로그인 전에 한 것은 브라우저에만
 * 있으므로 둘을 합친다.
 *
 * 목록 자체는 진도를 모른 채 먼저 그린다 -- 정적 HTML에 들어가야 하고, 아이가
 * 기다릴 이유가 없다. 체크와 강조만 나중에 붙는다.
 */
export default function LessonList({ groups }: { groups: LessonGroupView[] }) {
  const { me, loaded } = useMe();
  const [local, setLocal] = useState<string[]>([]);

  // localStorage는 서버에 없으므로 붙은 뒤에 읽는다. 처음부터 읽으면 서버와
  // 브라우저가 다른 HTML을 그려 hydration 오류가 난다.
  // 규칙은 "effect 안 동기 setState"를 막지만, 여기선 그게 목적이다 -- 서버 HTML과
  // 첫 클라이언트 렌더를 일치시킨 뒤 한 번만 갱신한다.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setLocal(readProgress().completedLessons), []);

  const done = new Set([...local, ...(me?.completedLessons ?? [])]);
  const ordered = groups.flatMap((group) => group.lessons);
  const next = loaded ? ordered.find((lesson) => !done.has(lesson.id)) : undefined;

  return (
    <>
      <AccountLinks me={me} loaded={loaded} />

      <div className="flex w-full flex-col gap-6 pt-4">
        {groups.map((group) => (
          <section key={group.title} className="flex flex-col gap-3">
            <h2 className="text-sm font-extrabold text-muted">{group.title}</h2>
            {group.lessons.map((lesson) => {
              const isDone = done.has(lesson.id);
              const isNext = lesson.id === next?.id;
              return (
                <Link
                  key={lesson.id}
                  href={`/lesson/${lesson.id}`}
                  data-testid={`lesson-${lesson.id}`}
                  data-done={isDone ? "true" : undefined}
                  data-next={isNext ? "true" : undefined}
                  className={`flex items-center gap-3 rounded-pop border-[2.5px] border-ink p-2 pr-4 text-left font-extrabold text-ink shadow-[0_3px_0_var(--color-ink)] ${
                    isNext ? "pulse-card bg-candy-yellow" : isDone ? "bg-paper" : "bg-candy-red"
                  }`}
                >
                  {/* 썸네일. 끝낸 레슨은 살짝 흐려서 "지나온 것"으로 읽힌다 */}
                  <Image
                    src={lessonArt(lesson.id)}
                    alt=""
                    width={64}
                    height={64}
                    className={`h-16 w-16 shrink-0 rounded-[10px] border-[2px] border-ink bg-cream object-cover ${isDone ? "opacity-60" : ""}`}
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-xs text-muted">{lesson.order}</span>
                    <span className="leading-tight">{lesson.title}</span>
                  </span>
                  {isDone && <span aria-label={ui.lessonDone} className="text-lg">✔</span>}
                  {isNext && <span className="shrink-0 rounded-full bg-ink px-2 py-0.5 text-xs text-paper">{ui.lessonNext}</span>}
                </Link>
              );
            })}
          </section>
        ))}
      </div>
    </>
  );
}
