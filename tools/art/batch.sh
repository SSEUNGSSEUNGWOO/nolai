#!/usr/bin/env bash
# 마스코트 표정 + 배지 16개를 한 번에 뽑는다. 실행: bash tools/art/batch.sh
set -e
cd "$(dirname "$0")/../.."
G="node tools/art/gen.js"
BASE=tools/art/out/owl-base-7.png
KEEP="Keep this exact owl character, same colors and outline style, same plain cream background. Change only the expression and pose:"

$G owl-curious "$KEEP curious, head tilted, one wing raised to its chin like thinking, eyes looking up, tiny question mark floating above. No text." $BASE 8
$G owl-surprised "$KEEP surprised, eyes very wide, beak open in a small O, wings spread out to the sides, leaning back slightly. No text." $BASE 8

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
