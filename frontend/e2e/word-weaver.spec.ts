import { test, expect } from "@playwright/test";

test("\"AI는 글을 이렇게 써\"를 처음부터 끝까지 완주한다", async ({ page }) => {
  await page.goto("/play");
  await page.getByRole("link", { name: /AI는 글을 이렇게 써/ }).click();

  await expect(page.getByText(/술술 쓰는 걸까/)).toBeVisible();
  await page.getByRole("button", { name: "궁금해!" }).click();

  // 문장 세 개를 만든다
  for (let i = 0; i < 3; i++) {
    await page.getByTestId("start-나는").click();
    while ((await page.getByTestId("ended").count()) === 0) {
      await page.locator('button[data-testid^="next-"]').first().click();
    }
    await page.getByTestId("save-sentence").click();
  }

  await page.getByRole("button", { name: "다 했어요" }).click();
  await expect(page.getByText("다음 말 고르기")).toBeVisible();

  await page.getByRole("button", { name: "알겠어!" }).click();
  await page
    .getByRole("button", { name: "다음 말만 고를 뿐 사실인지는 확인 안 해서" })
    .click();
  await page.getByRole("button", { name: "다음으로" }).click();
  // 두 번째 도전: '옛날' 뒤에는 늘 '옛날에'만 왔다
  await page
    .getByRole("button", { name: "배운 문장에서 '옛날' 뒤엔 늘 같은 말이라서" })
    .click();
  await page.getByRole("button", { name: "다음으로" }).click();

  await expect(page.getByText("이야기 짓는 아이")).toBeVisible();
  await page.getByRole("button", { name: "좋아!" }).click();
  await expect(page.getByText("레슨을 끝냈어!")).toBeVisible();
});

test("한 번에 한 말씩 붙고 확률이 보인다", async ({ page }) => {
  await page.goto("/lesson/word-weaver");
  await page.getByRole("button", { name: "궁금해!" }).click();

  await expect(page.getByTestId("sentence")).toContainText("첫 말을 골라봐");

  await page.getByTestId("start-나는").click();
  await expect(page.getByTestId("sentence")).toContainText("나는");

  // '나는' 뒤에는 다섯 가지가 왔고 각각 20%다
  const options = page.locator('button[data-testid^="next-"]');
  await expect(options).toHaveCount(5);
  await expect(options.first()).toHaveAttribute("data-p", "0.20");
});

test("본 적 없는 말에 닿으면 끝난다", async ({ page }) => {
  // "AI는 본 것만 이어 붙인다"가 이 레슨의 주장이다
  await page.goto("/lesson/word-weaver");
  await page.getByRole("button", { name: "궁금해!" }).click();

  await page.getByTestId("start-나는").click();
  let steps = 0;
  while ((await page.getByTestId("ended").count()) === 0 && steps < 20) {
    await page.locator('button[data-testid^="next-"]').first().click();
    steps += 1;
  }

  await expect(page.getByTestId("ended")).toBeVisible();
  expect(steps).toBeLessThan(20);
});

test("첫 말이 다르면 다른 문장이 나온다", async ({ page }) => {
  await page.goto("/lesson/word-weaver");
  await page.getByRole("button", { name: "궁금해!" }).click();

  const build = async (start: string) => {
    await page.getByTestId(`start-${start}`).click();
    while ((await page.getByTestId("ended").count()) === 0) {
      await page.locator('button[data-testid^="next-"]').first().click();
    }
    const made = await page.getByTestId("sentence").innerText();
    await page.getByTestId("save-sentence").click();
    return made;
  };

  expect(await build("나는")).not.toBe(await build("고양이가"));
});
