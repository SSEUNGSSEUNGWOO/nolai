import "server-only";

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { CODE_ALPHABET, CODE_LENGTH, normalizeCode } from "./code-format";

export {
  CODE_ALPHABET,
  CODE_LENGTH,
  codeSpace,
  isWellFormedCode,
  normalizeCode,
} from "./code-format";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const SALT_BYTES = 16;
const KEY_BYTES = 32;

/**
 * 비밀코드를 새로 만든다.
 *
 * 바이트를 알파벳 길이로 나눈 나머지를 그냥 쓰면 앞쪽 문자가 더 자주 나온다
 * (256은 31로 나누어떨어지지 않는다). 31의 배수를 넘는 바이트는 버리고 다시
 * 뽑아 치우침을 없앤다.
 */
export function generateCode(): string {
  const limit = Math.floor(256 / CODE_ALPHABET.length) * CODE_ALPHABET.length;
  let out = "";

  while (out.length < CODE_LENGTH) {
    for (const byte of randomBytes(CODE_LENGTH)) {
      if (byte >= limit) continue;
      out += CODE_ALPHABET[byte % CODE_ALPHABET.length];
      if (out.length === CODE_LENGTH) break;
    }
  }

  return out;
}

/**
 * 코드를 저장 가능한 형태로 바꾼다. 원문은 어디에도 저장하지 않는다.
 *
 * bcrypt가 아니라 scrypt인 이유: bcrypt는 네이티브 모듈이라 배포가 번거롭고
 * 순수 JS 대체제는 느리다. scrypt는 node:crypto에 들어 있어 의존성이 0이다.
 */
export async function hashCode(code: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await scryptAsync(normalizeCode(code), salt, KEY_BYTES);

  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

/** 형식이 깨진 저장값은 조용히 실패시킨다. 예외를 던지면 로그인 화면이 죽는다. */
export async function verifyCode(
  code: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;

  const salt = Buffer.from(parts[1], "base64");
  const expected = Buffer.from(parts[2], "base64");
  if (salt.length !== SALT_BYTES || expected.length !== KEY_BYTES) return false;

  const actual = await scryptAsync(normalizeCode(code), salt, KEY_BYTES);

  return timingSafeEqual(actual, expected);
}
