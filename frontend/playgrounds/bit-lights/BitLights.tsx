"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import type { BitsDataset } from "@/lib/dataset-schema";
import type { PlaygroundProps } from "../types";

export default function BitLights({
  data,
  onEvent,
  onArtifact,
}: PlaygroundProps) {
  const dataset = data as BitsDataset;
  const [bits, setBits] = useState<boolean[]>(
    () => Array(dataset.bitCount).fill(false),
  );
  const madeRef = useRef<number[]>([]);
  const [made, setMade] = useState<number[]>([]);

  // 왼쪽이 큰 자리다. 전구 여덟 개면 128, 64, 32 ... 1.
  const values = bits.map((_, i) => 2 ** (dataset.bitCount - 1 - i));
  const total = bits.reduce((sum, on, i) => sum + (on ? values[i] : 0), 0);
  const letter = dataset.table.find((one) => one.code === total) ?? null;

  function toggle(index: number) {
    const next = bits.map((on, i) => (i === index ? !on : on));
    setBits(next);

    const value = next.reduce((sum, on, i) => sum + (on ? values[i] : 0), 0);
    if (value === 0 || madeRef.current.includes(value)) return;

    const list = [...madeRef.current, value];
    madeRef.current = list;
    setMade(list);
    onEvent({ type: "made", payload: { value, count: list.length } });
    onArtifact({
      kind: "bit-lights",
      payload: { datasetId: dataset.id, made: list },
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        data-testid="readout"
        data-total={total}
        className="flex flex-col items-center gap-1 rounded-pop border-[3px] border-ink bg-paper p-3 shadow-[0_4px_0_var(--color-ink)]"
      >
        <span className="font-mono text-4xl font-black">{total}</span>
        <span data-testid="letter" className="text-lg font-extrabold">
          {letter ? `이 번호의 글자는 "${letter.char}"` : "이 번호인 글자는 없어"}
        </span>
      </div>

      <div data-testid="lights" className="flex justify-center gap-1">
        {bits.map((on, index) => (
          <button
            key={index}
            type="button"
            data-testid={`bit-${index}`}
            data-on={on ? "true" : "false"}
            onClick={() => toggle(index)}
            className="flex w-9 flex-col items-center gap-1"
          >
            <motion.span
              animate={{
                backgroundColor: on
                  ? "var(--color-candy-yellow)"
                  : "var(--color-paper)",
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full border-[2.5px] border-ink text-lg shadow-[0_3px_0_var(--color-ink)]"
            >
              {on ? "1" : "0"}
            </motion.span>
            {/* 자릿값을 함께 보여준다. 전구가 왜 그 숫자를 만드는지가 보여야 한다. */}
            <span className="font-mono text-[10px] font-bold text-muted">
              {values[index]}
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        data-testid="reset"
        onClick={() => setBits(Array(dataset.bitCount).fill(false))}
        className="self-center text-sm font-extrabold text-muted underline"
      >
        전부 끄기
      </button>

      {/* 전구가 모자라는 글자. 한글은 여덟 개로 안 된다. */}
      <div
        data-testid="wide-note"
        className="flex flex-col gap-1 rounded-pop border-[2.5px] border-ink bg-cream p-3 text-xs font-bold"
      >
        <span className="text-sm font-extrabold">전구가 모자란 글자도 있어</span>
        {dataset.wide.map((one) => (
          <span key={one.char} data-testid={`wide-${one.char}`}>
            {one.char} = {one.code} → 전구 {one.code.toString(2).length}개가 필요해
          </span>
        ))}
      </div>

      {made.length > 0 && (
        <p data-testid="made-count" className="text-xs font-bold text-muted">
          지금까지 숫자 {made.length}개를 만들었어
        </p>
      )}
    </div>
  );
}
