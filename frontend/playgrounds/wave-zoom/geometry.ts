/**
 * 소리를 숫자 줄로 바꾸는 계산.
 *
 * 화면에 그리는 값과 귀에 들리는 값이 **같은 배열**이어야 한다. 따로 만들면
 * 아이가 보는 물결과 듣는 소리가 다른 것이 되고, 6장의 "모든 숫자는 진짜다"가
 * 깨진다. 그래서 여기서 한 번 만들어 그림과 소리가 함께 쓴다.
 */

/**
 * 사인파를 샘플 배열로 만든다.
 *
 * harmonics가 1보다 크면 배음을 겹쳐 거친 소리가 된다. 물결 모양이 눈에 띄게
 * 달라지므로 아이가 "소리가 다르면 숫자도 다르다"를 볼 수 있다.
 */
export function samplesOf(
  frequency: number,
  harmonics: number,
  sampleRate: number,
  count: number,
): number[] {
  const out: number[] = [];

  for (let i = 0; i < count; i++) {
    let value = 0;
    for (let h = 1; h <= harmonics; h++) {
      value += Math.sin((2 * Math.PI * frequency * h * i) / sampleRate) / h;
    }
    out.push(value / harmonics);
  }

  return out;
}

/** 샘플 배열을 0~100 좌표의 꺾은선으로 바꾼다. 위가 +1, 아래가 -1이다. */
export function toPolyline(samples: number[]): string {
  if (samples.length < 2) return "";

  return samples
    .map((value, index) => {
      const x = (index / (samples.length - 1)) * 100;
      const y = 50 - Math.max(-1, Math.min(1, value)) * 45;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

/** 한 물결에 샘플이 몇 개 들어가는지. 아이에게 "물결 하나"를 짚어줄 때 쓴다. */
export function samplesPerWave(frequency: number, sampleRate: number): number {
  return sampleRate / frequency;
}
