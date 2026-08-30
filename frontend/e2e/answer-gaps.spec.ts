import { test, expect, type Page } from "@playwright/test";

async function nearness(page: Page, rank: number): Promise<number> {
  const value = await page
    .getByTestId(`match-bar-${rank}`)
    .getAttribute("data-nearness");

  return Number(value);
}

test("\"없는 건 못 찾아\"를 처음부터 끝까지 완주한다", async ({ page }) => {
  await page.goto("/play");
  await page.getByRole("link", { name: /없는 건 못 찾아/ }).click();

  await expect(page.getByText(/답을 모르는 걸 물어보면/)).toBeVisible();
  await page.getByRole("button", { name: "궁금해!" }).click();

  for (const id of ["g01", "g07", "g08", "g12"]) {
    await page.getByTestId(`question-${id}`).click();
  }

  await page.getByRole("button", { name: "다 했어요" }).click();
  await expect(page.getByText("모른다는 걸 모른다")).toBeVisible();

  await page.getByRole("button", { name: "알겠어!" }).click();
  await page
    .getByRole("button", { name: "컴퓨터가 가진 문장에 축구 이야기가 없다는 것" })
    .click();
  await page.getByRole("button", { name: "다음으로" }).click();

  await expect(page.getByText("빈틈 탐정")).toBeVisible();
  await page.getByRole("button", { name: "좋아!" }).click();
  await expect(page.getByText("레슨을 끝냈어!")).toBeVisible();
});

test("답이 없는 질문은 답이 있는 질문보다 막대가 짧다", async ({ page }) => {
  // 이 차이가 레슨의 근거다. 겹치면 아이에게 보여줄 것이 없다.
  await page.goto("/lesson/answer-gaps");
  await page.getByRole("button", { name: "궁금해!" }).click();

  await page.getByTestId("question-g04").click(); // 펭귄 -- 답이 있다
  const hasAnswer = await nearness(page, 1);

  await page.getByTestId("question-g08").click(); // 축구 -- 답이 없다
  const noAnswer = await nearness(page, 1);

  expect(hasAnswer).toBeGreaterThan(noAnswer + 0.2);
});

test("답이 없으면 세 막대가 고만고만하다", async ({ page }) => {
  // 컴퓨터도 확신이 없다는 뜻이고, 그게 아이가 알아채야 할 신호다
  await page.goto("/lesson/answer-gaps");
  await page.getByRole("button", { name: "궁금해!" }).click();
  await page.getByTestId("question-g08").click();

  const bars = [await nearness(page, 1), await nearness(page, 2), await nearness(page, 3)];
  expect(Math.max(...bars) - Math.min(...bars)).toBeLessThan(0.12);
});

test("답이 있으면 1등 막대가 확실히 앞선다", async ({ page }) => {
  await page.goto("/lesson/answer-gaps");
  await page.getByRole("button", { name: "궁금해!" }).click();
  await page.getByTestId("question-g04").click();

  expect(await nearness(page, 1)).toBeGreaterThan((await nearness(page, 2)) + 0.2);
});
