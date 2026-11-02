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

function runMapshaperArgs(args: string[]): void {
  execFileSync(
    process.execPath,
    [
      path.join(ROOT, "node_modules", "mapshaper", "bin", "mapshaper"),
      ...args,
    ],
    { stdio: "inherit" },
  );
}

function runMapshaper(input: string, filter: string, output: string): void {
  runMapshaperArgs([
    input,
    "-filter",
    filter,
    "-simplify",
    "10%",
    "keep-shapes",
    "-o",
    "format=geojson",
    output,
  ]);
}

type Json = Record<string, any>;

const readJson = (file: string): Json =>
  JSON.parse(fs.readFileSync(file, "utf8"));

const countriesSource = readJson(
  path.join(RAW, "ne_10m_admin_0_countries.geojson"),
);
const places = readJson(path.join(RAW, "ne_10m_populated_places.geojson"));

const referenceFile = path.join(ROOT, "data", "reference", "world.json");
const europeReferenceFile = path.join(ROOT, "data", "reference", "europe.json");
const reference = fs.existsSync(referenceFile)
  ? readJson(referenceFile)
  : fs.existsSync(europeReferenceFile)
    ? readJson(europeReferenceFile)
    : null;

/** Territories/dependencies that are not playable countries. */
const EXCLUDED = new Set(["GIB", "JEY", "GGY", "IMN", "ALD", "FRO"]);

const CONTINENT_MAP: Record<string, string> = {
  Europe: "europe",
  Asia: "asia",
  Africa: "africa",
  "North America": "north-america",
  "South America": "south-america",
  Oceania: "oceania",
};

const CONTINENT_NAMES: Record<string, { de: string; en: string }> = {
  europe: { de: "Europa", en: "Europe" },
  asia: { de: "Asien", en: "Asia" },
  africa: { de: "Afrika", en: "Africa" },
  "north-america": { de: "Nordamerika", en: "North America" },
  "south-america": { de: "Südamerika", en: "South America" },
  oceania: { de: "Ozeanien", en: "Oceania" },
};

const CONTINENT_BBOX: Record<string, [number, number, number, number]> = {
  europe: [-25, 34, 45, 72],
  asia: [-10, 5, 150, 80],
  africa: [-20, -35, 55, 38],
  "north-america": [-170, 7, -50, 75],
  "south-america": [-82, -56, -34, 13],
  oceania: [110, -50, 180, 0],
  world: [-180, -60, 180, 85],
};

function isIncludedCountry(p: Json): boolean {
  if (!["Sovereign country", "Country", "Disputed"].includes(p.TYPE)) {
    return false;
  }
  if (EXCLUDED.has(p.ADM0_A3)) return false;
  if (p.ADM0_DIF === 1 && p.SOVEREIGNT !== p.ADMIN) return false;
  return Boolean(CONTINENT_MAP[p.CONTINENT]);
}

/** Natural Earth sometimes uses -99 for ISO_A2; recover the real code. */
const ISO_FALLBACK: Record<string, string> = {
  FRA: "FR",
  NOR: "NO",
  KOS: "XK",
  CYN: "XN",
  SOL: "XS",
};

const FLAG_ALIAS: Record<string, string> = {
  CYN: "tr",
  SOL: "so",
};

/** Short German names where Natural Earth uses long/official forms. */
const NAME_OVERRIDE: Record<string, string> = {
  CD: "DR Kongo",
  CG: "Republik Kongo",
  CN: "China",
  CY: "Zypern",
  XN: "Nordzypern",
  FM: "Mikronesien",
  MD: "Moldau",
  TW: "Taiwan",
  US: "USA",
};

/** Correct German prepositional phrases for countries with articles. */
const NAME_CASES: Record<
  string,
  { von: string; in: string; acc: string }
