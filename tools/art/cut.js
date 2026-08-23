// 생성된 그림의 바깥 배경만 투명하게 만든다. 실행: node tools/art/cut.js <in.png> <out.png|.webp> [최대변] [keep]
// 넷째 인자가 keep이면 배경을 따지 않고 줄이기만 한다 -- 썸네일처럼 그림 자체가 한 장인 경우.
// rembg 같은 모델은 안쪽 크림색(얼굴·배)도 배경으로 봐서 구멍을 낸다. 대신 네
// 모서리에서 출발하는 flood fill로 배경색과 비슷한 픽셀만 지운다 -- 먹선으로 닫힌
// 안쪽에는 닿지 않는다. Playwright의 canvas를 쓴다.
// playwright는 frontend의 devDependency다. 이 파일 위치에서 그쪽을 찾는다.
const { chromium } = require(require("path").join(__dirname, "../../frontend/node_modules/playwright"));
const fs = require("fs");
const [input, output, maxArg, mode] = process.argv.slice(2);
const keep = mode === "keep";
const maxSide = Number(maxArg ?? 0);
const mime = output.endsWith(".webp") ? "image/webp" : "image/png";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const src = "data:image/png;base64," + fs.readFileSync(input).toString("base64");
  const result = await page.evaluate(async ({ src, maxSide, mime, keep }) => {
    const img = new Image(); img.src = src; await img.decode();
    const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
    const ctx = c.getContext("2d"); ctx.drawImage(img, 0, 0);
    const { width: W, height: H } = c; const d = ctx.getImageData(0, 0, W, H); const px = d.data;
    if (keep) {
      const k = maxSide && Math.max(W, H) > maxSide ? maxSide / Math.max(W, H) : 1;
      const r = document.createElement("canvas"); r.width = Math.round(W * k); r.height = Math.round(H * k);
      const rc = r.getContext("2d"); rc.imageSmoothingQuality = "high"; rc.drawImage(c, 0, 0, r.width, r.height);
      return r.toDataURL(mime, 0.9);
    }
    // 배경색은 네 모서리 평균. 생성 모델의 배경은 살짝 얼룩져서 허용 오차를 넉넉히 둔다.
    const corners = [0, (W - 1) * 4, (H - 1) * W * 4, ((H - 1) * W + W - 1) * 4];
    const bg = [0, 1, 2].map((k) => corners.reduce((a, i) => a + px[i + k], 0) / 4);
    const near = (i) => Math.abs(px[i] - bg[0]) + Math.abs(px[i + 1] - bg[1]) + Math.abs(px[i + 2] - bg[2]) < 30;
    const seen = new Uint8Array(W * H); const stack = [];
    for (let x = 0; x < W; x++) { stack.push(x, (H - 1) * W + x); }
    for (let y = 0; y < H; y++) { stack.push(y * W, y * W + W - 1); }
    while (stack.length) {
      const p = stack.pop(); if (seen[p]) continue; seen[p] = 1;
      if (!near(p * 4)) continue;
      px[p * 4 + 3] = 0;
      const x = p % W, y = (p - x) / W;
      if (x > 0) stack.push(p - 1); if (x < W - 1) stack.push(p + 1);
      if (y > 0) stack.push(p - W); if (y < H - 1) stack.push(p + W);
    }
    // 가장자리 한 픽셀을 반투명으로 눌러 계단을 줄인다
    const a = (p) => px[p * 4 + 3];
    const edge = [];
    for (let p = 0; p < W * H; p++) if (a(p) === 255) { const x = p % W; if ((x > 0 && a(p - 1) === 0) || (x < W - 1 && a(p + 1) === 0) || (p >= W && a(p - W) === 0) || (p < W * (H - 1) && a(p + W) === 0)) edge.push(p); }
    for (const p of edge) px[p * 4 + 3] = 140;
    ctx.putImageData(d, 0, 0);
    // 투명 여백을 잘라낸다
    let minX = W, minY = H, maxX = 0, maxY = 0;
    for (let p = 0; p < W * H; p++) if (a(p)) { const x = p % W, y = (p - x) / W; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    const pad = 8; const o = document.createElement("canvas");
    o.width = maxX - minX + 1 + pad * 2; o.height = maxY - minY + 1 + pad * 2;
    o.getContext("2d").drawImage(c, minX - pad, minY - pad, o.width, o.height, 0, 0, o.width, o.height);
    if (!maxSide || Math.max(o.width, o.height) <= maxSide) return o.toDataURL(mime, 0.9);
    const k = maxSide / Math.max(o.width, o.height);
    const r = document.createElement("canvas"); r.width = Math.round(o.width * k); r.height = Math.round(o.height * k);
    const rc = r.getContext("2d"); rc.imageSmoothingQuality = "high"; rc.drawImage(o, 0, 0, r.width, r.height);
    return r.toDataURL(mime, 0.9);
  }, { src, maxSide, mime, keep });
  fs.writeFileSync(output, Buffer.from(result.split(",")[1], "base64"));
  await browser.close();
  console.log(output);
})();
