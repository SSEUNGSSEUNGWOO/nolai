import { notFound } from "next/navigation";
import { getLesson, getDataset, listLessons } from "@/lib/content";
import LessonClient from "./LessonClient";

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
