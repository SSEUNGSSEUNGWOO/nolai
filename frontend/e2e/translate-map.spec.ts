import { test, expect } from "@playwright/test";

test("\"말이 달라도 뜻이 같으면\"를 처음부터 끝까지 완주한다", async ({ page }) => {
  await page.goto("/play");
  await page.getByRole("link", { name: /말이 달라도 뜻이 같으면/ }).click();

  await expect(page.getByText(/어떻게 짝지어 줄까/)).toBeVisible();
  await page.getByRole("button", { name: "궁금해!" }).click();

  for (let i = 0; i < 8; i++) {
    await page.locator('[data-testid^="drawer-word-"]').first().click();
  }

  await page.getByRole("button", { name: "다 했어요" }).click();
  await expect(page.getByText("번역", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "알겠어!" }).click();
  await page
    .getByRole("button", { name: "컴퓨터에게는 둘이 거의 같은 뜻이라는 것" })
    .click();
  await page.getByRole("button", { name: "다음으로" }).click();

  await expect(page.getByText("다리 놓는 아이")).toBeVisible();
  await page.getByRole("button", { name: "좋아!" }).click();
  await expect(page.getByText("레슨을 끝냈어!")).toBeVisible();
});

test("짝끼리 선이 그어진다", async ({ page }) => {
  // 이 레슨의 주장 자체다. 선이 안 그어지면 보여줄 것이 없다.
  await page.goto("/lesson/translate-map");
  await page.getByRole("button", { name: "궁금해!" }).click();

  for (const id of ["dog_ko", "dog_en", "music_ko", "music_en"]) {
    await page.getByTestId(`drawer-word-${id}`).click();
  }

  await expect(page.locator('[data-testid="link-dog_ko-dog_en"]')).toBeVisible();
  await expect(
    page.locator('[data-testid="link-music_ko-music_en"]'),
  ).toBeVisible();
});

test("언어끼리는 뭉치지 않는다", async ({ page }) => {
  // 한국어끼리 모이면 "뜻으로 자리를 정한다"는 말이 거짓이 된다
  await page.goto("/lesson/translate-map");
  await page.getByRole("button", { name: "궁금해!" }).click();

  for (const id of ["dog_ko", "dog_en", "sea_ko", "sea_en"]) {
    await page.getByTestId(`drawer-word-${id}`).click();
  }

  const box = async (id: string) =>
    (await page.getByTestId(`placed-word-${id}`).boundingBox())!;

  const dogKo = await box("dog_ko");
  const dogEn = await box("dog_en");
  const seaKo = await box("sea_ko");

  const pairGap = Math.hypot(dogKo.x - dogEn.x, dogKo.y - dogEn.y);
  const sameLanguageGap = Math.hypot(dogKo.x - seaKo.x, dogKo.y - seaKo.y);

  expect(pairGap).toBeLessThan(sameLanguageGap);
});
