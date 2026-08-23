"use client";

import { useState } from "react";
import MascotBubble from "../MascotBubble";
import { popButton, choiceButton } from "./styles";
import { ui } from "@/copy/ui";
import Confetti from "../fx/Confetti";
import { playDing } from "@/lib/sound";

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
    <div className="relative mx-auto w-full max-w-md flex flex-col gap-3 py-6">
      {picked !== null && isCorrect && <Confetti key={picked} />}
      <MascotBubble text={question} />

      {choices.map((choice, index) => (
        <button
          key={choice}
          type="button"
          onClick={() => {
            setPicked(index);
            if (index === answer) playDing();
          }}
          className={choiceButton(picked === index)}
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
