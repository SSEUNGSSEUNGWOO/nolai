import EmbeddingMap from "./embedding-map/EmbeddingMap";
import NearestSearch from "./nearest-search/NearestSearch";
import type { PlaygroundComponent } from "./types";

export const registry: Record<string, PlaygroundComponent> = {
  EmbeddingMap,
  NearestSearch,
};

export function getPlayground(name: string): PlaygroundComponent {
  const component = registry[name];
  if (!component) throw new Error(`알 수 없는 놀이터: ${name}`);
  return component;
}
