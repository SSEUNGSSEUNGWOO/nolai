import { test, expect } from "@playwright/test";

test("레슨 1을 처음부터 끝까지 완주한다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /비슷한 말끼리 모여라/ }).click();

  await expect(page.getByText(/어떻게 알아듣지/)).toBeVisible();
  await page.getByRole("button", { name: "궁금해!" }).click();

  await expect(page.getByTestId("word-drawer")).toBeVisible();

  // 서랍에 남아 있는 첫 칩을 9번 누른다
  for (let i = 0; i < 9; i++) {
    await page.locator('[data-testid^="drawer-word-"]').first().click();
  }

  await page.getByRole("button", { name: "다 했어요" }).click();
  await expect(page.getByText("임베딩")).toBeVisible();

  await page.getByRole("button", { name: "알겠어!" }).click();
  await page.getByRole("button", { name: "강아지 근처" }).click();
  await page.getByRole("button", { name: "다음으로" }).click();

  await expect(page.getByText("지도 탐험가")).toBeVisible();
  await page.getByRole("button", { name: "좋아!" }).click();

  await expect(page.getByText("레슨을 끝냈어!")).toBeVisible();
});

test("진도가 localStorage에 남는다", async ({ page }) => {
  await page.goto("/lesson/embedding-map");
  await page.getByRole("button", { name: "궁금해!" }).click();

  for (let i = 0; i < 9; i++) {
    await page.locator('[data-testid^="drawer-word-"]').first().click();
  }
  await page.getByRole("button", { name: "다 했어요" }).click();
  await page.getByRole("button", { name: "알겠어!" }).click();
  await page.getByRole("button", { name: "강아지 근처" }).click();
  await page.getByRole("button", { name: "다음으로" }).click();
  await page.getByRole("button", { name: "좋아!" }).click();

  const stored = await page.evaluate(() =>
    window.localStorage.getItem("nolai:progress"),
  );
  expect(stored).toContain("embedding-map");
  expect(stored).toContain("map-explorer");
});

test("진짜 마우스로 끌어다 놓아도 배치된다", async ({ page }) => {
  await page.goto("/lesson/embedding-map");
  await page.getByRole("button", { name: "궁금해!" }).click();

  const chip = page.getByTestId("drawer-word-dog");
  const map = page.getByTestId("map-area");

  const chipBox = (await chip.boundingBox())!;
  const mapBox = (await map.boundingBox())!;

  await page.mouse.move(
    chipBox.x + chipBox.width / 2,
    chipBox.y + chipBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    mapBox.x + mapBox.width / 2,
    mapBox.y + mapBox.height / 2,
    { steps: 10 },
  );
  await page.mouse.up();

  await expect(page.getByTestId("placed-word-dog")).toBeVisible();
});

const viewports = [
  { name: "데스크톱", width: 1280, height: 800 },
  { name: "작은 폰", width: 360, height: 740 },
];

for (const viewport of viewports) {
  test(`배치된 칩이 지도 밖으로 삐져나가지 않는다 (${viewport.name})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/lesson/embedding-map");
    await page.getByRole("button", { name: "궁금해!" }).click();

    // 전부 놓는다 — 가장자리 좌표를 가진 단어까지 확인해야 한다
    const drawer = page.locator('[data-testid^="drawer-word-"]');
    for (let remaining = await drawer.count(); remaining > 0; remaining--) {
      await drawer.first().click();
    }

    // 스프링 애니메이션이 끝날 때까지 기다린다
    await page.waitForTimeout(1500);

    const map = (await page.getByTestId("map-area").boundingBox())!;
    const chips = page.locator('[data-testid^="placed-word-"]');
    const count = await chips.count();
    expect(count).toBe(18);

    for (let i = 0; i < count; i++) {
      const chip = (await chips.nth(i).boundingBox())!;
      const label = await chips.nth(i).getAttribute("data-testid");

      expect(chip.x, `${label} 왼쪽`).toBeGreaterThanOrEqual(map.x - 1);
      expect(chip.y, `${label} 위쪽`).toBeGreaterThanOrEqual(map.y - 1);
      expect(chip.x + chip.width, `${label} 오른쪽`).toBeLessThanOrEqual(
        map.x + map.width + 1,
      );
      expect(chip.y + chip.height, `${label} 아래쪽`).toBeLessThanOrEqual(
        map.y + map.height + 1,
      );
    }
  });
}
