"use client";

import { popButton } from "./styles";
import { ui } from "@/copy/ui";

export default function NameStep({
  concept,
  body,
  onDone,
}: {
  concept: string;
  body: string;
  onDone: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <p className="text-lg font-extrabold">방금 한 게 👉</p>
      <p className="rounded-pop border-[2.5px] border-ink bg-candy-yellow px-4 py-1 text-xl font-black">
        {concept}
      </p>
      <p className="max-w-md text-center text-sm leading-relaxed">{body}</p>
      <button type="button" className={popButton} onClick={onDone}>
        {ui.nameCta}
      </button>
    </div>
  );
}
