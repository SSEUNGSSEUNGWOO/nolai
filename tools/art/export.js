// out/의 생성물을 앱이 쓰는 자리(frontend/public/art/)로 내보낸다. 배경을 따고 줄이고 webp로.
// 실행: node tools/art/export.js   -- 어떤 파일이 어떤 이름으로 가는지는 아래 표가 전부다.
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "../../frontend/public/art");
fs.mkdirSync(OUT, { recursive: true });

// [out/ 파일, public/art/ 이름, 최대 변]. 마스코트는 크게 쓰일 수 있어 512, 배지는 256, 단어는 128.
const table = [
  ["cand-robot-21.png", "mascot-base.webp", 512],
  ["robot-curious-22.png", "mascot-curious.webp", 512],
  ["robot-happy-22.png", "mascot-happy.webp", 512],
  ["robot-surprised-22.png", "mascot-surprised.webp", 512],
  ["robot-wave-22.png", "mascot-wave.webp", 512],
  ["robot-point-22.png", "mascot-point.webp", 512],
  ["robot-think-22.png", "mascot-think.webp", 512],
  ["empty-shelf-61.png", "empty-shelf.webp", 256],
  // 놀이터 빈 무대의 소품. 조작 전 흰 상자에 "뭘 하는 곳인지"를 그림으로 둔다.
  ...fs.readdirSync(path.join(__dirname, "out")).filter((f) => /^prop-.*-71.png$/.test(f)).map((f) => [f, f.replace(/-71.png$/, ".webp"), 256]),
  // 썸네일은 그림 자체가 한 장이라 배경을 따지 않는다(keep)
  ...fs.readdirSync(path.join(__dirname, "out")).filter((f) => /^thumb-.*-41.png$/.test(f)).map((f) => [f, f.replace(/-41.png$/, ".webp"), 320, "keep"]),
  ...fs.readdirSync(path.join(__dirname, "out")).filter((f) => /^badge-.*-11.png$/.test(f)).map((f) => [f, f.replace(/-11.png$/, ".webp"), 256]),
  // 단어 칩은 20px로 쓰이지만 고해상도 화면을 위해 128로 둔다.
  ...fs.readdirSync(path.join(__dirname, "out")).filter((f) => /^word-.*-31.png$/.test(f)).map((f) => [f, f.replace(/-31.png$/, ".webp"), 128]),
];

for (const [src, dst, size, mode] of table) {
  const from = path.join(__dirname, "out", src);
  if (!fs.existsSync(from)) { console.warn("없음:", src); continue; }
  execFileSync("node", [path.join(__dirname, "cut.js"), from, path.join(OUT, dst), String(size), ...(mode ? [mode] : [])], { stdio: "inherit" });
}
