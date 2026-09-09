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

  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // 저장소가 꽉 찼거나 시크릿 모드가 쓰기를 막는다. 진도 한 줄 때문에
    // 완료 화면까지 막지 않는다.
  }
}

/**
 * 로그아웃·방 삭제 때 부른다. 공용 기기에서 다음 아이가 로그인하면 /api/sync가
 * 이 기록을 그 아이 계정에 합쳐 버리므로, 계정을 떠날 때 지운다.
 */
export function clearProgress(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // 읽기 전용 저장소면 지울 수도 없다. 여기서 던져 로그아웃을 막는 것이
    // 다음 로그인 때 합쳐지는 것보다 나쁘다.
  }
}

export function isCompleted(lessonId: string): boolean {
  return readProgress().completedLessons.includes(lessonId);
}
