import { describe, it, expect } from "vitest";
import {
  NICKNAME_CHARACTERS,
  NICKNAME_MODIFIERS,
  isValidNickname,
  nicknameSpace,
  randomNicknames,
} from "./nickname";

describe("닉네임 풀", () => {
  it("수식어와 캐릭터에 중복이 없다", () => {
    expect(new Set(NICKNAME_MODIFIERS).size).toBe(NICKNAME_MODIFIERS.length);
    expect(new Set(NICKNAME_CHARACTERS).size).toBe(NICKNAME_CHARACTERS.length);
  });

  it("수식어에 한국 성씨가 한 글자도 없다", () => {
    // 조합으로 사람 이름이 우연히 만들어지면 안 된다
    const surnames = "김이박최정강조윤장임한오서신권황안송류홍전고문손양배백허유남심노하";
    for (const modifier of NICKNAME_MODIFIERS) {
      expect(surnames).not.toContain(modifier);
    }
  });

  it("조합 수가 충분하다", () => {
    // 닉네임은 중복을 허용하지만, 풀이 좁으면 같은 닉네임에 아이가 몰린다
    expect(nicknameSpace()).toBeGreaterThanOrEqual(1000);
  });
});

describe("randomNicknames", () => {
  it("요청한 개수를 돌려준다", () => {
    expect(randomNicknames(3)).toHaveLength(3);
  });

  it("같은 화면에 중복을 내지 않는다", () => {
    for (let i = 0; i < 100; i++) {
      const picked = randomNicknames(3);
      expect(new Set(picked).size).toBe(3);
    }
  });

  it("만들어낸 것이 전부 유효한 조합이다", () => {
    for (const nickname of randomNicknames(20)) {
      expect(isValidNickname(nickname)).toBe(true);
    }
  });

  it("풀보다 많이 요청해도 멈춘다", () => {
    // 무한 루프를 돌면 안 된다
    expect(randomNicknames(nicknameSpace() + 10)).toHaveLength(nicknameSpace());
  });

  it("호출할 때마다 같은 것만 주지 않는다", () => {
    const seen = new Set(
      Array.from({ length: 50 }, () => randomNicknames(3).join(",")),
    );
    expect(seen.size).toBeGreaterThan(40);
  });
});

describe("isValidNickname", () => {
  it("만들 수 있는 조합을 통과시킨다", () => {
    expect(isValidNickname(`${NICKNAME_MODIFIERS[0]}${NICKNAME_CHARACTERS[0]}`)).toBe(true);
  });

  it("실명을 거부한다", () => {
    // 화면이 고르기만 허용해도 요청은 손으로 만들 수 있다
    for (const name of ["김민수", "이서연", "박지훈"]) {
      expect(isValidNickname(name)).toBe(false);
    }
  });

  it("조합이 아닌 문자열을 거부한다", () => {
    for (const bad of ["", "번개", "토끼", "번개김민수", "토끼번개", "AAA"]) {
      expect(isValidNickname(bad)).toBe(false);
    }
  });

  it("앞뒤 공백이 붙으면 거부한다", () => {
    // 서버는 클라이언트가 보낸 문자열을 그대로 검사한다. 흘려보내면
    // "번개토끼"와 "번개토끼 "가 다른 아이가 된다
    expect(isValidNickname(" 번개토끼")).toBe(false);
    expect(isValidNickname("번개토끼 ")).toBe(false);
  });
});
