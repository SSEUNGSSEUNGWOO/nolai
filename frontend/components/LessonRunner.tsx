"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { Lesson } from "@/lib/lesson-schema";
import type { Dataset } from "@/lib/dataset-schema";
import type { Artifact, PlaygroundEvent } from "@/playgrounds/types";
import { registry } from "@/playgrounds/registry";
import MascotBubble from "./MascotBubble";
import HookStep from "./steps/HookStep";
import NameStep from "./steps/NameStep";
import ChallengeStep from "./steps/ChallengeStep";
import RewardStep from "./steps/RewardStep";
import PredictStep from "./steps/PredictStep";
import RevealStep from "./steps/RevealStep";
import { popButton } from "./steps/styles";
import { ui } from "@/copy/ui";
import { unlockAudio, playPop } from "@/lib/sound";

export interface LessonResult {
  lessonId: string;
  badge: string;
  /** 놀이터가 마지막으로 올린 결과물. 아무것도 안 만들었으면 null. */
  artifact: Artifact | null;
}

export default function LessonRunner({
  lesson,
  dataset,
  onComplete,
}: {
  lesson: Lesson;
  dataset: Dataset;
  onComplete: (result: LessonResult) => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [progressCount, setProgressCount] = useState(0);
  // 예측 스텝에서 고른 보기. 확인 스텝이 돌아본다. 스키마가 순서를 지키므로
  // 확인 스텝에 닿았을 때는 항상 값이 있다.
  const [prediction, setPrediction] = useState<number | null>(null);
  // 움직임을 줄인 기기(멀미·접근성)에서는 화면이 튕기지 않는다. E2E도 이 경로로 돈다 --
  // 스텝마다 튕기면 클릭 전에 멈추길 기다리느라 전체가 두 배 느려진다.
  const reducedMotion = useReducedMotion();
  // 움직임을 줄인 기기(멀미·접근성)에서는 화면이 튕기지 않는다. E2E도 이 경로로 돈다 --

  // 놀이터가 만든 산출물을 받아둔다. state가 아니라 ref인 이유는
  // 값이 바뀌어도 다시 그릴 필요가 없어서다. 계획 2에서 서버에 저장한다.
  const artifactRef = useRef<Artifact | null>(null);

  const step = lesson.steps[stepIndex];
  // getPlayground()가 아니라 registry를 직접 읽는다: 함수 호출의 결과를 JSX
  // 태그로 쓰면 react-hooks/static-components가 "렌더 중 컴포넌트 생성"으로
  // 오탐한다(레지스트리 조회가 매번 새 컴포넌트를 만드는 것과 구별하지 못함).
  // lib/content.ts의 assertPlaygroundExists가 로드 시점에 이미
  // lesson.playground를 검증하므로, 여기서는 존재를 다시 확인할 필요가 없다.
  const Playground = registry[lesson.playground];

  function next() {
    // 브라우저는 사용자 조작 없이 소리를 못 내게 막는다. 버튼을 누른 이
    // 순간이 그 조작이라, 보상 화면에 닿기 전에 미리 깨워둔다.
    unlockAudio();

    if (stepIndex + 1 < lesson.steps.length) {
      setStepIndex(stepIndex + 1);
      return;
    }

    const reward = lesson.steps.find((s) => s.type === "reward");
    onComplete({
      lessonId: lesson.id,
      badge: reward && reward.type === "reward" ? reward.badge : "",
      artifact: artifactRef.current,
    });
  }

  // 놀이터는 자기가 하는 일의 이름으로 이벤트를 올린다("placed", "searched").
  // 러너는 지금 스텝의 목표와 이름이 같은 이벤트만 세고 나머지는 흘려보낸다.
  // 이렇게 해야 놀이터가 레슨의 목표를 몰라도 된다.
  function handlePlaygroundEvent(event: PlaygroundEvent) {
    if (step.type === "play" && event.type === step.goal.kind) {
      setProgressCount(Number(event.payload?.count ?? 0));
      // 해낸 것마다 "뿅". 소리 레슨은 자기 소리를 내고 있으니 겹치지 않게 뺀다.
      if (event.type !== "heard") playPop();
    }
  }

  return (
    <motion.div
      key={stepIndex}
      initial={reducedMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
    >
      {renderStep()}
    </motion.div>
  );

  function renderStep() {
  if (step.type === "hook") {
    return <HookStep owl={step.owl} onDone={next} />;
  }

  if (step.type === "play") {
    // 해낸 개수만큼 대사가 따라 올라간다. 대사가 모자라면 마지막 대사를 유지한다.
    const line = step.owl[Math.min(progressCount, step.owl.length - 1)];
    const canAdvance = progressCount >= step.goal.min;

    return (
      <div className="flex flex-col gap-3">
        <Playground
          key={dataset.id}
          data={dataset}
          onEvent={handlePlaygroundEvent}
          onArtifact={(a) => {
            artifactRef.current = a;
          }}
        />
        {/* 넓은 화면에서 이 둘까지 늘어나면 버튼 하나가 화면을 가로지른다.
            지도 폭에 맞춰 왼쪽에 세운다. */}
        <div className="flex flex-col gap-3 lg:max-w-3xl">
          <MascotBubble text={line} />
          {canAdvance && (
            <button type="button" className={popButton} onClick={next}>
              {ui.playDone}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (step.type === "name") {
    return <NameStep concept={step.concept} body={step.body} onDone={next} />;
  }

  if (step.type === "predict") {
    return (
      <PredictStep
        question={step.question}
        choices={step.choices}
        onDone={(picked) => {
          setPrediction(picked);
          next();
        }}
      />
    );
  }

  if (step.type === "reveal") {
    const predict = lesson.steps.find((s) => s.type === "predict");
    if (!predict || predict.type !== "predict" || prediction === null) {
      // 스키마가 막으므로 닿을 수 없다. 닿았더라도 아이의 놀이를 멈추지는
      // 않는다 -- 넘어갈 버튼만 그린다.
      return (
        <button type="button" className={popButton} onClick={next}>
          {ui.challengeNext}
        </button>
      );
    }
    return (
      <RevealStep
        picked={prediction}
        answer={predict.answer}
        choices={predict.choices}
        right={step.right}
        wrong={step.wrong}
        onDone={next}
      />
    );
  }

  if (step.type === "challenge") {
    return (
      <ChallengeStep
        question={step.question}
        choices={step.choices}
        answer={step.answer}
        explain={step.explain}
        onDone={next}
      />
    );
  }

  return <RewardStep badge={step.badge} onDone={next} />;
  }
}
