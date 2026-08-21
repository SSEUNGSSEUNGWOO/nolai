"use client";

import OwlBubble from "../OwlBubble";
import { ui } from "@/copy/ui";

export const popButton =
  "rounded-pop border-[2.5px] border-ink bg-candy-red px-5 py-2 font-extrabold text-white shadow-[0_3px_0_var(--color-ink)]";

export default function HookStep({
  owl,
  onDone,
}: {
  owl: string;
  onDone: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <span className="text-5xl" aria-hidden>
        🦉
      </span>
      <OwlBubble text={owl} />
      <button type="button" className={popButton} onClick={onDone}>
        {ui.hookCta}
      </button>
    </div>
  );
}
