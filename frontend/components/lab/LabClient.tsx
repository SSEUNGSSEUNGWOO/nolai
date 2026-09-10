"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { searchWords, type DictWord } from "@/lib/dictionary";
import { lab } from "@/copy/ui";
import { popButton, choiceButton } from "@/components/steps/styles";
import MascotBubble from "@/components/MascotBubble";
import { useMe } from "@/components/useMe";
import WordPicker from "./WordPicker";

interface Compared {
  a: DictWord;
  b: DictWord;
  score: number; // 0~100 정수
}

interface Near {
  id: number;
  word: string;
  similarity: number;
}

const INTRO_KEY = "nolai:lab-intro";
const pairKey = (a: DictWord, b: DictWord) => `${Math.min(a.id, b.id)}|${Math.max(a.id, b.id)}`;
const toScore = (similarity: number) => Math.round(similarity * 100);

async function fetchCompare(a: DictWord, b: DictWord): Promise<number | null> {
  const response = await fetch(`/api/words/compare?a=${a.id}&b=${b.id}`).catch(() => null);
  if (!response?.ok) return null;
  const data = (await response.json()) as { similarity: number };
  return toScore(data.similarity);
}

/**
 * 단어 실험실. 설계 문서 17장.
 *
 * 세 판이 한 화면에 있다: 두 단어 비교(이전 결과가 남는다), 가까운 말(눌러서
 * 따라간다), 남긴 발견(내 방에 넣는다). 처음 한 번만 고양이·강아지로 찍어보게
 * 하고, 그 뒤로는 안내를 붙이지 않는다 -- 매번 예측을 강제하면 학습지가 된다.
 */
