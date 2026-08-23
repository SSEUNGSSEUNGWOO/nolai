"use client";

import { useMemo, useRef, useState } from "react";
import WordIcon from "@/components/WordIcon";
import { motion } from "motion/react";
import type { WordsDataset } from "@/lib/dataset-schema";
import type { PlaygroundProps } from "../types";
import { guessAll, type Example } from "./geometry";

export default function TeachSorter({
  data,
  onEvent,
  onArtifact,
}: PlaygroundProps) {
  const dataset = data as WordsDataset;

  /** 아이가 어느 단어를 어느 상자에 넣었는지. 넣은 순서를 지킨다. */
  const [taught, setTaught] = useState<{ wordId: string; categoryId: string }[]>([]);
  const taughtRef = useRef<{ wordId: string; categoryId: string }[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [asked, setAsked] = useState(false);

  const wordById = useMemo(
    () => new Map(dataset.words.map((word) => [word.id, word])),
    [dataset.words],
  );

  const taughtIds = new Set(taught.map((t) => t.wordId));
  const drawer = dataset.words.filter((word) => !taughtIds.has(word.id));

  const examples: Example[] = taught.map((t) => {
    const word = wordById.get(t.wordId)!;
    return { id: word.id, x: word.x, y: word.y, categoryId: t.categoryId };
  });

  const guesses = asked
    ? guessAll(
        drawer.map((word) => ({ id: word.id, x: word.x, y: word.y })),
        examples,
      )
    : [];
  const guessById = new Map(guesses.map((g) => [g.id, g]));

  function teach(categoryId: string) {
    if (!picked) return;

    const next = [...taughtRef.current, { wordId: picked, categoryId }];
    taughtRef.current = next;
    setTaught(next);
    setPicked(null);
    // 예시가 바뀌면 컴퓨터의 답도 다시 받아야 한다.
    setAsked(false);

    onEvent({ type: "taught", payload: { wordId: picked, count: next.length } });
    onArtifact({
      kind: "teach-sorter",
      payload: {
        datasetId: dataset.id,
        taught: next.map((t) => ({ wordId: t.wordId, categoryId: t.categoryId })),
      },
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        {dataset.categories.map((category) => {
          const mine = taught.filter((t) => t.categoryId === category.id);
          const guessed = guesses.filter((g) => g.categoryId === category.id);

          return (
            <button
              key={category.id}
              type="button"
              data-testid={`box-${category.id}`}
              disabled={!picked}
              onClick={() => teach(category.id)}
              className="flex min-h-40 flex-col gap-2 rounded-pop border-[3px] border-ink bg-paper p-2 text-left shadow-[0_4px_0_var(--color-ink)] disabled:cursor-default"
              style={{ borderColor: picked ? category.color : undefined }}
            >
              <span
                className="self-start rounded-full border-2 border-ink px-2 py-0.5 text-xs font-extrabold"
                style={{ backgroundColor: category.color }}
              >
                {category.label}
              </span>

              <span className="flex flex-wrap gap-1">
                {mine.map((t) => (
                  <span
                    key={t.wordId}
                    data-testid={`taught-${t.wordId}`}
                    className="rounded-full border-2 border-ink px-2 py-0.5 text-xs font-extrabold"
                    style={{ backgroundColor: category.color }}
                  >
                    <WordIcon wordId={t.wordId} emoji={wordById.get(t.wordId)!.emoji} /> {wordById.get(t.wordId)!.label}
                  </span>
                ))}

                {/* 컴퓨터가 넣은 것은 흐리게. 아이가 넣은 것과 구별되어야 한다. */}
                {guessed.map((g) => {
                  const word = wordById.get(g.id)!;
                  const right = word.category === g.categoryId;

                  return (
                    <motion.span
                      key={g.id}
                      data-testid={`guessed-${g.id}`}
                      data-right={right ? "true" : "false"}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="rounded-full border-2 border-dashed border-ink bg-cream px-2 py-0.5 text-xs font-bold"
                    >
                      <WordIcon wordId={word.id} emoji={word.emoji} /> {word.label} {right ? "" : "❓"}
                    </motion.span>
                  );
                })}
              </span>
            </button>
          );
        })}
      </div>

      <div data-testid="teach-drawer" className="flex flex-wrap gap-2">
        {drawer.map((word) => (
          <button
            key={word.id}
            type="button"
            data-testid={`word-${word.id}`}
            data-picked={picked === word.id ? "true" : undefined}
            onClick={() => setPicked(picked === word.id ? null : word.id)}
            className="rounded-full border-[2.5px] border-ink px-3 py-1 text-sm font-extrabold text-ink shadow-[0_3px_0_var(--color-ink)]"
            style={{
              backgroundColor:
                picked === word.id ? "var(--color-candy-yellow)" : "var(--color-paper)",
              opacity: guessById.has(word.id) ? 0.45 : 1,
            }}
          >
            <WordIcon wordId={word.id} emoji={word.emoji} /> {word.label}
          </button>
        ))}
      </div>

      {taught.length > 0 && !asked && (
        <button
          type="button"
          data-testid="ask-computer"
          onClick={() => setAsked(true)}
          className="rounded-pop border-[2.5px] border-ink bg-candy-teal px-5 py-2 font-extrabold text-ink shadow-[0_3px_0_var(--color-ink)]"
        >
          컴퓨터한테 물어보기
        </button>
      )}
    </div>
  );
}
