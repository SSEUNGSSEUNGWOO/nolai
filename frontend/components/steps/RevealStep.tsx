"use client";

import OwlBubble from "../OwlBubble";
import { popButton } from "./styles";
import { ui } from "@/copy/ui";

/** 놀이 전에 찍은 것을 돌아본다. 틀렸을 때 혼내지 않는다 -- 그게 배운 순간이다. */
export default function RevealStep({
  picked,
  answer,
  choices,
  right,
  wrong,
  onDone,
}: {
  picked: number;
  answer: number;
  choices: string[];
  right: string;
  wrong: string;
  onDone: () => void;
}) {
  const wasRight = picked === answer;

  return (
    <div className="mx-auto w-full max-w-md flex flex-col gap-3 py-6">
      <p className="text-sm font-extrabold text-muted" data-testid="reveal-picked">
        {ui.revealPicked} {choices[picked]}
      </p>
      <OwlBubble text={wasRight ? ui.revealRight : ui.revealWrong} />
      <p className="text-sm leading-relaxed">{wasRight ? right : wrong}</p>
      <button type="button" className={popButton} onClick={onDone}>
        {ui.challengeNext}
      </button>
    </div>
  );
}
