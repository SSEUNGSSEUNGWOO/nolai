import { test, expect } from "@playwright/test";

test("\"소리도 숫자야\"를 처음부터 끝까지 완주한다", async ({ page }) => {
  await page.goto("/play");
  await page.getByRole("link", { name: /소리도 숫자야/ }).click();

  await expect(page.getByText(/어떻게 기억할까/)).toBeVisible();
  await page.getByRole("button", { name: "궁금해!" }).click();

  await expect(page.getByTestId("wave-view")).toBeVisible();
  for (const id of ["do", "sol", "high"]) {
    await page.getByTestId(`sound-${id}`).click();
  }

  await page.getByRole("button", { name: "다 했어요" }).click();
  await expect(page.getByText("소리 데이터")).toBeVisible();

  await page.getByRole("button", { name: "알겠어!" }).click();
  await page.getByRole("button", { name: "높은 소리일수록 물결이 촘촘하다" }).click();
  await page.getByRole("button", { name: "다음으로" }).click();

  await expect(page.getByText("소리 파도타기")).toBeVisible();
  await page.getByRole("button", { name: "좋아!" }).click();
  await expect(page.getByText("레슨을 끝냈어!")).toBeVisible();
});

test("점을 누르면 그 순간의 숫자가 나온다", async ({ page }) => {
  await page.goto("/lesson/wave-zoom");
  await page.getByRole("button", { name: "궁금해!" }).click();

  await expect(page.getByTestId("wave-readout")).toContainText("점을 눌러봐");

  // 첫 점은 사인파의 시작이라 0이다
  await page.getByTestId("sample-0").click();
  await expect(page.getByTestId("wave-readout")).toContainText("1번째 숫자 = 0.000");
});

test("높은 소리일수록 물결이 촘촘하다", async ({ page }) => {
  // 도전 문제가 묻는 것이 화면에서 실제로 사실인지 검사한다
  await page.goto("/lesson/wave-zoom");
  await page.getByRole("button", { name: "궁금해!" }).click();

  const perWave = async () =>
    Number(await page.getByTestId("per-wave").getAttribute("data-count"));

  await page.getByTestId("sound-do").click();
  const low = await perWave();

  await page.getByTestId("sound-high").click();
  const high = await perWave();

  expect(high).toBeLessThan(low);
});

test("소리마다 물결 모양이 다르다", async ({ page }) => {
  await page.goto("/lesson/wave-zoom");
  await page.getByRole("button", { name: "궁금해!" }).click();

  await page.getByTestId("sound-do").click();
  const plain = await page.getByTestId("wave-line").getAttribute("points");

  await page.getByTestId("sound-rough").click();
  const rough = await page.getByTestId("wave-line").getAttribute("points");

  expect(rough).not.toBe(plain);
});

test("음소거하면 소리를 내지 않는다", async ({ page }) => {
  // 소리를 내는 레슨이 둘이 됐다. 음소거는 양쪽 모두에서 들어야 한다.
  await page.addInitScript(() => {
    (window as unknown as { __buf: number }).__buf = 0;
    const original = AudioContext.prototype.createBuffer;
    AudioContext.prototype.createBuffer = function patched(
      this: AudioContext,
      ...args: Parameters<typeof original>
    ) {
      (window as unknown as { __buf: number }).__buf += 1;
      return original.apply(this, args);
    };
  });

  await page.goto("/lesson/wave-zoom");
  await page.getByRole("button", { name: "궁금해!" }).click();

  await page.getByTestId("sound-do").click();
  expect(
    await page.evaluate(() => (window as unknown as { __buf: number }).__buf),
  ).toBeGreaterThan(0);

  await page.getByTestId("mute").click();
  await page.getByTestId("sound-sol").click();
  const after = await page.evaluate(
    () => (window as unknown as { __buf: number }).__buf,
  );

  await page.getByTestId("sound-high").click();
  expect(
    await page.evaluate(() => (window as unknown as { __buf: number }).__buf),
  ).toBe(after);
});
