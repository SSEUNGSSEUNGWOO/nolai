import type { Metadata, Viewport } from "next";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  // OG 이미지·canonical 같은 상대 경로가 절대 URL이 되게 한다. 없으면 빌드가 막힌다.
  metadataBase: new URL(SITE_URL),
  title: "놀AI — AI는 어떻게 생각할까?",
  description:
    "10~13세 어린이가 AI의 작동 원리를 손으로 만져서 배우는 온라인 놀이터.",
  // 카톡·메신저에 링크를 붙였을 때의 미리보기. 이미지는 app/opengraph-image.png.
  openGraph: { type: "website", siteName: "놀AI", locale: "ko_KR" },
  manifest: "/manifest.webmanifest",
  icons: { apple: "/apple-touch-icon.png" },
  // iOS는 manifest의 display를 안 보고 이 메타 태그로 전체화면 여부를 정한다.
  appleWebApp: { capable: true, statusBarStyle: "default", title: "놀AI" },
};

export const viewport: Viewport = {
  themeColor: "#fff3d6",
  // 노치 영역까지 배경을 채운다. 안 채우면 설치된 앱 위아래에 흰 띠가 생긴다.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