> = {
  AE: {
    von: "von den Vereinigten Arabischen Emiraten",
    in: "in den Vereinigten Arabischen Emiraten",
    acc: "die Vereinigten Arabischen Emirate",
  },
  BS: { von: "von den Bahamas", in: "auf den Bahamas", acc: "die Bahamas" },
  CD: { von: "von der DR Kongo", in: "in der DR Kongo", acc: "die DR Kongo" },
  CF: {
    von: "von der Zentralafrikanischen Republik",
    in: "in der Zentralafrikanischen Republik",
    acc: "die Zentralafrikanische Republik",
  },
  CG: {
    von: "von der Republik Kongo",
    in: "in der Republik Kongo",
    acc: "die Republik Kongo",
  },
  CH: { von: "von der Schweiz", in: "in der Schweiz", acc: "die Schweiz" },
  CI: {
    von: "von der Elfenbeinküste",
    in: "in der Elfenbeinküste",
    acc: "die Elfenbeinküste",
  },
  DO: {
    von: "von der Dominikanischen Republik",
    in: "in der Dominikanischen Republik",
    acc: "die Dominikanische Republik",
  },
  GB: {
    von: "vom Vereinigten Königreich",
    in: "im Vereinigten Königreich",
    acc: "das Vereinigte Königreich",
  },
  IQ: { von: "vom Irak", in: "im Irak", acc: "den Irak" },
  IR: { von: "vom Iran", in: "im Iran", acc: "den Iran" },
  KM: { von: "von den Komoren", in: "auf den Komoren", acc: "die Komoren" },
  LB: { von: "vom Libanon", in: "im Libanon", acc: "den Libanon" },
  MH: {
    von: "von den Marshallinseln",
    in: "auf den Marshallinseln",
    acc: "die Marshallinseln",
  },
  MN: { von: "von der Mongolei", in: "in der Mongolei", acc: "die Mongolei" },
  MV: { von: "von den Malediven", in: "auf den Malediven", acc: "die Malediven" },
  NE: { von: "vom Niger", in: "im Niger", acc: "den Niger" },
  NL: {
    von: "von den Niederlanden",
    in: "in den Niederlanden",
    acc: "die Niederlande",
  },
  OM: { von: "vom Oman", in: "im Oman", acc: "den Oman" },
  PH: {
    von: "von den Philippinen",
    in: "auf den Philippinen",
    acc: "die Philippinen",
  },
  SB: {
    von: "von den Salomonen",
    in: "auf den Salomonen",
    acc: "die Salomonen",
  },
  SC: { von: "von den Seychellen", in: "auf den Seychellen", acc: "die Seychellen" },
  SD: { von: "vom Sudan", in: "im Sudan", acc: "den Sudan" },
  SK: { von: "von der Slowakei", in: "in der Slowakei", acc: "die Slowakei" },
  SS: { von: "vom Südsudan", in: "im Südsudan", acc: "den Südsudan" },
  TD: { von: "vom Tschad", in: "im Tschad", acc: "den Tschad" },
  TR: { von: "von der Türkei", in: "in der Türkei", acc: "die Türkei" },
  UA: { von: "von der Ukraine", in: "in der Ukraine", acc: "die Ukraine" },
  US: { von: "von den USA", in: "in den USA", acc: "die USA" },
  VA: { von: "vom Vatikan", in: "im Vatikan", acc: "den Vatikan" },
  XK: { von: "vom Kosovo", in: "im Kosovo", acc: "den Kosovo" },
  YE: { von: "vom Jemen", in: "im Jemen", acc: "den Jemen" },
};

function countryCode(p: Json): string {
  if (p.ADM0_A3 === "CYN") return "XN";
  if (p.ADM0_A3 === "SOL") return "XS";
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

const round = (value: number, digits = 4) => Number(value.toFixed(digits));

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
 * without dropping nearby islands (Corsica, Crete, Madeira …).
 */
function focusBBox(
  feature: Json,
  label: [number, number],
): [number, number, number, number] {
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
      center: [(box[0] + box[2]) / 2, (box[1] + box[3]) / 2] as [
        number,
        number,
      ],
    };
  });

  const largest = Math.max(...entries.map((entry: Json) => entry.area));
  const kept = entries.filter(
    (entry: Json) =>
      entry.area >= largest * 0.01 &&
      haversineKm(label, entry.center) <= 1500,
  );
  const boxes = kept.length
    ? kept
    : [
        entries.reduce((best: Json, entry: Json) =>
          entry.area > best.area ? entry : best,
        ),
      ];
  const box = [
    Math.min(...boxes.map((entry: Json) => entry.box[0])),
    Math.min(...boxes.map((entry: Json) => entry.box[1])),
    Math.max(...boxes.map((entry: Json) => entry.box[2])),
    Math.max(...boxes.map((entry: Json) => entry.box[3])),
  ];
  // Dateline-crossing islands (New Zealand, Fiji, Kiribati) would produce a
  // world-wide bbox. Fall back to a readable window around the label.
  if (box[2] - box[0] > 180 || box[3] - box[1] > 85) {
    const minX = Math.min(...entries.map((entry: Json) => entry.box[0]));
    const minY = Math.min(...entries.map((entry: Json) => entry.box[1]));
    const maxX = Math.max(...entries.map((entry: Json) => entry.box[2]));
    const maxY = Math.max(...entries.map((entry: Json) => entry.box[3]));
    return [
      round(Math.max(minX, label[0] - 12)),
      round(Math.max(minY, label[1] - 10)),
      round(Math.min(maxX, label[0] + 12)),
      round(Math.min(maxY, label[1] + 10)),
    ];
  }
  return box.map((value: number) => round(value)) as [
    number,
    number,
    number,
    number,
  ];
}

