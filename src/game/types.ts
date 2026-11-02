import type { Geometry } from "geojson";
import type { BBox, ContinentId, LonLat } from "../data/types";
import type { Precision } from "./geo";

export type Interaction = "mc" | "drag" | "tap-country" | "tap-region";

export type FactCategory =
  | "country"
  | "capital"
  | "city"
  | "river"
  | "mountain"
  | "lake"
  | "sea"
  | "strait"
  | "landmark"
  | "neighbor"
  | "region"
  | "extreme";

export interface FactAnswer {
  label: string;
  point?: LonLat;
  regionCode?: string;
  countryCode?: string;
}

export interface Fact {
  id: string;
  country: string;
  focus?: ContinentId | "world";
  category: FactCategory;
  interactions: Interaction[];
  difficulty: 1 | 2 | 3 | 4;
  question: string;
  answer: FactAnswer;
  options: string[];
  fact: string;
  source: string;
}

export type MapFocus =
  | { kind: "country"; code: string }
  | { kind: "continent"; id: ContinentId }
  | { kind: "world" };

export interface Question {
  /** Stable id used for mastery tracking, including synthetic questions. */
  factId: string;
  countryCode: string;
  category: FactCategory;
  interaction: Interaction;
  prompt: string;
  options: string[];
  answer: FactAnswer;
  fact: string;
  source: string;
  difficulty: number;
  focus: MapFocus;
}

export interface RunConfig {
  scope: "world" | "continent" | "country";
  continent?: ContinentId;
  countryCode?: string;
  count: number;
  seed: number;
  daily?: boolean;
}

export type RevealKind = "point" | "line" | "polygon";

export interface Reveal {
  kind: RevealKind;
  geometry?: Geometry;
  point?: LonLat;
  bbox: BBox;
  labelPoint?: LonLat | null;
  label: string;
}

export type RevealMap = Record<string, Reveal>;

export type UserAnswer =
  | { kind: "mc"; value: string }
  | { kind: "drag"; point: LonLat }
  | { kind: "tap-country"; countryCode: string }
  | { kind: "tap-region"; regionCode: string };

export interface AnswerFeedback {
  correct: boolean;
  points: number;
  answerLabel: string;
  userLabel: string | null;
  userPoint?: LonLat | null;
  distanceKm: number | null;
  precision: Precision | null;
  fact: string;
}

export interface RunState {
  config: RunConfig;
  questions: Question[];
  index: number;
  score: number;
  streak: number;
  bestStreak: number;
  correctCount: number;
  startedAt: number;
}

export interface RunSummary {
  config: RunConfig;
  score: number;
  correctCount: number;
  total: number;
  bestStreak: number;
  startedAt: number;
  finishedAt: number;
}
