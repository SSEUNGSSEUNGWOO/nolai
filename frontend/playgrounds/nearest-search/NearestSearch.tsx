"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import type { PassagesDataset } from "@/lib/dataset-schema";
import type { PlaygroundProps } from "../types";
import { MAX_RADIUS, pointAt, radiusOf, topIndexes } from "./geometry";

const TOP_K = 3;

/** 1·2·3등에 쓰는 색. 순위가 번호만이 아니라 색으로도 구별되게 한다. */
const RANK_COLORS = [
  "var(--color-candy-red)",
  "var(--color-candy-teal)",
  "var(--color-candy-yellow)",
];

export default function NearestSearch({
  data,
  onEvent,
  onArtifact,
}: PlaygroundProps) {
  const dataset = data as PassagesDataset;
  const [askedIds, setAskedIds] = useState<string[]>([]);
  // EmbeddingMap과 같은 이유로 ref를 함께 둔다: 같은 배치 안에서 연달아
  // ask()가 불리면 state 클로저가 오래된 값을 읽는다.
  const askedIdsRef = useRef<string[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const current = dataset.questions.find((q) => q.id === currentId) ?? null;
  const rankOf = new Map(
    current ? topIndexes(current.sims, TOP_K).map((i, rank) => [i, rank]) : [],
  );

  function ask(questionId: string) {
    setCurrentId(questionId);

    // 같은 질문을 다시 눌러도 화면은 바뀌지만 "해본 개수"는 늘지 않는다.
    if (askedIdsRef.current.includes(questionId)) return;

    const next = [...askedIdsRef.current, questionId];
    askedIdsRef.current = next;
    setAskedIds(next);

    onEvent({
      type: "searched",
      payload: { questionId, count: next.length },
    });

    onArtifact({
      kind: "nearest-search",
      payload: { datasetId: dataset.id, questionIds: next },
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        data-testid="search-map"
        className="relative aspect-square w-full rounded-pop border-[3px] border-ink bg-paper shadow-[0_4px_0_var(--color-ink)]"
      >
        {/* 좌표 레이어 — 가장 바깥 점이 테두리에 물리지 않도록 들여놓는다. */}
        <div className="absolute inset-5">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {current &&
              dataset.passages.map((passage, index) => {
                const rank = rankOf.get(index);
                if (rank === undefined) return null;

                const point = pointAt(
                  passage.angle,
                  radiusOf(current.sims[index], dataset.simRange),
                );

                return (
                  <motion.line
                    key={passage.id}
                    data-testid={`ray-${passage.id}`}
                    x1={50}
                    y1={50}
                    animate={{ x2: point.x * 100, y2: point.y * 100 }}
                    initial={false}
                    stroke={RANK_COLORS[rank]}
                    strokeWidth={7 - rank * 2}
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    transition={{ type: "spring", stiffness: 160, damping: 20 }}
                  />
                );
              })}
          </svg>

          {dataset.passages.map((passage, index) => {
            const rank = rankOf.get(index);
            const hit = rank !== undefined;
            // 질문을 아직 안 골랐으면 전부 바깥 원에 늘어서 있다.
            const radius = current
              ? radiusOf(current.sims[index], dataset.simRange)
              : MAX_RADIUS;
            const point = pointAt(passage.angle, radius);

            return (
              <motion.div
                key={passage.id}
                data-testid={`passage-dot-${passage.id}`}
                data-rank={hit ? rank + 1 : undefined}
                title={passage.text}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[2.5px] border-ink text-xs font-extrabold text-ink"
                initial={false}
                animate={{
                  left: `${point.x * 100}%`,
                  top: `${point.y * 100}%`,
                  width: hit ? 26 : 12,
                  height: hit ? 26 : 12,
                  backgroundColor: hit
                    ? RANK_COLORS[rank]
                    : "var(--color-paper)",
                }}
                transition={{ type: "spring", stiffness: 160, damping: 20 }}
              >
                {hit ? rank + 1 : ""}
              </motion.div>
            );
          })}

          {current && (
            <motion.div
              key={current.id}
              data-testid="question-marker"
              // 이모지는 글리프가 텍스트 상자 안에서 치우쳐 그려진다. 크기를
              // 정한 상자 안에 가운데 정렬해야 광선이 시작하는 (50,50)과 별의
              // 눈에 보이는 중심이 맞는다.
              className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-3xl leading-none"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 14 }}
            >
              ⭐
            </motion.div>
          )}
        </div>
      </div>

      {current && (
        <ol data-testid="match-list" className="flex flex-col gap-2">
          {topIndexes(current.sims, TOP_K).map((index, rank) => (
            <li
              key={dataset.passages[index].id}
              data-testid={`match-${rank + 1}`}
              className="flex items-center gap-2 rounded-pop border-[2.5px] border-ink bg-paper px-3 py-2 text-sm font-bold text-ink"
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-ink text-xs font-extrabold"
                style={{ backgroundColor: RANK_COLORS[rank] }}
              >
                {rank + 1}
              </span>
              {dataset.passages[index].text}
            </li>
          ))}
        </ol>
      )}

      {/* 질문이 20장이고 문장이라 길다. 그대로 늘어놓으면 놀이터 아래에 오는
          노리 말풍선과 "다 했어요" 버튼이 화면 밖으로 밀려 아이가 안내도 못 보고
          다음으로 넘어가지도 못한다. 서랍 안에서만 스크롤되게 높이를 묶는다. */}
      <div
        data-testid="question-drawer"
        className="flex max-h-[38vh] flex-wrap gap-2 overflow-y-auto rounded-pop border-[2.5px] border-ink bg-cream p-2"
      >
        {dataset.questions.map((question) => (
          <button
            key={question.id}
            type="button"
            data-testid={`question-${question.id}`}
            data-asked={askedIds.includes(question.id) ? "true" : undefined}
            onClick={() => ask(question.id)}
            className="rounded-full border-[2.5px] border-ink px-3 py-1 text-sm font-extrabold text-ink shadow-[0_3px_0_var(--color-ink)]"
            style={{
              backgroundColor:
                question.id === currentId
                  ? "var(--color-candy-yellow)"
                  : "var(--color-paper)",
            }}
          >
            {question.text}
          </button>
        ))}
      </div>
    </div>
  );
}