// --- Capitals from Natural Earth populated places -------------------------

const CAPITAL_OVERRIDE: Record<string, Json> = {
  NR: {
    name_de: "Yaren",
    name_en: "Yaren",
    point: [166.9209, -0.5477],
    population: 1100,
    population_year: 2019,
  },
  SS: {
    name_de: "Juba",
    name_en: "Juba",
    point: [31.580026, 4.829975],
    population: 372410,
    population_year: 2019,
  },
  XN: {
    name_de: "Nord-Nikosia",
    name_en: "North Nicosia",
    point: [33.3215, 35.1856],
    population: 61000,
    population_year: 2019,
  },
};

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

// --- Region labels --------------------------------------------------------

const REGION_TYPE_DE: Record<string, { label: string; plural: string }> = {
  State: { label: "Bundesstaat", plural: "Bundesstaaten" },
  Province: { label: "Provinz", plural: "Provinzen" },
  Region: { label: "Region", plural: "Regionen" },
  Department: { label: "Departement", plural: "Departements" },
  Governorate: { label: "Gouvernement", plural: "Gouvernements" },
  Prefecture: { label: "Präfektur", plural: "Präfekturen" },
  District: { label: "Distrikt", plural: "Distrikte" },
  County: { label: "County", plural: "Countys" },
  Municipality: { label: "Gemeinde", plural: "Gemeinden" },
  "Autonomous Community": {
    label: "Autonome Gemeinschaft",
    plural: "Autonome Gemeinschaften",
  },
  "Autonomous Region": {
    label: "Autonome Region",
    plural: "Autonome Regionen",
  },
  "Autonomous City": { label: "Autonome Stadt", plural: "Autonome Städte" },
  Republic: { label: "Republik", plural: "Republiken" },
  "Federal District": {
    label: "Bundesdistrikt",
    plural: "Bundesdistrikte",
  },
  "Capital Territory": {
    label: "Hauptstadtterritorium",
    plural: "Hauptstadtterritorien",
  },
  Territory: { label: "Territorium", plural: "Territorien" },
  Oblast: { label: "Oblast", plural: "Oblaste" },
  Krai: { label: "Region", plural: "Regionen" },
  Voivodeship: { label: "Woiwodschaft", plural: "Woiwodschaften" },
  Canton: { label: "Kanton", plural: "Kantone" },
  Parish: { label: "Parish", plural: "Parishes" },
  Borough: { label: "Bezirk", plural: "Bezirke" },
  Emirate: { label: "Emirat", plural: "Emirate" },
  Wilaya: { label: "Wilaya", plural: "Wilayas" },
  Island: { label: "Insel", plural: "Inseln" },
  Division: { label: "Division", plural: "Divisionen" },
  "Sub-province": { label: "Unterprovinz", plural: "Unterprovinzen" },
};

const REGION_TYPE_OVERRIDE: Record<string, { label: string; plural: string }> =
  {
    DE: { label: "Bundesland", plural: "Bundesländer" },
    AT: { label: "Bundesland", plural: "Bundesländer" },
    CH: { label: "Kanton", plural: "Kantone" },
    FR: { label: "Region", plural: "Regionen" },
    IT: { label: "Region", plural: "Regionen" },
    ES: { label: "Autonome Gemeinschaft", plural: "Autonome Gemeinschaften" },
    PL: { label: "Woiwodschaft", plural: "Woiwodschaften" },
    NL: { label: "Provinz", plural: "Provinzen" },
  };

const REGION_COUNTRY: Record<string, string> = {};
const CODE_BY_A3: Record<string, string> = {};

