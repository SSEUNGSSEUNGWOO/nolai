/**
 * 워드마크 "AI쏙". 심볼은 따로 없다 -- 마스코트 노리가 그 역할을 하고, 이 글자의
 * "I" 위에 노리의 안테나(노란 공)만 옮겨 왔다. 글자는 그림 파일이 아니라 SVG 텍스트라
 * 상단 바(32px)부터 OG 이미지까지 같은 코드가 크기만 바꿔 쓰인다. 색·외곽선·오프셋
 * 그림자는 DESIGN.md의 스티커 규칙 그대로다. 모양을 바꾸면 tools/icons/og.js의
 * 복사본도 같이 바꾼다.
 *
 * 크기가 서로 다른 이유(놀AI 시절에 잰 값): 같은 100px에서 한글은 글자 높이 91, 영문
 * 대문자는 72라 AI가 눌려 보이고, 반대로 AI만 키우면 획이 굵어진다. 한글 112 / AI 120이면
 * 획 굵기가 13 대 16으로 비슷하다. AI 기준선은 한글의 바닥에 맞춰 8 내렸다. 2026-09-10
 * 개명하며 순서만 AI → 쏙으로 바뀌었고, 안테나는 앞으로 온 I의 중심(x 99) 위에 있다.
 *
 * 높이는 className으로 준다(h-8 등). 너비는 비율대로 따라온다.
 */
export default function Logo({ className = "h-8" }: { className?: string }) {
  return (
    <svg viewBox="-2 -140 236 161" role="img" aria-label="AI쏙" className={`w-auto overflow-visible font-sans font-black ${className}`}>
      <g strokeWidth={10} strokeLinejoin="round" style={{ paintOrder: "stroke fill" }} className="stroke-ink">
        <g transform="translate(0,7)" className="fill-ink">
          <text x={0} y={8} fontSize={120} letterSpacing="-0.03em">AI</text>
          <text x={118} y={0} fontSize={112}>쏙</text>
        </g>
        <text x={0} y={8} fontSize={120} letterSpacing="-0.03em" className="fill-candy-teal">AI</text>
        <text x={118} y={0} fontSize={112} className="fill-candy-red">쏙</text>
      </g>
      <line x1={99} y1={-90} x2={99} y2={-108} strokeWidth={9} strokeLinecap="round" className="stroke-ink" />
      <circle cx={99} cy={-116} r={11} strokeWidth={5} className="fill-candy-yellow stroke-ink" />
    </svg>
  );
}
