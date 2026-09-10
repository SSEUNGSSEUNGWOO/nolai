"use client";

import { useState } from "react";
import { searchWords, type DictWord } from "@/lib/dictionary";
import { lab } from "@/copy/ui";

/**
 * 사전 안에서만 고르는 입력칸.
 *
 * 글자는 기기 안에서만 쓰인다 -- 서버로 가는 것은 아이가 목록에서 누른 단어의
 * id뿐이다(설계 문서 17장). 그래서 input은 폼에 묶지 않고 URL에도 넣지 않는다.
 * 글자를 고치면 고른 단어는 풀린다(value가 null이 된다).
 */
export default function WordPicker({
  label,
  value,
  onPick,
}: {
  label: string;
  value: DictWord | null;
  onPick: (word: DictWord | null) => void;
}) {
  const [typed, setTyped] = useState("");
  const query = value ? "" : typed;
  const found = searchWords(query, 8);

  return (
    <div className="relative flex flex-col gap-1">
      <input
        aria-label={label}
        type="text"
        autoComplete="off"
        placeholder={lab.placeholder}
        value={value ? value.word : typed}
        onChange={(event) => {
          setTyped(event.target.value);
          if (value) onPick(null);
        }}
        className="w-full rounded-pop border-[2.5px] border-ink bg-paper px-3 py-2 text-lg font-extrabold text-ink"
      />
      {found.length > 0 && (
        <ul className="absolute top-full z-10 mt-1 flex w-full flex-col overflow-hidden rounded-pop border-[2.5px] border-ink bg-paper shadow-[0_3px_0_var(--color-ink)]">
          {found.map((word) => (
            <li key={word.id}>
              <button
                type="button"
                onClick={() => {
                  setTyped("");
                  onPick(word);
                }}
                className="w-full px-3 py-2 text-left font-extrabold hover:bg-candy-yellow"
              >
                {word.word}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
