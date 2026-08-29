"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import type { SentimentDataset } from "@/lib/dataset-schema";
import type { PlaygroundProps } from "../types";

type Side = "good" | "bad";

const FACE: Record<Side, string> = { good: "😊", bad: "😢" };
const NAME: Record<Side, string> = { good: "좋은 기분", bad: "안 좋은 기분" };

export default function FeelingDuel({
  data,
  onEvent,
  onArtifact,
}: PlaygroundProps) {
  const dataset = data as SentimentDataset;
  const [sentenceId, setSentenceId] = useState<string | null>(null);
  const [myGuess, setMyGuess] = useState<Side | null>(null);
  const judgedRef = useRef<string[]>([]);
  const [judged, setJudged] = useState<string[]>([]);

  const sentence = dataset.sentences.find((one) => one.id === sentenceId) ?? null;
  // 아이가 먼저 고르기 전에는 AI의 답을 보여주지 않는다. 보고 나면 대결이 아니다.
  const revealed = sentence !== null && myGuess !== null;

  const wins = judged.filter((id) => {
    const one = dataset.sentences.find((s) => s.id === id)!;
    return one.aiSays !== one.answer;
  }).length;

  function open(id: string) {
    setSentenceId(id);
    setMyGuess(null);
  }

  function guess(side: Side) {
    if (!sentence || myGuess !== null) return;
    setMyGuess(side);

    if (judgedRef.current.includes(sentence.id)) return;
    const next = [...judgedRef.current, sentence.id];
    judgedRef.current = next;
    setJudged(next);
    onEvent({ type: "judged", payload: { sentenceId: sentence.id, count: next.length } });
    onArtifact({
      kind: "feeling-duel",
      payload: { datasetId: dataset.id, judged: next },
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        data-testid="duel-card"
        data-revealed={revealed ? "true" : undefined}
        className="stage-dots flex min-h-40 flex-col gap-3 rounded-pop border-[3px] border-ink p-3 shadow-[0_4px_0_var(--color-ink)]"
      >
        {sentence === null ? (
          <span className="text-sm font-bold text-muted">
            아래에서 문장을 하나 골라봐!
          </span>
        ) : (
          <>
            <span className="text-lg font-black">{sentence.text}</span>

            {myGuess === null ? (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-bold text-muted">
                  너는 어떤 기분 같아?
                </span>
                <div className="flex gap-2">
                  {(["good", "bad"] as const).map((side) => (
                    <button
                      key={side}
                      type="button"
                      data-testid={`guess-${side}`}
                      onClick={() => guess(side)}
                      className="flex-1 rounded-pop border-[2.5px] border-ink bg-cream px-3 py-2 text-sm font-extrabold text-ink shadow-[0_3px_0_var(--color-ink)]"
                    >
                      {FACE[side]} {NAME[side]}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-2"
              >
                <div className="flex flex-wrap gap-2 text-sm font-extrabold">
                  <span
                    data-testid="my-verdict"
                    data-right={myGuess === sentence.answer ? "true" : "false"}
                    className="rounded-full border-2 border-ink bg-candy-yellow px-3 py-1"
                  >
                    너: {FACE[myGuess]} {myGuess === sentence.answer ? "맞음" : "아쉽"}
                  </span>
                  <span
                    data-testid="ai-verdict"
                    data-right={sentence.aiSays === sentence.answer ? "true" : "false"}
                    className="rounded-full border-2 border-ink px-3 py-1"
                    style={{
                      backgroundColor:
                        sentence.aiSays === sentence.answer
                          ? "var(--color-candy-teal)"
                          : "var(--color-candy-red)",
                    }}
                  >
                    AI: {FACE[sentence.aiSays]} {Math.round(sentence.confidence * 100)}% 확신
                  </span>
                </div>

                {sentence.aiSays !== sentence.answer && (
                  <p data-testid="ai-wrong" className="text-sm font-extrabold">
                    🎉 네가 이겼어! AI가 이렇게 자신 있게 틀렸네.
                  </p>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>

      {judged.length > 0 && (
        <p data-testid="score" className="text-xs font-bold text-muted">
          {judged.length}개 해봤고, AI를 {wins}번 이겼어
        </p>
      )}

      <div data-testid="sentence-picker" className="flex flex-wrap gap-2">
        {dataset.sentences.map((one) => (
          <button
            key={one.id}
            type="button"
            data-testid={`sentence-${one.id}`}
            data-done={judged.includes(one.id) ? "true" : undefined}
            onClick={() => open(one.id)}
            className="rounded-full border-[2.5px] border-ink px-3 py-1 text-sm font-extrabold text-ink shadow-[0_3px_0_var(--color-ink)]"
            style={{
              backgroundColor:
                sentenceId === one.id
                  ? "var(--color-candy-yellow)"
                  : judged.includes(one.id)
                    ? "var(--color-cream)"
                    : "var(--color-paper)",
            }}
          >
            {one.text}
          </button>
        ))}
      </div>
    </div>
  );
}
