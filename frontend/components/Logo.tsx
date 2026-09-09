/**
 * 워드마크 "놀AI". 심볼은 따로 없다 -- 마스코트 노리가 그 역할을 하고, 이 글자의
 * "I" 위에 노리의 안테나(노란 공)만 옮겨 왔다. 글자는 그림 파일이 아니라 SVG 텍스트라
 * 상단 바(32px)부터 OG 이미지까지 같은 코드가 크기만 바꿔 쓰인다. 색·외곽선·오프셋
 * 그림자는 DESIGN.md의 스티커 규칙 그대로다. 모양을 바꾸면 tools/icons/og.js의
 * 복사본도 같이 바꾼다.
 *
 * 한글 "놀"은 글자 높이가 91(기준선 위 84, 아래 6)이고 영문 대문자는 72라, 같은
 * 크기로 두면 AI가 눌려 보인다. AI를 1.26배(126)로 키우고 기준선을 7 내려 위아래를
 * 놀과 정확히 맞췄다. 안테나는 그 크기에서 실측한 I의 중심(x=205) 위에 있다.
 *
 * 높이는 className으로 준다(h-8 등). 너비는 비율대로 따라온다.
 */
export default function Logo({ className = "h-8" }: { className?: string }) {
  return (
    <svg viewBox="-2 -120 228 140" role="img" aria-label="놀AI" className={`w-auto overflow-visible font-sans font-black ${className}`}>
      <g strokeWidth={10} strokeLinejoin="round" style={{ paintOrder: "stroke fill" }} className="stroke-ink">
        <g transform="translate(0,7)" className="fill-ink">
          <text x={0} y={0} fontSize={100}>놀</text>
          <text x={101} y={7} fontSize={126} letterSpacing="-0.03em">AI</text>
        </g>
        <text x={0} y={0} fontSize={100} className="fill-candy-red">놀</text>
        <text x={101} y={7} fontSize={126} letterSpacing="-0.03em" className="fill-candy-teal">AI</text>
      </g>
      <line x1={206} y1={-80} x2={206} y2={-98} strokeWidth={9} strokeLinecap="round" className="stroke-ink" />
      <circle cx={206} cy={-106} r={11} strokeWidth={5} className="fill-candy-yellow stroke-ink" />
    </svg>
  );
}
