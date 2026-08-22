/**
 * "네가 좋아한 것과 닮은 것" 고르기.
 *
 * 좋아한 것들 중 **하나라도** 가까우면 추천한다(가장 가까운 것까지의 거리로
 * 줄 세운다). 좋아한 것들의 평균점을 쓰지 않는 이유는 레슨 3과 같다 -- 취향이
 * 갈리면(피자와 축구를 둘 다 좋아함) 평균점은 둘 사이 아무것도 없는 자리에
 * 찍히고, 거기서 가까운 것은 아이가 좋아한 것과 닮지 않았다.
 */

export interface Item {
  id: string;
  x: number;
  y: number;
}

export interface Recommendation {
  id: string;
  /** 이 추천을 끌어낸 "좋아요". 아이에게 이유를 보여줄 때 쓴다. */
  viaId: string;
}

function distance(a: Item, b: Item): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * 좋아하지 않은 것 중에서 가장 닮은 것부터 count개 고른다.
 *
 * 좋아한 것이 없으면 아무것도 추천하지 않는다 -- 취향을 모르는데 추천할 수는
 * 없고, 그게 이 레슨의 첫 장면이다.
 */
export function recommend(
  items: Item[],
  likedIds: string[],
  count: number,
): Recommendation[] {
  const liked = items.filter((item) => likedIds.includes(item.id));
  if (liked.length === 0) return [];

  return items
    .filter((item) => !likedIds.includes(item.id))
    .map((item) => {
      let best = liked[0];
      let bestDistance = distance(item, best);

      for (const candidate of liked.slice(1)) {
        const gap = distance(item, candidate);
        if (gap < bestDistance) {
          best = candidate;
          bestDistance = gap;
        }
      }

      return { id: item.id, viaId: best.id, distance: bestDistance };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count)
    .map(({ id, viaId }) => ({ id, viaId }));
}
