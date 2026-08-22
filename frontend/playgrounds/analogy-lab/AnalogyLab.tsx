"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import type { AnalogyDataset } from "@/lib/dataset-schema";
import type { PlaygroundProps } from "../types";

/** 관계마다 어울리는 단어 무리. 어울릴 때만 답이 그럴듯하다. */
const FITS: Record<string, string> = {
  gender: "family",
  capital: "country",
  opposite: "adjective",
};

export default function AnalogyLab({
  data,
  onEvent,
  onArtifact,
}: PlaygroundProps) {
  const dataset = data as AnalogyDataset;
  const [relationId, setRelationId] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const triedRef = useRef<string[]>([]);
  const [, setTried] = useState<string[]>([]);

  const relation = dataset.relations.find((one) => one.id === relationId) ?? null;
  const subject = dataset.subjects.find((one) => one.id === subjectId) ?? null;
  const key = relation && subject ? `${relation.id}|${subject.id}` : null;
  const answers = key ? dataset.answers[key] : null;
  const matched = relation && subject ? FITS[relation.id] === subject.group : null;

  function pick(nextRelation: string | null, nextSubject: string | null) {
    const r = nextRelation ?? relationId;
    const s = nextSubject ?? subjectId;
    setRelationId(r);
    setSubjectId(s);
    if (!r || !s) return;

    const combo = `${r}|${s}`;
    if (triedRef.current.includes(combo)) return;

    const next = [...triedRef.current, combo];
    triedRef.current = next;
    setTried(next);
    onEvent({ type: "calculated", payload: { combo, count: next.length } });
    onArtifact({
      kind: "analogy-lab",
      payload: { datasetId: dataset.id, tried: next },
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 식을 눈에 보이게 늘어놓는다. 아이가 만드는 것이 "계산"이라는 것이
          화면에서 읽혀야 한다. */}
      <div
        data-testid="formula"
        className="flex flex-wrap items-center justify-center gap-2 rounded-pop border-[3px] border-ink bg-paper p-3 text-lg font-black shadow-[0_4px_0_var(--color-ink)]"
      >
        <span data-testid="formula-subject">
          {subject ? `${subject.emoji} ${subject.label}` : "❓"}
        </span>
        <span className="text-muted">에</span>
        <span
          data-testid="formula-relation"
          className="rounded-full border-[2.5px] border-ink bg-candy-teal px-2 py-0.5 text-sm"
        >
          {relation ? relation.label : "❓"}
        </span>
        <span className="text-muted">를 쓰면?</span>
      </div>

      {answers && (
        <motion.div
          key={key}
          data-testid="answer"
          data-matched={matched ? "true" : "false"}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-2 rounded-pop border-[3px] border-ink bg-cream p-3 shadow-[0_4px_0_var(--color-ink)]"
        >
          <span className="text-2xl font-black" data-testid="answer-top">
            {answers[0].label}
          </span>
          <span className="text-xs font-bold text-muted">
            다음 후보: {answers.slice(1).map((a) => a.label).join(", ")}
          </span>
        </motion.div>
      )}

      <div data-testid="relation-picker" className="flex flex-wrap gap-2">
        {dataset.relations.map((one) => (
          <button
            key={one.id}
            type="button"
            data-testid={`relation-${one.id}`}
            data-current={relationId === one.id ? "true" : undefined}
            onClick={() => pick(one.id, null)}
            className="rounded-pop border-[2.5px] border-ink px-3 py-1 text-sm font-extrabold text-ink shadow-[0_3px_0_var(--color-ink)]"
            style={{
              backgroundColor:
                relationId === one.id ? "var(--color-candy-teal)" : "var(--color-paper)",
            }}
          >
            {one.label}
          </button>
        ))}
      </div>

      <div data-testid="subject-picker" className="flex flex-wrap gap-2">
        {dataset.subjects.map((one) => (
          <button
            key={one.id}
            type="button"
            data-testid={`subject-${one.id}`}
            data-current={subjectId === one.id ? "true" : undefined}
            onClick={() => pick(null, one.id)}
            className="rounded-full border-[2.5px] border-ink px-3 py-1 text-sm font-extrabold text-ink shadow-[0_3px_0_var(--color-ink)]"
            style={{
              backgroundColor:
                subjectId === one.id ? "var(--color-candy-yellow)" : "var(--color-paper)",
            }}
          >
            {one.emoji} {one.label}
          </button>
        ))}
      </div>
    </div>
  );
}
