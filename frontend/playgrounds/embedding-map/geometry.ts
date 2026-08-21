export interface Point {
  x: number;
  y: number;
}

export interface PositionedWord extends Point {
  id: string;
}

export interface Link {
  fromId: string;
  toId: string;
  from: Point;
  to: Point;
  width: number;
  opacity: number;
}

/** 이 거리보다 멀면 선을 그리지 않는다. 0~1 정규화 좌표 기준. */
export const LINK_THRESHOLD = 0.22;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function toNormalized(
  point: Point,
  rect: { left: number; top: number; width: number; height: number },
): Point {
  return {
    x: clamp01((point.x - rect.left) / rect.width),
    y: clamp01((point.y - rect.top) / rect.height),
  };
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function linkStyle(d: number): { width: number; opacity: number } | null {
  if (d > LINK_THRESHOLD) return null;
  const closeness = 1 - d / LINK_THRESHOLD;
  return {
    width: 2 + closeness * 5,
    opacity: 0.2 + closeness * 0.45,
  };
}

export function isInsideRect(
  point: Point,
  rect: { left: number; top: number; width: number; height: number },
): boolean {
  return (
    point.x >= rect.left &&
    point.x <= rect.left + rect.width &&
    point.y >= rect.top &&
    point.y <= rect.top + rect.height
  );
}

export function buildLinks(words: PositionedWord[]): Link[] {
  const links: Link[] = [];

  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j < words.length; j++) {
      const a = words[i];
      const b = words[j];
      const style = linkStyle(distance(a, b));
      if (!style) continue;

      links.push({
        fromId: a.id,
        toId: b.id,
        from: { x: a.x, y: a.y },
        to: { x: b.x, y: b.y },
        ...style,
      });
    }
  }

  return links;
}
