import { notFound } from "next/navigation";
import { getLesson, getDataset, listLessons } from "@/lib/content";
import LessonClient from "./LessonClient";

export function generateStaticParams() {
  return listLessons().map((lesson) => ({ lessonId: lesson.id }));
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;

  try {
    const lesson = getLesson(lessonId);
    const dataset = getDataset(lesson.dataset);
    return <LessonClient lesson={lesson} dataset={dataset} />;
  } catch {
    notFound();
  }
}
