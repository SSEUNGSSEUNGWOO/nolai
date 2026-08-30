import { test, expect } from "@playwright/test";

/**
 * 첫 화면(/)은 설명이 아니라 첫 레슨의 놀이터다. 놓은 단어 수에 따라 노리의 말이
 * 바뀌고, "시작하기"가 아이 목록(/play)으로 보낸다.
 */
test("랜딩에서 단어를 놓으면 노리의 말이 바뀌고, 시작하기는 /play로 간다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("엔트리 다음은");

  const line = page.getByTestId("hero-line");
  await expect(line).toContainText("호랑이는 어디로 갈까");
  await page.getByTestId("drawer-word-tiger").click();
  await expect(line).toContainText("하나 더");
  await expect(page.getByTestId("chip-tiger")).toBeVisible();

  await page.getByTestId("landing-start").click();
  await expect(page).toHaveURL(/\/play$/);
  await expect(page.getByRole("link", { name: /비슷한 말끼리 모여라/ })).toBeVisible();
});

test("옛 주소 /parents는 첫 화면으로 간다", async ({ page }) => {
  await page.goto("/parents");
  await expect(page).toHaveURL(/\/$/);
});
