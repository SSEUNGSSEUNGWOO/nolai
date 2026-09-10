"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { daily, lab } from "@/copy/ui";
import { type Temperature } from "@/lib/daily";
import { type DictWord } from "@/lib/dictionary";
import { popButton } from "@/components/steps/styles";
import MascotBubble from "@/components/MascotBubble";
import WordPicker from "@/components/lab/WordPicker";

interface Guess {
  word: DictWord;
  similarity: number;
  rank: number | null;
  hinted: boolean;
  temperature: Temperature;
}

interface State {
  date: string;
  available: boolean;
  signedIn: boolean;
  guesses: Guess[];
  solved: boolean;
  board: {
    top: { nickname: string; tries: number; hinted: boolean }[];
    solvedCount: number;
    me: { rank: number; tries: number; hinted: boolean } | null;
  };
  yesterday: { word: string | null; popular: { word: string; guessers: number }[] } | null;
}

const HINT_AFTER = 20;
const localKey = (date: string) => `nolai:daily:${date}`;
const toScore = (similarity: number) => Math.round(similarity * 100);

/** 비회원의 오늘 시도. 기기에만 남는다. 못 읽으면 빈 목록. */
function readLocal(date: string): Guess[] {
  try {
    const raw = window.localStorage.getItem(localKey(date));
    return raw ? (JSON.parse(raw) as Guess[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(date: string, guesses: Guess[]) {
  try {
    window.localStorage.setItem(localKey(date), JSON.stringify(guesses));
  } catch {
    // 못 남기면 새로고침에 사라질 뿐이다
  }
}

const bg: Record<Temperature, string> = {
  correct: "bg-candy-teal",
  hot: "bg-candy-red",
  warm: "bg-candy-yellow",
  lukewarm: "bg-cream",
  cold: "bg-paper",
};

/**
 * 오늘의 단어. 설계 문서 17장. 꼬맨틀 방식 -- 숨은 단어를 넣을 때마다 유사도·온도·순위가
 * 나오고, 그걸로 좁혀 간다. 시도는 무제한, 20번 넘게 헤매면 힌트.
 */
export default function DailyClient() {
  const [state, setState] = useState<State | null>(null);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [pick, setPick] = useState<DictWord | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/daily").catch(() => null);
    if (!response?.ok) {
      setError(daily.loadFailed);
      return;
    }
    const data = (await response.json()) as State;
    setState(data);
    setGuesses(data.signedIn ? data.guesses : readLocal(data.date));
  }

  // 서버 HTML과 첫 클라이언트 렌더를 일치시킨 뒤 한 번 받는다(LessonList와 같은 이유).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  const solved = guesses.some((g) => g.rank === 0);

  function add(guess: Guess) {
    setGuesses((previous) => {
      if (previous.some((g) => g.word.id === guess.word.id)) return previous;
      const next = [...previous, guess].sort((a, b) => b.similarity - a.similarity);
      if (state && !state.signedIn) writeLocal(state.date, next);
      return next;
    });
  }

  // 앞 요청이 끝나기 전에 다음 단어를 넣어도 버리지 않는다. 요청은 서로 독립이고
  // 서버는 같은 단어를 두 번 받아도 행을 늘리지 않는다.
  async function submit(word: DictWord | null) {
    setPick(word);
    if (!word || solved) return;
    setError(null);
    const response = await fetch("/api/daily/guess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordId: word.id }),
    }).catch(() => null);
    setPick((current) => (current?.id === word.id ? null : current));
    if (!response?.ok) {
      setError(daily.loadFailed);
      return;
    }
    const judged = (await response.json()) as Guess;
    add({ ...judged, hinted: false });
    if (judged.rank === 0) void load(); // 순위판을 새로 받는다
  }

  async function hint() {
    setBusy(true);
    const ranks = guesses.map((g) => g.rank).filter((r): r is number => r !== null && r > 0);
    const bestRank = ranks.length > 0 ? Math.min(...ranks) : undefined;
    const response = await fetch("/api/daily/hint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bestRank ? { bestRank } : {}),
    }).catch(() => null);
    setBusy(false);
    if (!response?.ok) {
      setError(daily.loadFailed);
      return;
    }
    add({ ...((await response.json()) as Guess), hinted: true });
  }

  if (error && !state) return <p className="text-sm font-extrabold">{error}</p>;
  if (!state) return null;
  if (!state.available) return <MascotBubble text={daily.noWord} />;

  const tries = guesses.length;

  return (
    <div className="flex flex-col gap-6">
      <MascotBubble text={daily.owl} />
      {error && <p className="text-sm font-extrabold">{error}</p>}

      {solved ? (
        <section
          data-testid="daily-solved"
          className="rounded-pop border-[3px] border-ink bg-candy-teal p-4 shadow-[0_4px_0_var(--color-ink)]"
        >
          <p className="text-xl font-black">{daily.solvedTitle}</p>
          <p className="text-sm font-extrabold">{daily.solvedBody(tries)}</p>
        </section>
      ) : (
        <section className="flex flex-col gap-2">
          <WordPicker label={daily.guessLabel} value={pick} onPick={submit} />
          <p className="text-xs text-muted">{daily.tries(tries)}</p>
          {tries >= HINT_AFTER && (
            <button
              type="button"
              data-testid="daily-hint"
              className={popButton}
              disabled={busy}
              onClick={hint}
            >
              {daily.hint}
            </button>
          )}
        </section>
      )}

      {guesses.length > 0 && (
        <ol data-testid="daily-guesses" className="flex flex-col gap-1">
          {guesses.map((g) => (
            <li
              key={g.word.id}
              data-temperature={g.temperature}
              className={`flex items-center justify-between rounded-pop border-2 border-ink px-3 py-1 text-sm font-extrabold ${bg[g.temperature]}`}
            >
              <span>
                {g.hinted && `${daily.boardHintMark} `}
                {g.word.word}
              </span>
              <span className="flex items-center gap-2">
                <span className="text-xs">
                  {g.rank === null ? daily.rankOutside : g.rank === 0 ? "" : daily.rankInside(g.rank)}
                </span>
                <span className="font-mono">{toScore(g.similarity)}</span>
                <span>{daily.temperature[g.temperature]}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
      <p className="text-xs text-muted">{daily.note}</p>

      <section data-testid="daily-board" className="flex flex-col gap-2">
        <h2 className="text-lg font-extrabold">{daily.boardTitle}</h2>
        <p className="text-sm text-muted">{daily.boardSolved(state.board.solvedCount)}</p>
        {state.board.top.length > 0 && (
          <ol className="flex flex-col gap-1">
            {state.board.top.map((row, index) => (
              <li
                key={`${row.nickname}-${index}`}
                className="flex items-center gap-2 rounded-pop border-2 border-ink bg-paper px-3 py-1 text-sm font-extrabold"
              >
                <span className="w-6 text-muted">{index + 1}</span>
                <span className="flex-1">{row.nickname}</span>
                <span className="font-mono">
                  {row.tries}번{row.hinted && ` ${daily.boardHintMark}`}
                </span>
              </li>
            ))}
          </ol>
        )}
        {state.board.me ? (
          <p data-testid="daily-me" className="text-sm font-extrabold">
            {daily.boardMe(state.board.me.rank, state.board.solvedCount)}
          </p>
        ) : (
          !state.signedIn && (
            <Link href="/join" className="text-sm font-extrabold underline">
              {daily.boardGuest}
            </Link>
          )
        )}
      </section>

      {state.yesterday?.word && (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-extrabold">{daily.yesterdayTitle}</h2>
          <p className="text-sm font-extrabold">{daily.yesterdayAnswer(state.yesterday.word)}</p>
          {state.yesterday.popular.length > 0 && (
            <>
              <p className="text-xs text-muted">{daily.yesterdayPopular}</p>
              <ul className="flex flex-wrap gap-1">
                {state.yesterday.popular.map((p) => (
                  <li
                    key={p.word}
                    className="rounded-full border-2 border-ink bg-cream px-2 py-0.5 text-xs font-extrabold"
                  >
                    {p.word} · {p.guessers}
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="text-xs text-muted">{daily.yesterdayWhy}</p>
          <Link href="/lab" className="text-sm font-extrabold underline">
            {daily.toLab} ({lab.title})
          </Link>
        </section>
      )}
    </div>
  );
}
