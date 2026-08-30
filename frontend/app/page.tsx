import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentKidId } from "@/lib/auth/current";
import { getDataset, listLessonGroups, listLessons } from "@/lib/content";
import Landing from "@/components/landing/Landing";
import ProgressRedirect from "@/components/landing/ProgressRedirect";

/**
 * 첫 방문자(부모·교사·아이)가 보는 랜딩. SEO 대상은 이 페이지뿐이다(설계 문서 3장).
 *
 * 설명 대신 첫 레슨의 놀이터를 그대로 박아 넣는다 -- 원칙 1 "설명보다 조작이 먼저"는
 * 랜딩에도 적용된다. 성취기준 표 같은 어른용 정보는 맨 아래에만 둔다.
 *
 * 이미 노는 아이는 이 페이지를 볼 이유가 없다. 세션이 있으면 서버에서, 기기에 진도가
 * 있으면 브라우저에서 /play로 보낸다(설계 문서 3장 "재방문은 바로 내 방").
 */
export const metadata: Metadata = {
  title: "초등 인공지능 교육 놀이터 놀AI — 무료, 회원가입 없음",
  description:
    "초등 5~6학년이 AI 작동 원리를 손으로 만져보는 무료 레슨 16개. 회원가입·개인정보 없음. 실과 성취기준 6실05-04·05 대응. 브라우저에서 바로 시작.",
  alternates: { canonical: "/" },
};

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  if (await currentKidId()) redirect("/play");

  const groups = listLessonGroups().map((group) => ({
    title: group.title,
    lessons: group.lessons.map(({ id, title }) => ({ id, title })),
  }));
  const titles = Object.fromEntries(listLessons().map((lesson) => [lesson.id, lesson.title]));
  const dataset = getDataset("words-animals-vehicles");

  return (
    <main>
      <ProgressRedirect />
      <Landing dataset={dataset} groups={groups} titles={titles} />
    </main>
  );
}
