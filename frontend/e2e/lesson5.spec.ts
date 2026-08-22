import { test, expect } from "@playwright/test";

test("레슨 5를 처음부터 끝까지 완주한다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /내 취향을 어떻게 알까/ }).click();

  await expect(page.getByText(/어떻게 아는 걸까/)).toBeVisible();
  await page.getByRole("button", { name: "궁금해!" }).click();

  await expect(page.getByTestId("like-shelf")).toBeVisible();
  // 좋아하기 전에는 추천이 없다
  await expect(page.getByTestId("recommendations")).toHaveCount(0);

  for (const id of ["pizza", "soccer", "lego"]) {
    await page.getByTestId(`item-${id}`).click();
  }

  await expect(page.getByTestId("recommendations")).toBeVisible();
  await page.getByRole("button", { name: "다 했어요" }).click();
  await expect(page.getByText("추천", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "알겠어!" }).click();
  await page.getByRole("button", { name: "축구는 피자와 닮지 않아서" }).click();
  await page.getByRole("button", { name: "다음으로" }).click();

  await expect(page.getByText("취향 탐정")).toBeVisible();
  await page.getByRole("button", { name: "좋아!" }).click();
  await expect(page.getByText("레슨을 끝냈어!")).toBeVisible();
});

test("좋아한 것과 같은 갈래를 추천한다", async ({ page }) => {
  await page.goto("/lesson/like-recommender");
  await page.getByRole("button", { name: "궁금해!" }).click();
  await page.getByTestId("item-soccer").click();

  // 축구를 좋아하면 운동이 나와야 한다
  const picks = page.locator('[data-testid^="pick-"]');
  await expect(picks).toHaveCount(3);
  await expect(page.getByTestId("recommendations")).toContainText("야구");
});

test("왜 추천했는지 함께 보여준다", async ({ page }) => {
  // 이유 없는 추천은 마술처럼 보인다. 이 레슨은 그 마술을 걷어내는 것이 목적이다.
  await page.goto("/lesson/like-recommender");
  await page.getByRole("button", { name: "궁금해!" }).click();
  await page.getByTestId("item-pizza").click();

  await expect(page.getByTestId("recommendations")).toContainText("네가 좋아한");
  await expect(page.locator('[data-testid^="pick-"]').first()).toHaveAttribute(
    "data-via",
    "pizza",
  );
});

test("취향이 갈리면 양쪽에서 골라준다", async ({ page }) => {
  await page.goto("/lesson/like-recommender");
  await page.getByRole("button", { name: "궁금해!" }).click();
  await page.getByTestId("item-pizza").click();
  await page.getByTestId("item-soccer").click();

  const vias = await page
    .locator('[data-testid^="pick-"]')
    .evaluateAll((els) => els.map((el) => el.getAttribute("data-via")));

  expect(new Set(vias).size).toBeGreaterThan(1);
});

test("하트를 다시 누르면 취향에서 빠진다", async ({ page }) => {
  await page.goto("/lesson/like-recommender");
  await page.getByRole("button", { name: "궁금해!" }).click();

  await page.getByTestId("item-pizza").click();
  await expect(page.getByTestId("item-pizza")).toHaveAttribute("data-liked", "true");

  await page.getByTestId("item-pizza").click();
  await expect(page.getByTestId("item-pizza")).not.toHaveAttribute("data-liked");
  await expect(page.getByTestId("recommendations")).toHaveCount(0);
});
