import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "놀AI — AI는 어떻게 생각할까?",
  description:
    "10~13세 어린이가 AI의 작동 원리를 손으로 만져서 배우는 온라인 놀이터.",
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
