import { test, expect, type Page } from "@playwright/test";

/** 단어를 하나 골라 상자에 넣는다. */
async function teach(page: Page, wordId: string, boxId: string) {
  await page.getByTestId(`word-${wordId}`).click();
  await page.getByTestId(`box-${boxId}`).click();
}

test("\"컴퓨터에게 가르쳐주기\"를 처음부터 끝까지 완주한다", async ({ page }) => {
  await page.goto("/play");
  await page.getByRole("link", { name: /컴퓨터에게 가르쳐주기/ }).click();

  await expect(page.getByText(/어떻게 알려주지/)).toBeVisible();
  await page.getByRole("button", { name: "궁금해!" }).click();

  await expect(page.getByTestId("teach-drawer")).toBeVisible();
  for (const [word, box] of [
    ["dog", "animal"],
    ["whale", "animal"],
    ["car", "vehicle"],
    ["airplane", "vehicle"],
  ] as const) {
    await teach(page, word, box);
  }

  await page.getByRole("button", { name: "다 했어요" }).click();
  await expect(page.getByText("학습 데이터")).toBeVisible();

  await page.getByRole("button", { name: "알겠어!" }).click();
  await page
    .getByRole("button", { name: "가르쳐준 예시가 강아지 하나뿐이라서" })
    .click();
  await page.getByRole("button", { name: "다음으로" }).click();

  await expect(page.getByText("꼬마 선생님")).toBeVisible();
  await page.getByRole("button", { name: "좋아!" }).click();
  await expect(page.getByText("레슨을 끝냈어!")).toBeVisible();
});

test("골고루 가르치면 컴퓨터가 나머지를 맞힌다", async ({ page }) => {
  await page.goto("/lesson/teach-sorter");
  await page.getByRole("button", { name: "궁금해!" }).click();

  await teach(page, "dog", "animal");
  await teach(page, "whale", "animal");
  await teach(page, "car", "vehicle");
  await teach(page, "airplane", "vehicle");
  await page.getByTestId("ask-computer").click();

  // 가르치지 않은 16개가 전부 제자리로 가야 한다
  const guessed = page.locator('[data-testid^="guessed-"]');
  await expect(guessed).toHaveCount(16);
  await expect(page.locator('[data-testid^="guessed-"][data-right="false"]')).toHaveCount(0);
});

test("한쪽만 가르치면 컴퓨터가 틀린다", async ({ page }) => {
  // 이 레슨이 하려는 말이다 -- 안 보여준 것은 알 수 없다
  await page.goto("/lesson/teach-sorter");
  await page.getByRole("button", { name: "궁금해!" }).click();

  await teach(page, "dog", "animal");
  await page.getByTestId("ask-computer").click();

  // 예시가 동물 하나뿐이니 탈것까지 전부 동물 상자로 간다
  await expect(page.getByTestId("guessed-car")).toHaveAttribute("data-right", "false");
  await expect(page.getByTestId("guessed-airplane")).toHaveAttribute("data-right", "false");
});
