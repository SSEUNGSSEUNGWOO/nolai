import { describe, it, expect } from "vitest";
import {
  CODE_ALPHABET,
  CODE_LENGTH,
  codeSpace,
  generateCode,
  hashCode,
  isWellFormedCode,
  normalizeCode,
  verifyCode,
} from "./code";

describe("CODE_ALPHABET", () => {
  it("혼동되는 글자를 담지 않는다", () => {
    for (const banned of ["0", "O", "1", "I", "L"]) {
      expect(CODE_ALPHABET).not.toContain(banned);
    }
  });

  it("글자가 중복되지 않는다", () => {
    expect(new Set(CODE_ALPHABET).size).toBe(CODE_ALPHABET.length);
  });

  it("설계 문서가 정한 31자다", () => {
    expect(CODE_ALPHABET).toHaveLength(31);
    expect(codeSpace()).toBe(31 ** 6);
  });
});

describe("generateCode", () => {
  it("정해진 길이와 문자셋으로만 만든다", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateCode();
      expect(code).toHaveLength(CODE_LENGTH);
      expect([...code].every((c) => CODE_ALPHABET.includes(c))).toBe(true);
    }
  });

  it("매번 다른 값이 나온다", () => {
    const codes = new Set(Array.from({ length: 300 }, generateCode));
    // 887,504,481분의 1 공간에서 300개를 뽑아 290개 미만이면 생성이 고장난 것이다
    expect(codes.size).toBeGreaterThan(290);
  });

  it("특정 글자로 치우치지 않는다", () => {
    // 나머지 연산의 치우침을 그냥 두면 앞쪽 8글자가 약 1.29배 자주 나온다.
    const counts = new Map<string, number>();
    for (let i = 0; i < 2000; i++) {
      for (const char of generateCode()) {
        counts.set(char, (counts.get(char) ?? 0) + 1);
      }
    }

    const expected = (2000 * CODE_LENGTH) / CODE_ALPHABET.length;
    for (const char of CODE_ALPHABET) {
      const seen = counts.get(char) ?? 0;
      expect(seen).toBeGreaterThan(expected * 0.8);
      expect(seen).toBeLessThan(expected * 1.2);
    }
  });
});

describe("normalizeCode", () => {
  it("소문자를 대문자로 바꾼다", () => {
    expect(normalizeCode("a2b3c4")).toBe("A2B3C4");
  });

  it("공백과 하이픈을 지운다", () => {
    expect(normalizeCode(" A2B-3C4 ")).toBe("A2B3C4");
  });
});

describe("isWellFormedCode", () => {
  it("올바른 코드를 통과시킨다", () => {
    expect(isWellFormedCode(generateCode())).toBe(true);
  });

  it("소문자로 적어 와도 통과시킨다", () => {
    expect(isWellFormedCode(generateCode().toLowerCase())).toBe(true);
  });

  it("길이가 다르면 거부한다", () => {
    expect(isWellFormedCode("A2B3C")).toBe(false);
    expect(isWellFormedCode("A2B3C4D")).toBe(false);
  });

  it("혼동 글자가 섞이면 거부한다", () => {
    expect(isWellFormedCode("A2B3C0")).toBe(false);
    expect(isWellFormedCode("A2B3CO")).toBe(false);
  });
});

describe("hashCode / verifyCode", () => {
  it("맞는 코드를 통과시킨다", async () => {
    const code = generateCode();
    expect(await verifyCode(code, await hashCode(code))).toBe(true);
  });

  it("틀린 코드를 거부한다", async () => {
    const stored = await hashCode("A2B3C4");
    expect(await verifyCode("A2B3C5", stored)).toBe(false);
  });

  it("원문 코드가 저장값에 남지 않는다", async () => {
    const code = "A2B3C4";
    expect(await hashCode(code)).not.toContain(code);
  });

  it("같은 코드라도 저장값이 매번 다르다", async () => {
    // 소금이 없으면 같은 코드를 쓰는 아이들이 한눈에 드러난다
    expect(await hashCode("A2B3C4")).not.toBe(await hashCode("A2B3C4"));
  });

  it("아이가 소문자로 입력해도 로그인된다", async () => {
    const stored = await hashCode("A2B3C4");
    expect(await verifyCode("a2b3c4", stored)).toBe(true);
  });

  it("깨진 저장값에 예외를 던지지 않고 false를 준다", async () => {
    for (const broken of ["", "nonsense", "scrypt$only-two", "bcrypt$a$b"]) {
      expect(await verifyCode("A2B3C4", broken)).toBe(false);
    }
  });
});
