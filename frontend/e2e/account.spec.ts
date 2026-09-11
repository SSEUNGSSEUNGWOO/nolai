import { test, expect, type Page } from "@playwright/test";
import {
  NICKNAME_CHARACTERS,
  NICKNAME_MODIFIERS,
} from "../lib/auth/nickname";
import { clearAttempts, deleteKidsByNickname, testDb } from "./support/db";

/**
 * 이 파일은 실제 Supabase 프로젝트에 계정을 만든다. 만든 닉네임만 골라 지우고,
 * 시도 제한 버킷도 이 테스트가 쓴 것만 지운다(안 지우면 한 시간에 마흔 번까지만
 * 돌릴 수 있다).
 */
const created: string[] = [];

test.afterEach(async () => {
  for (const nickname of created.splice(0)) {
    await deleteKidsByNickname(nickname);
  }
  await clearAttempts(["signup-ip:", "login-ip:", "login-nick:"]);
});

/** 닉네임을 화면에서 고를 수 있는 두 조각으로 되돌린다. */
function split(nickname: string): { modifier: string; character: string } {
  for (const modifier of NICKNAME_MODIFIERS) {
    if (!nickname.startsWith(modifier)) continue;

    const character = nickname.slice(modifier.length);
    if (NICKNAME_CHARACTERS.includes(character as never)) {
      return { modifier, character };
    }
  }

  throw new Error(`조합으로 되돌릴 수 없는 닉네임: ${nickname}`);
}

async function join(page: Page): Promise<{ nickname: string; code: string }> {
  await page.goto("/join");
  // 누르기 전에 이름을 먼저 적어둔다. 가입 뒤 단언에서 실패하면 뒷정리가
  // 이 계정을 놓쳐 DB에 고아 계정이 남는다.
  const candidate = page.locator('[data-testid^="nickname-"]').first();
  created.push((await candidate.innerText()).trim());
  await candidate.click();

  await expect(page.getByTestId("issued-code")).toBeVisible();
  const nickname = (await page.getByTestId("issued-nickname").innerText()).trim();
  const code = (await page.getByTestId("issued-code").innerText()).trim();

  return { nickname, code };
}

/** "가장 가까운 걸 찾아줘"를 훅부터 배지까지 완주한다. 질문 5개면 목표가 찬다. */
async function finishLesson2(page: Page) {
  await page.goto("/lesson/nearest-search");
  await playLesson2(page);
  // 진도 저장 응답을 기다린다. keepalive는 요청이 도착하는 것만 보장하지
  // 서버가 DB에 쓰기를 마친 것까지 보장하지 않는다. 안 기다리면 바로 뒤에
  // 오는 /room 검사가 간헐적으로 배지를 못 본다.
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/progress")).catch(() => null),
    page.getByRole("button", { name: "좋아!" }).click(),
  ]);
  await expect(page.getByText("레슨을 끝냈어!")).toBeVisible();
}

/** 이미 열린 레슨 화면에서 보상 화면("좋아!" 직전)까지 간다. 네트워크를 쓰지 않는다. */
async function playLesson2(page: Page) {
  await page.getByRole("button", { name: "궁금해!" }).click();
  for (const id of ["q01", "q05", "q08", "q13", "q20"]) {
    await page.getByTestId(`question-${id}`).click();
  }
  await page.getByRole("button", { name: "다 했어요" }).click();
  await page.getByRole("button", { name: "알겠어!" }).click();
  await page
    .getByRole("button", { name: "먹을 게 어디 있는지 친구한테 어떻게 알려줘?" })
    .click();
  await page.getByRole("button", { name: "다음으로" }).click();
  await page.getByRole("button", { name: "펭귄은 헤엄은 치지만 날지 못한다" }).click();
  await page.getByRole("button", { name: "다음으로" }).click();
}

test("가입하고 레슨을 끝내면 내 방에 배지가 꽂힌다", async ({ page }) => {
  const { nickname } = await join(page);

  await page.getByRole("button", { name: "내 방으로 가기" }).click();
  await expect(page.getByRole("heading", { name: `${nickname}의 내 방` })).toBeVisible();
  await expect(page.getByText("아직 배지가 없어")).toBeVisible();

  await finishLesson2(page);

  await page.goto("/room");
  await expect(page.getByTestId("badge-path-finder")).toContainText("길 찾기 대장");
  await expect(page.getByTestId("room-lesson-nearest-search")).toHaveAttribute(
    "data-done",
    "true",
  );
});

test("나갔다가 닉네임과 코드로 다시 들어오면 진도가 그대로다", async ({ page }) => {
  const { nickname, code } = await join(page);
  await finishLesson2(page);

  await page.goto("/room");
  await page.getByTestId("logout").click();
  await expect(page.getByTestId("to-join")).toBeVisible();

  const { modifier, character } = split(nickname);
  await page.goto("/login");
  await page.getByTestId("modifier").selectOption(modifier);
  await page.getByTestId("character").selectOption(character);
  await page.getByTestId("code").fill(code);
  await page.getByTestId("login-submit").click();

  await expect(page.getByRole("heading", { name: `${nickname}의 내 방` })).toBeVisible();
  await expect(page.getByTestId("badge-path-finder")).toBeVisible();
});

