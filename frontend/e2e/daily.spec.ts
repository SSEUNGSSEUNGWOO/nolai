import { test, expect, type Page } from "@playwright/test";
import { clearAttempts, deleteKidsByNickname, testDb } from "./support/db";
import dictionary from "../datasets/dictionary.json";

/**
 * test 스키마에 오늘의 단어를 "강아지"로 심고 논다. 이웃은 DB의 nearest_words로 만든다.
 * 실험실 E2E와 같은 사전을 쓴다.
 */
const created: string[] = [];
const dog = dictionary.words.find((w) => w.word === "강아지")!.id;

function todayKst(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

test.beforeAll(async () => {
  const db = testDb();
  const { data, error } = await db.rpc("nearest_words", { p_word_id: dog, p_count: 1000 });
  if (error) throw error;
  const neighbors = (data as { id: number }[]).map((r) => r.id);
  const { error: upsertError } = await db
    .from("daily_words")
    .upsert({ date: todayKst(), word_id: dog, neighbors }, { onConflict: "date" });
  if (upsertError) throw upsertError;
});

test.afterEach(async () => {
  for (const nickname of created.splice(0)) {
    await deleteKidsByNickname(nickname);
  }
  await clearAttempts(["signup-ip:", "words-ip:"]);
});

async function guess(page: Page, word: string) {
  await page.getByRole("textbox", { name: "넣을 단어" }).fill(word);
  await page.getByRole("button", { name: word, exact: true }).click();
  // 채점이 돌아와 목록에 붙을 때까지 기다린다
  await expect(page.getByTestId("daily-guesses")).toContainText(word);
}

test("넣을 때마다 온도가 나오고, 정답을 넣으면 맞힌 화면이 뜬다", async ({ page }) => {
  await page.goto("/daily");
  await guess(page, "고양이");
  const rows = page.getByTestId("daily-guesses").getByRole("listitem");
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toHaveAttribute("data-temperature", /hot|warm/);

  await guess(page, "책상");
  await expect(rows).toHaveCount(2);
  // 유사도 내림차순 -- 고양이가 위
  await expect(rows.first()).toContainText("고양이");

  await guess(page, "강아지");
  await expect(page.getByTestId("daily-solved")).toContainText("3번 만에");
  await expect(page.getByText("방을 만들면 순위에 올라가")).toBeVisible();
});

test("비회원의 시도는 새로고침해도 남는다", async ({ page }) => {
  await page.goto("/daily");
  await guess(page, "고양이");
  await page.reload();
  await expect(page.getByTestId("daily-guesses").getByRole("listitem")).toHaveCount(1);
});

test("방을 만들고 맞히면 오늘 순위에 오르고 내 방에 기록이 남는다", async ({ page }) => {
  await page.goto("/join");
  const candidate = page.locator('[data-testid^="nickname-"]').first();
  const nickname = (await candidate.innerText()).trim();
  created.push(nickname);
  await candidate.click();
  await expect(page.getByTestId("issued-code")).toBeVisible();

  await page.goto("/daily");
  await guess(page, "고양이");
  await guess(page, "강아지");
  await expect(page.getByTestId("daily-solved")).toContainText("2번 만에");
  await expect(page.getByTestId("daily-board")).toContainText(nickname);
  await expect(page.getByTestId("daily-me")).toContainText("등");

  await page.goto("/room");
  await expect(page.getByTestId("daily-record")).toContainText("연속 1일 참여");
  await expect(page.getByTestId("daily-record")).toContainText("최소 2번 만에 정답");
});

test("정답 id는 응답에 없고, 없는 단어는 400", async ({ request }) => {
  const state = await (await request.get("/api/daily")).json();
  expect(JSON.stringify(state)).not.toContain(`"wordId"`);
  expect((await request.post("/api/daily/guess", { data: { wordId: 999999 } })).status()).toBe(400);
});
