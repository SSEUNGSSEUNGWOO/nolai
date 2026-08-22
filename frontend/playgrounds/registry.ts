import EmbeddingMap from "./embedding-map/EmbeddingMap";
import NearestSearch from "./nearest-search/NearestSearch";
import TeachSorter from "./teach-sorter/TeachSorter";
import LikeRecommender from "./like-recommender/LikeRecommender";
import PixelZoom from "./pixel-zoom/PixelZoom";
import WaveZoom from "./wave-zoom/WaveZoom";
import TokenSplit from "./token-split/TokenSplit";
import type { PlaygroundComponent } from "./types";

export const registry: Record<string, PlaygroundComponent> = {
  EmbeddingMap,
  NearestSearch,
  TeachSorter,
  LikeRecommender,
  PixelZoom,
  WaveZoom,
  TokenSplit,
};

export function getPlayground(name: string): PlaygroundComponent {
  const component = registry[name];
  if (!component) throw new Error(`알 수 없는 놀이터: ${name}`);
  return component;
}
