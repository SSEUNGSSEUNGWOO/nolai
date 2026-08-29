"use client";

import { useRef, useState } from "react";
import WordIcon from "@/components/WordIcon";
import { motion } from "motion/react";
import type { ClustersDataset } from "@/lib/dataset-schema";
import type { PlaygroundProps } from "../types";

/** 무리마다 다른 색. 사람이 붙인 갈래 색과 일부러 다르게 쓴다. */
const GROUP_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#FFD93D",
  "#A78BFA",
  "#F59E0B",
];

export default function SelfCluster({
  data,
  onEvent,
  onArtifact,
}: PlaygroundProps) {
  const dataset = data as ClustersDataset;
  const options = Object.keys(dataset.groupings)
    .map(Number)
    .sort((a, b) => a - b);

  const [k, setK] = useState<number | null>(null);
  const triedRef = useRef<number[]>([]);
  const [tried, setTried] = useState<number[]>([]);

  const assigned = k === null ? null : dataset.groupings[String(k)];

  function divide(count: number) {
    setK(count);

    if (!triedRef.current.includes(count)) {
      const next = [...triedRef.current, count];
      triedRef.current = next;
      setTried(next);
      onArtifact({
        kind: "self-cluster",
        payload: { datasetId: dataset.id, triedGroupings: next },
      });
    }
    onEvent({ type: "grouped", payload: { k: count, count: triedRef.current.length } });
  }

  return (
    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start lg:gap-5">
      <div
        data-testid="cluster-map"
        data-k={k ?? 0}
        className="stage-grid relative aspect-[4/3] w-full overflow-hidden rounded-pop border-[3px] border-ink shadow-[0_4px_0_var(--color-ink)]"
      >
        <div className="absolute inset-x-12 inset-y-6">
          {dataset.words.map((word, index) => {
            const group = assigned ? assigned[index] : null;

            return (
              <motion.div
                key={word.id}
                data-testid={`word-${word.id}`}
                data-group={group ?? undefined}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                initial={false}
                animate={{ left: `${word.x * 100}%`, top: `${word.y * 100}%` }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <motion.span
                  // 무리가 정해지기 전에는 전부 같은 색이다. "아직 아무도
                  // 안 나눴다"가 눈에 보여야 나눈 뒤의 변화가 읽힌다.
                  animate={{
                    backgroundColor:
                      group === null
                        ? "var(--color-paper)"
                        : GROUP_COLORS[group % GROUP_COLORS.length],
                  }}
                  className="inline-block whitespace-nowrap rounded-full border-[2.5px] border-ink px-2 py-0.5 text-xs font-extrabold text-ink shadow-[0_2px_0_var(--color-ink)]"
                >
                  <WordIcon wordId={word.id} emoji={word.emoji} /> {word.label}
                </motion.span>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div data-testid="k-picker" className="flex flex-wrap gap-2">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              data-testid={`k-${option}`}
              data-current={k === option ? "true" : undefined}
              data-tried={tried.includes(option) ? "true" : undefined}
              onClick={() => divide(option)}
              className="rounded-pop border-[2.5px] border-ink px-4 py-2 text-sm font-extrabold text-ink shadow-[0_3px_0_var(--color-ink)]"
              style={{
                backgroundColor:
                  k === option ? "var(--color-candy-yellow)" : "var(--color-paper)",
              }}
            >
              {option}개로 나눠
            </button>
          ))}
        </div>

        <p data-testid="cluster-note" className="text-xs font-bold text-muted">
          {k === null
            ? "몇 개로 나눌지 정해줘. 컴퓨터가 알아서 나눌 거야."
            : `컴퓨터가 ${k}개 무리로 나눴어. 이상한 게 섞여 있는지 봐!`}
        </p>
      </div>
    </div>
  );
}
