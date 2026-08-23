#!/usr/bin/env bash
# 단어 칩 그림. 실행: bash tools/art/words.sh
# 번역 레슨(강아지/dog)은 일부러 뺀다 -- 같은 그림 둘이면 "같은 그림이 같은 자리"가 되어
# 답을 미리 준다. 반대말 레슨(크다/덥다)은 형용사라 그림이 애매해서 이모지를 둔다.
set -e
cd "$(dirname "$0")/../.."
G="env ART_STYLE=natural node tools/art/gen.js"
W="A single simple object icon, centered, nothing else:"
S=31
while IFS='|' read -r id prompt; do
  [ -z "$id" ] && continue
  $G "word-$id" "$W $prompt. No text." "" $S
done <<'LIST'
dog|a cute puppy
cat|a cute cat
rabbit|a cute rabbit
tiger|a cute tiger cub
elephant|a cute elephant
chick|a cute yellow chick
fish|a cute fish
penguin|a cute penguin
whale|a cute whale
shark|a cute shark
octopus|a cute octopus
crab|a cute crab
jellyfish|a cute jellyfish
car|a small red car
bus|a yellow school bus
train|a train engine
bike|a bicycle
airplane|a passenger airplane
truck|a delivery truck
helicopter|a helicopter
rocket|a rocket
balloon|a hot air balloon
glider|a hang glider
strawberry|a strawberry
banana|a banana
grape|a bunch of grapes
watermelon|a watermelon slice
tangerine|a tangerine
pizza|a pizza slice
tteok|a bowl of tteokbokki, red rice cakes
icecream|an ice cream cone with a pink and white swirl, perfectly flat plain cream background
gimbap|korean gimbap rolls
chocolate|a chocolate bar
ramen|a bowl of ramen noodles
burger|a hamburger
dumpling|a steamed dumpling
soccer|a soccer ball
baseball|a baseball and bat
swim|swimming goggles and a pool float
taekwondo|a taekwondo uniform with a black belt
pingpong|a table tennis paddle and ball
basket|a basketball
badminton|a badminton racket and shuttlecock
volleyball|a volleyball
lego|colorful toy building bricks
origami|a paper crane
drawing|a paintbrush and a palette
clay|three colorful balls of modeling clay, red, blue and yellow, with a small clay snail made from them
knit|a ball of yarn with knitting needles
puzzle|two colorful jigsaw puzzle pieces fitting together
blocks|a stack of wooden toy blocks
beads|a colorful bead bracelet
LIST
echo WORDS-DONE
