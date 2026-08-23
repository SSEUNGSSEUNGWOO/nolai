"use client";

import { useMemo, useRef, useState } from "react";
import WordIcon from "@/components/WordIcon";
import { motion } from "motion/react";
import type { WordsDataset } from "@/lib/dataset-schema";
import type { PlaygroundProps } from "../types";
import { recommend } from "./geometry";

const HOW_MANY = 3;

export default function LikeRecommender({
  data,
  onEvent,
  onArtifact,
}: PlaygroundProps) {
  const dataset = data as WordsDataset;
  const [liked, setLiked] = useState<string[]>([]);
  // 같은 배치 안에서 연달아 눌릴 때 오래된 값을 읽지 않도록 ref를 함께 둔다.
  const likedRef = useRef<string[]>([]);

  const wordById = useMemo(
    () => new Map(dataset.words.map((word) => [word.id, word])),
    [dataset.words],
  );
  const colorOf = useMemo(() => {
    const map = new Map(dataset.categories.map((c) => [c.id, c.color]));
    return (categoryId: string) => map.get(categoryId) ?? "var(--color-paper)";
  }, [dataset.categories]);

  const picks = recommend(
    dataset.words.map((word) => ({ id: word.id, x: word.x, y: word.y })),
    liked,
    HOW_MANY,
  );

  function toggle(wordId: string) {
    const current = likedRef.current;
    const next = current.includes(wordId)
      ? current.filter((id) => id !== wordId)
      : [...current, wordId];

    likedRef.current = next;
    setLiked(next);

    // 취소도 취향을 바꾸는 일이라 그대로 올려보낸다. 러너는 개수만 본다.
    onEvent({ type: "liked", payload: { wordId, count: next.length } });
    onArtifact({
      kind: "like-recommender",
      payload: { datasetId: dataset.id, likedIds: next },
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div data-testid="like-shelf" className="flex flex-wrap gap-2">
        {dataset.words.map((word) => {
          const isLiked = liked.includes(word.id);

          return (
            <button
              key={word.id}
              type="button"
              data-testid={`item-${word.id}`}
              data-liked={isLiked ? "true" : undefined}
              onClick={() => toggle(word.id)}
              className="rounded-full border-[2.5px] border-ink px-3 py-1 text-sm font-extrabold text-ink shadow-[0_3px_0_var(--color-ink)]"
              style={{
                backgroundColor: isLiked
                  ? colorOf(word.category)
                  : "var(--color-paper)",
              }}
            >
              {isLiked ? "❤️ " : ""}
              <WordIcon wordId={word.id} emoji={word.emoji} /> {word.label}
            </button>
          );
        })}
      </div>

      {picks.length > 0 && (
        <div
          data-testid="recommendations"
          className="flex flex-col gap-2 rounded-pop border-[3px] border-ink bg-paper p-3 shadow-[0_4px_0_var(--color-ink)]"
        >
          <span className="text-sm font-extrabold">이건 어때?</span>

          {picks.map((pick, rank) => {
            const word = wordById.get(pick.id)!;
            const via = wordById.get(pick.viaId)!;

            return (
              <motion.div
                key={pick.id}
                data-testid={`pick-${pick.id}`}
                data-via={pick.viaId}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: rank * 0.08 }}
                className="flex flex-wrap items-center gap-2"
              >
                <span
                  className="rounded-full border-2 border-ink px-2 py-0.5 text-sm font-extrabold"
                  style={{ backgroundColor: colorOf(word.category) }}
                >
                  <WordIcon wordId={word.id} emoji={word.emoji} /> {word.label}
                </span>
                {/* 왜 골랐는지를 늘 함께 보여준다. 이유 없는 추천은 마술처럼
                    보이고, 이 레슨은 그 마술을 걷어내는 것이 목적이다. */}
                <span className="text-xs font-bold text-muted">
                  네가 좋아한 <WordIcon wordId={via.id} emoji={via.emoji} size={16} /> {via.label}와 닮아서
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
