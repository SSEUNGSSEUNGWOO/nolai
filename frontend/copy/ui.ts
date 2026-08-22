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
  "path-finder": "길 찾기 대장",
};

/** 계정과 내 방 화면의 문구. */
export const account = {
  joinTitle: "네 이름을 골라봐",
  joinOwl: "여기서 쓸 이름이야. 마음에 드는 걸 고르면 돼!",
  reroll: "다른 이름 보기",
  codeTitle: "비밀코드가 나왔어!",
  codeOwl: "이 코드가 있어야 다른 기기에서도 네 방에 들어올 수 있어.",
  codeWarning: "이 코드는 다시 볼 수 없어. 꼭 적어두거나 저장해!",
  saveImage: "그림으로 저장하기",
  toRoom: "내 방으로 가기",
  loginTitle: "내 방으로 들어가기",
  loginOwl: "이름을 고르고 비밀코드를 넣어줘.",
  loginCta: "들어가기",
  loginFailed: "이름이나 코드가 맞지 않아. 다시 해볼래?",
  loginThrottled: "너무 많이 시도했어. 잠깐 쉬었다가 다시 해줘.",
  nicknameFull: "그 이름은 자리가 찼어. 다른 이름을 골라줄래?",
  signupFailed: "방을 만들지 못했어. 잠시 뒤에 다시 해볼래?",
  roomTitle: "내 방",
  roomBadges: "모은 배지",
  roomNoBadges: "아직 배지가 없어. 레슨을 하나 끝내보자!",
  roomProgress: "끝낸 레슨",
  logout: "나가기",
  join: "내 방 만들기",
  login: "내 방 들어가기",
} as const;
