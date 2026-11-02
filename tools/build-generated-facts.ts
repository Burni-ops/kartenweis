import fs from "node:fs";
import path from "node:path";
import area from "@turf/area";
import bbox from "@turf/bbox";
import booleanIntersects from "@turf/boolean-intersects";
import length from "@turf/length";
import { mulberry32, sample, shuffle } from "../src/game/random";

const ROOT = process.cwd();
const readJson = (file: string) =>
  JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));

const countries = readJson("public/data/countries.json").countries;
const europe = readJson("public/data/maps/europe.geojson");
const rivers = readJson("data/raw/ne_10m_rivers_lake_centerlines.geojson");
const lakes = readJson("data/raw/ne_10m_lakes.geojson");
const curated = readJson("public/data/facts/europe.json");

const RIVER_DE: Record<string, string> = {
  Rhine: "Rhein",
  Danube: "Donau",
  Vistula: "Weichsel",
  Oder: "Oder",
  Elbe: "Elbe",
  Loire: "Loire",
  Seine: "Seine",
  Rhone: "Rhone",
  Po: "Po",
  Ebro: "Ebro",
  Thames: "Themse",
  Severn: "Severn",
  Trent: "Trent",
  Clyde: "Clyde",
  Meuse: "Maas",
  Scheldt: "Schelde",
  Weser: "Weser",
  Ems: "Ems",
  Neckar: "Neckar",
  Main: "Main",
  Moselle: "Mosel",
  Saone: "Saône",
  Dnieper: "Dnepr",
  Dniester: "Dnister",
  "Southern Bug": "Südlicher Bug",
  Daugava: "Düna",
  Neman: "Memel",
  Vardar: "Vardar",
  Maritsa: "Mariza",
  Struma: "Struma",
  Neretva: "Neretva",
  Sava: "Save",
  Drava: "Drau",
  Tisza: "Theiß",
  Prut: "Pruth",
  Siret: "Sereth",
  Olt: "Olt",
  Arges: "Argeș",
  Kura: "Kura",
  Aras: "Aras",
  Terek: "Terek",
  Kuban: "Kuban",
  Don: "Don",
  Volga: "Wolga",
  Ural: "Ural",
  Pechora: "Petschora",
  "Northern Dvina": "Nördliche Dwina",
  Torne: "Torne älv",
  Kemijoki: "Kemijoki",
  Glomma: "Glomma",
  "Thjórsá": "Þjórsá",
};

const RIVER_OVERRIDES: Record<string, string> = {
  IS: "Þjórsá",
  NO: "Glomma",
};

const EXCLUDED_RIVER_COUNTRIES = new Set(["AL", "ME"]);

const EUROPE_BBOX = [-25, 34, 45, 72];

const DISTRACTOR_RIVERS = [
  "Rhein",
  "Donau",
  "Elbe",
  "Oder",
  "Weichsel",
  "Loire",
  "Seine",
  "Rhone",
  "Po",
  "Ebro",
  "Themse",
  "Severn",
  "Shannon",
  "Glomma",
  "Kemijoki",
  "Duero",
  "Tejo",
  "Maas",
  "Schelde",
  "Weser",
  "Ems",
  "Düna",
  "Memel",
  "Neris",
  "Göta älv",
  "Dalälven",
  "Ångermanälven",
  "Torne älv",
  "Vltava",
  "Main",
  "Mosel",
  "Inn",
  "Trent",
  "Clyde",
  "Garonne",
];

const DISTRACTOR_LAKES = [
  "Bodensee",
  "Genfersee",
  "Gardasee",
  "IJsselmeer",
  "Vänern",
  "Vättern",
  "Mälaren",
  "Ladogasee",
  "Onegasee",
  "Peipussee",
  "Saimaa",
  "Balaton",
  "Lough Neagh",
  "Loch Ness",
  "Mjøsa",
  "Skutarisee",
  "Ohridsee",
  "Prespasee",
  "Lac du Bourget",
  "Lago Maggiore",
  "Comer See",
  "Vierwaldstättersee",
  "Neuenburgersee",
  "Chiemsee",
  "Müritz",
];

const riverName = (feature: any) => {
  const name = feature.properties?.name ?? feature.properties?.name_en;
  return RIVER_DE[name] ?? name;
};

const lakeName = (feature: any) =>
  feature.properties?.name_de ??
  feature.properties?.name ??
  feature.properties?.name_en;

const countryFeatures = new Map<string, any>(
  europe.features.map((feature: any) => [feature.properties.code, feature]),
);

