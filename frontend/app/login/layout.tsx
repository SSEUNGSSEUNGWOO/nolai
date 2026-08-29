import type { Metadata } from "next";

// page.tsx가 "use client"라 metadata를 내보낼 수 없다. robots.ts와 같은 이유로 색인에서 뺀다.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
