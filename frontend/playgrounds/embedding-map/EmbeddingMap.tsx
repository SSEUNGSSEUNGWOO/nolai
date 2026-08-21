"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import type { Dataset } from "@/lib/dataset-schema";
import type { PlaygroundProps } from "../types";
import WordChip from "./WordChip";
import { buildLinks } from "./geometry";

export default function EmbeddingMap({
  data,
  onEvent,
  onArtifact,
}: PlaygroundProps) {
  const dataset = data as Dataset;
  const [placedIds, setPlacedIds] = useState<string[]>([]);
  // 렌더링 사이 간격 없이 값을 즉시 반영해야 하므로 ref로 최신 상태를 따로 추적한다.
  // (state만 쓰면 같은 배치 안에서 연속으로 place()가 호출될 때 클로저가 오래된
  // placedIds를 읽어 먼저 놓인 단어가 사라진다.)
  const placedIdsRef = useRef<string[]>([]);

  const colorOf = useMemo(() => {
    const map = new Map(dataset.categories.map((c) => [c.id, c.color]));
    return (categoryId: string) => map.get(categoryId) ?? "#FFFFFF";
  }, [dataset.categories]);

  const placedWords = placedIds.map(
    (id) => dataset.words.find((w) => w.id === id)!,
  );
  const drawerWords = dataset.words.filter((w) => !placedIds.includes(w.id));
  const links = buildLinks(placedWords);

  function place(wordId: string) {
    const next = [...placedIdsRef.current, wordId];
    placedIdsRef.current = next;
    setPlacedIds(next);
    onEvent({
      type: "placed",
      payload: { wordId, placedCount: next.length },
    });

    if (next.length === dataset.words.length) {
      onArtifact({
        kind: "embedding-map",
        payload: { datasetId: dataset.id, placedIds: next },
      });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        data-testid="map-area"
        className="relative aspect-[4/3] w-full rounded-pop border-[3px] border-ink bg-paper shadow-[0_4px_0_var(--color-ink)]"
      >
        {/* 좌표 레이어 — 지도 테두리보다 안쪽으로 들여놓는다.
            칩은 좌표를 중심으로 그려지므로, 가장자리 칩이 지도 밖으로
            삐져나가지 않으려면 칩 반폭만큼의 여백이 필요하다. */}
        <div className="absolute inset-x-12 inset-y-6">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {links.map((link) => (
              <line
                key={`${link.fromId}-${link.toId}`}
                data-testid={`link-${link.fromId}-${link.toId}`}
                x1={link.from.x * 100}
                y1={link.from.y * 100}
                x2={link.to.x * 100}
                y2={link.to.y * 100}
                stroke="var(--color-ink)"
                strokeWidth={link.width}
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                opacity={link.opacity}
              />
            ))}
          </svg>

          {placedWords.map((word) => (
            <motion.div
              key={word.id}
              data-testid={`placed-word-${word.id}`}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              initial={{ scale: 1.3, opacity: 0.7 }}
              animate={{
                left: `${word.x * 100}%`,
                top: `${word.y * 100}%`,
                scale: 1,
                opacity: 1,
              }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
            >
              <WordChip
                testId={`chip-${word.id}`}
                label={word.label}
                emoji={word.emoji}
                color={colorOf(word.category)}
              />
            </motion.div>
          ))}
        </div>
      </div>

      <div data-testid="word-drawer" className="flex flex-wrap gap-2">
        {drawerWords.map((word) => (
          <WordChip
            key={word.id}
            testId={`drawer-word-${word.id}`}
            label={word.label}
            emoji={word.emoji}
            color={colorOf(word.category)}
            onActivate={() => place(word.id)}
          />
        ))}
      </div>
    </div>
  );
}
