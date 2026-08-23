"use client";

import { motion, useReducedMotion } from "motion/react";

const COLORS = ["#ff6b6b", "#4ecdc4", "#ffd93d", "#1f2430", "#fffdf6"];

/**
 * 색종이 폭발. 화면 가운데서 사방으로 튄 뒤 떨어진다. 한 번 그리고 끝이라 상태가
 * 없다 -- 다시 터뜨리려면 key를 바꿔 다시 mount한다. 움직임을 줄인 기기에서는
 * 아무것도 그리지 않는다.
 */
export default function Confetti({ count = 28 }: { count?: number }) {
  const reduced = useReducedMotion();
  if (reduced) return null;

  // 입자마다 각도·거리·색을 정한다. 결정적(i 기반)이라 SSR과 클라이언트가 같다.
  const pieces = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + (i % 3) * 0.3;
    const distance = 90 + (i % 5) * 28;
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance * 0.7,
      color: COLORS[i % COLORS.length],
      rotate: (i * 47) % 360,
      round: i % 4 === 0,
    };
  });

  return (
    <div aria-hidden data-testid="confetti" className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-1/2 block"
          style={{ width: p.round ? 10 : 8, height: p.round ? 10 : 14, backgroundColor: p.color, borderRadius: p.round ? 999 : 2 }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
          animate={{ x: p.x, y: [0, p.y, p.y + 140], opacity: [1, 1, 0], rotate: p.rotate + 360, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.2, 0.8, 0.4, 1], times: [0, 0.45, 1] }}
        />
      ))}
    </div>
  );
}
