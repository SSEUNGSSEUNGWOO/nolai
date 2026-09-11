import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  readPending,
  enqueuePending,
  removePending,
  clearPendingOwnedBy,
  sendPending,
  flushPending,
} from "./pending";

function respond(status: number) {
  return vi.fn(async () => new Response("{}", { status }));
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("pending — 대기열", () => {
  it("넣으면 id가 붙어 남는다", () => {
    const { item } = enqueuePending({ lessonId: "a", artifact: null, owner: null });
    expect(item.id).toBeTruthy();
    expect(readPending()).toEqual([item]);
  });

  it("지우면 그 항목만 사라진다", () => {
    const { item: first } = enqueuePending({ lessonId: "a", artifact: null, owner: null });
    const { item: second } = enqueuePending({ lessonId: "b", artifact: null, owner: null });
    removePending(first.id);
    expect(readPending()).toEqual([second]);
  });

  it("계정 몫만 골라 지운다", () => {
    enqueuePending({ lessonId: "a", artifact: null, owner: "kid-a" });
    const { item: guest } = enqueuePending({ lessonId: "b", artifact: null, owner: null });
    clearPendingOwnedBy("kid-a");
    expect(readPending()).toEqual([guest]);
  });

  it("저장값이 깨져 있으면 빈 대기열로 되돌린다", () => {
    localStorage.setItem("nolai:pending", "{{{ 망가진 JSON");
    expect(readPending()).toEqual([]);
  });

  it("저장소가 꽉 차도 던지지 않고 stored=false로 알린다", () => {
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("quota", "QuotaExceededError");
      });

    const queued = enqueuePending({ lessonId: "a", artifact: null, owner: null });
    expect(queued.stored).toBe(false);
    expect(queued.item.lessonId).toBe("a");

    setItem.mockRestore();
  });

  it("randomUUID가 없어도 서버가 받는 uuid 모양을 만든다", () => {
    vi.stubGlobal("crypto", {
      getRandomValues: (bytes: Uint8Array) => {
        for (let i = 0; i < bytes.length; i += 1) bytes[i] = (i * 37) % 256;
        return bytes;
      },
    });

    const { item } = enqueuePending({ lessonId: "a", artifact: null, owner: null });
    expect(item.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });
});

describe("pending — 보내기", () => {
  it("서버가 성공하면 대기열에서 지운다", async () => {
    vi.stubGlobal("fetch", respond(200));
    const { item } = enqueuePending({ lessonId: "a", artifact: { x: 1 }, owner: null });

    expect(await sendPending(item)).toBe("saved");
    expect(readPending()).toEqual([]);
  });

  it("통신이 끊기면 남겨 둔다", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("offline"); }));
    const { item } = enqueuePending({ lessonId: "a", artifact: null, owner: null });

    expect(await sendPending(item)).toBe("kept");
    expect(readPending()).toEqual([item]);
  });

  it("로그인 전(401)이면 남겨 둔다", async () => {
    vi.stubGlobal("fetch", respond(401));
    const { item } = enqueuePending({ lessonId: "a", artifact: null, owner: null });

    expect(await sendPending(item)).toBe("kept");
    expect(readPending()).toEqual([item]);
  });

  it("서버가 거부(400)하면 다시 보내지 않도록 지운다", async () => {
    vi.stubGlobal("fetch", respond(400));
    const { item } = enqueuePending({ lessonId: "없는-레슨", artifact: null, owner: null });

    expect(await sendPending(item)).toBe("dropped");
    expect(readPending()).toEqual([]);
  });

  it("항목의 id를 clientId로 같이 보낸다", async () => {
    const fetchMock = respond(200);
    vi.stubGlobal("fetch", fetchMock);
    const { item } = enqueuePending({ lessonId: "a", artifact: null, owner: null });
    await sendPending(item);

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      lessonId: "a",
      artifact: null,
      clientId: item.id,
    });
  });
});

describe("pending — 한꺼번에 보내기", () => {
  it("다른 아이 몫은 보내지 않는다", async () => {
    const fetchMock = respond(200);
    vi.stubGlobal("fetch", fetchMock);
    const { item: other } = enqueuePending({ lessonId: "a", artifact: null, owner: "kid-a" });
    enqueuePending({ lessonId: "b", artifact: null, owner: "kid-b" });
    enqueuePending({ lessonId: "c", artifact: null, owner: null });

    await flushPending("kid-b");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(readPending()).toEqual([other]);
  });

  it("손님 몫은 처음 보내려는 아이 것으로 확정돼 실패해도 다른 아이에게 안 간다", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("offline"); }));
    enqueuePending({ lessonId: "a", artifact: null, owner: null });

    await flushPending("kid-a");
    expect(readPending()[0].owner).toBe("kid-a");

    const fetchMock = respond(200);
    vi.stubGlobal("fetch", fetchMock);
    await flushPending("kid-b");

    expect(fetchMock).not.toHaveBeenCalled();
    expect(readPending()).toHaveLength(1);
  });

  it("통신이 끊기면 거기서 멈춘다", async () => {
    const fetchMock = vi.fn(async () => { throw new TypeError("offline"); });
    vi.stubGlobal("fetch", fetchMock);
    enqueuePending({ lessonId: "a", artifact: null, owner: null });
    enqueuePending({ lessonId: "b", artifact: null, owner: null });

    await flushPending("kid");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(readPending()).toHaveLength(2);
  });
});
