import type { Metadata } from "next";
import { randomNicknames } from "@/lib/auth/nickname";
import JoinClient from "./JoinClient";

/**
 * 후보를 서버에서 뽑아 넘긴다.
 *
 * 클라이언트에서 뽑으면 첫 렌더가 서버와 달라 하이드레이션이 어긋나고, 그걸
 * 피하려고 useEffect로 미루면 화면이 빈 채로 한 번 깜빡인다. 서버가 뽑은 값은
 * HTML에 실려 오므로 양쪽이 같다.
 *
 * 매 요청 새로 뽑아야 하므로 정적 생성하지 않는다.
 */
export const dynamic = "force-dynamic";
// 검색 결과에 나올 이유가 없는 화면. robots.ts와 같은 판단이다.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function JoinPage() {
  return <JoinClient initial={randomNicknames(3)} />;
}
