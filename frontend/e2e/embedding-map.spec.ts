import { test, expect, type Page } from "@playwright/test";

/** 훅을 지나 예측까지 마치고 놀이터에 선다. */
async function enterPlay(page: Page, guess = "강아지 근처") {
  await page.getByRole("button", { name: "궁금해!" }).click();
  await page.getByRole("button", { name: guess }).click();
  await page.getByRole("button", { name: "직접 확인해보자!" }).click();
}

test("\"비슷한 말끼리 모여라\"를 처음부터 끝까지 완주한다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /비슷한 말끼리 모여라/ }).click();

  await expect(page.getByText(/어떻게 알아듣지/)).toBeVisible();
  await enterPlay(page, "강아지 근처");

  await expect(page.getByTestId("word-drawer")).toBeVisible();

  // 서랍에 남아 있는 첫 칩을 9번 누른다
  for (let i = 0; i < 9; i++) {
    await page.locator('[data-testid^="drawer-word-"]').first().click();
  }

  await page.getByRole("button", { name: "다 했어요" }).click();

  // 놀이 전에 찍은 것을 돌아본다. 맞게 찍었으니 맞았다고 한다.
  await expect(page.getByTestId("reveal-picked")).toContainText("강아지 근처");
  await expect(page.getByText(/네 말이 맞았어/)).toBeVisible();
  await page.getByRole("button", { name: "다음으로" }).click();

  await expect(page.getByText("임베딩")).toBeVisible();
  await page.getByRole("button", { name: "알겠어!" }).click();

  await expect(page.getByText("지도 탐험가")).toBeVisible();
  await page.getByRole("button", { name: "좋아!" }).click();

  await expect(page.getByText("레슨을 끝냈어!")).toBeVisible();

  // 첫 화면으로 돌아오면 끝낸 레슨에 체크가 붙고 다음 레슨이 강조된다.
  // 계정 없이도 된다 -- 진도가 브라우저에 남기 때문이다.
  await page.goto("/");
  await expect(page.getByTestId("lesson-embedding-map")).toHaveAttribute("data-done", "true");
  await expect(page.getByTestId("lesson-nearest-search")).toHaveAttribute("data-next", "true");
  await expect(page.getByText("뜻으로 찾기")).toBeVisible();
});

test("진도가 localStorage에 남는다", async ({ page }) => {
  await page.goto("/lesson/embedding-map");
  // 일부러 틀리게 찍는다. 틀려도 혼나지 않고 끝까지 간다.
  await enterPlay(page, "자동차 근처");

  for (let i = 0; i < 9; i++) {
    await page.locator('[data-testid^="drawer-word-"]').first().click();
  }
  await page.getByRole("button", { name: "다 했어요" }).click();
  await expect(page.getByText(/달랐네/)).toBeVisible();
  await page.getByRole("button", { name: "다음으로" }).click();
  await page.getByRole("button", { name: "알겠어!" }).click();
  await page.getByRole("button", { name: "좋아!" }).click();

  const stored = await page.evaluate(() =>
    window.localStorage.getItem("nolai:progress"),
  );
  expect(stored).toContain("embedding-map");
  expect(stored).toContain("map-explorer");
});

test("진짜 마우스로 끌어다 놓아도 배치된다", async ({ page }) => {
  await page.goto("/lesson/embedding-map");
  await enterPlay(page);

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
    await enterPlay(page);

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

test("예측의 정답이 지도에서도 참이다 -- 호랑이는 자동차·딸기보다 강아지에 가깝다", async ({ page }) => {
  // 레슨이 "강아지 근처"를 정답이라고 하는데 데이터가 바뀌어 거짓이 되면
  // 아이가 맞게 찍고도 틀렸다는 말을 듣는다.
  await page.goto("/lesson/embedding-map");
  await enterPlay(page);
  for (const id of ["tiger", "dog", "car", "strawberry"]) {
    await page.getByTestId(`drawer-word-${id}`).click();
  }
  const center = async (id: string) => {
    const box = (await page.getByTestId(`placed-word-${id}`).boundingBox())!;
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  };
  const tiger = await center("tiger");
  const dist = async (id: string) => {
    const c = await center(id);
    return Math.hypot(c.x - tiger.x, c.y - tiger.y);
  };
  const toDog = await dist("dog");
  expect(toDog).toBeLessThan(await dist("car"));
  expect(toDog).toBeLessThan(await dist("strawberry"));
});
