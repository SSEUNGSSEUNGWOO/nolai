"use client";

import { motion } from "motion/react";
import { useEffect } from "react";
import { playReward } from "@/lib/sound";
import { popButton } from "./styles";
import Image from "next/image";
import { ui, badgeNames } from "@/copy/ui";
import { badgeArt } from "@/lib/art";
import Confetti from "../fx/Confetti";

export default function RewardStep({
  badge,
  onDone,
}: {
  badge: string;
  onDone: () => void;
}) {
  // 배지가 뜨는 순간에 낸다. 음소거면 playReward가 알아서 아무 일도 안 한다.
  useEffect(() => playReward(), []);

  return (
    <div className="relative mx-auto w-full max-w-md flex flex-col items-center gap-3 py-10">
      <Confetti count={36} />
      <motion.div
        className="h-44 w-44"
        aria-hidden
        initial={{ scale: 0, rotate: -30, y: 40 }}
        animate={{ scale: [0, 1.25, 1], rotate: [-30, 8, 0], y: 0 }}
        transition={{ duration: 0.7, times: [0, 0.6, 1], ease: "easeOut" }}
      >
        <Image src={badgeArt(badge)} alt="" width={176} height={176} priority />
      </motion.div>
      <p className="text-xl font-black">{badgeNames[badge] ?? badge}</p>
      <p className="text-sm text-muted">{ui.rewardTitle}</p>
      <button type="button" className={popButton} onClick={onDone}>
        {ui.rewardCta}
      </button>
    </div>
  );
}
