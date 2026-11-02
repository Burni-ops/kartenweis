import type { FeatureCollection, Geometry, MultiPolygon, Polygon } from "geojson";

export type ContinentId =
  | "europe"
  | "asia"
  | "africa"
  | "north-america"
  | "south-america"
  | "oceania"
  | "antarctica";

export type BBox = [number, number, number, number];
export type LonLat = [number, number];

export interface LocalizedName {
  de: string;
  en: string;
}

export interface Capital {
  name_de: string;
  name_en: string;
  point: LonLat;
  population: number | null;
  population_year: number | null;
}

export interface Country {
  code: string;
  iso3: string;
  name: LocalizedName;
  continent: ContinentId;
  capital: Capital | null;
  population: number | null;
  population_year: number | null;
  area_km2: number;
  bbox: BBox;
  focus_bbox: BBox;
  center: LonLat;
  flag: string;
  flag_url: string;
  wikidata: string | null;
  mapcolor: number;
  has_regions: boolean;
  region_label: string | null;
  region_plural: string | null;
  regions_map: string | null;
  map: string;
}

export interface CountriesDataset {
  version: number;
  generated_at: string;
  source: string;
  continents: Array<{
    id: ContinentId;
    name: LocalizedName;
    country_count: number;
  }>;
  countries: Country[];
}

export interface RegionProperties {
  code: string;
  name_de: string;
  name_en: string;
  country: string;
  type: string;
  center: LonLat;
  area_km2: number;
  bbox: BBox;
  wikidata: string | null;
}

export type Region = RegionProperties;

export type RegionFeatureCollection = FeatureCollection<
  Polygon | MultiPolygon,
  RegionProperties
>;

export type CountryFeatureCollection = FeatureCollection<Geometry>;
