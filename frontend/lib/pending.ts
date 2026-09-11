/**
 * 아직 서버에 닿지 못한 레슨 완료(진도 + 작품)의 대기열.
 *
 * 레슨을 끝내면 먼저 여기에 넣고 /api/progress로 보낸다. 서버가 성공을
 * 돌려준 것만 지운다. 통신이 끊겼거나 로그인 전이면 남아 있다가 다음 방문,
 * 로그인, 네트워크 재연결 때 다시 나간다. 항목마다 브라우저가 id를 붙여
 * 두 번 도착해도 서버가 한 번만 저장한다(artifacts.client_id).
 *
 * owner는 이 항목을 받을 아이의 id다. 만들 때 로그인해 있었으면 그 아이,
 * 손님이면 null이고, 손님 몫은 처음 보내려는 아이 것으로 확정된다. 공용
 * 기기에서 A가 나간 뒤 B가 로그인해도 A의 작품이 B의 방에 들어가면 안 된다.
 */
const KEY = "nolai:pending";
/** 한 기기에 이보다 많이 쌓이면 오래된 것부터 버린다. 통신이 계속 안 되는 상황이다. */
const MAX_ITEMS = 50;

export interface PendingItem {
  id: string;
  lessonId: string;
  artifact: unknown;
  owner: string | null;
}

export type SendOutcome = "saved" | "kept" | "dropped";

/**
 * 서버가 uuid만 받으므로(app/api/progress) 대체 경로도 반드시 v4 모양을 만든다.
 * 아무 문자열이나 만들면 400이 돌아오고 대기열이 그 작품을 버린다.
 */
function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function readPending(): PendingItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (one): one is PendingItem =>
        typeof one === "object" &&
        one !== null &&
        typeof (one as PendingItem).id === "string" &&
        typeof (one as PendingItem).lessonId === "string",
    );
  } catch {
    return [];
  }
}

/** 저장소가 꽉 찼거나 막혀 있으면 false. 여기서 던지면 레슨 완료 화면까지 막힌다. */
function writePending(items: PendingItem[]): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(KEY, JSON.stringify(items.slice(-MAX_ITEMS)));
    return true;
  } catch {
    return false;
  }
}

/**
 * 대기열에 넣는다. stored가 false면 브라우저에 남기지 못한 것이라, 바로 이어지는
 * 전송이 실패하면 이 항목은 사라진다 -- 화면이 그 사실을 아이에게 알려야 한다.
 */
export function enqueuePending(
  item: Omit<PendingItem, "id">,
): { item: PendingItem; stored: boolean } {
  const created = { id: newId(), ...item };
  const stored = writePending([...readPending(), created]);
  return { item: created, stored };
}

export function removePending(id: string): void {
  writePending(readPending().filter((one) => one.id !== id));
}

/** 계정이 지워지면 그 아이 몫의 대기열도 지운다. 받아줄 방이 없다. */
export function clearPendingOwnedBy(owner: string): void {
  writePending(readPending().filter((one) => one.owner !== owner));
}

/**
 * 한 항목을 서버로 보낸다. 성공하면 대기열에서 지운다.
 * - kept: 통신 실패나 로그인 전(401). 다음에 다시 보낸다.
 * - dropped: 서버가 요청 자체를 거부(400). 다시 보내도 소용없어 지운다.
 *
 * keepalive: 아이가 끝나자마자 화면을 벗어나도 요청은 살아서 도착한다. 응답을
 * 못 받아 대기열에 남으면 다음에 한 번 더 가지만 서버가 client_id로 걸러낸다.
 */
export async function sendPending(item: PendingItem): Promise<SendOutcome> {
  let response: Response;
  try {
    response = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        lessonId: item.lessonId,
        artifact: item.artifact,
        clientId: item.id,
      }),
    });
  } catch {
    return "kept";
  }

  if (response.ok) {
    removePending(item.id);
    return "saved";
  }
  if (response.status === 400) {
    removePending(item.id);
    return "dropped";
  }
  return "kept";
}

/**
 * 지금 로그인한 아이(owner) 몫을 차례로 보낸다.
 *
 * 손님 몫(owner null)은 보내기 전에 이 아이 것으로 먼저 확정한다. 확정하지
 * 않고 보내다 실패하면 null인 채 남아, 다음에 로그인한 다른 아이에게 간다.
 */
export async function flushPending(owner: string): Promise<void> {
  const claimed = readPending().map((item) =>
    item.owner === null ? { ...item, owner } : item,
  );
  writePending(claimed);

  for (const item of claimed) {
    if (item.owner !== owner) continue;
    const outcome = await sendPending(item);
    // 통신이 끊긴 상태면 나머지도 안 간다. 다음 기회에 이어서 한다.
    if (outcome === "kept") return;
  }
}
