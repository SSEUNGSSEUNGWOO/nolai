/** 오늘의 단어의 날짜·온도·기록 계산. 서버와 화면이 같이 쓴다. DB를 모른다. */

export type Temperature = "correct" | "hot" | "warm" | "lukewarm" | "cold";

/** 한국 시간 기준 YYYY-MM-DD. 서버(UTC)와 아이의 폰이 같은 날짜를 봐야 한다. */
export function todayKst(now: number = Date.now()): string {
  return new Date(now + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** rank 0은 정답, null은 이웃 1000개 밖. 설계 문서 17장 표. */
export function temperatureOf(rank: number | null): Temperature {
  if (rank === 0) return "correct";
  if (rank === null) return "cold";
  if (rank <= 10) return "hot";
  if (rank <= 100) return "warm";
  if (rank <= 1000) return "lukewarm";
  return "cold";
}

export interface DayRecord {
  date: string;
  tries: number;
  solved: boolean;
}

function dayBefore(date: string): string {
  return new Date(Date.parse(date) - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** 오늘(또는 오늘 아직 안 했으면 어제)부터 거꾸로 이어진 참여 일수. 맞혔는지는 안 따진다. */
export function streakOf(history: DayRecord[], today: string): number {
  const played = new Set(history.map((h) => h.date));
  let day = played.has(today) ? today : dayBefore(today);
  let streak = 0;
  while (played.has(day)) {
    streak += 1;
    day = dayBefore(day);
  }
  return streak;
}

export function bestTriesOf(history: DayRecord[]): number | null {
  const solved = history.filter((h) => h.solved).map((h) => h.tries);
  return solved.length > 0 ? Math.min(...solved) : null;
}
