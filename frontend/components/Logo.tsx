/**
 * 워드마크 "놀AI". 심볼은 따로 없다 -- 마스코트 노리가 그 역할을 하고, 이 글자의
 * "I" 위에 노리의 안테나(노란 공)만 옮겨 왔다. 글자는 그림 파일이 아니라 SVG 텍스트라
 * 상단 바(32px)부터 OG 이미지까지 같은 코드가 크기만 바꿔 쓰인다. 색·외곽선·오프셋
 * 그림자는 DESIGN.md의 스티커 규칙 그대로다. 모양을 바꾸면 tools/icons/og.js의
 * 복사본도 같이 바꾼다.
 *
 * 높이는 className으로 준다(h-8 등). 너비는 비율대로 따라온다.
 */
export default function Logo({ className = "h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="-6 -28 206 138"
      role="img"
      aria-label="놀AI"
      className={`w-auto overflow-visible font-sans font-black ${className}`}
      style={{ letterSpacing: "-0.03em" }}
    >
      <g fontSize={100} strokeWidth={10} strokeLinejoin="round" style={{ paintOrder: "stroke fill" }}>
        <text x={0} y={100} transform="translate(0,7)" className="fill-ink stroke-ink">놀AI</text>
        <text x={0} y={100} className="stroke-ink">
          <tspan className="fill-candy-red">놀</tspan>
          <tspan className="fill-candy-teal">AI</tspan>
        </text>
      </g>
      <line x1={177} y1={30} x2={177} y2={6} strokeWidth={9} strokeLinecap="round" className="stroke-ink" />
      <circle cx={177} cy={-6} r={13} strokeWidth={5} className="fill-candy-yellow stroke-ink" />
    </svg>
  );
}
