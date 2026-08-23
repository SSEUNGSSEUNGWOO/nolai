import { test, expect } from "@playwright/test";

test("\"AI랑 기분 맞히기 대결\"를 처음부터 끝까지 완주한다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /AI랑 기분 맞히기 대결/ }).click();

  await expect(page.getByText(/알아맞힐 수 있을까/)).toBeVisible();
  await page.getByRole("button", { name: "궁금해!" }).click();

  for (const [id, side] of [
    ["f01", "good"],
    ["f06", "bad"],
    ["f11", "bad"],
    ["f12", "good"],
    ["f10", "good"],
  ] as const) {
    await page.getByTestId(`sentence-${id}`).click();
    await page.getByTestId(`guess-${side}`).click();
  }

  await page.getByRole("button", { name: "다 했어요" }).click();
  await expect(page.getByText("배운 대로 본다")).toBeVisible();

  await page.getByRole("button", { name: "알겠어!" }).click();
  await page
    .getByRole("button", { name: "AI는 확신에 차 있어도 틀릴 수 있다는 것" })
    .click();
  await page.getByRole("button", { name: "다음으로" }).click();

  await expect(page.getByText("기분 판사")).toBeVisible();
  await page.getByRole("button", { name: "좋아!" }).click();
  await expect(page.getByText("레슨을 끝냈어!")).toBeVisible();
});

test("내가 고르기 전에는 AI 답이 안 보인다", async ({ page }) => {
  // 보고 나면 대결이 아니다
  await page.goto("/lesson/feeling-duel");
  await page.getByRole("button", { name: "궁금해!" }).click();

  await page.getByTestId("sentence-f11").click();
  await expect(page.getByTestId("ai-verdict")).toHaveCount(0);

  await page.getByTestId("guess-bad").click();
  await expect(page.getByTestId("ai-verdict")).toBeVisible();
});

test("쉬운 문장은 AI도 맞힌다", async ({ page }) => {
  await page.goto("/lesson/feeling-duel");
  await page.getByRole("button", { name: "궁금해!" }).click();

  await page.getByTestId("sentence-f01").click();
  await page.getByTestId("guess-good").click();

  await expect(page.getByTestId("ai-verdict")).toHaveAttribute("data-right", "true");
  await expect(page.getByTestId("ai-wrong")).toHaveCount(0);
});

test("AI가 자신 있게 틀리는 문장이 있다", async ({ page }) => {
  // 이 레슨의 근거다. AI가 다 맞히면 보여줄 것이 없다.
  await page.goto("/lesson/feeling-duel");
  await page.getByRole("button", { name: "궁금해!" }).click();

  await page.getByTestId("sentence-f11").click();
  await page.getByTestId("guess-bad").click();

  await expect(page.getByTestId("my-verdict")).toHaveAttribute("data-right", "true");
  await expect(page.getByTestId("ai-verdict")).toHaveAttribute("data-right", "false");
  await expect(page.getByTestId("ai-verdict")).toContainText("97%");
  await expect(page.getByTestId("ai-wrong")).toBeVisible();
});
