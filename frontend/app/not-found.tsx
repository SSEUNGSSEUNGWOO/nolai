import Link from "next/link";
import Image from "next/image";
import { mascotArt } from "@/lib/art";
import { popButton } from "@/components/steps/styles";

/** 없는 주소. Next 기본 404는 영어라 아이가 읽지 못한다. 노리가 대신 말한다. */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-5 px-5 text-center">
      <Image src={mascotArt("think")} alt="" width={160} height={160} className="bob h-40 w-40" />
      <h1 className="text-2xl font-black">여긴 아무것도 없네?</h1>
      <p className="font-bold text-muted">주소가 틀렸거나, 옛날 주소야.</p>
      <Link href="/play" className={popButton}>
        레슨 목록으로
      </Link>
    </main>
  );
}
