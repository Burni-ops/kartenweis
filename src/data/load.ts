import type { FeatureCollection, Geometry } from "geojson";
import type {
  CountriesDataset,
  RegionFeatureCollection,
} from "./types";
import type { Fact, RevealMap } from "../game/types";
import { assetUrl } from "../utils/assets";

const cache = new Map<string, Promise<unknown>>();

export function loadJson<T>(url: string): Promise<T> {
  const resolved = assetUrl(url);
  const cached = cache.get(resolved);
  if (cached) return cached as Promise<T>;

  const promise = fetch(resolved).then(async (response) => {
    if (!response.ok) {
      throw new Error(
        `Daten konnten nicht geladen werden: ${resolved} (${response.status})`,
      );
    }
    return (await response.json()) as T;
  });

  cache.set(resolved, promise);
  return promise;
}

export const loadCountries = () =>
  loadJson<CountriesDataset>("/data/countries.json");

export const loadWorldMap = () =>
  loadJson<FeatureCollection<Geometry>>("/data/maps/world.geojson");

export const loadEuropeMap = loadWorldMap;

export const loadRegions = () =>
  loadJson<RegionFeatureCollection>("/data/maps/world-regions.geojson");

export const loadFacts = async () => {
  const [curated, generated] = await Promise.all([
    loadJson<Fact[]>("/data/facts/europe.json"),
    loadJson<Fact[]>("/data/facts/generated.json"),
  ]);
  return [...curated, ...generated];
};

export const loadReveals = async () => {
  const [curated, generated] = await Promise.all([
    loadJson<RevealMap>("/data/reveals/europe.json"),
    loadJson<RevealMap>("/data/reveals/generated.json"),
  ]);
  return { ...curated, ...generated };
};
