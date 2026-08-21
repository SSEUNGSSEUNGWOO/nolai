import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "놀AI — AI는 어떻게 생각할까?",
  description:
    "10~13세 어린이가 AI의 작동 원리를 손으로 만져서 배우는 온라인 놀이터.",
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
