import type { ComponentType } from "react";

/** 놀이터가 바깥으로 올려보내는 사건. 놀이터는 이걸 누가 듣는지 모른다. */
export interface PlaygroundEvent {
  type: string;
  payload?: Record<string, unknown>;
}

/** 아이가 만들어낸 결과물. "내 방"에 저장될 재료다. */
export interface Artifact {
  kind: string;
  payload: Record<string, unknown>;
}

export interface PlaygroundProps {
  data: unknown;
  onEvent: (event: PlaygroundEvent) => void;
  onArtifact: (artifact: Artifact) => void;
}

export type PlaygroundComponent = ComponentType<PlaygroundProps>;
