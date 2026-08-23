#!/usr/bin/env bash
# 마스코트 표정 + 배지 16개를 한 번에 뽑는다. 실행: bash tools/art/batch.sh
set -e
cd "$(dirname "$0")/../.."
G="node tools/art/gen.js"

# 마스코트: 로봇. 부엉이는 "지혜의 상징"이라는 뻔한 연상으로 고른 것이라 이유가 없었고
# 듀오링고를 따라 한 인상을 줬다. 로봇은 AI 앱에 AI가 주인공이라 설명이 필요 없다.
$G cand-robot "A cute small round robot mascot, friendly screen face with two big happy dot eyes, one little antenna with a glowing yellow ball, stubby arms and feet, coral red body with mint teal belly panel, holding a tiny toy block, full body, standing. No text." "" 21
BASE=tools/art/out/cand-robot-21.png
KEEP="Keep this exact robot character, same colors, same outline style, same plain cream background. Change only the expression and pose:"
$G robot-curious "$KEEP curious, head tilted, screen face shows wide round eyes looking up and a small open mouth, one hand on chin, a small question mark floating above. No text." $BASE 22
$G robot-happy "$KEEP very happy, screen face shows closed happy arc eyes and a big open smile, both arms raised in celebration, antenna ball glowing brightly with sparkles around. No text." $BASE 22
$G robot-surprised "$KEEP surprised, screen face shows huge wide eyes and an O-shaped mouth, arms out to the sides, leaning back, antenna tilted. No text." $BASE 22

# 배지: 둥근 메달 모양 안에 레슨의 상징. 전부 같은 틀이라 모아놓으면 한 세트로 보인다.
B="A round badge medal icon with a thick dark navy rim and a small ribbon at the bottom, sunny yellow rim, inside the circle:"
$G badge-map-explorer   "$B a tiny treasure map with three colored dots grouped together and a compass." "" 11
$G badge-path-finder    "$B a magnifying glass finding a glowing star among small dots." "" 11
$G badge-gap-finder     "$B a detective hat and a magnifying glass over an empty dotted outline." "" 11
$G badge-taste-reader   "$B a red heart with a small sparkle and a tiny pizza slice." "" 11
$G badge-bridge-builder "$B a small arched bridge connecting two speech bubbles." "" 11
$G badge-word-math      "$B a plus sign and an equals sign made of chunky blocks with a crown." "" 11
$G badge-meter-master   "$B a cute balance scale with two small weights." "" 11
$G badge-teacher        "$B a chalkboard with a tiny owl pointer and three colored boxes." "" 11
$G badge-group-finder   "$B three circles of dots, each group a different candy color, separated by dashed lines." "" 11
$G badge-feeling-judge  "$B a judge gavel next to a smiling face and a sad face." "" 11
$G badge-piece-master   "$B a jigsaw puzzle piece with a graduation cap." "" 11
$G badge-story-weaver   "$B an open book with a thread weaving through the pages." "" 11
$G badge-pixel-hunter   "$B a magnifying glass over a small grid of colored pixel squares." "" 11
$G badge-sharp-eye      "$B a stylized hawk eye with a sharp gleam." "" 11
$G badge-wave-rider     "$B a cute wave with a tiny surfboard and a musical note." "" 11
$G badge-bit-master     "$B a wizard hat with glowing 0 and 1 digits floating." "" 11
echo BATCH-DONE
