"use client";

import OwlBubble from "../OwlBubble";
import { popButton } from "./styles";
import { ui } from "@/copy/ui";

export default function HookStep({
  owl,
  onDone,
}: {
  owl: string;
  onDone: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-md flex flex-col items-center gap-4 py-8">
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
