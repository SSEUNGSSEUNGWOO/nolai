/**
 * 질문 중심 방사 배치의 계산.
 *
 * 질문은 늘 화면 한가운데 있고, 문장은 자기 방향(angle)을 유지한 채 질문과의
 * 실제 유사도만큼 중심에 다가온다. 그래서 화면에서 가까워 보이는 문장이 곧
 * 진짜 1등이다 — 2D 지도로 눌렀을 때 생기던 어긋남이 구조적으로 없다.
 */

/** 중심에서 문장까지의 거리 범위. 화면 절반(0.5) 안쪽에 둔다. */
export const MIN_RADIUS = 0.1;
export const MAX_RADIUS = 0.46;

export interface SimRange {
  min: number;
  max: number;
}

/**
 * 유사도를 중심으로부터의 거리로 바꾼다. 유사도가 클수록 거리가 짧다.
 *
 * 기준(range)은 데이터셋 전체에서 한 번 잰 값이다. 질문마다 따로 정규화하면
 * 어떤 질문에서든 1등이 중심에 딱 붙어 보여, 실제로는 답이 애매한 질문까지
 * 확신에 차 보인다.
 */
export function radiusOf(sim: number, range: SimRange): number {
  const span = range.max - range.min;
  const nearness = span <= 0 ? 0.5 : (sim - range.min) / span;
  const clamped = Math.min(1, Math.max(0, nearness));

  return MAX_RADIUS - clamped * (MAX_RADIUS - MIN_RADIUS);
}

/** 방향(0~1 회전수)과 거리를 화면 비율 좌표(0~1)로 바꾼다. */
export function pointAt(
  angle: number,
  radius: number,
): { x: number; y: number } {
  const theta = angle * Math.PI * 2;

  return {
    x: 0.5 + radius * Math.cos(theta),
    y: 0.5 + radius * Math.sin(theta),
  };
}

/**
 * 유사도가 높은 순으로 인덱스를 k개 고른다.
 *
 * 동점이면 원래 순서를 지킨다(Array.sort는 안정 정렬이다). 실행할 때마다
 * 순위가 뒤집히면 아이가 같은 질문을 다시 눌렀을 때 답이 달라져 보인다.
 */
export function topIndexes(sims: number[], k: number): number[] {
  return sims
    .map((_, index) => index)
    .sort((a, b) => sims[b] - sims[a])
    .slice(0, k);
}
