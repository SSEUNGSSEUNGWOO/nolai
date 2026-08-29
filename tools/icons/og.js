// 링크 미리보기(OG) 이미지 1200×630을 만든다. 실행: frontend/에서  node ../tools/icons/og.js
// make.js와 같은 방식 -- Playwright로 HTML을 그려 찍는다. 결과는 app/opengraph-image.png.
const { chromium } = require(require("path").join(__dirname, "../../frontend/node_modules/playwright"));
const fs = require("fs");
const path = require("path");
const mascot = "data:image/webp;base64," + fs.readFileSync(path.join(__dirname, "../../frontend/public/art/mascot-wave.webp")).toString("base64");
const font = require("url").pathToFileURL(path.join(__dirname, "../../frontend/node_modules/pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css")).href;

const html = `<html><head><link rel="stylesheet" href="${font}"></head>
<body style="margin:0;font-family:'Pretendard Variable',sans-serif;color:#1f2430">
<div style="width:1200px;height:630px;background:#fff3d6;display:flex;align-items:center;justify-content:center;gap:56px">
  <div style="width:360px;height:360px;border-radius:80px;background:#ffd93d;border:8px solid #1f2430;box-shadow:0 12px 0 #1f2430;display:flex;align-items:center;justify-content:center">
    <img src="${mascot}" style="width:260px;height:260px;object-fit:contain">
  </div>
  <div style="display:flex;flex-direction:column;gap:20px">
    <div style="font-size:120px;font-weight:900;line-height:1">놀AI</div>
    <div style="font-size:44px;font-weight:800">AI는 어떻게 생각할까?</div>
    <div style="font-size:30px;font-weight:600;color:#736b5a">10~13세가 손으로 만져서 배우는 AI 원리</div>
  </div>
</div></body></html>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(html);
  await page.waitForTimeout(500);
  await page.screenshot({ path: "app/opengraph-image.png" });
  await browser.close();
  console.log("app/opengraph-image.png");
})();
