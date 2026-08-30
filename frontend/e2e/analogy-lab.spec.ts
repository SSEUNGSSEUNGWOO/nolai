import { test, expect } from "@playwright/test";

test("\"뜻으로 계산하기\"를 처음부터 끝까지 완주한다", async ({ page }) => {
  await page.goto("/play");
  await page.getByRole("link", { name: /뜻으로 계산하기/ }).click();

  await expect(page.getByText(/더하고 뺄 수 있을까/)).toBeVisible();
  await page.getByRole("button", { name: "궁금해!" }).click();

  await page.getByTestId("relation-gender").click();
  for (const id of ["king", "dad", "son", "brother"]) {
    await page.getByTestId(`subject-${id}`).click();
  }

  await page.getByRole("button", { name: "다 했어요" }).click();
  await expect(page.getByText("뜻 계산")).toBeVisible();

  await page.getByRole("button", { name: "알겠어!" }).click();
  await page
    .getByRole("button", { name: "남자에서 여자로 가는 방향이 나라에는 안 맞아서" })
    .click();
  await page.getByRole("button", { name: "다음으로" }).click();

  await expect(page.getByText("말 수학자")).toBeVisible();
  await page.getByRole("button", { name: "좋아!" }).click();
  await expect(page.getByText("레슨을 끝냈어!")).toBeVisible();
});

test("어울리는 조합은 정확히 맞힌다", async ({ page }) => {
  // 이 레슨의 근거다. 안 맞으면 "다 맞히지?"라는 대사가 거짓이 된다.
  await page.goto("/lesson/analogy-lab");
  await page.getByRole("button", { name: "궁금해!" }).click();

  await page.getByTestId("relation-gender").click();
  for (const [id, want] of [
    ["king", "여왕"],
    ["dad", "엄마"],
    ["son", "딸"],
    ["grandpa", "할머니"],
  ] as const) {
    await page.getByTestId(`subject-${id}`).click();
    await expect(page.getByTestId("answer-top")).toHaveText(want);
    await expect(page.getByTestId("answer")).toHaveAttribute("data-matched", "true");
  }

  await page.getByTestId("relation-capital").click();
  for (const [id, want] of [
    ["japan", "도쿄"],
    ["france", "파리"],
    ["china", "베이징"],
    ["usa", "워싱턴"],
  ] as const) {
    await page.getByTestId(`subject-${id}`).click();
    await expect(page.getByTestId("answer-top")).toHaveText(want);
  }
});

test("안 어울리는 조합은 엉뚱한 답이 나온다", async ({ page }) => {
  // 도전 문제가 묻는 장면이다. 실제로 일어나야 물어볼 수 있다.
  await page.goto("/lesson/analogy-lab");
  await page.getByRole("button", { name: "궁금해!" }).click();

  await page.getByTestId("relation-gender").click();
  await page.getByTestId("subject-japan").click();

  await expect(page.getByTestId("answer")).toHaveAttribute("data-matched", "false");
  await expect(page.getByTestId("answer-top")).toHaveText("도쿄");
});

test("둘 다 고르기 전에는 답이 없다", async ({ page }) => {
  await page.goto("/lesson/analogy-lab");
  await page.getByRole("button", { name: "궁금해!" }).click();

  await expect(page.getByTestId("answer")).toHaveCount(0);
  await page.getByTestId("relation-gender").click();
  await expect(page.getByTestId("answer")).toHaveCount(0);
});
