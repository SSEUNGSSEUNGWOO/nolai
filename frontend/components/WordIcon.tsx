import Image from "next/image";
import { wordArt } from "@/lib/art";

/**
 * 단어 칩 앞의 작은 그림. 그림이 있으면 그림, 없으면 이모지. 놀이터 네 곳이
 * 같은 결정을 하므로 여기 한 곳에 둔다.
 */
export default function WordIcon({ wordId, emoji, size = 20 }: { wordId: string; emoji: string; size?: number }) {
  const src = wordArt(wordId);
  if (!src) return <>{emoji}</>;
  return (
    <Image src={src} alt="" width={size} height={size} className="inline-block align-[-0.25em]" style={{ width: size, height: size }} />
  );
}
