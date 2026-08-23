import Link from "next/link";
import { listLessonGroups } from "@/lib/content";
import { ui } from "@/copy/ui";
import Image from "next/image";
import LessonList from "@/components/LessonList";
import { mascotArt } from "@/lib/art";

export default function Home() {
  // 클라이언트로 넘기는 것은 화면에 필요한 세 값뿐이다. Lesson 전체를 넘기면
  // 16개 레슨의 본문이 HTML에 통째로 실린다.
  const groups = listLessonGroups().map((group) => ({
    title: group.title,
    lessons: group.lessons.map(({ id, order, title }) => ({ id, order, title })),
  }));

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-5 text-center">
      <Image src={mascotArt("base")} alt="" width={144} height={144} priority className="h-36 w-36" />
      <h1 className="text-5xl font-black">{ui.landingTitle}</h1>
      <p className="text-lg font-extrabold">{ui.landingSubtitle}</p>
      <p className="text-sm text-muted">들어가서 만져봐 👋</p>
      <LessonList groups={groups} />

      <footer className="pt-6 text-xs text-muted">
        <Link href="/privacy" className="underline">개인정보처리방침</Link>
      </footer>
    </main>
  );
}
