import { test, expect, type Page } from "@playwright/test";

/** 전구를 켜서 원하는 숫자를 만든다. 왼쪽이 큰 자리(128)다. */
async function makeNumber(page: Page, value: number) {
  await page.getByTestId("reset").click();
  for (let i = 0; i < 8; i++) {
    if (value & (1 << (7 - i))) await page.getByTestId(`bit-${i}`).click();
  }
}

test("\"컴퓨터는 0과 1뿐이야\"를 처음부터 끝까지 완주한다", async ({ page }) => {
  await page.goto("/play");
  await page.getByRole("link", { name: /컴퓨터는 0과 1뿐이야/ }).click();

  await expect(page.getByText(/0과 1밖에 없을까/)).toBeVisible();
  await page.getByRole("button", { name: "궁금해!" }).click();

  for (const n of [65, 97, 48, 33, 66, 63]) await makeNumber(page, n);

  await page.getByRole("button", { name: "다 했어요" }).click();
  await expect(page.getByText("0과 1", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "알겠어!" }).click();
  await page
    .getByRole("button", { name: "못 만든다. 여덟 개로는 255까지가 끝이라서" })
    .click();
  await page.getByRole("button", { name: "다음으로" }).click();
  // 두 번째 도전: 65에 32 전구를 더 켜면 97 = a
  await page.getByRole("button", { name: "a", exact: true }).click();
  await page.getByRole("button", { name: "다음으로" }).click();

  await expect(page.getByText("0과 1 마법사")).toBeVisible();
  await page.getByRole("button", { name: "좋아!" }).click();
  await expect(page.getByText("레슨을 끝냈어!")).toBeVisible();
});

test("전구를 켜면 자릿값을 더한 숫자가 나온다", async ({ page }) => {
  await page.goto("/lesson/bit-lights");
  await page.getByRole("button", { name: "궁금해!" }).click();

  await expect(page.getByTestId("readout")).toHaveAttribute("data-total", "0");

  // 맨 왼쪽은 128
  await page.getByTestId("bit-0").click();
  await expect(page.getByTestId("readout")).toHaveAttribute("data-total", "128");

  // 맨 오른쪽은 1
  await page.getByTestId("bit-7").click();
  await expect(page.getByTestId("readout")).toHaveAttribute("data-total", "129");
});

test("65를 만들면 A가 나온다", async ({ page }) => {
  await page.goto("/lesson/bit-lights");
  await page.getByRole("button", { name: "궁금해!" }).click();

  await makeNumber(page, 65);
  await expect(page.getByTestId("readout")).toHaveAttribute("data-total", "65");
  await expect(page.getByTestId("letter")).toContainText("A");
});

test("전구 여덟 개로는 255가 최대다", async ({ page }) => {
  // 도전 문제의 근거다
  await page.goto("/lesson/bit-lights");
  await page.getByRole("button", { name: "궁금해!" }).click();

  await makeNumber(page, 255);
  await expect(page.getByTestId("readout")).toHaveAttribute("data-total", "255");

  // 한글은 그보다 훨씬 크다
  await expect(page.getByTestId("wide-놀")).toContainText("45440");
  await expect(page.getByTestId("wide-놀")).toContainText("16개");
});
