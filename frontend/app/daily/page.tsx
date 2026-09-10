import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { daily, ui } from "@/copy/ui";
import { mascotArt } from "@/lib/art";
import DailyClient from "@/components/daily/DailyClient";

// 아이 화면. 검색에 나올 이유가 없다 -- /play와 같은 판단.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function DailyPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 px-5 py-6 lg:max-w-2xl">
      <header className="flex items-center justify-between text-sm font-extrabold">
        <Link href="/play">← {ui.landingTitle}</Link>
        <span>{daily.title}</span>
      </header>
      <Image src={mascotArt("think")} alt="" width={96} height={96} priority className="mx-auto h-24 w-24" />
      <h1 className="text-2xl font-black">{daily.title}</h1>
      <DailyClient />
    </main>
  );
}
