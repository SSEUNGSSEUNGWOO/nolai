import { test, expect } from "@playwright/test";

test("\"그림도 숫자야\"를 처음부터 끝까지 완주한다", async ({ page }) => {
  await page.goto("/play");
  await page.getByRole("link", { name: /그림도 숫자야/ }).click();

  await expect(page.getByText(/숫자밖에 모르는데/)).toBeVisible();
  await page.getByRole("button", { name: "궁금해!" }).click();

  await expect(page.getByTestId("pixel-grid")).toBeVisible();
  for (const id of ["star", "apple", "smile"]) {
    await page.getByTestId(`image-${id}`).click();
  }

  await page.getByRole("button", { name: "다 했어요" }).click();
  await expect(page.getByText("이미지 데이터")).toBeVisible();

  await page.getByRole("button", { name: "알겠어!" }).click();
  await page.getByRole("button", { name: "똑같아" }).click();
  await page.getByRole("button", { name: "다음으로" }).click();

  await expect(page.getByText("픽셀 사냥꾼")).toBeVisible();
  await page.getByRole("button", { name: "좋아!" }).click();
  await expect(page.getByText("레슨을 끝냈어!")).toBeVisible();
});

test("칸을 누르면 그 칸의 색이 숫자로 나온다", async ({ page }) => {
  await page.goto("/lesson/pixel-zoom");
  await page.getByRole("button", { name: "궁금해!" }).click();

  await expect(page.getByTestId("pixel-readout")).toContainText("칸을 하나 눌러봐");

  // 하트 그림의 왼쪽 위는 배경(#FFFDF6)이다
  await page.getByTestId("cell-0-0").click();
  await expect(page.getByTestId("pixel-readout")).toContainText("빨강 255");

  // 가운데는 빨강(#FF6B6B)이다
  await page.getByTestId("cell-5-4").click();
  await expect(page.getByTestId("pixel-readout")).toContainText("초록 107");
});

test("\"칸이 많을수록 또렷해\"에서 칸을 줄이면 격자가 굵어진다", async ({ page }) => {
  await page.goto("/lesson/pixel-coarse");
  await page.getByRole("button", { name: "궁금해!" }).click();

  await expect(page.getByTestId("pixel-grid")).toHaveAttribute("data-cells", "12");

  await page.getByTestId("step-3").click();
  await expect(page.getByTestId("pixel-grid")).toHaveAttribute("data-cells", "4");

  await page.getByTestId("step-1").click();
  await expect(page.getByTestId("pixel-grid")).toHaveAttribute("data-cells", "12");
});

test("칸을 줄이면 색이 섞인 값이 나온다", async ({ page }) => {
  // 흐릿한 그림은 원본에서 진짜로 계산된 것이지 따로 그려둔 그림이 아니다
  await page.goto("/lesson/pixel-coarse");
  await page.getByRole("button", { name: "궁금해!" }).click();

  await page.getByTestId("cell-0-1").click();
  const sharp = await page.getByTestId("pixel-readout").innerText();

  await page.getByTestId("step-4").click();
  await page.getByTestId("cell-0-1").click();
  const blurry = await page.getByTestId("pixel-readout").innerText();

  expect(blurry).not.toBe(sharp);
});
