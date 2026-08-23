"use client";

import MascotBubble from "../MascotBubble";
import { popButton } from "./styles";
import Image from "next/image";
import { ui } from "@/copy/ui";
import { mascotArt } from "@/lib/art";

export default function HookStep({
  owl,
  onDone,
}: {
  owl: string;
  onDone: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-md flex flex-col items-center gap-4 py-8">
      <Image src={mascotArt("curious")} alt="" width={160} height={160} priority className="bob h-40 w-40" />
      <MascotBubble text={owl} />
      <button type="button" className={popButton} onClick={onDone}>
        {ui.hookCta}
      </button>
    </div>
  );
}
