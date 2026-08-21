"use client";

import { useRef, useState } from "react";
import type { Lesson } from "@/lib/lesson-schema";
import type { Dataset } from "@/lib/dataset-schema";
import type { Artifact, PlaygroundEvent } from "@/playgrounds/types";
import { getPlayground } from "@/playgrounds/registry";
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
  const [placedCount, setPlacedCount] = useState(0);

  // 놀이터가 만든 산출물을 받아둔다. state가 아니라 ref인 이유는
  // 값이 바뀌어도 다시 그릴 필요가 없어서다. 계획 2에서 서버에 저장한다.
  const artifactRef = useRef<Artifact | null>(null);

  const step = lesson.steps[stepIndex];
  const Playground = getPlayground(lesson.playground);

  function next() {
    if (stepIndex + 1 < lesson.steps.length) {
      setStepIndex(stepIndex + 1);
      return;
    }

    const reward = lesson.steps.find((s) => s.type === "reward");
    onComplete({
      lessonId: lesson.id,
      badge: reward && reward.type === "reward" ? reward.badge : "",
    });
  }

  function handlePlaygroundEvent(event: PlaygroundEvent) {
    if (event.type === "placed") {
      setPlacedCount(Number(event.payload?.placedCount ?? 0));
    }
  }

  if (step.type === "hook") {
    return <HookStep owl={step.owl} onDone={next} />;
  }

  if (step.type === "play") {
    // 놓은 개수만큼 대사가 따라 올라간다. 대사가 모자라면 마지막 대사를 유지한다.
    const line = step.owl[Math.min(placedCount, step.owl.length - 1)];
    const canAdvance = placedCount >= step.goal.minPlaced;

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
