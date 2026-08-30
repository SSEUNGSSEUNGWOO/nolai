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
      <body>
        {/* 랜딩(/) 방향 계약 — impeccable 절차. 빌드 산출물에 남아야 하므로 HTML 주석으로 낸다. */}
        <div hidden dangerouslySetInnerHTML={{ __html: `<!--
THESIS: 랜딩이 설명하지 않고 첫 레슨의 첫 90초를 그대로 시킨다. 헤드라인+기능 카드+CTA의 기본 배열을 거부한다.
OWN-WORLD: 팝 캔디 — 남색(#1f2430) 3px 외곽선과 입체 그림자, 코랄·민트·노랑이 섹션 전체를 칠하는 색면, Pretendard 900, 로봇 노리 포즈 7종이 섹션 내레이터. 글을 지워도 알아본다.
STORY: 방문자가 지도에 단어를 놓는다 → 자리가 정해져 있음을 본다 → "방금 한 게 임베딩" 이름을 얻는다 → 코딩이 아님·정보 안 받음·레슨 16·FAQ·교육과정 → 시작하기.
FIRST VIEWPORT: 상단 바(놀AI · 부모·선생님께 · 시작하기). 데스크톱은 헤드라인 줄(좌 h1, 우 노리+말풍선) 아래에 실제 EmbeddingMap을 전폭(최대 5xl, 살짝 기울임)으로 — 지도가 4:3이라 옆에 두면 접힘 안에 못 들어와 위아래로 쌓았다. 모바일은 헤드라인 → 말풍선 → 지도. 첫 칩이 맥동하고 지도 안 "여기에 놓아봐"가 크게. 놓은 단어 수가 노리 대사·포즈를 바꾸고, 4개째에 색종이가 터지며 다음 섹션 제목에 그 수가 박힌다(시그니처 상호작용).
FORM: 노리가 안내하는 대화형 스크롤 — 후보 7 중 3번, seed f4ff6c07. 모션 문법: 섹션마다 한 번 스프링으로 떠오름, 노리 포즈 전환은 스프링 팝, reduced-motion이면 정지.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
-->` }} />
        {children}
      </body>
    </html>
  );
}
