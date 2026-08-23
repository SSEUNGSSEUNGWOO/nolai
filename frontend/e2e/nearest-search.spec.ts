import { test, expect } from "@playwright/test";

test("\"가장 가까운 걸 찾아줘\"를 처음부터 끝까지 완주한다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /가장 가까운 걸 찾아줘/ }).click();

  await expect(page.getByText(/어디서 답을 찾아올까/)).toBeVisible();
  await page.getByRole("button", { name: "궁금해!" }).click();

  await expect(page.getByTestId("question-drawer")).toBeVisible();
  // 질문을 고르기 전에는 순위가 없다
  await expect(page.getByTestId("match-list")).toHaveCount(0);

  await page.getByTestId("question-q01").click();
  await page.getByTestId("question-q08").click();
  await page.getByTestId("question-q20").click();

  await page.getByRole("button", { name: "다 했어요" }).click();
  await expect(page.getByText("벡터검색")).toBeVisible();

  await page.getByRole("button", { name: "알겠어!" }).click();
  await page
    .getByRole("button", { name: "먹을 게 어디 있는지 친구한테 어떻게 알려줘?" })
    .click();
  await page.getByRole("button", { name: "다음으로" }).click();

  await expect(page.getByText("길 찾기 대장")).toBeVisible();
  await page.getByRole("button", { name: "좋아!" }).click();

  await expect(page.getByText("레슨을 끝냈어!")).toBeVisible();
});

test("낱말이 겹치지 않아도 뜻이 가까운 문장을 1등으로 뽑는다", async ({ page }) => {
  await page.goto("/lesson/nearest-search");
  await page.getByRole("button", { name: "궁금해!" }).click();

  // q08 "먹을 게 어디 있는지 친구한테 어떻게 알려줘?" 와
  // p11 "꿀벌은 몸을 흔드는 춤으로..." 는 낱말이 하나도 겹치지 않는다.
  // 이 레슨이 가르치려는 것이 정확히 이 짝이다.
  await page.getByTestId("question-q08").click();

  await expect(page.getByTestId("match-1")).toContainText("꿀벌");
  await expect(page.getByTestId("passage-dot-p11")).toHaveAttribute(
    "data-rank",
    "1",
  );
});

test("진도가 localStorage에 남는다", async ({ page }) => {
  await page.goto("/lesson/nearest-search");
  await page.getByRole("button", { name: "궁금해!" }).click();

  await page.getByTestId("question-q01").click();
  await page.getByTestId("question-q08").click();
  await page.getByTestId("question-q20").click();
  await page.getByRole("button", { name: "다 했어요" }).click();
  await page.getByRole("button", { name: "알겠어!" }).click();
  await page
    .getByRole("button", { name: "먹을 게 어디 있는지 친구한테 어떻게 알려줘?" })
    .click();
  await page.getByRole("button", { name: "다음으로" }).click();
  await page.getByRole("button", { name: "좋아!" }).click();

  const stored = await page.evaluate(() =>
    window.localStorage.getItem("nolai:progress"),
  );
  expect(stored).toContain("nearest-search");
  expect(stored).toContain("path-finder");
});

test.describe("작은 폰", () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test("점이 지도 밖으로 삐져나가지 않는다", async ({ page }) => {
    await page.goto("/lesson/nearest-search");
    await page.getByRole("button", { name: "궁금해!" }).click();
    await page.getByTestId("question-q01").click();

    const map = await page.getByTestId("search-map").boundingBox();
    expect(map).not.toBeNull();

    const dots = page.locator('[data-testid^="passage-dot-"]');
    const count = await dots.count();
    expect(count).toBe(30);

    for (let i = 0; i < count; i++) {
      const box = await dots.nth(i).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(map!.x - 1);
      expect(box!.y).toBeGreaterThanOrEqual(map!.y - 1);
      expect(box!.x + box!.width).toBeLessThanOrEqual(map!.x + map!.width + 1);
      expect(box!.y + box!.height).toBeLessThanOrEqual(map!.y + map!.height + 1);
    }
  });
});

test("음소거 버튼이 레슨 화면에 있고 상태가 남는다", async ({ page }) => {
  // 설계 문서 9장: 교실·도서관에서 쓸 수 있어야 한다
  await page.goto("/lesson/nearest-search");

  const mute = page.getByTestId("mute");
  await expect(mute).toBeVisible();
  await expect(mute).toHaveAttribute("data-muted", "false");

  await mute.click();
  await expect(mute).toHaveAttribute("data-muted", "true");

  // 다른 레슨으로 옮겨도 꺼진 채로 있어야 한다
  await page.goto("/lesson/embedding-map");
  await expect(page.getByTestId("mute")).toHaveAttribute("data-muted", "true");
});