for (const feature of countriesSource.features) {
  const p = feature.properties;
  if (!isIncludedCountry(p)) continue;
  const code = countryCode(p);
  REGION_COUNTRY[p.ADM0_A3] = code;
  CODE_BY_A3[p.ADM0_A3] = code;
}

const REGION_LABEL_TO_PLURAL: Record<string, string> = {};
for (const value of [
  ...Object.values(REGION_TYPE_DE),
  ...Object.values(REGION_TYPE_OVERRIDE),
]) {
  REGION_LABEL_TO_PLURAL[value.label] = value.plural;
}

const regionLabelFor = (
  code: string,
  typeEn: string | null,
): { label: string; plural: string } => {
  if (REGION_TYPE_OVERRIDE[code]) return REGION_TYPE_OVERRIDE[code];
  if (typeEn && REGION_TYPE_DE[typeEn]) return REGION_TYPE_DE[typeEn];
  if (typeEn && REGION_LABEL_TO_PLURAL[typeEn]) {
    return { label: typeEn, plural: REGION_LABEL_TO_PLURAL[typeEn] };
  }
  return { label: "Region", plural: "Regionen" };
};

// --- Region generation ----------------------------------------------------

const regionsRaw = path.join(
  RAW,
  "ne_10m_admin_1_states_provinces.geojson",
);

const dachSource = path.join(GENERATED, "dach-regions.geojson");
runMapshaper(
  regionsRaw,
  "adm0_a3 == 'DEU' || adm0_a3 == 'AUT' || adm0_a3 == 'CHE'",
  dachSource,
);

const euSource = path.join(GENERATED, "eu-regions-dissolved.geojson");
runMapshaperArgs([
  regionsRaw,
  "-filter",
  "adm0_a3 == 'FRA' || adm0_a3 == 'ITA' || adm0_a3 == 'ESP' || adm0_a3 == 'POL' || adm0_a3 == 'NLD'",
  "-filter",
  "adm0_a3 != 'NLD' || type_en == 'Province'",
  "-each",
  "group_code = (adm0_a3 == 'POL' || adm0_a3 == 'NLD' || name == 'Melilla') ? iso_3166_2 : region_cod; group_name = (adm0_a3 == 'POL' || adm0_a3 == 'NLD' || name == 'Melilla') ? (name_de || name) : region",
  "-dissolve",
  "group_code",
  "copy-fields=group_name,adm0_a3",
  "-each",
  "name_de = group_name, name_en = group_name",
  "-simplify",
  "10%",
  "keep-shapes",
  "-o",
  "format=geojson",
  euSource,
]);

const worldRegionsSource = path.join(GENERATED, "world-regions-raw.geojson");
runMapshaper(
  regionsRaw,
  "adm0_a3 != 'ATA'",
  worldRegionsSource,
);

const specialRegionCountries = new Set([
  "DE",
  "AT",
  "CH",
  "FR",
  "IT",
  "ES",
  "PL",
  "NL",
]);

const dachRegions = readJson(dachSource);
const euRegions = readJson(euSource);
const worldRegions = readJson(worldRegionsSource);

function normalizeRegion(feature: Json): Json | null {
  const p = feature.properties;
  const country = REGION_COUNTRY[p.adm0_a3] ?? CODE_BY_A3[p.adm0_a3];
  if (!country) return null;

  const box = bbox(feature as any);
  if (!box.every((value: number) => Number.isFinite(value))) return null;

  const code = String(
    p.iso_3166_2 ??
      p.group_code ??
      p.region_cod ??
      p.adm1_code ??
      "",
  ).trim();
  const nameDe = String(
    p.name_de || p.group_name || p.region || p.name || "",
  ).trim();
  const nameEn = String(
    p.name_en || p.group_name || p.region || p.name || "",
  ).trim();
  if (!code || !nameDe) return null;

  const label = regionLabelFor(country, p.type_en ?? null);
  const isAutonomousCity =
    country === "ES" && (nameDe === "Ceuta" || nameDe === "Melilla");

  return {
    type: "Feature",
    properties: {
      code,
      name_de: nameDe,
      name_en: nameEn || nameDe,
      country,
      type: isAutonomousCity ? "Autonome Stadt" : label.label,
      center: [
        round((box[0] + box[2]) / 2),
        round((box[1] + box[3]) / 2),
      ],
      area_km2: Math.max(
        1,
        Math.round(area(feature as any) / 1_000_000),
      ),
      bbox: box.map((value: number) => round(value)),
      wikidata: p.wikidataid ?? null,
    },
    geometry: feature.geometry,
  };
}