function walkCoordinates(
  coordinates: any,
  callback: (point: [number, number]) => void,
) {
  if (
    Array.isArray(coordinates) &&
    coordinates.length >= 2 &&
    typeof coordinates[0] === "number"
  ) {
    callback(coordinates as [number, number]);
    return;
  }
  if (Array.isArray(coordinates)) {
    for (const child of coordinates) walkCoordinates(child, callback);
  }
}

function bboxOfGeometry(geometry: any): [number, number, number, number] {
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;
  walkCoordinates(geometry.coordinates, ([lon, lat]) => {
    minLon = Math.min(minLon, lon);
    minLat = Math.min(minLat, lat);
    maxLon = Math.max(maxLon, lon);
    maxLat = Math.max(maxLat, lat);
  });
  return [minLon, minLat, maxLon, maxLat].map((value) =>
    Number(value.toFixed(4)),
  ) as [number, number, number, number];
}

function roundCoordinates(coordinates: any, digits = 4): any {
  if (
    Array.isArray(coordinates) &&
    coordinates.length >= 2 &&
    typeof coordinates[0] === "number"
  ) {
    return coordinates.map((value: number) => Number(value.toFixed(digits)));
  }
  return coordinates.map((child: any) => roundCoordinates(child, digits));
}

function representativePoint(feature: any, kind: "line" | "polygon") {
  const box = bboxOfGeometry(feature.geometry);
  if (kind === "polygon") {
    return [
      (box[0] + box[2]) / 2,
      (box[1] + box[3]) / 2,
    ] as [number, number];
  }

  const lines =
    feature.geometry.type === "LineString"
      ? [feature.geometry.coordinates]
      : feature.geometry.coordinates;
  let longest: any[] = [];
  for (const line of lines) {
    if (line.length > longest.length) longest = line;
  }
  return (longest[Math.floor(longest.length / 2)] ?? [
    (box[0] + box[2]) / 2,
    (box[1] + box[3]) / 2,
  ]) as [number, number];
}

function createReveal(
  feature: any,
  kind: "line" | "polygon",
  label: string,
) {
  const labelPoint = representativePoint(feature, kind);
  return {
    kind,
    geometry: {
      type: feature.geometry.type,
      coordinates: roundCoordinates(feature.geometry.coordinates),
    },
    bbox: bboxOfGeometry(feature.geometry),
    labelPoint,
    label,
  };
}

const riverFeatures = rivers.features.filter(
  (feature: any) =>
    feature.properties?.featurecla === "River" && riverName(feature),
);

const lakeFeatures = lakes.features.filter(
  (feature: any) => lakeName(feature),
);

const curatedRiverCountries = new Set(
  curated
    .filter((fact: any) => fact.category === "river")
    .map((fact: any) => fact.country),
);
const curatedLakeCountries = new Set(
  curated
    .filter((fact: any) => fact.category === "lake")
    .map((fact: any) => fact.country),
);

