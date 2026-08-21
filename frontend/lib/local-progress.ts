const KEY = "nolai:progress";

export interface LocalProgress {
  completedLessons: string[];
  badges: string[];
}

const empty: LocalProgress = { completedLessons: [], badges: [] };

export function readProgress(): LocalProgress {
  if (typeof window === "undefined") return empty;

  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty;

    const parsed = JSON.parse(raw) as Partial<LocalProgress>;
    return {
      completedLessons: Array.isArray(parsed.completedLessons)
        ? parsed.completedLessons
        : [],
      badges: Array.isArray(parsed.badges) ? parsed.badges : [],
    };
  } catch {
    // 손상된 값은 조용히 버린다. 아이의 놀이를 막는 것보다 낫다.
    return empty;
  }
}

export function completeLesson(lessonId: string, badge: string): void {
  if (typeof window === "undefined") return;

  const current = readProgress();
  const next: LocalProgress = {
    completedLessons: current.completedLessons.includes(lessonId)
      ? current.completedLessons
      : [...current.completedLessons, lessonId],
    badges:
      !badge || current.badges.includes(badge)
        ? current.badges
        : [...current.badges, badge],
  };

  window.localStorage.setItem(KEY, JSON.stringify(next));
}

export function isCompleted(lessonId: string): boolean {
  return readProgress().completedLessons.includes(lessonId);
}
