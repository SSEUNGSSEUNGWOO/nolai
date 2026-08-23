import type { MetadataRoute } from "next";
import { ui } from "@/copy/ui";

/**
 * 홈 화면에 설치되게 하는 선언. 서비스워커는 일부러 없다 -- 설치 프롬프트에
 * 필요 없고(Next 문서), 캐시가 남으면 고친 레슨이 아이에게 안 가는 사고가 난다.
 * 그래서 오프라인은 안 된다. 아이콘은 tools/icons/make.js가 만든다.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${ui.landingTitle} — ${ui.landingSubtitle}`,
    short_name: ui.landingTitle,
    description: "AI의 작동 원리를 손으로 만져서 배우는 놀이터",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "ko",
    background_color: "#fff3d6",
    theme_color: "#fff3d6",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
