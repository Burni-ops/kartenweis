import type { FeatureCollection, Geometry } from "geojson";
import type {
  CountriesDataset,
  RegionFeatureCollection,
} from "./types";
import type { Fact, RevealMap } from "../game/types";

const cache = new Map<string, Promise<unknown>>();

export function loadJson<T>(url: string): Promise<T> {
  const cached = cache.get(url);
  if (cached) return cached as Promise<T>;

  const promise = fetch(url).then(async (response) => {
    if (!response.ok) {
      throw new Error(
        `Daten konnten nicht geladen werden: ${url} (${response.status})`,
      );
    }
    return (await response.json()) as T;
  });

  cache.set(url, promise);
  return promise;
}

export const loadCountries = () =>
  loadJson<CountriesDataset>("/data/countries.json");

export const loadEuropeMap = () =>
  loadJson<FeatureCollection<Geometry>>("/data/maps/europe.geojson");

export const loadDachRegions = () =>
  loadJson<RegionFeatureCollection>("/data/maps/dach-regions.geojson");

export const loadFacts = () => loadJson<Fact[]>("/data/facts/europe.json");

export const loadReveals = () =>
  loadJson<RevealMap>("/data/reveals/europe.json");