export default function LabClient() {
  const { me, loaded } = useMe();

  // 처음 한 번 안내. localStorage를 못 읽으면 매번 보여주는 쪽이 안전하다.
  const [intro, setIntro] = useState<"unknown" | "show" | "done">("unknown");
  const [guess, setGuess] = useState<number | null>(null);
  useEffect(() => {
    let seen = false;
    try {
      seen = Boolean(window.localStorage.getItem(INTRO_KEY));
    } catch {
      seen = false;
    }
    // 서버 HTML과 첫 클라이언트 렌더를 일치시킨 뒤 한 번만 갱신한다(LessonList와 같은 이유).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIntro(seen ? "done" : "show");
  }, []);

  const [left, setLeft] = useState<DictWord | null>(null);
  const [right, setRight] = useState<DictWord | null>(null);
  // rows[0]이 지금 잰 것, 나머지가 아까 잰 것. 한 배열이라 갱신이 한 번이다.
  const [rows, setRows] = useState<Compared[]>([]);
  const current = rows[0] ?? null;
  const [error, setError] = useState<string | null>(null);

  // 둘 다 고르면 바로 잰다. 한쪽만 바꿔도 다시 잰다 -- 그게 실험이다.
  useEffect(() => {
    if (!left || !right || left.id === right.id) return;
    let alive = true;
    fetchCompare(left, right).then((score) => {
      if (!alive) return;
      if (score === null) {
        setError(lab.loadFailed);
        return;
      }
      setError(null);
      // 같은 쌍을 다시 재면 옛 행을 빼고 맨 위로 올린다. 키가 겹치면 React가 행을 잘못 그린다.
      const key = pairKey(left, right);
      setRows((previous) =>
        [{ a: left, b: right, score }, ...previous.filter((r) => pairKey(r.a, r.b) !== key)].slice(0, 6),
      );
    });
    return () => {
      alive = false;
    };
  }, [left, right]);

  function finishIntro(choice: number) {
    setGuess(choice);
    setLeft(searchWords("고양이", 1)[0]);
    setRight(searchWords("강아지", 1)[0]);
    try {
      window.localStorage.setItem(INTRO_KEY, "done");
    } catch {
      // 못 남기면 다음에 또 보여줄 뿐이다.
    }
  }

  const [nearOf, setNearOf] = useState<DictWord | null>(null);
  const [near, setNear] = useState<Near[]>([]);
  useEffect(() => {
    if (!nearOf) return;
    let alive = true;
    fetch(`/api/words/near?id=${nearOf.id}`)
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null)
      .then((data: { near: Near[] } | null) => {
        if (!alive) return;
        if (!data) {
          setError(lab.loadFailed);
          return;
        }
        setError(null);
        setNear(data.near);
      });
    return () => {
      alive = false;
    };
  }, [nearOf]);

  const [starred, setStarred] = useState<Map<string, Compared>>(new Map());
  const [saveState, setSaveState] = useState<"idle" | "busy" | "saved" | "failed">("idle");

  function toggleStar(item: Compared) {
    const key = pairKey(item.a, item.b);
    setStarred((previous) => {
      const next = new Map(previous);
      if (next.has(key)) next.delete(key);
      else next.set(key, item);
      return next;
    });
    setSaveState("idle");
  }

  async function save() {
    setSaveState("busy");
    // 요청에 담은 것만 기억한다. 저장 중에 새로 남긴 쌍은 다음 저장에 간다.
    const sent = [...starred.entries()];
    const response = await fetch("/api/words/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pairs: sent.map(([, item]) => [item.a.id, item.b.id]) }),
    }).catch(() => null);
    if (!response?.ok) {
      setSaveState("failed");
      return;
    }
    setStarred((previous) => {
      const next = new Map(previous);
      for (const [key] of sent) next.delete(key);
      return next;
    });
    setSaveState("saved");
  }

  return (
    <div className="flex flex-col gap-6">
      {intro === "show" && guess === null && (
        <section data-testid="lab-intro" className="flex flex-col gap-3">
          <MascotBubble text={lab.introOwl} />
          <div className="flex flex-wrap gap-2">
            {lab.introChoices.map((choice, index) => (
              <button
                key={choice}
                type="button"
                className={choiceButton(false)}
                onClick={() => finishIntro(index)}
              >
                {choice}
              </button>
            ))}
          </div>
        </section>
      )}
      {intro === "show" && guess !== null && current && (
        <MascotBubble text={`${lab.introChoices[guess]}라고 했지? ${lab.introReveal}`} />
      )}

      {error && (
        <p className="rounded-pop border-[2.5px] border-ink bg-candy-red px-4 py-3 text-sm font-extrabold">
          {error}
        </p>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-extrabold">{lab.compareTitle}</h2>
        <p className="text-sm text-muted">{lab.compareHint}</p>
        <div className="grid grid-cols-2 gap-2">
          <WordPicker label="왼쪽 단어" value={left} onPick={setLeft} />
          <WordPicker label="오른쪽 단어" value={right} onPick={setRight} />
        </div>

        <div
          data-testid="lab-meter"
          data-score={current?.score}
          className="stage-dots flex flex-col gap-2 rounded-pop border-[3px] border-ink p-3 shadow-[0_4px_0_var(--color-ink)]"
        >
          <div className="flex items-center justify-center gap-2 text-lg font-black">
            <span>{current?.a.word ?? "❓"}</span>
            <span className="text-muted">↔</span>
            <span>{current?.b.word ?? "❓"}</span>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full border-2 border-ink bg-cream">
            <motion.div
              className="h-full bg-candy-red"
              initial={false}
              animate={{ width: `${current ? Math.max(3, current.score) : 0}%` }}
              transition={{ type: "spring", stiffness: 200, damping: 24 }}
            />
          </div>
          <span className="text-center font-mono text-sm font-extrabold">
            {current ? `${lab.score} ${current.score}` : ""}
          </span>
        </div>
        <p className="text-xs text-muted">{lab.note}</p>

        {rows.length > 0 && (
          <ul data-testid="lab-history" className="flex flex-col gap-1">
            {rows.map((item) => {
              const key = pairKey(item.a, item.b);
              const isStarred = starred.has(key);
              return (
                <li
                  key={key}
                  className="flex items-center justify-between rounded-pop border-2 border-ink bg-paper px-3 py-1 text-sm font-extrabold"
                >
                  <span>
                    {item.a.word} ↔ {item.b.word} <span className="font-mono">{item.score}</span>
                  </span>
                  <button
                    type="button"
                    data-testid={`star-${key}`}
                    onClick={() => toggleStar(item)}
                    className="text-xs underline"
                  >
                    {isStarred ? `⭐ ${lab.starred}` : `☆ ${lab.star}`}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-extrabold">{lab.nearTitle}</h2>
        <p className="text-sm text-muted">{lab.nearHint}</p>
        <WordPicker label="가까운 말 찾을 단어" value={nearOf} onPick={setNearOf} />
        {near.length > 0 && (
          <ol data-testid="lab-near" className="flex flex-col gap-1">
            {near.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setNearOf({ id: item.id, word: item.word })}
                  className="flex w-full items-center gap-2 rounded-pop border-2 border-ink bg-paper px-3 py-1 text-left text-sm font-extrabold"
                >
                  <span className="w-6 text-muted">{index + 1}</span>
                  <span className="flex-1">{item.word}</span>
                  <span className="font-mono">{toScore(item.similarity)}</span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="flex flex-col gap-2">
        {starred.size > 0 &&
          (loaded && me ? (
            <button
              type="button"
              data-testid="lab-save"
              className={popButton}
              disabled={saveState === "busy"}
              onClick={save}
            >
              {lab.save} ({starred.size})
            </button>
          ) : (
            <Link href="/join" className="text-sm font-extrabold underline">
              {lab.saveGuest}
            </Link>
          ))}
        {saveState === "saved" && (
          <p data-testid="lab-saved" className="text-sm font-extrabold">
            {lab.saved}
          </p>
        )}
        {saveState === "failed" && <p className="text-sm font-extrabold">{lab.saveFailed}</p>}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-extrabold text-muted">{lab.challengesTitle}</h2>
        <ul className="flex flex-col gap-1 text-sm">
          {lab.challenges.map((challenge) => (
            <li key={challenge}>💡 {challenge}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
