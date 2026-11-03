import type { Country, Region } from "../data/types";
import type { BBox, LonLat } from "../data/types";
import type { Geometry } from "geojson";
import type { Fact, FactCategory, RevealMap } from "./types";

export type AtlasFeatureKind =
  | "point"
  | "line"
  | "polygon"
  | "region"
  | "country";

export interface AtlasFeature {
  id: string;
  label: string;
  category: FactCategory;
  fact: string;
  source: string;
  kind: AtlasFeatureKind;
  point?: LonLat;
  center?: LonLat;
  geometry?: Geometry;
  bbox?: BBox;
  labelPoint?: LonLat | null;
  regionCode?: string;
  countryCode?: string;
}

const CATEGORY_ORDER: FactCategory[] = [
  "capital",
  "region",
  "city",
  "mountain",
  "river",
  "lake",
  "sea",
  "strait",
  "landmark",
  "extreme",
  "neighbor",
  "country",
  "currency",
  "language",
  "population",
  "area",
  "desert",
  "mountain_range",
  "island",
  "peninsula",
  "animal",
  "volcano",
];

export function buildAtlasFeatures(
  country: Country,
  facts: Fact[],
  reveals: RevealMap,
  regions: Region[],
): AtlasFeature[] {
  const features: AtlasFeature[] = [];
  const seen = new Set<string>();

  const add = (feature: AtlasFeature) => {
    if (seen.has(feature.id)) return;
    seen.add(feature.id);
    features.push(feature);
  };

  if (country.capital) {
    add({
      id: `capital:${country.code}`,
      label: country.capital.name_de,
      category: "capital",
      fact: `${country.capital.name_de} ist die Hauptstadt ${country.name_von}.`,
      source: `https://www.wikidata.org/wiki/${country.wikidata ?? ""}`,
      kind: "point",
      point: country.capital.point,
      center: country.capital.point,
    });
  }

  if (country.highest_point?.point) {
    add({
      id: `peak:${country.code}`,
      label: country.highest_point.name,
      category: "mountain",
      fact:
        country.highest_point.elevation_m !== null
          ? `${country.highest_point.name} ist mit ${Math.round(country.highest_point.elevation_m).toLocaleString("de-DE")} m der höchste Berg ${country.name_von}.`
          : `${country.highest_point.name} ist der höchste Berg ${country.name_von}.`,
      source: `https://www.wikidata.org/wiki/${country.wikidata ?? ""}`,
      kind: "point",
      point: country.highest_point.point,
      center: country.highest_point.point,
    });
  }

  for (const region of regions) {
    if (region.country !== country.code) continue;
    add({
      id: `region:${region.code}`,
      label: region.name_de,
      category: "region",
      fact: `${region.name_de} ist ${["Region", "Autonome Gemeinschaft", "Autonome Region", "Autonome Stadt", "Woiwodschaft", "Provinz", "Republik", "Präfektur", "Gemeinde", "Division", "Insel", "Wilaya", "Oblast"].includes(region.type) ? "eine" : "ein"} ${region.type} ${country.name_von}.`,
      source: `https://www.wikidata.org/wiki/${region.wikidata ?? ""}`,
      kind: "region",
      regionCode: region.code,
      center: region.center,
      bbox: region.bbox,
    });
  }

  for (const fact of facts) {
    if (fact.country !== country.code) continue;

    if (fact.answer.point) {
      add({
        id: fact.id,
        label: fact.answer.label,
        category: fact.category,
        fact: fact.fact,
        source: fact.source,
        kind: "point",
        point: fact.answer.point,
        center: fact.answer.point,
      });
      continue;
    }

    if (fact.answer.regionCode) {
      const region = regions.find(
        (item) => item.code === fact.answer.regionCode,
      );
      add({
        id: fact.id,
        label: fact.answer.label,
        category: fact.category,
        fact: fact.fact,
        source: fact.source,
        kind: "region",
        regionCode: fact.answer.regionCode,
        center: region?.center,
        bbox: region?.bbox,
      });
      continue;
    }

    if (fact.answer.countryCode) {
      add({
        id: fact.id,
        label: fact.answer.label,
        category: fact.category,
        fact: fact.fact,
        source: fact.source,
        kind: "country",
        countryCode: fact.answer.countryCode,
      });
      continue;
    }

    const reveal = reveals[fact.id];
    if (reveal) {
      add({
        id: fact.id,
        label: fact.answer.label,
        category: fact.category,
        fact: fact.fact,
        source: fact.source,
        kind: reveal.kind,
        point: reveal.point,
        center: reveal.point,
        geometry: reveal.geometry,
        bbox: reveal.bbox,
        labelPoint: reveal.labelPoint,
      });
    }
  }

  return features.sort((a, b) => {
    const categoryOrder =
      CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
    if (categoryOrder !== 0) return categoryOrder;
    return a.label.localeCompare(b.label, "de");
  });
}

export function factIdsForCountry(
  country: Country,
  facts: Fact[],
  regions: Region[],
): string[] {
  const ids: string[] = [`country:${country.code}`];
  if (country.capital) ids.push(`capital:${country.code}`);
  if (country.highest_point?.point) ids.push(`peak:${country.code}`);
  for (const region of regions) {
    if (region.country === country.code) ids.push(`region:${region.code}`);
  }
  for (const fact of facts) {
    if (fact.country === country.code) ids.push(fact.id);
  }
  return [...new Set(ids)];
}

export interface MasterySummary {
  learned: number;
  total: number;
  percent: number;
  stars: 0 | 1 | 2 | 3;
}

export function masteryForIds(
  ids: string[],
  progress: Record<string, { mastery: number }>,
): MasterySummary {
  const total = ids.length;
  const learned = ids.filter(
    (id) => (progress[id]?.mastery ?? 0) >= 4,
  ).length;
  const percent = total > 0 ? Math.round((learned / total) * 100) : 0;
  const stars: 0 | 1 | 2 | 3 =
    total === 0 ? 0 : percent >= 100 ? 3 : percent >= 66 ? 2 : percent >= 33 ? 1 : 0;
  return { learned, total, percent, stars };
}
