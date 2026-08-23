import { test, expect, type Page } from "@playwright/test";

async function groupOf(page: Page, id: string) {
  return page.getByTestId(`word-${id}`).getAttribute("data-group");
}

test("\"안 가르쳐도 나눠\"를 처음부터 끝까지 완주한다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /안 가르쳐도 나눠/ }).click();

  await expect(page.getByText(/스스로 나눌 수 있을까/)).toBeVisible();
  await page.getByRole("button", { name: "궁금해!" }).click();

  for (const k of [3, 2, 4]) {
    await page.getByTestId(`k-${k}`).click();
  }

  await page.getByRole("button", { name: "다 했어요" }).click();
  await expect(page.getByText("스스로 무리 짓기")).toBeVisible();

  await page.getByRole("button", { name: "알겠어!" }).click();
  await page
    .getByRole("button", { name: "무리가 2개뿐이라 어디든 하나에 넣어야 해서" })
    .click();
  await page.getByRole("button", { name: "다음으로" }).click();

  await expect(page.getByText("무리 찾기 대장")).toBeVisible();
  await page.getByRole("button", { name: "좋아!" }).click();
  await expect(page.getByText("레슨을 끝냈어!")).toBeVisible();
});

test("나누기 전에는 무리가 없다", async ({ page }) => {
  await page.goto("/lesson/self-cluster");
  await page.getByRole("button", { name: "궁금해!" }).click();

  await expect(page.getByTestId("cluster-map")).toHaveAttribute("data-k", "0");
  expect(await groupOf(page, "dog")).toBeNull();
});

test("3개로 나누면 동물·탈것·음식이 정확히 갈린다", async ({ page }) => {
  // 이 레슨의 근거다. 안 맞으면 "잘 나눴지?"라는 대사가 거짓이 된다.
  await page.goto("/lesson/self-cluster");
  await page.getByRole("button", { name: "궁금해!" }).click();
  await page.getByTestId("k-3").click();

  const animals = ["dog", "cat", "rabbit", "tiger", "elephant", "penguin"];
  const vehicles = ["car", "bus", "train", "airplane", "bike", "truck"];
  const foods = ["pizza", "gimbap", "ramen", "tteok", "burger", "dumpling"];

  for (const ids of [animals, vehicles, foods]) {
    const groups = await Promise.all(ids.map((id) => groupOf(page, id)));
    expect(new Set(groups).size).toBe(1);
  }

  // 세 무리가 서로 달라야 한다
  const heads = await Promise.all(
    [animals[0], vehicles[0], foods[0]].map((id) => groupOf(page, id)),
  );
  expect(new Set(heads).size).toBe(3);
});

test("2개로 나누면 만두가 탈것 쪽으로 간다", async ({ page }) => {
  // 도전 문제가 묻는 장면이다. 실제로 일어나야 물어볼 수 있다.
  await page.goto("/lesson/self-cluster");
  await page.getByRole("button", { name: "궁금해!" }).click();
  await page.getByTestId("k-2").click();

  expect(await groupOf(page, "dumpling")).toBe(await groupOf(page, "car"));
  expect(await groupOf(page, "dumpling")).not.toBe(await groupOf(page, "pizza"));
});
