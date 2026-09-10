import { test, expect, type Page } from "@playwright/test";
import { clearAttempts, deleteKidsByNickname } from "./support/db";

/**
 * test 스키마의 words 테이블(사전 전체)을 실제로 찌른다. 시도 제한 버킷은 이
 * 테스트가 쓴 것만 지운다.
 */
const created: string[] = [];

test.afterEach(async () => {
  for (const nickname of created.splice(0)) {
    await deleteKidsByNickname(nickname);
  }
  await clearAttempts(["signup-ip:", "words-ip:"]);
});

async function pick(page: Page, label: string, word: string) {
  await page.getByRole("textbox", { name: label }).fill(word);
  await page.getByRole("button", { name: word, exact: true }).click();
}

test("두 단어를 고르면 유사도가 나오고, 한쪽을 바꾸면 아까 결과가 남는다", async ({ page }) => {
  await page.goto("/lab");
  // 안내의 보기 하나를 누르면 고양이·강아지가 채워진다
  await page.getByRole("button", { name: "좀 비슷해" }).click();
  await expect(page.getByTestId("lab-meter")).toHaveAttribute("data-score", /^\d+$/);
  const first = await page.getByTestId("lab-meter").getAttribute("data-score");

  await pick(page, "오른쪽 단어", "호랑이");
  await expect(page.getByTestId("lab-history")).toContainText("고양이 ↔ 강아지");
  await expect(page.getByTestId("lab-history")).toContainText(`${first}`);
  await expect(page.getByTestId("lab-history")).toContainText("고양이 ↔ 호랑이");
});

test("가까운 말 20개가 나오고 누르면 따라간다", async ({ page }) => {
  await page.goto("/lab");
  await page.evaluate(() => window.localStorage.setItem("nolai:lab-intro", "done"));
  await page.reload();

  await pick(page, "가까운 말 찾을 단어", "강아지");
  const rows = page.getByTestId("lab-near").getByRole("listitem");
  await expect(rows).toHaveCount(20);
  await expect(rows.first()).toContainText("애완동물");

  await rows.first().getByRole("button").click();
  await expect(page.getByRole("textbox", { name: "가까운 말 찾을 단어" })).toHaveValue("애완동물");
  await expect(rows.first()).not.toContainText("애완동물");
});

test("로그인 전에는 남길 수 없고, 방을 만들면 내 방에 쌓인다", async ({ page }) => {
  await page.goto("/lab");
  await page.getByRole("button", { name: "좀 비슷해" }).click();
  await expect(page.getByTestId("lab-meter")).toHaveAttribute("data-score", /^\d+$/);
  await page.locator('[data-testid^="star-"]').first().click();
  await expect(page.getByText("방을 만들면 발견을 남길 수 있어")).toBeVisible();

  // 가입
  await page.goto("/join");
  const candidate = page.locator('[data-testid^="nickname-"]').first();
  created.push((await candidate.innerText()).trim());
  await candidate.click();
  await expect(page.getByTestId("issued-code")).toBeVisible();

  await page.goto("/lab");
  await pick(page, "왼쪽 단어", "고양이");
  await pick(page, "오른쪽 단어", "강아지");
  await expect(page.getByTestId("lab-meter")).toHaveAttribute("data-score", /^\d+$/);
  await page.locator('[data-testid^="star-"]').first().click();
  await page.getByTestId("lab-save").click();
  await expect(page.getByTestId("lab-saved")).toBeVisible();

  await page.goto("/room");
  const shelf = page.getByTestId("artifact-shelf");
  await expect(shelf).toContainText("단어 실험실");
  await expect(shelf).toContainText("고양이 ↔ 강아지");
});

test("사전에 없는 id는 400, 같은 단어끼리도 400, 로그인 없는 저장은 401", async ({ request }) => {
  expect((await request.get("/api/words/near?id=999999")).status()).toBe(400);
  expect((await request.get("/api/words/compare?a=1&b=1")).status()).toBe(400);
  expect((await request.post("/api/words/save", { data: { pairs: [[1, 2]] } })).status()).toBe(401);
});
