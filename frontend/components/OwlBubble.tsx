import { ui } from "@/copy/ui";

export default function OwlBubble({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-pop border-[2.5px] border-ink bg-white px-3 py-2 shadow-[0_3px_0_var(--color-ink)]">
      <span className="text-xl leading-none" aria-hidden>
        🦉
      </span>
      <p className="text-sm leading-relaxed">
        <span className="font-extrabold">{ui.owlName}</span> — {text}
      </p>
    </div>
  );
}
