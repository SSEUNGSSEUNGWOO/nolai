import Link from "next/link";
import { listLessons } from "@/lib/content";
import { ui } from "@/copy/ui";
import AccountLinks from "@/components/AccountLinks";

export default function Home() {
  const lessons = listLessons();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-5 text-center">
      <h1 className="text-5xl font-black">{ui.landingTitle}</h1>
      <p className="text-lg font-extrabold">{ui.landingSubtitle}</p>
      <p className="text-sm text-muted">들어가서 만져봐 👋</p>
      <AccountLinks />

      <div className="flex w-full flex-col gap-3 pt-4">
        {lessons.map((lesson) => (
          <Link
            key={lesson.id}
            href={`/lesson/${lesson.id}`}
            className="rounded-pop border-[2.5px] border-ink bg-candy-red px-5 py-3 font-extrabold text-ink shadow-[0_3px_0_var(--color-ink)]"
          >
            {lesson.order}. {lesson.title}
          </Link>
        ))}
      </div>
    </main>
  );
}
