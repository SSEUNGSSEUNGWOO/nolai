"use client";

import { motion } from "motion/react";
import { popButton } from "./HookStep";
import { ui, badgeNames } from "@/copy/ui";

export default function RewardStep({
  badge,
  onDone,
}: {
  badge: string;
  onDone: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-10">
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
