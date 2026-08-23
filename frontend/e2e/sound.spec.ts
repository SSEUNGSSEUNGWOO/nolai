import { test, expect } from "@playwright/test";

/**
 * 소리가 실제로 나는지는 jsdom에서 확인할 수 없다(Web Audio가 없다).
 * 진짜 브라우저에서 오실레이터가 만들어지는지를 센다.
 */
async function countOscillators(page: import("@playwright/test").Page) {
  return page.evaluate(() => (window as unknown as { __osc: number }).__osc);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __osc: number }).__osc = 0;
    const original = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function patched(this: AudioContext) {
      (window as unknown as { __osc: number }).__osc += 1;
      return original.call(this);
    };
  });
});

/** "가장 가까운 걸 찾아줘"를 완주해 보상 화면까지 간다. */
async function finish(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "궁금해!" }).click();
  for (const id of ["q01", "q08", "q20"]) await page.getByTestId(`question-${id}`).click();
  await page.getByRole("button", { name: "다 했어요" }).click();
  await page.getByRole("button", { name: "알겠어!" }).click();
  await page
    .getByRole("button", { name: "먹을 게 어디 있는지 친구한테 어떻게 알려줘?" })
    .click();
  await page.getByRole("button", { name: "다음으로" }).click();
}

test("배지를 받으면 소리가 난다", async ({ page }) => {
  await page.goto("/lesson/nearest-search");
  await finish(page);

  await expect(page.getByText("길 찾기 대장")).toBeVisible();
  expect(await countOscillators(page)).toBeGreaterThan(0);
});

test("음소거하면 소리를 내지 않는다", async ({ page }) => {
  await page.goto("/lesson/nearest-search");
  await page.getByTestId("mute").click();

  await finish(page);

  await expect(page.getByText("길 찾기 대장")).toBeVisible();
  expect(await countOscillators(page)).toBe(0);
});
