import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLesson, getDataset, listLessons } from "@/lib/content";
import LessonClient from "./LessonClient";

// 레슨 본문은 브라우저에서 그려져 색인엔 빈 껍데기만 남는다. 검색은 /parents가 맡는다.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export function generateStaticParams() {
  return listLessons().map((lesson) => ({ lessonId: lesson.id }));
}

function loadLesson(lessonId: string) {
  try {
    const lesson = getLesson(lessonId);
    return { lesson, dataset: getDataset(lesson.dataset) };
  } catch {
    notFound();
  }
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const { lesson, dataset } = loadLesson(lessonId);

  return <LessonClient lesson={lesson} dataset={dataset} />;
}
