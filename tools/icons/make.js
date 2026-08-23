// PWA 아이콘을 만든다. 앱과 같은 팔레트 위에 마스코트(public/art/owl-base.webp)를 올린다. 실행: frontend/에서  node ../tools/icons/make.js (public/ 기준 경로라 frontend/에서)
// Playwright(이미 devDependency)로 그리므로 다른 의존성이 없다. 마스코트는 tools/art/가 만든다.
const { chromium } = require(require("path").join(__dirname, "../../frontend/node_modules/playwright"));

const fs = require("fs");
const path = require("path");
const owl = "data:image/webp;base64," + fs.readFileSync(path.join(__dirname, "../../frontend/public/art/owl-base.webp")).toString("base64");

const html = (size, pad) => `<html><body style="margin:0">
<div style="width:${size}px;height:${size}px;background:#fff3d6;display:flex;align-items:center;justify-content:center;">
  <div style="width:${size * (1 - pad * 2)}px;height:${size * (1 - pad * 2)}px;border-radius:${size * 0.22}px;background:#ffd93d;border:${Math.max(3, size * 0.025)}px solid #1f2430;box-shadow:0 ${size * 0.03}px 0 #1f2430;display:flex;align-items:center;justify-content:center"><img src="${owl}" style="width:${size * 0.62}px;height:${size * 0.62}px;object-fit:contain"></div>
</div></body></html>`;

// maskable은 플랫폼이 가장자리를 잘라내므로 안쪽에 더 여유를 둔다.
const targets = [
  ["icon-192.png", 192, 0.08],
  ["icon-512.png", 512, 0.08],
  ["icon-maskable-512.png", 512, 0.18],
  ["apple-touch-icon.png", 180, 0.06],
];

(async () => {
  const browser = await chromium.launch();
  for (const [name, size, pad] of targets) {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await page.setContent(html(size, pad));
    await page.waitForTimeout(200);
    await page.screenshot({ path: `public/${name}`, clip: { x: 0, y: 0, width: size, height: size } });
    await page.close();
    console.log(name);
  }
  await browser.close();
})();
