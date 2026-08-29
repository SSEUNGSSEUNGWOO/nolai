"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import type { SimilarityDataset } from "@/lib/dataset-schema";
import type { PlaygroundProps } from "../types";

/** 막대를 그릴 때 쓰는 눈금. 데이터셋 전체의 최소·최대에서 뽑는다. */
function range(sims: Record<string, number>): { min: number; max: number } {
  const values = Object.values(sims);

  return { min: Math.min(...values), max: Math.max(...values) };
}

export default function CompareMeter({
  data,
  onEvent,
  onArtifact,
}: PlaygroundProps) {
  const dataset = data as SimilarityDataset;
  const [picked, setPicked] = useState<string[]>([]);
  const comparedRef = useRef<string[]>([]);

  const scale = range(dataset.sims);
  const [left, right] = picked;
  const score =
    left && right
      ? (dataset.sims[`${left}|${right}`] ?? dataset.sims[`${right}|${left}`])
      : null;

  const wordById = new Map(dataset.words.map((w) => [w.id, w]));
  const colorOf = new Map(dataset.categories.map((c) => [c.id, c.color]));

  function choose(id: string) {
    // 두 개까지만 고른다. 세 번째를 누르면 앞의 것이 밀려난다.
    const next = picked.includes(id)
      ? picked.filter((one) => one !== id)
      : [...picked, id].slice(-2);
    setPicked(next);
    if (next.length < 2) return;

    const key = [next[0], next[1]].join("|");
    if (comparedRef.current.includes(key)) return;

    comparedRef.current = [...comparedRef.current, key];
    onEvent({ type: "compared", payload: { key, count: comparedRef.current.length } });
    onArtifact({
      kind: "compare-meter",
      payload: { datasetId: dataset.id, compared: comparedRef.current },
    });
  }

  const filled =
    score === null
      ? 0
      : Math.max(
          3,
          ((score - scale.min) / Math.max(0.0001, scale.max - scale.min)) * 100,
        );

  return (
    <div className="flex flex-col gap-3">
      <div
        data-testid="meter"
        data-score={score === null ? undefined : score.toFixed(3)}
        className="stage-dots flex flex-col gap-2 rounded-pop border-[3px] border-ink p-3 shadow-[0_4px_0_var(--color-ink)]"
      >
        <div className="flex items-center justify-center gap-2 text-lg font-black">
          <span data-testid="meter-left">
            {left ? `${wordById.get(left)!.emoji} ${wordById.get(left)!.label}` : "❓"}
          </span>
          <span className="text-muted">↔</span>
          <span data-testid="meter-right">
            {right ? `${wordById.get(right)!.emoji} ${wordById.get(right)!.label}` : "❓"}
          </span>
        </div>

        <div className="h-4 w-full overflow-hidden rounded-full border-2 border-ink bg-cream">
          <motion.div
            className="h-full bg-candy-red"
            initial={false}
            animate={{ width: `${filled}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 24 }}
          />
        </div>

        <span className="text-center font-mono text-sm font-extrabold">
          {score === null ? (
            <span className="font-sans text-muted">단어 두 개를 골라봐!</span>
          ) : (
            `닮은 정도 ${score.toFixed(2)}`
          )}
        </span>
      </div>

      <div data-testid="word-picker" className="flex flex-wrap gap-2">
        {dataset.words.map((word) => (
          <button
            key={word.id}
            type="button"
            data-testid={`word-${word.id}`}
            data-picked={picked.includes(word.id) ? "true" : undefined}
            onClick={() => choose(word.id)}
            className="rounded-full border-[2.5px] border-ink px-3 py-1 text-sm font-extrabold text-ink shadow-[0_3px_0_var(--color-ink)]"
            style={{
              backgroundColor: picked.includes(word.id)
                ? (colorOf.get(word.category) ?? "var(--color-candy-yellow)")
                : "var(--color-paper)",
            }}
          >
            {word.emoji} {word.label}
          </button>
        ))}
      </div>
    </div>
  );
}
