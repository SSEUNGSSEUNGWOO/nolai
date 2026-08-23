import { test, expect } from "@playwright/test";

test("\"AI는 글을 조각으로 읽어\"를 처음부터 끝까지 완주한다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /AI는 글을 조각으로 읽어/ }).click();

  await expect(page.getByText(/한 글자씩 읽을까/)).toBeVisible();
  await page.getByRole("button", { name: "궁금해!" }).click();

  await expect(page.getByTestId("piece-view")).toContainText("눌러봐");
  for (const id of ["t01", "t05", "t08", "t03"]) {
    await page.getByTestId(`text-${id}`).click();
  }

  await page.getByRole("button", { name: "다 했어요" }).click();
  await expect(page.getByText("토큰", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "알겠어!" }).click();
  await page
    .getByRole("button", { name: "'안녕하세요'가 훨씬 자주 쓰이는 말이라서" })
    .click();
  await page.getByRole("button", { name: "다음으로" }).click();

  await expect(page.getByText("조각 박사")).toBeVisible();
  await page.getByRole("button", { name: "좋아!" }).click();
  await expect(page.getByText("레슨을 끝냈어!")).toBeVisible();
});

test("자주 쓰는 말일수록 적게 쪼개진다", async ({ page }) => {
  // 도전 문제가 묻는 것이 화면에서 실제로 사실인지 검사한다
  await page.goto("/lesson/token-split");
  await page.getByRole("button", { name: "궁금해!" }).click();

  const pieces = async () =>
    Number(await page.getByTestId("piece-view").getAttribute("data-pieces"));

  await page.getByTestId("text-t01").click(); // 안녕하세요
  const common = await pieces();

  await page.getByTestId("text-t05").click(); // 무지개
  const rare = await pieces();

  expect(common).toBe(1);
  expect(rare).toBeGreaterThan(common);
});

test("조각마다 번호가 붙어 있다", async ({ page }) => {
  await page.goto("/lesson/token-split");
  await page.getByRole("button", { name: "궁금해!" }).click();
  await page.getByTestId("text-t05").click();

  // 무지개는 세 조각이고 각 조각에 번호가 보인다
  await expect(page.getByTestId("piece-0")).toContainText("무");
  await expect(page.getByTestId("piece-0")).toContainText(/\d+/);
  await expect(page.getByTestId("piece-2")).toContainText("개");
});

test("문장은 여러 조각으로 갈라진다", async ({ page }) => {
  await page.goto("/lesson/token-split");
  await page.getByRole("button", { name: "궁금해!" }).click();
  await page.getByTestId("text-t08").click();

  const count = Number(
    await page.getByTestId("piece-view").getAttribute("data-pieces"),
  );
  expect(count).toBeGreaterThan(4);
});
