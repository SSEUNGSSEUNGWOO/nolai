import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * 검색엔진이 볼 곳은 랜딩(/parents)과 개인정보처리방침뿐이다(설계 문서 3장
 * "SEO 대상은 랜딩 페이지뿐"). 레슨은 클라이언트에서 그려져 색인엔 빈 껍데기이고,
 * 방·가입·로그인은 세션에 묶여 있어 검색 결과에 나올 이유가 없다.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/lesson/", "/room", "/join", "/login", "/api/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
