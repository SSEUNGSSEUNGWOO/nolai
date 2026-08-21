"use client";

interface WordChipProps {
  label: string;
  emoji: string;
  color: string;
  testId: string;
  onActivate?: () => void;
}

export default function WordChip({
  label,
  emoji,
  color,
  testId,
  onActivate,
}: WordChipProps) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onActivate}
      style={{ backgroundColor: color }}
      className="whitespace-nowrap rounded-full border-[2.5px] border-ink px-3 py-1 text-sm font-extrabold text-ink shadow-[0_3px_0_var(--color-ink)]"
    >
      {emoji} {label}
    </button>
  );
}
