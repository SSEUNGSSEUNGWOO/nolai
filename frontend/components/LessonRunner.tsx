"use client";

import { useRef, useState } from "react";
import type { Lesson } from "@/lib/lesson-schema";
import type { Dataset } from "@/lib/dataset-schema";
import type { Artifact, PlaygroundEvent } from "@/playgrounds/types";
import { registry } from "@/playgrounds/registry";
import OwlBubble from "./OwlBubble";
import HookStep from "./steps/HookStep";
import NameStep from "./steps/NameStep";
import ChallengeStep from "./steps/ChallengeStep";
import RewardStep from "./steps/RewardStep";
import { popButton } from "./steps/styles";
import { ui } from "@/copy/ui";

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
    }
  }

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
        <OwlBubble text={line} />
        {canAdvance && (
          <button type="button" className={popButton} onClick={next}>
            {ui.playDone}
          </button>
        )}
      </div>
    );
  }

  if (step.type === "name") {
    return <NameStep concept={step.concept} body={step.body} onDone={next} />;
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
