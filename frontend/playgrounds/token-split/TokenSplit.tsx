"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import type { TokensDataset } from "@/lib/dataset-schema";
import type { PlaygroundProps } from "../types";

export default function TokenSplit({
  data,
  onEvent,
  onArtifact,
}: PlaygroundProps) {
  const dataset = data as TokensDataset;
  const [itemId, setItemId] = useState<string | null>(null);
  const openedRef = useRef<string[]>([]);
  const [opened, setOpened] = useState<string[]>([]);

  const item = dataset.items.find((one) => one.id === itemId) ?? null;

  function open(id: string) {
    setItemId(id);

    if (!openedRef.current.includes(id)) {
      const next = [...openedRef.current, id];
      openedRef.current = next;
      setOpened(next);
      onArtifact({
        kind: "token-split",
        payload: { datasetId: dataset.id, itemIds: next },
      });
    }
    onEvent({ type: "split", payload: { itemId: id, count: openedRef.current.length } });
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        data-testid="piece-view"
        data-pieces={item ? item.pieces.length : 0}
        className="stage-dots flex min-h-32 flex-col gap-3 rounded-pop border-[3px] border-ink p-3 shadow-[0_4px_0_var(--color-ink)]"
      >
        {item === null ? (
          <span className="text-sm font-bold text-muted">
            아래에서 글을 하나 눌러봐!
          </span>
        ) : (
          <>
            <span className="text-lg font-black">{item.text}</span>

            <div className="flex flex-wrap items-center gap-1">
              {item.pieces.map((piece, index) => (
                <motion.span
                  key={index}
                  data-testid={`piece-${index}`}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className="flex flex-col items-center rounded-pop border-[2.5px] border-ink bg-cream px-2 py-1"
                >
                  <span className="text-sm font-extrabold">
                    {/* 앞에 띄어쓰기가 있었다는 표시를 아이가 알아볼 수 있게 바꾼다 */}
                    {piece.spaced && <span className="text-muted">␣</span>}
                    {piece.text}
                  </span>
                  <span className="font-mono text-[10px] font-bold text-muted">
                    {piece.number}
                  </span>
                </motion.span>
              ))}
            </div>

            <span className="text-xs font-bold text-muted">
              조각 {item.pieces.length}개 · 아래 숫자가 AI가 보는 글이야
            </span>
          </>
        )}
      </div>

      <div data-testid="text-picker" className="flex flex-wrap gap-2">
        {dataset.items.map((one) => (
          <button
            key={one.id}
            type="button"
            data-testid={`text-${one.id}`}
            data-current={itemId === one.id ? "true" : undefined}
            data-opened={opened.includes(one.id) ? "true" : undefined}
            onClick={() => open(one.id)}
            className="rounded-full border-[2.5px] border-ink px-3 py-1 text-sm font-extrabold text-ink shadow-[0_3px_0_var(--color-ink)]"
            style={{
              backgroundColor:
                itemId === one.id ? "var(--color-candy-yellow)" : "var(--color-paper)",
            }}
          >
            {one.text}
          </button>
        ))}
      </div>
    </div>
  );
}
