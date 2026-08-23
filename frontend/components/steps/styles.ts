/** 스텝 화면들이 공유하는 기본 버튼 스타일. */
export const popButton =
  "rounded-pop border-[2.5px] border-ink bg-candy-red px-5 py-2 font-extrabold text-ink shadow-[0_3px_0_var(--color-ink)]";

/** 도전·예측의 보기 버튼. 고른 것만 청록이다. */
export const choiceButton = (selected: boolean) =>
  `rounded-pop border-[2.5px] border-ink px-4 py-2 font-extrabold shadow-[0_3px_0_var(--color-ink)] ${selected ? "bg-candy-teal" : "bg-paper"}`;
