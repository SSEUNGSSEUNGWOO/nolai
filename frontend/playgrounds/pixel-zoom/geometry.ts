/**
 * 그림을 이루는 칸과, 칸 수를 줄였을 때 어떻게 되는지의 계산.
 *
 * 레슨 6은 "그림은 칸이고 칸은 숫자다"를, 레슨 9는 "칸이 많을수록 또렷하다"를
 * 보여준다. 둘 다 같은 그림을 쓰므로 계산도 한곳에 둔다.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** "#FF6B6B" 같은 색을 숫자 셋으로 푼다. 아이에게 보여줄 그 숫자다. */
export function toRgb(hex: string): Rgb {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

/** 글자 격자를 색 격자로 바꾼다. 팔레트에 없는 글자는 없다(스키마가 막는다). */
export function toColors(
  rows: string[],
  palette: Record<string, string>,
): string[][] {
  return rows.map((row) => [...row].map((char) => palette[char]));
}

/**
 * 칸을 굵게 만든다. size가 3이면 3x3 덩어리 하나를 평균 색 한 칸으로 바꾼다.
 *
 * 실제로 사진을 줄일 때 하는 일과 같다. 평균을 쓰므로 아이가 보는 흐릿한 그림은
 * 원본에서 진짜로 계산된 것이지 따로 그려둔 그림이 아니다.
 *
 * 그림 크기가 size로 나누어떨어지지 않으면 마지막 덩어리는 남은 칸만 쓴다.
 */
export function coarsen(colors: string[][], size: number): string[][] {
  if (size <= 1) return colors;

  const height = colors.length;
  const width = colors[0].length;
  const out: string[][] = [];

  for (let top = 0; top < height; top += size) {
    const row: string[] = [];

    for (let left = 0; left < width; left += size) {
      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;

      for (let y = top; y < Math.min(top + size, height); y++) {
        for (let x = left; x < Math.min(left + size, width); x++) {
          const rgb = toRgb(colors[y][x]);
          r += rgb.r;
          g += rgb.g;
          b += rgb.b;
          count += 1;
        }
      }

      const hex = (value: number) =>
        Math.round(value / count)
          .toString(16)
          .padStart(2, "0");
      row.push(`#${hex(r)}${hex(g)}${hex(b)}`.toUpperCase());
    }

    out.push(row);
  }

  return out;
}

/** 굵게 만든 격자를 원래 크기로 되펴서 나란히 비교할 수 있게 한다. */
export function expand(coarse: string[][], size: number, height: number, width: number): string[][] {
  const out: string[][] = [];

  for (let y = 0; y < height; y++) {
    const row: string[] = [];
    for (let x = 0; x < width; x++) {
      row.push(coarse[Math.floor(y / size)][Math.floor(x / size)]);
    }
    out.push(row);
  }

  return out;
}
