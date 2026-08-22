import EmbeddingMap from "./embedding-map/EmbeddingMap";
import NearestSearch from "./nearest-search/NearestSearch";
import TeachSorter from "./teach-sorter/TeachSorter";
import LikeRecommender from "./like-recommender/LikeRecommender";
import PixelZoom from "./pixel-zoom/PixelZoom";
import WaveZoom from "./wave-zoom/WaveZoom";
import TokenSplit from "./token-split/TokenSplit";
import SelfCluster from "./self-cluster/SelfCluster";
import AnalogyLab from "./analogy-lab/AnalogyLab";
import CompareMeter from "./compare-meter/CompareMeter";
import WordWeaver from "./word-weaver/WordWeaver";
import FeelingDuel from "./feeling-duel/FeelingDuel";
import BitLights from "./bit-lights/BitLights";
import type { PlaygroundComponent } from "./types";

export const registry: Record<string, PlaygroundComponent> = {
  EmbeddingMap,
  NearestSearch,
  TeachSorter,
  LikeRecommender,
  PixelZoom,
  WaveZoom,
  TokenSplit,
  SelfCluster,
  AnalogyLab,
  CompareMeter,
  WordWeaver,
  FeelingDuel,
  BitLights,
};

export function getPlayground(name: string): PlaygroundComponent {
  const component = registry[name];
  if (!component) throw new Error(`알 수 없는 놀이터: ${name}`);
  return component;
}
