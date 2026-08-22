/**
 * "가장 닮은 예시를 따라간다" 계산.
 *
 * 아이가 상자에 넣어준 단어가 예시가 되고, 나머지 단어는 그중 지도에서 가장
 * 가까운 것의 상자로 간다. 중심점(평균)이 아니라 **가장 가까운 예시 하나**를
 * 보는 이유는, 그래야 아이가 화면에서 이유를 짚을 수 있기 때문이다 -- "얘가
 * 고래랑 제일 닮아서 동물 상자로 갔어"는 말이 되지만, 평균점은 화면에 없다.
 */

export interface Point {
  id: string;
  x: number;
  y: number;
}

export interface Example extends Point {
  categoryId: string;
}

export interface Guess {
  id: string;
  categoryId: string;
  /** 이 단어가 따라간 예시. 아이에게 이유를 보여줄 때 쓴다. */
  viaId: string;
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * 예시들을 보고 나머지 단어가 어느 상자로 갈지 정한다.
 *
 * 예시가 하나도 없으면 아무것도 정하지 않는다 -- 가르쳐준 게 없으면 컴퓨터도
 * 할 말이 없다는 뜻이고, 그게 이 레슨이 하려는 말이다.
 *
 * 거리가 같으면 먼저 가르친 예시를 따른다(안정 정렬). 같은 화면을 다시 열었을
 * 때 답이 달라지면 아이가 혼란스럽다.
 */
export function guessAll(targets: Point[], examples: Example[]): Guess[] {
  if (examples.length === 0) return [];

  return targets.map((target) => {
    let best = examples[0];
    let bestDistance = distance(target, best);

    for (const example of examples.slice(1)) {
      const candidate = distance(target, example);
      if (candidate < bestDistance) {
        best = example;
        bestDistance = candidate;
      }
    }

    return { id: target.id, categoryId: best.categoryId, viaId: best.id };
  });
}
