/**
 * 닉네임은 "수식어 + 캐릭터" 조합으로만 만들어진다. 아이가 직접 입력할 수
 * 없다 — 고르기만 한다.
 *
 * 자유 입력을 두지 않는 이유는 실명 때문이다. 타겟이 전원 만 14세 미만이라
 * 아이가 자기 이름을 넣으면 그 순간 개인정보 수집이 되고 법정대리인 동의
 * 절차가 통째로 따라온다. 그런데 "김민수"와 "김밥맨"을 구별하는 필터는 만들
 * 수 없다 — 정교하게 만들수록 "한라봉" 같은 멀쩡한 이름을 막으면서 "민수김"은
 * 통과시킨다. 등록 시점에 못 거르면 사후에도 못 거르므로, 입력 경로 자체를
 * 두지 않는다.
 *
 * 수식어에 한국 성씨(김·이·박…)를 한 글자도 넣지 않는다. 조합으로 사람 이름이
 * 우연히 만들어지지 않게 하기 위해서다.
 */
export const NICKNAME_MODIFIERS = [
  "번개", "무지개", "초코", "딸기", "우주", "반짝", "씩씩", "폭풍",
  "구름", "별빛", "달빛", "햇살", "눈꽃", "바람", "불꽃", "얼음",
  "황금", "은하", "새싹", "꿀떡", "몽글", "쌩쌩", "통통", "슝슝",
  "야무진", "용감한", "신비한", "재빠른", "커다란", "자그만", "부릉", "두근",
  "방울", "솜사탕", "팝콘", "젤리", "수박", "참외", "도토리", "민트",
] as const;

export const NICKNAME_CHARACTERS = [
  "토끼", "상어", "로봇", "고양이", "강아지", "여우", "곰", "사자",
  "호랑이", "펭귄", "부엉이", "다람쥐", "코끼리", "기린", "판다", "수달",
  "돌고래", "문어", "거북", "두더지", "고슴도치", "너구리", "늑대", "매",
  "올빼미", "하마", "코알라", "캥거루", "미어캣", "알파카", "용", "공룡",
  "유령", "마법사", "기사", "닌자", "해적", "우주선", "별똥별", "요정",
] as const;

/** 만들 수 있는 닉네임의 총 개수. */
export function nicknameSpace(): number {
  return NICKNAME_MODIFIERS.length * NICKNAME_CHARACTERS.length;
}

const allNicknames = new Set(
  NICKNAME_MODIFIERS.flatMap((modifier) =>
    NICKNAME_CHARACTERS.map((character) => `${modifier}${character}`),
  ),
);

/** 후보를 고르는 데는 암호학적 난수가 필요 없다. 비밀인 것은 코드뿐이다. */
function pick(pool: readonly string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * 서로 다른 닉네임 후보를 count개 뽑는다.
 *
 * 화면에는 3개씩 보여주고 "다시 뽑기"를 준다. 같은 화면에 같은 닉네임이 두 번
 * 나오면 선택지가 줄어든 것처럼 보이므로 중복을 없앤다.
 */
export function randomNicknames(count: number): string[] {
  const wanted = Math.min(count, allNicknames.size);
  const picked = new Set<string>();

  while (picked.size < wanted) {
    const modifier = pick(NICKNAME_MODIFIERS);
    const character = pick(NICKNAME_CHARACTERS);
    picked.add(`${modifier}${character}`);
  }

  return [...picked];
}

/**
 * 만들 수 있는 조합인지 확인한다.
 *
 * 화면이 고르기만 허용해도 요청은 손으로 만들 수 있다. 서버는 클라이언트가
 * 보낸 문자열을 믿지 않고 여기를 통과한 것만 저장한다 — 이 검사가 없으면
 * 자유 입력을 막은 것이 아니라 화면에서만 숨긴 것이 된다.
 */
export function isValidNickname(value: string): boolean {
  return allNicknames.has(value);
}
