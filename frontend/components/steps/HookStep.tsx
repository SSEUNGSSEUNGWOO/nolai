"use client";

import OwlBubble from "../OwlBubble";
import { popButton } from "./styles";
import Image from "next/image";
import { ui } from "@/copy/ui";
import { owlArt } from "@/lib/art";

export default function HookStep({
  owl,
  onDone,
}: {
  owl: string;
  onDone: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-md flex flex-col items-center gap-4 py-8">
      <Image src={owlArt("curious")} alt="" width={160} height={160} priority className="h-40 w-40" />
      <OwlBubble text={owl} />
      <button type="button" className={popButton} onClick={onDone}>
        {ui.hookCta}
      </button>
    </div>
  );
}
