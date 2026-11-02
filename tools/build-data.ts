import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import area from "@turf/area";
import bbox from "@turf/bbox";

const ROOT = process.cwd();
const RAW = path.join(ROOT, "data", "raw");
const GENERATED = path.join(RAW, "generated");
const OUT = path.join(ROOT, "public", "data");

fs.mkdirSync(GENERATED, { recursive: true });
fs.mkdirSync(path.join(OUT, "maps"), { recursive: true });

function runMapshaper(input: string, filter: string, output: string): void {
  execFileSync(
    process.execPath,
    [
      path.join(ROOT, "node_modules", "mapshaper", "bin", "mapshaper"),
      input,
      "-filter",
      filter,
      "-simplify",
      "10%",
      "keep-shapes",
      "-o",
      "format=geojson",
      output,
    ],
    { stdio: "inherit" },
  );
}

type Json = Record<string, any>;

const readJson = (file: string): Json => JSON.parse(fs.readFileSync(file, "utf8"));

const countries = readJson(path.join(RAW, "ne_10m_admin_0_countries.geojson"));
const places = readJson(path.join(RAW, "ne_10m_populated_places.geojson"));

/** Territories/dependencies that are not part of the country list. */
const EXCLUDED = new Set(["GIB", "JEY", "GGY", "IMN", "ALD", "FRO"]);

/** Natural Earth sometimes uses -99 for ISO_A2; recover the real code. */
const ISO_FALLBACK: Record<string, string> = {
  FRA: "FR",
  NOR: "NO",
  KOS: "XK",
};

function countryCode(p: Json): string {
  const candidate =
    p.ISO_A2_EH && p.ISO_A2_EH !== "-99" ? p.ISO_A2_EH : p.ISO_A2;
  if (candidate && candidate !== "-99") return candidate;
  return ISO_FALLBACK[p.ADM0_A3] ?? p.ADM0_A3;
}

function flagEmoji(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return "🏳️";
  return [...code]
    .map((char) => String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65))
    .join("");
}

const round = (value: number, digits = 4) =>
  Number(value.toFixed(digits));

function haversineKm(a: [number, number], b: [number, number]): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const [lon1, lat1] = a;
  const [lon2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * Bounding box for the map focus. Excludes far-away overseas territories
 * (French Guiana, Svalbard, Canaries) without dropping Corsica, Crete or Madeira.
 */
function focusBBox(feature: Json, label: [number, number]): [number, number, number, number] {
  const polygons =
    feature.geometry.type === "Polygon"
      ? [feature.geometry.coordinates]
      : feature.geometry.coordinates;

  const entries = polygons.map((coordinates: any) => {
    const polygon: any = {
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates },
    };
    const box = bbox(polygon);
    return {
      box,
      area: area(polygon),
      center: [(box[0] + box[2]) / 2, (box[1] + box[3]) / 2] as [number, number],
    };
  });

  const largest = Math.max(...entries.map((entry: Json) => entry.area));
  const kept = entries.filter(
    (entry: Json) =>
      entry.area >= largest * 0.001 && haversineKm(label, entry.center) <= 1200,
  );
  const boxes = kept.length ? kept : entries;
  const box = [
    Math.min(...boxes.map((entry: Json) => entry.box[0])),
    Math.min(...boxes.map((entry: Json) => entry.box[1])),
    Math.max(...boxes.map((entry: Json) => entry.box[2])),
    Math.max(...boxes.map((entry: Json) => entry.box[3])),
  ];
  return box.map((value: number) => round(value)) as [number, number, number, number];
}

// --- Capitals from Natural Earth populated places -------------------------

const capitals = new Map<string, Json>();
const capitalsByIso3 = new Map<string, Json>();
for (const feature of places.features) {
  const p = feature.properties;
  if (p.ADM0CAP !== 1) continue;

  const capital = {
    name_de: p.NAME_DE || p.NAME,
    name_en: p.NAME_EN || p.NAME,
    point: [round(p.LONGITUDE, 6), round(p.LATITUDE, 6)],
    population: p.POP_MAX ?? null,
    population_year: 2019,
  };

  const code = p.ISO_A2 && p.ISO_A2 !== "-99" ? p.ISO_A2 : null;
  if (code && !capitals.has(code)) capitals.set(code, capital);
  if (p.ADM0_A3 && !capitalsByIso3.has(p.ADM0_A3)) {
    capitalsByIso3.set(p.ADM0_A3, capital);
  }
}

// --- Europe country list --------------------------------------------------

