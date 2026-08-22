"use client";

import { motion } from "motion/react";
import { useEffect } from "react";
import { playReward } from "@/lib/sound";
import { popButton } from "./styles";
import { ui, badgeNames } from "@/copy/ui";

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
    <div className="mx-auto w-full max-w-md flex flex-col items-center gap-3 py-10">
      <motion.span
        className="text-6xl"
        aria-hidden
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
      >
        🏅
      </motion.span>
      <p className="text-xl font-black">{badgeNames[badge] ?? badge}</p>
      <p className="text-sm text-muted">{ui.rewardTitle}</p>
      <button type="button" className={popButton} onClick={onDone}>
        {ui.rewardCta}
      </button>
    </div>
  );
}
