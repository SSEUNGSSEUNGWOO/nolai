// out/의 생성물을 앱이 쓰는 자리(frontend/public/art/)로 내보낸다. 배경을 따고 줄이고 webp로.
// 실행: node tools/art/export.js   -- 어떤 파일이 어떤 이름으로 가는지는 아래 표가 전부다.
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "../../frontend/public/art");
fs.mkdirSync(OUT, { recursive: true });

// [out/ 파일, public/art/ 이름, 최대 변]. 마스코트는 크게 쓰일 수 있어 512, 배지는 256.
const table = [
  ["cand-robot-21.png", "mascot-base.webp", 512],
  ["robot-curious-22.png", "mascot-curious.webp", 512],
  ["robot-happy-22.png", "mascot-happy.webp", 512],
  ["robot-surprised-22.png", "mascot-surprised.webp", 512],
  ...fs.readdirSync(path.join(__dirname, "out")).filter((f) => /^badge-.*-11.png$/.test(f)).map((f) => [f, f.replace(/-11.png$/, ".webp"), 256]),
];

for (const [src, dst, size] of table) {
  const from = path.join(__dirname, "out", src);
  if (!fs.existsSync(from)) { console.warn("없음:", src); continue; }
  execFileSync("node", [path.join(__dirname, "cut.js"), from, path.join(OUT, dst), String(size)], { stdio: "inherit" });
}
