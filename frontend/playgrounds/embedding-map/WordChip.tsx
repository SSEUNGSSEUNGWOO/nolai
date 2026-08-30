"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import WordIcon from "@/components/WordIcon";

interface WordChipProps {
  wordId: string;
  label: string;
  emoji: string;
  color: string;
  testId: string;
  /** 처음 놓을 칩을 빛나게 한다. "어느 걸 집어야 하지"를 없앤다. */
  highlight?: boolean;
  onActivate?: () => void;
  onDragStart?: (event: ReactPointerEvent) => void;
}

const chipClassName =
  "inline-block whitespace-nowrap rounded-full border-[2.5px] border-ink px-3 py-1 text-sm font-extrabold text-ink shadow-[0_3px_0_var(--color-ink)]";

export default function WordChip({
  wordId,
  label,
  emoji,
  color,
  testId,
  highlight = false,
  onActivate,
  onDragStart,
}: WordChipProps) {
  // 배치가 끝난 칩은 누를 게 없다. button으로 두면 키보드로 넘길 때
  // 아무 일도 안 하는 정거장이 열댓 개 생긴다.
  if (!onActivate) {
    return (
      <span data-testid={testId} style={{ backgroundColor: color }} className={chipClassName}>
        <WordIcon wordId={wordId} emoji={emoji} /> {label}
      </span>
    );
  }

  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onActivate}
      onPointerDown={onDragStart}
      style={{ backgroundColor: color, touchAction: "none" }}
      className={`${chipClassName} ${highlight ? "pulse-card" : ""}`}
    >
      <WordIcon wordId={wordId} emoji={emoji} /> {label}
    </button>
  );
}
