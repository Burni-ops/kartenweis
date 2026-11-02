import type { BBox, ContinentId } from "./types";

export type ContinentScope = ContinentId | "world";

export const CONTINENT_NAMES: Record<ContinentScope, string> = {
  world: "Welt",
  europe: "Europa",
  asia: "Asien",
  africa: "Afrika",
  "north-america": "Nordamerika",
  "south-america": "Südamerika",
  oceania: "Ozeanien",
  antarctica: "Antarktis",
};

export const CONTINENT_BBOX: Record<ContinentScope, BBox> = {
  world: [-180, -58, 180, 84],
  europe: [-25, 34, 45, 72],
  asia: [-10, 5, 150, 80],
  africa: [-20, -35, 55, 38],
  "north-america": [-170, 7, -50, 75],
  "south-america": [-82, -56, -34, 13],
  oceania: [110, -50, 180, 0],
  antarctica: [-180, -90, 180, -60],
};

export const CONTINENT_ICONS: Record<ContinentScope, string> = {
  world: "🌍",
  europe: "🇪🇺",
  asia: "🌏",
  africa: "🌍",
  "north-america": "🌎",
  "south-america": "🌎",
  oceania: "🌊",
  antarctica: "🧊",
};
