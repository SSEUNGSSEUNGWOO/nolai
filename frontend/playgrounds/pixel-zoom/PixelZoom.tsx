"use client";

import { useMemo, useRef, useState } from "react";
import type { PixelsDataset } from "@/lib/dataset-schema";
import type { PlaygroundProps } from "../types";
import { coarsen, expand, toColors, toRgb } from "./geometry";

/**
 * 굵기 단계. 1은 원본이고 숫자가 클수록 칸이 굵어진다.
 *
 * 레슨 6은 1에서만 놀아도 되고, 레슨 9는 이 단계를 오가며 "칸이 많을수록
 * 또렷하다"를 보게 한다. 한 놀이터가 두 레슨을 받는다.
 */
const STEPS = [1, 2, 3, 4, 6];

export default function PixelZoom({
  data,
  onEvent,
  onArtifact,
}: PlaygroundProps) {
  const dataset = data as PixelsDataset;
  const [imageId, setImageId] = useState(dataset.images[0].id);
  const [step, setStep] = useState(1);
  const [picked, setPicked] = useState<{ x: number; y: number } | null>(null);
  const seenRef = useRef<string[]>([dataset.images[0].id]);
  const [seen, setSeen] = useState<string[]>([dataset.images[0].id]);

  const image = dataset.images.find((one) => one.id === imageId)!;
  const colors = useMemo(
    () => toColors(image.rows, dataset.palette),
    [image.rows, dataset.palette],
  );

  const height = colors.length;
  const width = colors[0].length;
  // 굵게 만든 뒤 원래 크기로 되편다. 그래야 단계를 바꿔도 그림 크기가 그대로다.
  const shown =
    step === 1 ? colors : expand(coarsen(colors, step), step, height, width);
  const cells = step === 1 ? width : Math.ceil(width / step);

  function look(id: string) {
    setImageId(id);
    setPicked(null);

    if (!seenRef.current.includes(id)) {
      const next = [...seenRef.current, id];
      seenRef.current = next;
      setSeen(next);
      onArtifact({
        kind: "pixel-zoom",
        payload: { datasetId: dataset.id, imageIds: next },
      });
    }

    onEvent({ type: "looked", payload: { imageId: id, count: seenRef.current.length } });
  }

  const rgb = picked ? toRgb(shown[picked.y][picked.x]) : null;

  return (
    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start lg:gap-5">
      <div
        data-testid="pixel-grid"
        data-cells={cells}
        className="grid aspect-square w-full overflow-hidden rounded-pop border-[3px] border-ink bg-paper shadow-[0_4px_0_var(--color-ink)]"
        style={{
          gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
        }}
      >
        {shown.map((row, y) =>
          row.map((color, x) => (
            <button
              key={`${x}-${y}`}
              type="button"
              data-testid={`cell-${x}-${y}`}
              aria-label={`${x + 1}번째 칸, ${y + 1}번째 줄`}
              onClick={() => setPicked({ x, y })}
              // 옅은 선을 그어 "이건 칸이다"가 보이게 한다. 선이 없으면 12칸
              // 하트가 매끈한 그림으로 보여 이 레슨의 핵심이 사라진다.
              className="p-0"
              style={{
                backgroundColor: color,
                border: "1px solid rgba(31, 36, 48, 0.18)",
                outline:
                  picked?.x === x && picked?.y === y
                    ? "3px solid var(--color-ink)"
                    : undefined,
                outlineOffset: "-3px",
              }}
            />
          )),
        )}
      </div>

      <div className="flex flex-col gap-3">
        {/* 칸을 누르면 그 칸의 색이 숫자 셋으로 보인다. 이 레슨의 전부다. */}
        <div
          data-testid="pixel-readout"
          className="flex items-center gap-3 rounded-pop border-[2.5px] border-ink bg-paper px-3 py-2"
        >
          {rgb ? (
            <>
              <span
                className="h-8 w-8 shrink-0 rounded-md border-2 border-ink"
                style={{ backgroundColor: shown[picked!.y][picked!.x] }}
              />
              <span className="font-mono text-sm font-extrabold">
                빨강 {rgb.r} · 초록 {rgb.g} · 파랑 {rgb.b}
              </span>
            </>
          ) : (
            <span className="text-sm font-bold text-muted">
              칸을 하나 눌러봐!
            </span>
          )}
        </div>

        <div data-testid="step-picker" className="flex flex-wrap gap-2">
          {STEPS.map((one) => (
            <button
              key={one}
              type="button"
              data-testid={`step-${one}`}
              data-current={step === one ? "true" : undefined}
              onClick={() => {
                setStep(one);
                setPicked(null);
              }}
              className="rounded-full border-[2.5px] border-ink px-3 py-1 text-sm font-extrabold text-ink shadow-[0_3px_0_var(--color-ink)]"
              style={{
                backgroundColor:
                  step === one ? "var(--color-candy-yellow)" : "var(--color-paper)",
              }}
            >
              {Math.ceil(width / one)}칸
            </button>
          ))}
        </div>

        <div data-testid="image-picker" className="flex flex-wrap gap-2">
          {dataset.images.map((one) => (
            <button
              key={one.id}
              type="button"
              data-testid={`image-${one.id}`}
              data-current={imageId === one.id ? "true" : undefined}
              data-seen={seen.includes(one.id) ? "true" : undefined}
              onClick={() => look(one.id)}
              className="rounded-full border-[2.5px] border-ink px-3 py-1 text-sm font-extrabold text-ink shadow-[0_3px_0_var(--color-ink)]"
              style={{
                backgroundColor:
                  imageId === one.id ? "var(--color-candy-teal)" : "var(--color-paper)",
              }}
            >
              {one.emoji} {one.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
