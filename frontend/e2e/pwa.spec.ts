import { test, expect } from "@playwright/test";

test("manifest와 아이콘이 실제로 내려온다", async ({ page, request }) => {
  await page.goto("/");
  const href = await page.locator("link[rel=manifest]").getAttribute("href");
  expect(href).toBeTruthy();

  const manifest = await request.get(href!);
  expect(manifest.ok()).toBe(true);
  const json = await manifest.json();
  expect(json.short_name).toBe("놀AI");

  for (const icon of json.icons) {
    const res = await request.get(icon.src);
    expect(res.ok(), icon.src).toBe(true);
    expect(res.headers()["content-type"]).toContain("image/png");
  }
});

test("iOS 홈 화면 설치용 메타가 있다", async ({ page, request }) => {
  // iOS는 manifest를 거의 안 본다. 이 태그들이 없으면 사파리 UI가 그대로 뜬다.
  // apple-mobile-web-app-capable은 Apple이 폐기했고, Next는 표준 이름으로 낸다.
  await page.goto("/");
  await expect(page.locator("meta[name=mobile-web-app-capable]")).toHaveAttribute("content", "yes");
  const apple = await page.locator("link[rel=apple-touch-icon]").getAttribute("href");
  expect((await request.get(apple!)).ok()).toBe(true);
  await expect(page.locator("meta[name=viewport]")).toHaveAttribute("content", /viewport-fit=cover/);
});
