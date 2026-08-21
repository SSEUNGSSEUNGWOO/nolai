/** 화면에 나오는 고정 문구를 한곳에 모은다. 말투 일관성을 위해서다. */
export const ui = {
  owlName: "노리",
  landingTitle: "놀AI",
  landingSubtitle: "AI는 어떻게 생각할까?",
  landingCta: "시작하기",
  hookCta: "궁금해!",
  playDone: "다 했어요",
  nameCta: "알겠어!",
  challengeCorrect: "맞았어! 🎉",
  challengeRetry: "이렇게 되는 거야!",
  challengeNext: "다음으로",
  rewardTitle: "배지 획득!",
  rewardCta: "좋아!",
  lessonComplete: "레슨을 끝냈어!",
} as const;

export const badgeNames: Record<string, string> = {
  "map-explorer": "지도 탐험가",
};