const specialFeatures = [...dachRegions.features, ...euRegions.features]
  .map(normalizeRegion)
  .filter(Boolean) as Json[];

/**
 * The DACH and FR/IT/ES/PL/NL files already contain the hand-checked
 * first-level regions. Raw admin-1 is only used for all other countries.
 */
const worldOnlyFeatures = worldRegions.features
  .filter((feature: Json) => {
    const country =
      REGION_COUNTRY[feature.properties.adm0_a3] ??
      CODE_BY_A3[feature.properties.adm0_a3];
    return country && !specialRegionCountries.has(country);
  })
  .map(normalizeRegion)
  .filter(Boolean) as Json[];

const regionByCode = new Map<string, Json>();
for (const feature of [...specialFeatures, ...worldOnlyFeatures]) {
  const code = feature.properties.code;
  if (!regionByCode.has(code)) regionByCode.set(code, feature);
}

const uniqueRegions = [...regionByCode.values()];

const regionCounts: Record<string, number> = {};
const regionTypeCounts: Record<string, Record<string, number>> = {};
for (const feature of uniqueRegions) {
  const country = feature.properties.country;
  regionCounts[country] = (regionCounts[country] ?? 0) + 1;
  regionTypeCounts[country] ??= {};
  const type = feature.properties.type;
  regionTypeCounts[country][type] =
    (regionTypeCounts[country][type] ?? 0) + 1;
}
const regionTypeByCountry: Record<string, string | null> = {};
for (const [country, counts] of Object.entries(regionTypeCounts)) {
  regionTypeByCountry[country] = Object.entries(counts).sort(
    (a, b) => b[1] - a[1],
  )[0]?.[0] ?? null;
}

const regions = {
  type: "FeatureCollection",
  features: uniqueRegions,
};
const regionsFile = path.join(OUT, "maps", "world-regions.geojson");
fs.writeFileSync(regionsFile, JSON.stringify(regions), "utf8");
const oldRegionsFile = path.join(OUT, "maps", "europe-regions.geojson");
if (fs.existsSync(oldRegionsFile)) fs.rmSync(oldRegionsFile);
const oldDachFile = path.join(OUT, "maps", "dach-regions.geojson");
if (fs.existsSync(oldDachFile)) fs.rmSync(oldDachFile);

// --- Country dataset ------------------------------------------------------

const countryFeatures = countriesSource.features.filter((feature: Json) =>
  isIncludedCountry(feature.properties),
);
console.log(
  `Playable filter: ${countryFeatures.length}/${countriesSource.features.length}`,
);

const playableCountries = countryFeatures
  .map((feature: Json) => {
    const p = feature.properties;
    const code = countryCode(p);
    const box = bbox(feature as any).map((value: number) => round(value));
    const center = [round(p.LABEL_X), round(p.LABEL_Y)] as [number, number];
    const focus = focusBBox(feature, center);
    const rawAreaKm2 = area(feature as any) / 1_000_000;
    const geometryAreaKm2 =
      rawAreaKm2 < 10
        ? Number(rawAreaKm2.toFixed(2))
        : Math.round(rawAreaKm2);
    const ref = reference?.countries?.[code] ?? null;
    const areaKm2 =
      typeof ref?.area_km2 === "number"
        ? ref.area_km2 < 10
          ? Number(ref.area_km2.toFixed(2))
          : Math.round(ref.area_km2)
        : geometryAreaKm2;
    const population =
      ref?.population ?? ref?.ne_population ?? p.POP_EST ?? null;
    const populationYear =
      ref?.population_year ??
      ref?.ne_population_year ??
      p.POP_YEAR ??
      null;
    const capitalBase =
      capitals.get(code) ??
      capitalsByIso3.get(p.ADM0_A3) ??
      CAPITAL_OVERRIDE[code] ??
      null;
    const capital = capitalBase
      ? {
          ...capitalBase,
          name_de: ref?.capital ?? capitalBase.name_de,
          name_en: capitalBase.name_en ?? ref?.capital ?? capitalBase.name_de,
        }
      : null;

    const fieldLabel = regionLabelFor(
      code,
      regionTypeByCountry[code] ?? null,
    );

    const regionCount = regionCounts[code] ?? 0;
    const hasRegions = regionCount >= 2;

    const flagCode = FLAG_ALIAS[p.ADM0_A3] ?? code.toLowerCase();
    const localFlag = path.join(
      ROOT,
      "public",
      "flags",
      `${flagCode}.svg`,
    );
    const flagUrl = fs.existsSync(localFlag)
      ? `/flags/${flagCode}.svg`
      : `https://flagcdn.com/w80/${flagCode}.png`;

    const baseName = NAME_OVERRIDE[code] ?? p.NAME_DE ?? p.NAME;
    const cases = NAME_CASES[code] ?? {
      von: `von ${baseName}`,
      in: `in ${baseName}`,
      acc: baseName,
    };

    return {
      code,
      iso3: p.ADM0_A3,
      name: {
        de: baseName,
        en: p.NAME_EN || p.NAME,
      },
      continent: CONTINENT_MAP[p.CONTINENT],
      capital,
      population,
      population_year: populationYear,
      area_km2: areaKm2,
      area_year: ref?.area_year ?? null,
      highest_point: ref?.highest_point ?? null,
      bbox: box,
      focus_bbox: focus,
      center,
      flag: flagEmoji(code),
      flag_url: flagUrl,
      wikidata: ref?.wikidata ?? p.WIKIDATAID ?? null,
      mapcolor: p.MAPCOLOR9 ?? 1,
      has_regions: hasRegions,
      region_label: hasRegions ? fieldLabel.label : null,
      region_plural: hasRegions ? fieldLabel.plural : null,
      regions_map: hasRegions
        ? "/data/maps/world-regions.geojson"
        : null,
      map: "/data/maps/world.geojson",
      name_von: cases.von,
      name_in: cases.in,
      name_acc: cases.acc,
    };
  })
  .sort((a: Json, b: Json) => a.name.de.localeCompare(b.name.de, "de"));

