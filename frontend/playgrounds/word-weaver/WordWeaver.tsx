"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import type { NextWordDataset } from "@/lib/dataset-schema";
import type { PlaygroundProps } from "../types";

export default function WordWeaver({
  data,
  onEvent,
  onArtifact,
}: PlaygroundProps) {
  const dataset = data as NextWordDataset;
  const [words, setWords] = useState<string[]>([]);
  const doneRef = useRef<string[][]>([]);
  const [done, setDone] = useState<string[][]>([]);

  const last = words[words.length - 1];
  const options = last ? (dataset.next[last] ?? []) : null;
  const ended = words.length > 0 && (options === null || options.length === 0);

  function add(word: string) {
    setWords((current) => [...current, word]);
  }

  function finish(made: string[]) {
    if (made.length < 2) return;

    const next = [...doneRef.current, made];
    doneRef.current = next;
    setDone(next);
    onEvent({ type: "wrote", payload: { count: next.length } });
    onArtifact({
      kind: "word-weaver",
      payload: { datasetId: dataset.id, sentences: next },
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 아이가 만든 문장. 한 단어씩 붙는 것이 보여야 "한 번에 하나씩"이 읽힌다. */}
      <div
        data-testid="sentence"
        className="flex min-h-16 flex-wrap items-center gap-1 rounded-pop border-[3px] border-ink bg-paper p-3 text-lg font-black shadow-[0_4px_0_var(--color-ink)]"
      >
        {words.length === 0 ? (
          <span className="text-sm font-bold text-muted">
            아래에서 첫 말을 골라봐!
          </span>
        ) : (
          words.map((word, index) => (
            <motion.span
              key={`${word}-${index}`}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {word}
            </motion.span>
          ))
        )}
      </div>

      {words.length === 0 ? (
        <div data-testid="start-picker" className="flex flex-wrap gap-2">
          {dataset.starts.map((word) => (
            <button
              key={word}
              type="button"
              data-testid={`start-${word}`}
              onClick={() => add(word)}
              className="rounded-full border-[2.5px] border-ink bg-paper px-3 py-1 text-sm font-extrabold text-ink shadow-[0_3px_0_var(--color-ink)]"
            >
              {word}
            </button>
          ))}
        </div>
      ) : ended ? (
        <div className="flex flex-col gap-2">
          <p data-testid="ended" className="text-sm font-extrabold">
            여기서 끝! 이 말 다음은 본 적이 없어.
          </p>
          <button
            type="button"
            data-testid="save-sentence"
            onClick={() => {
              finish(words);
              setWords([]);
            }}
            className="rounded-pop border-[2.5px] border-ink bg-candy-teal px-5 py-2 font-extrabold text-ink shadow-[0_3px_0_var(--color-ink)]"
          >
            새 문장 만들기
          </button>
        </div>
      ) : (
        <div data-testid="word-options" className="flex flex-col gap-2">
          {options!.map((option) => (
            <button
              key={option.word}
              type="button"
              data-testid={`next-${option.word}`}
              data-p={option.p.toFixed(2)}
              onClick={() => add(option.word)}
              className="flex items-center gap-2 rounded-pop border-[2.5px] border-ink bg-paper px-3 py-2 text-left text-sm font-extrabold text-ink shadow-[0_3px_0_var(--color-ink)]"
            >
              <span className="min-w-20">{option.word}</span>
              {/* 확률을 막대로 보여준다. 어떤 말이 더 자주 왔는지가 곧 AI의 "감"이다. */}
              <span className="h-3 flex-1 overflow-hidden rounded-full border-2 border-ink bg-cream">
                <span
                  className="block h-full bg-candy-red"
                  style={{ width: `${Math.max(6, option.p * 100)}%` }}
                />
              </span>
              <span className="font-mono text-xs text-muted">
                {Math.round(option.p * 100)}%
              </span>
            </button>
          ))}
        </div>
      )}

      {done.length > 0 && (
        <p data-testid="made-count" className="text-xs font-bold text-muted">
          지금까지 {done.length}개 만들었어
        </p>
      )}
    </div>
  );
}
