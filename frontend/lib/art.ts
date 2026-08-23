/**
 * 그림 파일의 주소. 전부 public/art/에 있고 tools/art/export.js가 만든다.
 * 주소를 한 곳에서 만들어야 파일 이름을 바꿀 때 화면 네 군데를 뒤지지 않는다.
 * 배지 그림이 실제로 있는지는 lib/art.test.ts가 badgeNames 전부에 대해 확인한다.
 */
export type MascotMood = "base" | "curious" | "happy" | "surprised";

export function mascotArt(mood: MascotMood): string {
  return `/art/mascot-${mood}.webp`;
}

export function badgeArt(badge: string): string {
  return `/art/badge-${badge}.webp`;
}