function intersects(
  feature: any,
  countryFeature: any,
): boolean {
  const a = bbox(feature);
  const b = bbox(countryFeature);
  if (a[2] < b[0] || a[0] > b[2] || a[3] < b[1] || a[1] > b[3]) {
    return false;
  }
  return booleanIntersects(feature, countryFeature);
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

const riverPool: string[] = unique(
  riverFeatures
    .filter((feature: any) => {
      const box = bbox(feature);
      return !(
        box[2] < EUROPE_BBOX[0] ||
        box[0] > EUROPE_BBOX[2] ||
        box[3] < EUROPE_BBOX[1] ||
        box[1] > EUROPE_BBOX[3]
      );
    })
    .map((feature: any) => riverName(feature)),
);
const lakePool: string[] = unique(
  lakeFeatures
    .filter((feature: any) => {
      const box = bbox(feature);
      return !(
        box[2] < EUROPE_BBOX[0] ||
        box[0] > EUROPE_BBOX[2] ||
        box[3] < EUROPE_BBOX[1] ||
        box[1] > EUROPE_BBOX[3]
      );
    })
    .map((feature: any) => lakeName(feature)),
);

const generated: any[] = [];
const generatedReveals: Record<string, any> = {};
const stats = { river: 0, lake: 0, skipped: [] as string[] };

for (const country of countries) {
  const countryFeature = countryFeatures.get(country.code);
  if (!countryFeature) continue;
  const rng = mulberry32(
    country.code.split("").reduce((sum: number, char: string) => sum + char.charCodeAt(0), 17),
  );

  if (
    !curatedRiverCountries.has(country.code) &&
    !EXCLUDED_RIVER_COUNTRIES.has(country.code)
  ) {
    const hits = riverFeatures.filter((feature: any) =>
      intersects(feature, countryFeature),
    );
    const uniqueHits = new Map<string, any>();
    for (const feature of hits) {
      const name = riverName(feature);
      if (!name) continue;
      const previous = uniqueHits.get(name);
      if (!previous || length(feature) > length(previous)) {
        uniqueHits.set(name, feature);
      }
    }
    const override = RIVER_OVERRIDES[country.code];
    const correct = override
      ? uniqueHits.has(override)
        ? override
        : undefined
      : [...uniqueHits.entries()].sort(
          (a, b) => length(b[1]) - length(a[1]),
        )[0]?.[0];

    if (correct) {
      const curatedPool = DISTRACTOR_RIVERS.filter(
        (name) => name !== correct && !uniqueHits.has(name),
      );
      const fallbackPool = riverPool.filter(
        (name) => name !== correct && !uniqueHits.has(name),
      );
      const distractors = sample(
        curatedPool.length >= 3 ? curatedPool : fallbackPool,
        3,
        rng,
      );
      if (distractors.length === 3) {
        const factId = `gen-river-${country.code}`;
        const feature = uniqueHits.get(correct);
        const answerPoint = feature
          ? representativePoint(feature, "line")
          : null;
        generated.push({
          id: factId,
          country: country.code,
          category: "river",
          interactions: ["mc"],
          difficulty: 2,
          question: `Welcher dieser Flüsse fließt durch ${country.name.de}?`,
          answer: {
            label: correct,
            ...(answerPoint ? { point: answerPoint } : {}),
          },
          options: shuffle([correct, ...distractors], rng),
          fact: `${correct} fließt durch ${country.name.de}.`,
          source: "https://www.naturalearthdata.com/",
        });
        if (feature?.geometry) {
          generatedReveals[factId] = createReveal(
            feature,
            "line",
            correct,
          );
        }
        stats.river += 1;
      } else {
        stats.skipped.push(`${country.code} river`);
      }
    }
  }

  if (!curatedLakeCountries.has(country.code)) {
    const hits = lakeFeatures.filter((feature: any) =>
      intersects(feature, countryFeature),
    );
    const uniqueHits = new Map<string, any>();
    for (const feature of hits) {
      const name = lakeName(feature);
      if (!name) continue;
      const previous = uniqueHits.get(name);
      if (!previous || area(feature) > area(previous)) {
        uniqueHits.set(name, feature);
      }
    }
    const correct = [...uniqueHits.entries()].sort(
      (a, b) => area(b[1]) - area(a[1]),
    )[0]?.[0];

    if (correct) {
      const curatedPool = DISTRACTOR_LAKES.filter(
        (name) => name !== correct && !uniqueHits.has(name),
      );
      const fallbackPool = lakePool.filter(
        (name) => name !== correct && !uniqueHits.has(name),
      );
      const distractors = sample(
        curatedPool.length >= 3 ? curatedPool : fallbackPool,
        3,
        rng,
      );
      if (distractors.length === 3) {
        const factId = `gen-lake-${country.code}`;
        const feature = uniqueHits.get(correct);
        const answerPoint = feature
          ? representativePoint(feature, "polygon")
          : null;
        generated.push({
          id: factId,
          country: country.code,
          category: "lake",
          interactions: ["mc"],
          difficulty: 2,
          question: `Welcher dieser Seen liegt in ${country.name.de}?`,
          answer: {
            label: correct,
            ...(answerPoint ? { point: answerPoint } : {}),
          },
          options: shuffle([correct, ...distractors], rng),
          fact: `${correct} liegt in ${country.name.de}.`,
          source: "https://www.naturalearthdata.com/",
        });
        if (feature?.geometry) {
          generatedReveals[factId] = createReveal(
            feature,
            "polygon",
            correct,
          );
        }
        stats.lake += 1;
      } else {
        stats.skipped.push(`${country.code} lake`);
      }
    }
  }
}

const outFile = path.join(ROOT, "public/data/facts/generated.json");
fs.writeFileSync(
  outFile,
  `${JSON.stringify(generated, null, 2)}\n`,
);

const revealsFile = path.join(
  ROOT,
  "public/data/reveals/generated.json",
);
fs.mkdirSync(path.dirname(revealsFile), { recursive: true });
fs.writeFileSync(
  revealsFile,
  `${JSON.stringify(generatedReveals, null, 2)}\n`,
);

console.log(
  `Wrote ${generated.length} generated facts (${stats.river} rivers, ${stats.lake} lakes) to public/data/facts/generated.json`,
);
console.log(
  `Wrote ${Object.keys(generatedReveals).length} generated map reveals to public/data/reveals/generated.json`,
);
if (stats.skipped.length) {
  console.log(`Skipped: ${stats.skipped.join(", ")}`);
}
