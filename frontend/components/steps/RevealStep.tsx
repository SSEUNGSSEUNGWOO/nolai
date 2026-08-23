"use client";

import MascotBubble from "../MascotBubble";
import { popButton } from "./styles";
import Image from "next/image";
import { useEffect } from "react";
import { motion } from "motion/react";
import Confetti from "../fx/Confetti";
import { playDing } from "@/lib/sound";
import { ui } from "@/copy/ui";
import { mascotArt } from "@/lib/art";

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
  useEffect(() => { if (wasRight) playDing(); }, [wasRight]);

  return (
    <div className="relative mx-auto w-full max-w-md flex flex-col gap-3 py-6">
      {wasRight && <Confetti />}
      <p className="text-sm font-extrabold text-muted" data-testid="reveal-picked">
        {ui.revealPicked} {choices[picked]}
      </p>
      <motion.div
        className="mx-auto"
        // 맞으면 튀어오르고, 틀리면 깜짝 놀라 좌우로 움찔한다
        initial={wasRight ? { scale: 0.4, y: 30 } : { x: 0 }}
        animate={wasRight ? { scale: 1, y: 0 } : { x: [0, -10, 10, -6, 6, 0] }}
        transition={wasRight ? { type: "spring", stiffness: 260, damping: 14 } : { duration: 0.5 }}
      >
        <Image src={mascotArt(wasRight ? "happy" : "surprised")} alt="" width={160} height={160} className="h-40 w-40" />
      </motion.div>
      <MascotBubble text={wasRight ? ui.revealRight : ui.revealWrong} />
      <p className="text-sm leading-relaxed">{wasRight ? right : wrong}</p>
      <button type="button" className={popButton} onClick={onDone}>
        {ui.challengeNext}
      </button>
    </div>
  );
}
