"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import type { WordsDataset } from "@/lib/dataset-schema";
import type { PlaygroundProps } from "../types";
import WordChip from "./WordChip";
import { buildLinks, isInsideRect } from "./geometry";

interface DragState {
  wordId: string;
  pointerId: number;
  x: number;
  y: number;
}

export default function EmbeddingMap({
  data,
  onEvent,
  onArtifact,
}: PlaygroundProps) {
  const dataset = data as WordsDataset;
  const [placedIds, setPlacedIds] = useState<string[]>([]);
  // 렌더링 사이 간격 없이 값을 즉시 반영해야 하므로 ref로 최신 상태를 따로 추적한다.
  // (state만 쓰면 같은 배치 안에서 연속으로 place()가 호출될 때 클로저가 오래된
  // placedIds를 읽어 먼저 놓인 단어가 사라진다.)
  const placedIdsRef = useRef<string[]>([]);
  const [drag, setDrag] = useState<DragState | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const wordById = useMemo(
    () => new Map(dataset.words.map((w) => [w.id, w])),
    [dataset.words],
  );

  // 서랍과 끌고 가는 중인 칩은 전부 같은 색이다. 갈래 색은 지도에 내려앉은
  // 뒤에만 붙는다 -- 놓기 전에 색이 갈리면 "비슷한 것끼리 모인다"를 아이가
  // 발견하기 전에 색이 답을 말해버린다.
  const undecided = "#FFFFFF";
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
    if (placedIdsRef.current.includes(wordId)) return;

    const next = [...placedIdsRef.current, wordId];
    placedIdsRef.current = next;
    setPlacedIds(next);
    onEvent({
      type: "placed",
      payload: { wordId, count: next.length },
    });

    onArtifact({
      kind: "embedding-map",
      payload: { datasetId: dataset.id, placedIds: next },
    });
  }

  const draggingId = drag?.wordId ?? null;
  const draggingPointerId = drag?.pointerId ?? null;

  useEffect(() => {
    if (!draggingId) return;
    const wordId = draggingId;

    // blur는 pointerId가 없는 일반 Event이므로 어느 손가락이든 무조건 취소한다.
    function cancelUnconditionally() {
      setDrag(null);
    }

    function move(event: PointerEvent) {
      if (event.pointerId !== draggingPointerId) return;

      // 창 밖에서 손을 뗐다가 다시 들어온 경우, 눌린 버튼이 없다.
      // 이걸 안 잡으면 유령 칩이 커서를 영원히 따라다닌다.
      if (event.buttons === 0) {
        cancelUnconditionally();
        return;
      }

      setDrag((current) =>
        current ? { ...current, x: event.clientX, y: event.clientY } : current,
      );
    }

    function up(event: PointerEvent) {
      if (event.pointerId !== draggingPointerId) return;

      const rect = mapRef.current?.getBoundingClientRect();
      setDrag(null);

      if (rect && isInsideRect({ x: event.clientX, y: event.clientY }, rect)) {
        place(wordId);
      }
    }

    function pointercancel(event: PointerEvent) {
      if (event.pointerId !== draggingPointerId) return;
      cancelUnconditionally();
    }

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", pointercancel);
    window.addEventListener("blur", cancelUnconditionally);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", pointercancel);
      window.removeEventListener("blur", cancelUnconditionally);
    };
    // place는 ref를 통해 최신 상태를 읽으므로 의존성에 넣지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingId, draggingPointerId]);

  return (
    // 넓은 화면에서는 지도 옆에 서랍을 세운다. 지도가 커지면 칩이 덜 겹치고,
    // 서랍이 아래로 길게 늘어지지 않아 부엉이 말풍선이 화면 안에 남는다.
    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:gap-5">
      <div
        ref={mapRef}
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
              {/* 내려앉는 순간 링이 퍼진다. 한 번 그리고 끝. */}
              <motion.span
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 rounded-full border-[3px] border-candy-teal"
                style={{ x: "-50%", y: "-50%" }}
                initial={{ scale: 0.4, opacity: 0.9 }}
                animate={{ scale: 2.4, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
              <WordChip
                testId={`chip-${word.id}`}
                wordId={word.id}
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
            wordId={word.id}
            label={word.label}
            emoji={word.emoji}
            color={undecided}
            onActivate={() => place(word.id)}
            onDragStart={(event) =>
              setDrag({
                wordId: word.id,
                pointerId: event.pointerId,
                x: event.clientX,
                y: event.clientY,
              })
            }
          />
        ))}
      </div>

      {drag && wordById.get(drag.wordId) && (
        <div
          data-testid="drag-ghost"
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 opacity-80"
          style={{ left: drag.x, top: drag.y }}
        >
          <WordChip
            testId={`ghost-${drag.wordId}`}
            wordId={drag.wordId}
            label={wordById.get(drag.wordId)!.label}
            emoji={wordById.get(drag.wordId)!.emoji}
            color={undecided}
          />
        </div>
      )}
    </div>
  );
}
