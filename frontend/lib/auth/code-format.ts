/**
 * 비밀코드의 생김새에 관한 것만 담는다. 브라우저에서도 쓰기 때문이다.
 *
 * 코드를 만들고 검증하는 일(node:crypto가 필요한 부분)은 code.ts에 있다.
 * 한 파일에 두면 로그인 화면이 node:crypto를 브라우저로 끌고 들어가 터진다.
 */

/**
 * 혼동 문자를 뺀 31자.
 *
 * 0/O, 1/I/L을 뺐다. 아이가 종이에 적었다가 못 알아보면 계정을 잃는데,
 * 이 서비스에는 복구 수단이 없다(개인정보를 받지 않으므로).
 */
export const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const CODE_LENGTH = 6;

/** 31^6 = 887,503,681. 분당 5회 제한과 합쳐 무차별 시도를 막는다. */
export function codeSpace(): number {
  return CODE_ALPHABET.length ** CODE_LENGTH;
}

/** 아이가 소문자로 적어 왔거나 공백·하이픈을 넣었을 때를 흡수한다. */
export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s-]/g, "");
}

export function isWellFormedCode(raw: string): boolean {
  const code = normalizeCode(raw);
  if (code.length !== CODE_LENGTH) return false;

  return [...code].every((char) => CODE_ALPHABET.includes(char));
}
