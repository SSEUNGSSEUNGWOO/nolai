import Link from "next/link";
import { redirect } from "next/navigation";
import { currentKidId } from "@/lib/auth/current";
import { loadRoom } from "@/lib/room";
import { listLessons } from "@/lib/content";
import { account, badgeNames, ui } from "@/copy/ui";
import LogoutButton from "./LogoutButton";

// 세션 쿠키를 읽으므로 요청마다 그린다.
export const dynamic = "force-dynamic";

export default async function RoomPage() {
  const kidId = await currentKidId();
  const room = kidId ? await loadRoom(kidId) : null;

  // 쿠키가 없거나, 서명은 맞는데 계정이 지워진 경우다.
  if (!room) redirect("/join");

  const lessons = listLessons();
  const done = new Set(room.completedLessons);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-5 py-8">
      <header className="flex items-center justify-between text-sm font-extrabold">
        <Link href="/">← {ui.landingTitle}</Link>
        <LogoutButton />
      </header>

      <h1 className="text-3xl font-black">
        {room.nickname}의 {account.roomTitle}
      </h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-extrabold">{account.roomBadges}</h2>
        {room.badges.length === 0 ? (
          <p className="text-sm text-muted">{account.roomNoBadges}</p>
        ) : (
          <ul data-testid="badge-shelf" className="flex flex-wrap gap-2">
            {room.badges.map((badge) => (
              <li
                key={badge}
                data-testid={`badge-${badge}`}
                className="rounded-pop border-[2.5px] border-ink bg-candy-yellow px-4 py-2 font-extrabold shadow-[0_3px_0_var(--color-ink)]"
              >
                🏅 {badgeNames[badge] ?? badge}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-extrabold">{account.roomProgress}</h2>
        <ul className="flex flex-col gap-3">
          {lessons.map((lesson) => (
            <li key={lesson.id}>
              <Link
                href={`/lesson/${lesson.id}`}
                data-testid={`room-lesson-${lesson.id}`}
                data-done={done.has(lesson.id) ? "true" : undefined}
                className="flex items-center justify-between rounded-pop border-[2.5px] border-ink bg-candy-red px-5 py-3 font-extrabold text-ink shadow-[0_3px_0_var(--color-ink)]"
              >
                <span>
                  {lesson.order}. {lesson.title}
                </span>
                <span>{done.has(lesson.id) ? "✅" : "▶"}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
