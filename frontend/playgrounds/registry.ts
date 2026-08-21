import EmbeddingMap from "./embedding-map/EmbeddingMap";
import type { PlaygroundComponent } from "./types";

const registry: Record<string, PlaygroundComponent> = {
  EmbeddingMap,
};

export function getPlayground(name: string): PlaygroundComponent {
  const component = registry[name];
  if (!component) throw new Error(`알 수 없는 놀이터: ${name}`);
  return component;
}