const missingCapitals = playableCountries
  .filter((country: Json) => !country.capital)
  .map((country: Json) => `${country.code} ${country.name.de}`);

const continents = Object.entries(CONTINENT_NAMES)
  .map(([id, name]) => ({
    id,
    name,
    country_count: playableCountries.filter(
      (country: Json) => country.continent === id,
    ).length,
    bbox: CONTINENT_BBOX[id],
  }))
  .filter((continent) => continent.country_count > 0);

const dataset = {
  version: 1,
  generated_at: new Date().toISOString(),
  source: "Natural Earth 1:10m (public domain)",
  continents,
  countries: playableCountries,
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(
  path.join(OUT, "countries.json"),
  `${JSON.stringify(dataset, null, 2)}\n`,
  "utf8",
);

// --- Generate and normalize the world GeoJSON that the app loads ----------

const worldSource = path.join(GENERATED, "world.geojson");
runMapshaperArgs([
  path.join(RAW, "ne_10m_admin_0_countries.geojson"),
  "-filter",
  "CONTINENT != 'Antarctica' && CONTINENT != 'Seven seas (open ocean)'",
  "-simplify",
  "10%",
  "keep-shapes",
  "-o",
  "format=geojson",
  worldSource,
]);
const worldMap = readJson(worldSource);
worldMap.features = worldMap.features
  .filter((feature: Json) => {
    const p = feature.properties;
    return (
      p.CONTINENT !== "Antarctica" &&
      p.CONTINENT !== "Seven seas (open ocean)"
    );
  })
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
        continent: CONTINENT_MAP[p.CONTINENT] ?? "other",
        playable: isIncludedCountry(p),
        has_regions: (regionCounts[code] ?? 0) >= 2,
      },
      geometry: feature.geometry,
    };
  });
const worldMapFile = path.join(OUT, "maps", "world.geojson");
fs.writeFileSync(worldMapFile, JSON.stringify(worldMap), "utf8");
const europeMapFile = path.join(OUT, "maps", "europe.geojson");
if (fs.existsSync(europeMapFile)) fs.rmSync(europeMapFile);

console.log(
  `Wrote ${playableCountries.length} countries to public/data/countries.json`,
);
console.log(
  `Normalized ${worldMap.features.length} country shapes and ${regions.features.length} regions`,
);
console.log(
  `Regions map: ${(fs.statSync(regionsFile).size / 1024 / 1024).toFixed(2)} MB; world map: ${(fs.statSync(worldMapFile).size / 1024 / 1024).toFixed(2)} MB`,
);
if (missingCapitals.length) {
  console.warn(`Missing capitals for: ${missingCapitals.join(", ")}`);
}
