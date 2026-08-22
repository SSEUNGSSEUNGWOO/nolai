import { test, expect, type Page } from "@playwright/test";

async function score(page: Page, a: string, b: string): Promise<number> {
  await page.getByTestId(`word-${a}`).click();
  await page.getByTestId(`word-${b}`).click();
  const value = await page.getByTestId("meter").getAttribute("data-score");

  return Number(value);
}

test("레슨 13을 처음부터 끝까지 완주한다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /반대말인데 왜 가까워/ }).click();

  await expect(page.getByText(/가까울까, 멀까/)).toBeVisible();
  await page.getByRole("button", { name: "궁금해!" }).click();

  await score(page, "big", "small");
  await score(page, "hot", "cold");
  await score(page, "big", "pencil");
  await score(page, "bright", "car");

  await page.getByRole("button", { name: "다 했어요" }).click();
  await expect(page.getByText("주제가 먼저")).toBeVisible();

  await page.getByRole("button", { name: "알겠어!" }).click();
  await page.getByRole("button", { name: "둘 다 온도에 대한 말이라서" }).click();
  await page.getByRole("button", { name: "다음으로" }).click();

  await expect(page.getByText("저울 박사")).toBeVisible();
  await page.getByRole("button", { name: "좋아!" }).click();
  await expect(page.getByText("레슨을 끝냈어!")).toBeVisible();
});

test("반대말이 무관한 말보다 훨씬 가깝다", async ({ page }) => {
  // 이 레슨의 근거다. 뒤집히면 보여줄 것이 없다.
  await page.goto("/lesson/compare-meter");
  await page.getByRole("button", { name: "궁금해!" }).click();

  const opposite = await score(page, "big", "small");
  const unrelated = await score(page, "big", "pencil");

  expect(opposite).toBeGreaterThan(unrelated + 0.2);
});

test("반대말과 비슷한 말이 거의 같게 나온다", async ({ page }) => {
  // 컴퓨터가 반대인지 비슷한지를 구별하지 못한다는 것이 name 스텝의 주장이다
  await page.goto("/lesson/compare-meter");
  await page.getByRole("button", { name: "궁금해!" }).click();

  const opposite = await score(page, "big", "small");
  const similar = await score(page, "big", "long");

  expect(Math.abs(opposite - similar)).toBeLessThan(0.1);
});

test("고르기 전에는 값이 없다", async ({ page }) => {
  await page.goto("/lesson/compare-meter");
  await page.getByRole("button", { name: "궁금해!" }).click();

  await expect(page.getByTestId("meter")).not.toHaveAttribute("data-score");
  await expect(page.getByTestId("meter")).toContainText("두 개를 골라봐");
});