const europe = countries.features
  .filter(
    (feature: Json) =>
      feature.properties.CONTINENT === "Europe" &&
      !EXCLUDED.has(feature.properties.ADM0_A3),
  )
  .map((feature: Json) => {
    const p = feature.properties;
    const code = countryCode(p);
    const box = bbox(feature as any).map((value: number) => round(value));
    const center = [round(p.LABEL_X), round(p.LABEL_Y)];
    const focus = focusBBox(feature, center as [number, number]);
    const rawAreaKm2 = area(feature as any) / 1_000_000;
    const areaKm2 =
      rawAreaKm2 < 10
        ? Number(rawAreaKm2.toFixed(2))
        : Math.round(rawAreaKm2);
    const capital =
      capitals.get(code) ?? capitalsByIso3.get(p.ADM0_A3) ?? null;

    return {
      code,
      iso3: p.ADM0_A3,
      name: {
        de: p.NAME_DE || p.NAME,
        en: p.NAME_EN || p.NAME,
      },
      continent: "europe",
      capital,
      population: p.POP_EST ?? null,
      population_year: p.POP_YEAR ?? null,
      area_km2: areaKm2,
      bbox: box,
      focus_bbox: focus,
      center,
      flag: flagEmoji(code),
      flag_url: `/flags/${code.toLowerCase()}.svg`,
      wikidata: p.WIKIDATAID ?? null,
      mapcolor: p.MAPCOLOR9 ?? 1,
      has_regions: ["DE", "AT", "CH"].includes(code),
      region_label:
        code === "CH"
          ? "Kanton"
          : code === "DE" || code === "AT"
            ? "Bundesland"
            : null,
      region_plural:
        code === "CH"
          ? "Kantone"
          : code === "DE" || code === "AT"
            ? "Bundesländer"
            : null,
      regions_map: ["DE", "AT", "CH"].includes(code)
        ? "/data/maps/dach-regions.geojson"
        : null,
      map: "/data/maps/europe.geojson",
    };
  })
  .sort((a: Json, b: Json) => a.name.de.localeCompare(b.name.de, "de"));

const missingCapitals = europe
  .filter((country: Json) => !country.capital)
  .map((country: Json) => `${country.code} ${country.name.de}`);

const dataset = {
  version: 1,
  generated_at: new Date().toISOString(),
  source: "Natural Earth 1:10m (public domain)",
  continents: [
    { id: "europe", name: { de: "Europa", en: "Europe" }, country_count: europe.length },
  ],
  countries: europe,
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(
  path.join(OUT, "countries.json"),
  `${JSON.stringify(dataset, null, 2)}\n`,
  "utf8",
);

// --- Generate and normalize the GeoJSON that the app loads -----------------

const europeSource = path.join(GENERATED, "europe.geojson");
runMapshaper(
  path.join(RAW, "ne_10m_admin_0_countries.geojson"),
  "CONTINENT == 'Europe'",
  europeSource,
);
const europeMap = readJson(europeSource);
europeMap.features = europeMap.features
  .filter((feature: Json) => !EXCLUDED.has(feature.properties.ADM0_A3))
  .map((feature: Json) => {
    const p = feature.properties;
    const code = countryCode(p);
    return {
      type: "Feature",
      properties: {
        code,
        name_de: p.NAME_DE || p.NAME,
        name_en: p.NAME_EN || p.NAME,
        mapcolor: p.MAPCOLOR9 ?? 1,
        continent: "europe",
        has_regions: ["DE", "AT", "CH"].includes(code),
      },
      geometry: feature.geometry,
    };
  });
const europeMapFile = path.join(OUT, "maps", "europe.geojson");
fs.writeFileSync(europeMapFile, JSON.stringify(europeMap), "utf8");

const regionsSource = path.join(GENERATED, "dach-regions.geojson");
runMapshaper(
  path.join(RAW, "ne_10m_admin_1_states_provinces.geojson"),
  "adm0_a3 == 'DEU' || adm0_a3 == 'AUT' || adm0_a3 == 'CHE'",
  regionsSource,
);
const regions = readJson(regionsSource);
regions.features = regions.features.map((feature: Json) => {
  const p = feature.properties;
  const country =
    p.adm0_a3 === "DEU" ? "DE" : p.adm0_a3 === "AUT" ? "AT" : "CH";
  return {
    type: "Feature",
    properties: {
      code: p.iso_3166_2,
      name_de: p.name_de || p.name,
      name_en: p.name_en || p.name,
      country,
      type: p.type_en,
      center: [round(p.longitude), round(p.latitude)],
      area_km2: Math.round(area(feature as any) / 1_000_000),
      bbox: bbox(feature as any).map((value: number) => round(value)),
      wikidata: p.wikidataid ?? null,
    },
    geometry: feature.geometry,
  };
});
const regionsFile = path.join(OUT, "maps", "dach-regions.geojson");
fs.writeFileSync(regionsFile, JSON.stringify(regions), "utf8");

console.log(`Wrote ${europe.length} countries to public/data/countries.json`);
console.log(
  `Normalized ${europeMap.features.length} country shapes and ${regions.features.length} DACH regions`,
);
if (missingCapitals.length) {
  console.warn(`Missing capitals for: ${missingCapitals.join(", ")}`);
}