test("나가면 브라우저에 남은 진도가 다음 아이에게 넘어가지 않는다", async ({ page }) => {
  // 교실 공용 기기: A가 나간 뒤 B가 같은 브라우저를 쓴다.
  await join(page);
  await finishLesson2(page);

  await page.goto("/room");
  await page.getByTestId("logout").click();
  await expect(page.getByTestId("to-join")).toBeVisible();

  await expect(page.getByTestId("lesson-nearest-search")).not.toHaveAttribute(
    "data-done",
    "true",
  );
});

test("연결이 끊긴 채 레슨을 끝내도 작품이 나중에 내 방에 저장된다", async ({ page, context }) => {
  const { nickname } = await join(page);

  await page.goto("/lesson/nearest-search");
  // 로그인 여부(/api/me)를 받은 뒤에 끊는다. 그래야 "보관했어" 안내가 뜬다.
  await page.waitForResponse((r) => r.url().endsWith("/api/me"));
  await context.setOffline(true);
  await playLesson2(page);
  await page.getByRole("button", { name: "좋아!" }).click();
  await expect(page.getByTestId("kept-locally")).toBeVisible();

  // 다시 연결되면 다음 방문 때 보낸다. /room은 서버가 그리므로 보내기가 끝난 뒤 연다.
  await context.setOffline(false);
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/progress") && r.ok()),
    page.goto("/play"),
  ]);

  await page.goto("/room");
  await expect(page.getByRole("heading", { name: `${nickname}의 내 방` })).toBeVisible();
  await expect(page.getByTestId("badge-path-finder")).toBeVisible();
  await expect(page.getByTestId("artifact-shelf")).toContainText("질문 5개를 찾아봤어");

  // 보낸 뒤에는 대기열이 비어 있어야 한다. 남으면 방문마다 다시 보낸다.
  expect(await page.evaluate(() => localStorage.getItem("nolai:pending"))).toBe("[]");
});

test("소문자로 코드를 쳐도 들어갈 수 있다", async ({ page }) => {
  const { nickname, code } = await join(page);

  await page.goto("/room");
  await page.getByTestId("logout").click();

  const { modifier, character } = split(nickname);
  await page.goto("/login");
  await page.getByTestId("modifier").selectOption(modifier);
  await page.getByTestId("character").selectOption(character);
  await page.getByTestId("code").fill(code.toLowerCase());
  await page.getByTestId("login-submit").click();

  await expect(page.getByRole("heading", { name: `${nickname}의 내 방` })).toBeVisible();
});

test("코드가 틀리면 들어가지 못한다", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("code").fill("ZZZZZZ");
  await page.getByTestId("login-submit").click();

  await expect(page.getByTestId("login-error")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("로그인 없이 끝낸 레슨이 가입할 때 따라온다", async ({ page }) => {
  // 계정 없이 먼저 논다 (설계 문서 3장: 첫 방문 60초 안에 놀이터까지)
  await finishLesson2(page);

  const { nickname } = await join(page);

  await page.goto("/room");
  await expect(page.getByRole("heading", { name: `${nickname}의 내 방` })).toBeVisible();
  await expect(page.getByTestId("badge-path-finder")).toBeVisible();
});

test("레슨에서 만든 작품이 내 방에 쌓인다", async ({ page }) => {
  const { nickname } = await join(page);

  await page.goto("/room");
  await expect(page.getByText("아직 작품이 없어")).toBeVisible();

  await finishLesson2(page);

  await page.goto("/room");
  await expect(page.getByRole("heading", { name: `${nickname}의 내 방` })).toBeVisible();

  const shelf = page.getByTestId("artifact-shelf");
  await expect(shelf).toBeVisible();
  // 놀이터에서 고른 질문 5개가 작품에 그대로 담겨 있어야 한다
  await expect(shelf).toContainText("질문 5개를 찾아봤어");
  await expect(shelf).toContainText("먹을 게 어디 있는지 친구한테 어떻게 알려줘?");
});

test("내 방을 지우면 DB에서도 사라지고 로그아웃된다", async ({ page }) => {
  // 개인정보처리방침이 약속한 "즉시 삭제"가 실제로 일어나는지 확인한다.
  const { nickname } = await join(page);
  await finishLesson2(page);

  await page.goto("/room");
  await page.getByTestId("delete-room").click();
  await expect(page.getByText(/되돌릴 수 없어/)).toBeVisible();
  await Promise.all([
    page.waitForResponse((r) => r.url().endsWith("/api/me") && r.request().method() === "DELETE"),
    page.getByTestId("delete-room-confirm").click(),
  ]);

  const db = testDb();
  const kids = await db.from("kids").select("id").eq("nickname", nickname);
  expect(kids.data).toEqual([]);
  // 진도·배지도 cascade로 같이 사라져야 한다 -- 고아 행은 닉네임 없는 개인정보다
  const progress = await db.from("progress").select("kid_id");
  expect(progress.data?.length ?? 0).toBe(0);

  // 쿠키가 지워져 첫 화면은 로그아웃 상태다
  await page.goto("/play");
  await expect(page.getByTestId("to-join")).toBeVisible();
});

test("개인정보처리방침에 첫 화면과 내 방에서 갈 수 있다", async ({ page }) => {
  await page.goto("/play");
  await page.getByRole("link", { name: "개인정보처리방침" }).click();
  await expect(page.getByRole("heading", { name: "개인정보처리방침" })).toBeVisible();
  await expect(page.getByText(/내 방 지우기/)).toBeVisible();
});
