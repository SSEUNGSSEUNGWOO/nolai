#!/usr/bin/env bash
# 레슨 썸네일 16, 마스코트 포즈 3, 묶음 헤더 4, 내 방 빈 상태 1. 실행: bash tools/art/extras.sh
# 캔디 팔레트(마스코트·배지와 같은 계열). 단어 칩과 달리 사물 본래 색이 필요 없다.
set -e
cd "$(dirname "$0")/../.."
G="node tools/art/gen.js"

# 마스코트 포즈: 기본 그림을 참조로 편집
BASE=tools/art/out/cand-robot-21.png
KEEP="Keep this exact robot character, same colors, same outline style, same plain cream background. Change only the pose:"
$G robot-wave "$KEEP waving one hand high in a friendly greeting, screen face smiling warmly, other arm relaxed. No text." $BASE 22
$G robot-point "$KEEP pointing to the right with one arm extended and index finger out, screen face eager and encouraging, leaning forward slightly. No text." $BASE 22
$G robot-think "$KEEP thinking hard, one hand on the side of its head, screen face shows eyes looking up and a small flat mouth, three small dots floating above the head like loading. No text." $BASE 22

# 레슨 썸네일: 가로 카드. 글자 없이 한 장면.
T="A small square scene illustration for a lesson card, simple composition, one clear idea, no characters, no text:"
S=41
while IFS='|' read -r id prompt; do
  [ -z "$id" ] && continue
  $G "thumb-$id" "$T $prompt No text." "" $S
done <<'LIST'
embedding-map|a map with three clusters of colorful dots, animals dots red, vehicle dots teal, fruit dots yellow, with thin lines connecting nearby dots.
nearest-search|a magnifying glass hovering over a row of speech bubbles, one bubble glowing brighter than the rest.
answer-gaps|a row of speech bubbles with one empty dotted-outline bubble and a small question mark inside it.
like-recommender|a red heart with three small cards fanning out from it, one card glowing.
translate-map|two speech bubbles, one with a Korean flag and one with a US flag, overlapping in the middle with a star where they meet.
analogy-lab|a crown, a minus sign, a mustache, a plus sign, a bow, and an equals sign laid out like an equation made of icons.
compare-meter|a cute balance scale with a big elephant on one side and a tiny ant on the other, both sides level.
teach-sorter|two open boxes, one red and one teal, with a small hand placing a colored ball into one of them.
self-cluster|scattered colorful dots with two dashed circles drawn around two groups, and a pencil drawing the circle.
feeling-duel|two cards side by side, one with a happy face and one with a sad face, with a small robot head between them.
token-split|a long paper strip being cut by scissors into small numbered pieces.
word-weaver|a typewriter with a ribbon of words coming out and the last word still being typed.
pixel-zoom|a magnifying glass over a picture showing big colorful square pixels underneath.
pixel-coarse|the same smiley drawn twice, one on a coarse 4x4 grid and one on a fine 16x16 grid.
wave-zoom|a sound wave curve with small dots marking points along it and a tiny speaker.
bit-lights|a row of eight light bulbs, some lit yellow and some off, like a binary number.
LIST

# 묶음 헤더: 작은 장식 그림
H="A small decorative emblem icon, simple, no text:"
$G group-find "$H a compass needle pointing at a glowing dot among other dots." "" 51
$G group-more "$H a plus sign and an arrow made of chunky rounded blocks." "" 51
$G group-learn "$H a small open book with a lightbulb above it." "" 51
$G group-numbers "$H a cluster of the digits 0 and 1 floating like confetti." "" 51

# 내 방 빈 상태
$G empty-shelf "A small empty wooden shelf with a single dotted outline where a badge would sit, a tiny sparkle. No text." "" 61
echo EXTRAS-DONE
