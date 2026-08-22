import { test, expect, type Page } from "@playwright/test";

/**
 * 넓은 화면에서 서랍이 지도 옆에 서는지 검사한다.
 *
 * 단위 테스트는 Tailwind의 lg: 규칙을 실행하지 않으므로 이건 진짜 브라우저에서만
 * 확인된다. 없으면 누군가 클래스를 지워도 아무도 모른다.
 */
async function boxes(page: Page, mapId: string, drawerId: string) {
  const map = await page.getByTestId(mapId).boundingBox();
  const drawer = await page.getByTestId(drawerId).boundingBox();
  expect(map).not.toBeNull();
  expect(drawer).not.toBeNull();

  return { map: map!, drawer: drawer! };
}

test.describe("레슨 1", () => {
  test("넓은 화면에서는 서랍이 지도 오른쪽에 선다", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/lesson/embedding-map");
    await page.getByRole("button", { name: "궁금해!" }).click();

    const { map, drawer } = await boxes(page, "map-area", "word-drawer");
    expect(drawer.x).toBeGreaterThanOrEqual(map.x + map.width - 1);
  });

  test("폰에서는 서랍이 지도 아래에 온다", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 840 });
    await page.goto("/lesson/embedding-map");
    await page.getByRole("button", { name: "궁금해!" }).click();

    const { map, drawer } = await boxes(page, "map-area", "word-drawer");
    expect(drawer.y).toBeGreaterThanOrEqual(map.y + map.height - 1);
  });
});

test.describe("레슨 2", () => {
  test("넓은 화면에서는 질문이 지도 오른쪽에 서고 스크롤이 필요 없다", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/lesson/nearest-search");
    await page.getByRole("button", { name: "궁금해!" }).click();

    const { map, drawer } = await boxes(page, "search-map", "question-drawer");
    expect(drawer.x).toBeGreaterThanOrEqual(map.x + map.width - 1);

    // 질문 20장이 서랍 안에 다 들어와야 한다(안쪽 스크롤이 생기면 안 된다)
    const overflow = await page
      .getByTestId("question-drawer")
      .evaluate((el) => el.scrollHeight - el.clientHeight);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("폰에서는 질문이 지도 아래에 오고 서랍 안에서 스크롤된다", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 840 });
    await page.goto("/lesson/nearest-search");
    await page.getByRole("button", { name: "궁금해!" }).click();

    const { map, drawer } = await boxes(page, "search-map", "question-drawer");
    expect(drawer.y).toBeGreaterThanOrEqual(map.y + map.height - 1);

    // 서랍이 화면을 넘기지 않아야 노리 안내와 "다 했어요"가 화면 안에 남는다
    expect(drawer.height).toBeLessThan(840 * 0.45);
  });
});

test("글이 있는 스텝은 넓은 화면에서도 좁게 유지한다", async ({ page }) => {
  // 한 줄이 길어지면 읽기 어렵다. 놀이터만 넓어져야 한다.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/lesson/nearest-search");

  const hook = await page.getByText(/어디서 답을 찾아올까/).boundingBox();
  expect(hook).not.toBeNull();
  expect(hook!.width).toBeLessThan(600);
});
