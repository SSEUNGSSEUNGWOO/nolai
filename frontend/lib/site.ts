/**
 * 배포 주소. OG·sitemap·robots·canonical이 절대 URL을 요구해서 한곳에 둔다.
 *
 * 도메인은 aissok.com으로 정했지만(2026-09-10, 설계 문서 14장) 아직 연결 전이다. 도메인을
 * 붙이면 Vercel 환경변수 NEXT_PUBLIC_SITE_URL만 바꾸면 되고, 그 전에는 실제로
 * 열리는 vercel.app 주소를 쓴다 -- 없는 주소를 검색엔진에 알리지 않기 위해서다.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nolai.vercel.app";
