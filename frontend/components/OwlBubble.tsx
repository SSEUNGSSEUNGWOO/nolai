import Image from "next/image";
import { ui } from "@/copy/ui";
import { owlArt } from "@/lib/art";

export default function OwlBubble({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-pop border-[2.5px] border-ink bg-paper px-3 py-2 shadow-[0_3px_0_var(--color-ink)]">
      <Image src={owlArt("base")} alt="" width={32} height={32} className="h-8 w-8 shrink-0" />
      <p className="text-sm leading-relaxed">
        <span className="font-extrabold">{ui.owlName}</span> — {text}
      </p>
    </div>
  );
}
