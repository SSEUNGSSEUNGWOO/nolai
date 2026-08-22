"use client";

import { useState } from "react";
import OwlBubble from "../OwlBubble";
import { popButton } from "./styles";
import { ui } from "@/copy/ui";

export default function ChallengeStep({
  question,
  choices,
  answer,
  explain,
  onDone,
}: {
  question: string;
  choices: string[];
  answer: number;
  explain: string;
  onDone: () => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const isCorrect = picked === answer;

  return (
    <div className="mx-auto w-full max-w-md flex flex-col gap-3 py-6">
      <OwlBubble text={question} />

      {choices.map((choice, index) => (
        <button
          key={choice}
          type="button"
          onClick={() => setPicked(index)}
          className={`rounded-pop border-[2.5px] border-ink px-4 py-2 font-extrabold shadow-[0_3px_0_var(--color-ink)] ${
            picked === index ? "bg-candy-teal" : "bg-paper"
          }`}
        >
          {choice}
        </button>
      ))}

      {picked !== null && (
        <div className="flex flex-col gap-3 pt-2">
          <p className="text-sm font-extrabold">
            {isCorrect ? ui.challengeCorrect : ui.challengeRetry}
          </p>
          <p className="text-sm leading-relaxed">{explain}</p>
          <button type="button" className={popButton} onClick={onDone}>
            {ui.challengeNext}
          </button>
        </div>
      )}
    </div>
  );
}
