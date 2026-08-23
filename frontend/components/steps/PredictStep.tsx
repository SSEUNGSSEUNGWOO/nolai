"use client";

import { useState } from "react";
import MascotBubble from "../MascotBubble";
import { popButton, choiceButton } from "./styles";
import { ui } from "@/copy/ui";

/**
 * 놀이 전에 먼저 찍어본다. 여기서는 맞고 틀림을 말하지 않는다 -- 아이가 놀이에서
 * 직접 확인한다. 고른 것은 RevealStep이 돌아본다.
 */
export default function PredictStep({
  question,
  choices,
  onDone,
}: {
  question: string;
  choices: string[];
  onDone: (picked: number) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);

  return (
    <div className="mx-auto w-full max-w-md flex flex-col gap-3 py-6">
      <MascotBubble text={question} />

      {choices.map((choice, index) => (
        <button
          key={choice}
          type="button"
          onClick={() => setPicked(index)}
          className={choiceButton(picked === index)}
        >
          {choice}
        </button>
      ))}

      {picked !== null && (
        <button type="button" className={popButton} onClick={() => onDone(picked)}>
          {ui.predictCta}
        </button>
      )}
    </div>
  );
}
