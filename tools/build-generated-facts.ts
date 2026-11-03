import fs from "node:fs";
import path from "node:path";
import area from "@turf/area";
import bbox from "@turf/bbox";
import booleanIntersects from "@turf/boolean-intersects";
import intersect from "@turf/intersect";
import length from "@turf/length";
import { mulberry32, sample, shuffle } from "../src/game/random";

const ROOT = process.cwd();
const readJson = (file: string) =>
  JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));

const dataset = readJson("public/data/countries.json");
const countries = dataset.countries as any[];
const countryByCode = new Map<string, any>(
  countries.map((country) => [country.code, country]),
);
const world = readJson("public/data/maps/world.geojson");
const rivers = readJson("data/raw/ne_10m_rivers_lake_centerlines.geojson");
const lakes = readJson("data/raw/ne_10m_lakes.geojson");
const marine = readJson(
  "data/raw/ne_10m_geography_marine_polys.geojson",
);
const places = readJson("data/raw/ne_10m_populated_places.geojson");
const curated = readJson("public/data/facts/europe.json") as any[];
const extrasFile = path.join(ROOT, "data/reference/world-extras.json");
const extras = fs.existsSync(extrasFile) ? readJson(
  "data/reference/world-extras.json",
) : null;
const landformFile = path.join(
  ROOT,
  "data/raw/ne_10m_geography_regions_polys.geojson",
);
const landforms = fs.existsSync(landformFile)
  ? readJson("data/raw/ne_10m_geography_regions_polys.geojson")
  : { features: [] };

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
  Amazon: "Amazonas",
  "Amazonas": "Amazonas",
  Nile: "Nil",
  Ganges: "Ganges",
  Brahmaputra: "Brahmaputra",
  Indus: "Indus",
  Mekong: "Mekong",
  Yangtze: "Jangtse",
  "Huang He": "Gelber Fluss",
  Huang: "Gelber Fluss",
  "Yellow": "Gelber Fluss",
  Ob: "Ob",
  Yenisey: "Jenissei",
  Lena: "Lena",
  Amur: "Amur",
  Congo: "Kongo",
  Niger: "Niger",
  Zambezi: "Sambesi",
  Murray: "Murray",
  Darling: "Darling",
  Mississippi: "Mississippi",
  Missouri: "Missouri",
  Colorado: "Colorado",
  Orinoco: "Orinoco",
  Parana: "Paraná",
  "Paraná": "Paraná",
  Yukon: "Yukon",
  Mackenzie: "Mackenzie",
  Columbia: "Columbia",
  "Sao Francisco": "São Francisco",
  "São Francisco": "São Francisco",
  Euphrates: "Euphrat",
  Tigris: "Tigris",
  SyrDarya: "Syrdarja",
  "Syr Darya": "Syrdarja",
  AmuDarya: "Amudarja",
  "Amu Darya": "Amudarja",
  Irtysh: "Irtysch",
  Angara: "Angara",
  Aldan: "Aldan",
  Kolyma: "Kolyma",
  Indigirka: "Indigirka",
  Yana: "Jana",
  Khatanga: "Chatanga",
  Olenyok: "Oljonjok",
  Anadyr: "Anadyr",
  Dnieper2: "Dnepr",
};

const RIVER_OVERRIDES: Record<string, string> = {
  IS: "Þjórsá",
  NO: "Glomma",
};

const EXCLUDED_RIVER_COUNTRIES = new Set<string>([]);

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
  "Amazonas",
  "Nil",
  "Ganges",
  "Brahmaputra",
  "Indus",
  "Mekong",
  "Jangtse",
  "Gelber Fluss",
  "Ob",
  "Jenissei",
  "Lena",
  "Amur",
  "Kongo",
  "Niger",
  "Sambesi",
  "Murray",
  "Darling",
  "Mississippi",
  "Missouri",
  "Colorado",
  "Orinoco",
  "Paraná",
  "Yukon",
  "Mackenzie",
  "Euphrat",
  "Tigris",
  "Syrdarja",
  "Amudarja",
  "Irtysch",
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
  "Victoriasee",
  "Tanganjikasee",
  "Malawisee",
  "Tschadsee",
  "Baikalsee",
  "Großer Bärensee",
  "Großer Sklavensee",
  "Oberer See",
  "Huronsee",
  "Michigansee",
  "Eriesee",
  "Ontariosee",
  "Titicacasee",
  "Großer Salzsee",
  "Tobasee",
  "Aralsee",
  "Kaspisches Meer",
];

const CONTINENT_BBOX: Record<string, [number, number, number, number]> = {
  europe: [-25, 34, 45, 72],
  asia: [-10, 5, 150, 80],
  africa: [-20, -35, 55, 38],
  "north-america": [-170, 7, -50, 75],
  "south-america": [-82, -56, -34, 13],
  oceania: [110, -50, 180, 0],
};

const riverName = (feature: any) => {
  const name = feature.properties?.name ?? feature.properties?.name_en;
  return RIVER_DE[name] ?? name;
};

const LAKE_NAME_OVERRIDE: Record<string, string> = {
  Abbe: "Abbe-See",
  Alaotra: "Alaotra-See",
  Bay: "Laguna de Bay",
  Biwa: "Biwa-See",
  "Buenos Aires / General Carrera": "General-Carrera-See",
  Débo: "Débo-See",
  Derg: "Lough Derg",
  Enriquillo: "Enriquillosee",
  Izabal: "Izabal-See",
  Oberer: "Oberer See",
  Taupo: "Lake Taupō",
  Tharthar: "Tharthar-See",
  Turkana: "Turkana-See",
};

const lakeName = (feature: any) => {
  const name =
    feature.properties?.name_de ??
    feature.properties?.name ??
    feature.properties?.name_en;
  if (!name) return null;
  return LAKE_NAME_OVERRIDE[name] ?? name;
};

const marineName = (feature: any) =>
  feature.properties?.name_de ??
  feature.properties?.name_en ??
  feature.properties?.name ??
  null;

const landformName = (feature: any) =>
  feature.properties?.NAME_DE ??
  feature.properties?.NAME ??
  feature.properties?.NAME_EN ??
  null;

const LANDFORM_CATEGORIES = {
  desert: "Desert",
  mountain_range: "Range/mtn",
  island: "Island",
  peninsula: "Peninsula",
} as const;

const landformFeatures = landforms.features.filter((feature: any) =>
  Object.values(LANDFORM_CATEGORIES).includes(feature.properties?.FEATURECLA),
);
const landformPoolByCategory = new Map<string, string[]>();
for (const [category, featurecla] of Object.entries(LANDFORM_CATEGORIES)) {
  landformPoolByCategory.set(
    category,
    unique(
      landformFeatures
        .filter((feature: any) => feature.properties.FEATURECLA === featurecla)
        .map(landformName)
        .filter(Boolean) as string[],
    ),
  );
}

const countryFeatureByCode = new Map<string, any>();
for (const feature of world.features) {
  const code = feature.properties.code;
  if (countryByCode.has(code) && !countryFeatureByCode.has(code)) {
    countryFeatureByCode.set(code, feature);
  }
}

function intersects(a: any, b: any): boolean {
  const ab = bbox(a);
  const bb = bbox(b);
  if (ab[2] < bb[0] || ab[0] > bb[2] || ab[3] < bb[1] || ab[1] > bb[3]) {
    return false;
  }
  return booleanIntersects(a, b);
}

function roundCoordinates(coordinates: any, digits = 2): any {
  if (
    Array.isArray(coordinates) &&
    coordinates.length >= 2 &&
    typeof coordinates[0] === "number"
  ) {
    return coordinates.map((value: number) => Number(value.toFixed(digits)));
  }
  return coordinates.map((child: any) => roundCoordinates(child, digits));
}

function clipSegmentToBox(
  a: [number, number],
  b: [number, number],
  box: [number, number, number, number],
): [[number, number], [number, number]] | null {
  let [x1, y1] = a;
  let [x2, y2] = b;
  const [minX, minY, maxX, maxY] = box;
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - minX, maxX - x1, y1 - minY, maxY - y1];
  for (let index = 0; index < 4; index += 1) {
    if (p[index] === 0) {
      if (q[index] < 0) return null;
    } else {
      const r = q[index] / p[index];
      if (p[index] < 0) {
        if (r > t1) return null;
        if (r > t0) t0 = r;
      } else {
        if (r < t0) return null;
        if (r < t1) t1 = r;
      }
    }
  }
  return [
    [x1 + t0 * dx, y1 + t0 * dy],
    [x1 + t1 * dx, y1 + t1 * dy],
  ];
}

function clipLineToBox(
  feature: any,
  box: [number, number, number, number],
) {
  const lines =
    feature.geometry.type === "LineString"
      ? [feature.geometry.coordinates]
      : feature.geometry.coordinates;
  const result: any[][] = [];
  for (const line of lines) {
    let current: any[] = [];
    for (let index = 0; index < line.length - 1; index += 1) {
      const segment = clipSegmentToBox(line[index], line[index + 1], box);
      if (segment) {
        if (current.length === 0) {
          current = [segment[0], segment[1]];
        } else {
          const last = current[current.length - 1];
          const continuous =
            Math.abs(last[0] - segment[0][0]) < 1e-7 &&
            Math.abs(last[1] - segment[0][1]) < 1e-7;
          if (continuous) {
            current.push(segment[1]);
          } else {
            if (current.length > 1) result.push(current);
            current = [segment[0], segment[1]];
          }
        }
      } else if (current.length > 1) {
        result.push(current);
        current = [];
      } else {
        current = [];
      }
    }
    if (current.length > 1) result.push(current);
  }
  if (result.length === 0) return feature.geometry;
  if (result.length === 1) {
    return { type: "LineString" as const, coordinates: result[0] };
  }
  return { type: "MultiLineString" as const, coordinates: result };
}

function boxPolygon(box: [number, number, number, number]) {
  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "Polygon" as const,
      coordinates: [
        [
          [box[0], box[1]],
          [box[2], box[1]],
          [box[2], box[3]],
          [box[0], box[3]],
          [box[0], box[1]],
        ],
      ],
    },
  };
}

function revealFromGeometry(
  geometry: any,
  label: string,
  kind: "line" | "polygon",
) {
  const feature = {
    type: "Feature" as const,
    properties: {},
    geometry,
  };
  const box = bbox(feature as any) as [number, number, number, number];
  return {
    kind,
    geometry: {
      type: geometry.type,
      coordinates: roundCoordinates(geometry.coordinates),
    },
    bbox: box.map((value: number) => Number(value.toFixed(4))),
    labelPoint: [(box[0] + box[2]) / 2, (box[1] + box[3]) / 2],
    label,
  };
}

function createLineReveal(
  feature: any,
  label: string,
  box: [number, number, number, number],
) {
  return revealFromGeometry(clipLineToBox(feature, box), label, "line");
}

function createPolygonReveal(
  feature: any,
  label: string,
  box: [number, number, number, number],
) {
  try {
    const clipped = intersect(feature, boxPolygon(box));
    if (clipped?.geometry) {
      return revealFromGeometry(clipped.geometry, label, "polygon");
    }
  } catch {
    // Fall back to the uncapped geometry below.
  }
  return revealFromGeometry(feature.geometry, label, "polygon");
}

function representativePoint(feature: any, kind: "line" | "polygon") {
  const box = bbox(feature);
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

const curatedRiverCountries = new Set(
  curated
    .filter((fact) => fact.category === "river")
    .map((fact) => fact.country),
);
const curatedLakeCountries = new Set(
  curated
    .filter((fact) => fact.category === "lake")
    .map((fact) => fact.country),
);
const curatedSeaCountries = new Set(
  curated
    .filter((fact) => fact.category === "sea")
    .map((fact) => fact.country),
);
const curatedStraitCountries = new Set(
  curated
    .filter((fact) => fact.category === "strait")
    .map((fact) => fact.country),
);
const curatedCityCountries = new Set(
  curated
    .filter((fact) => fact.category === "city")
    .map((fact) => fact.country),
);
const curatedNeighborCountries = new Set(
  curated
    .filter((fact) => fact.category === "neighbor")
    .map((fact) => fact.country),
);

const riverFeatures = rivers.features.filter(
  (feature: any) =>
    feature.properties?.featurecla === "River" && riverName(feature),
);
const lakeFeatures = lakes.features.filter(
  (feature: any) => lakeName(feature),
);
const marineFeatures = marine.features.filter((feature: any) => {
  const type = feature.properties?.featurecla;
  return (
    ["ocean", "sea", "gulf", "bay", "strait", "channel", "sound"].includes(
      type,
    ) && marineName(feature)
  );
});

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

const riverPoolByContinent = new Map<string, string[]>();
const lakePoolByContinent = new Map<string, string[]>();
const seaPoolByContinent = new Map<string, string[]>();
const straitPoolByContinent = new Map<string, string[]>();

function inBBox(box: number[], region: number[]): boolean {
  return !(
    box[2] < region[0] ||
    box[0] > region[2] ||
    box[3] < region[1] ||
    box[1] > region[3]
  );
}

for (const [continent, region] of Object.entries(CONTINENT_BBOX)) {
  riverPoolByContinent.set(
    continent,
    unique(
      riverFeatures
        .filter((feature: any) => inBBox(bbox(feature), region))
        .map((feature: any) => riverName(feature)),
    ),
  );
  lakePoolByContinent.set(
    continent,
    unique(
      lakeFeatures
        .filter((feature: any) => inBBox(bbox(feature), region))
        .map((feature: any) => lakeName(feature))
        .filter(Boolean) as string[],
    ),
  );
  const continentalMarine = marineFeatures.filter((feature: any) =>
    inBBox(bbox(feature), region),
  );
  seaPoolByContinent.set(
    continent,
    unique(
      continentalMarine
        .filter((feature: any) =>
          ["ocean", "sea", "gulf", "bay"].includes(
            feature.properties.featurecla,
          ),
        )
        .map((feature: any) => marineName(feature))
        .filter(Boolean) as string[],
    ),
  );
  straitPoolByContinent.set(
    continent,
    unique(
      continentalMarine
        .filter((feature: any) =>
          ["strait", "channel", "sound"].includes(
            feature.properties.featurecla,
          ),
        )
        .map((feature: any) => marineName(feature))
        .filter(Boolean) as string[],
    ),
  );
}

// --- Places by country ----------------------------------------------------

const CODE_BY_ISO3 = new Map<string, string>(
  countries.map((country) => [country.iso3, country.code]),
);

const placesByCountry = new Map<string, any[]>();
for (const place of places.features) {
  const p = place.properties;
  const code =
    p.ISO_A2 && p.ISO_A2 !== "-99"
      ? p.ISO_A2
      : CODE_BY_ISO3.get(p.ADM0_A3);
  if (!code || !countryByCode.has(code)) continue;
  const bucket = placesByCountry.get(code);
  if (bucket) bucket.push(place);
  else placesByCountry.set(code, [place]);
}

const CITY_OVERRIDE: Record<string, string> = {
  // Natural Earth's POP_MIN ranking puts Durban ahead of Johannesburg.
  ZA: "Johannesburg",
};

const largestCityByCountry = new Map<string, any>();
for (const [code, list] of placesByCountry) {
  const country = countryByCode.get(code);
  const populationOf = (place: any) =>
    place.properties.POP_MIN ?? place.properties.POP_MAX ?? 0;
  const sorted = [...list]
    .filter((place) => populationOf(place) > 0)
    .sort((a, b) => populationOf(b) - populationOf(a));

  const insideFocus = (place: any) => {
    const [lon, lat] = [
      place.properties.LONGITUDE,
      place.properties.LATITUDE,
    ];
    const box = country.focus_bbox;
    return lon >= box[0] && lon <= box[2] && lat >= box[1] && lat <= box[3];
  };

  const override = CITY_OVERRIDE[code];
  const overridden = override
    ? sorted.find(
        (place) =>
          place.properties.NAME_DE === override ||
          place.properties.NAME === override,
      )
    : null;
  const best = overridden ?? sorted.find(insideFocus) ?? sorted[0];
  if (best) largestCityByCountry.set(code, best);
}

const cityPoolByContinent = new Map<string, string[]>();
for (const continent of Object.keys(CONTINENT_BBOX)) {
  cityPoolByContinent.set(
    continent,
    unique(
      countries
        .filter((country) => country.continent === continent)
        .flatMap((country) =>
          (placesByCountry.get(country.code) ?? [])
            .filter((place) => (place.properties.POP_MAX ?? 0) >= 200_000)
            .map((place) => place.properties.NAME_DE || place.properties.NAME),
        )
        .filter(Boolean),
    ),
  );
}

// --- Neighbor adjacency ---------------------------------------------------

const neighborByCountry = new Map<string, string[]>();
const worldFeatures = world.features.filter((feature: any) =>
  countryByCode.has(feature.properties.code),
);

for (const country of countries) {
  const feature = countryFeatureByCode.get(country.code);
  if (!feature) continue;
  const focus = country.focus_bbox;
  const padded = [focus[0] - 1.5, focus[1] - 1.5, focus[2] + 1.5, focus[3] + 1.5];
  const neighbors: Array<{ code: string; distance: number }> = [];

  for (const other of worldFeatures) {
    const code = other.properties.code;
    if (code === country.code) continue;
    if (!inBBox(bbox(other), padded)) continue;
    if (!intersects(feature, other)) continue;
    const otherCountry = countryByCode.get(code);
    if (!otherCountry) continue;
    const dx = otherCountry.center[0] - country.center[0];
    const dy = otherCountry.center[1] - country.center[1];
    neighbors.push({ code, distance: Math.hypot(dx, dy) });
  }

  neighborByCountry.set(
    country.code,
    unique(
      neighbors
        .sort((a, b) => a.distance - b.distance)
        .map((neighbor) => neighbor.code),
    ),
  );
}

// --- Marine adjacency ----------------------------------------------------

const seaByCountry = new Map<string, any>();
const straitByCountry = new Map<string, any>();

for (const country of countries) {
  const feature = countryFeatureByCode.get(country.code);
  if (!feature) continue;
  const focus = country.focus_bbox;
  const padded: [number, number, number, number] = [
    focus[0] - 4,
    focus[1] - 4,
    focus[2] + 4,
    focus[3] + 4,
  ];
  const focusPolygon = boxPolygon(padded);

  const hits = marineFeatures.filter((candidate: any) => {
    if (!inBBox(bbox(candidate), padded)) return false;
    if (!booleanIntersects(candidate, focusPolygon)) return false;
    return intersects(feature, candidate);
  });

  const seas = hits.filter((candidate: any) =>
    ["sea", "gulf", "bay", "ocean"].includes(
      candidate.properties.featurecla,
    ),
  );
  const straits = hits.filter((candidate: any) => {
    const type = candidate.properties.featurecla;
    if (!["strait", "channel"].includes(type)) return false;
    const name = marineName(candidate) ?? "";
    return !/^(Canal|Seno|Sound|Dixon Entrance|Sankt-Lorenz-Strom)/i.test(
      name,
    );
  });

  const seaRank = (type: string) => (type === "ocean" ? 1 : 0);
  const bestSea = [...seas].sort((a, b) => {
    const rank =
      seaRank(a.properties.featurecla) - seaRank(b.properties.featurecla);
    if (rank !== 0) return rank;
    return area(b) - area(a);
  })[0];
  const straitRank = (type: string) =>
    ({ strait: 0, channel: 1 })[type] ?? 9;
  const bestStrait = [...straits].sort((a, b) => {
    const rank =
      straitRank(a.properties.featurecla) -
      straitRank(b.properties.featurecla);
    if (rank !== 0) return rank;
    return area(b) - area(a);
  })[0];
  if (bestSea) seaByCountry.set(country.code, bestSea);
  if (bestStrait) straitByCountry.set(country.code, bestStrait);
}

// --- Generate facts -------------------------------------------------------

const generated: any[] = [];
const generatedReveals: Record<string, any> = {};
const stats: Record<string, number> = {};
const skipped: string[] = [];

function count(key: string) {
  stats[key] = (stats[key] ?? 0) + 1;
}

function seedFor(code: string, salt: string): number {
  return [...`${code}:${salt}`].reduce(
    (sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0,
    7,
  );
}

function addFact(fact: any) {
  generated.push(fact);
  count(fact.category);
}

function distractors(
  answer: string,
  pool: string[],
  rng: () => number,
  count = 4,
): string[] {
  const candidates = unique(pool).filter(
    (value) => value !== answer && value.length > 0,
  );
  const picked = sample(candidates, count - 1, rng);
  return shuffle([answer, ...picked], rng);
}

for (const country of countries) {
  const code = country.code;
  const continent = country.continent;
  const rng = mulberry32(seedFor(code, "facts"));
  const feature = countryFeatureByCode.get(code);

  // River ----------------------------------------------------------------
  if (feature && !curatedRiverCountries.has(code) && !EXCLUDED_RIVER_COUNTRIES.has(code)) {
    const hits = riverFeatures.filter((candidate: any) =>
      intersects(feature, candidate),
    );
    const uniqueHits = new Map<string, any>();
    for (const hit of hits) {
      const name = riverName(hit);
      if (!name) continue;
      const previous = uniqueHits.get(name);
      if (!previous || length(hit) > length(previous)) {
        uniqueHits.set(name, hit);
      }
    }
    const override = RIVER_OVERRIDES[code];
    const correct = override
      ? uniqueHits.has(override)
        ? override
        : undefined
      : [...uniqueHits.entries()].sort(
          (a, b) => length(b[1]) - length(a[1]),
        )[0]?.[0];

    if (correct) {
      const continentPool =
        riverPoolByContinent.get(continent) ?? [];
      const pool = unique([
        ...(continent === "europe" ? DISTRACTOR_RIVERS : []),
        ...continentPool,
      ]).filter((name) => !uniqueHits.has(name));
      const options = distractors(correct, pool, rng);
      if (options.length === 4) {
        const factId = `gen-river-${code}`;
        const riverFeature = uniqueHits.get(correct);
        const answerPoint = riverFeature
          ? representativePoint(riverFeature, "line")
          : null;
        addFact({
          id: factId,
          country: code,
          category: "river",
          interactions: ["mc"],
          difficulty: 2,
          question: `Welcher dieser Flüsse fließt durch ${country.name_acc}?`,
          answer: {
            label: correct,
            ...(answerPoint ? { point: answerPoint } : {}),
          },
          options,
          fact: `${correct} fließt durch ${country.name_acc}.`,
          source: "https://www.naturalearthdata.com/",
        });
        if (riverFeature?.geometry) {
          generatedReveals[factId] = createLineReveal(
            riverFeature,
            correct,
            [
              country.focus_bbox[0] - 6,
              country.focus_bbox[1] - 6,
              country.focus_bbox[2] + 6,
              country.focus_bbox[3] + 6,
            ],
          );
        }
      } else {
        skipped.push(`${code} river (distractors)`);
      }
    } else {
      skipped.push(`${code} river`);
    }
  }

  // Lake -----------------------------------------------------------------
  if (feature && !curatedLakeCountries.has(code)) {
    const hits = lakeFeatures.filter((candidate: any) =>
      intersects(feature, candidate),
    );
    const uniqueHits = new Map<string, any>();
    for (const hit of hits) {
      const name = lakeName(hit);
      if (!name) continue;
      const previous = uniqueHits.get(name);
      if (!previous || area(hit) > area(previous)) {
        uniqueHits.set(name, hit);
      }
    }
    const correct = [...uniqueHits.entries()].sort(
      (a, b) => area(b[1]) - area(a[1]),
    )[0]?.[0];

    if (correct) {
      const continentPool = lakePoolByContinent.get(continent) ?? [];
      const pool = unique([
        ...(continent === "europe" ? DISTRACTOR_LAKES : []),
        ...continentPool,
      ]).filter((name) => !uniqueHits.has(name));
      const options = distractors(correct, pool, rng);
      if (options.length === 4) {
        const factId = `gen-lake-${code}`;
        const lakeFeature = uniqueHits.get(correct);
        const answerPoint = lakeFeature
          ? representativePoint(lakeFeature, "polygon")
          : null;
        addFact({
          id: factId,
          country: code,
          category: "lake",
          interactions: ["mc"],
          difficulty: 2,
          question: `Welcher dieser Seen liegt ${country.name_in}?`,
          answer: {
            label: correct,
            ...(answerPoint ? { point: answerPoint } : {}),
          },
          options,
          fact: `${correct} liegt ${country.name_in}.`,
          source: "https://www.naturalearthdata.com/",
        });
        if (lakeFeature?.geometry) {
          generatedReveals[factId] = createPolygonReveal(
            lakeFeature,
            correct,
            [
              country.focus_bbox[0] - 6,
              country.focus_bbox[1] - 6,
              country.focus_bbox[2] + 6,
              country.focus_bbox[3] + 6,
            ],
          );
        }
      } else {
        skipped.push(`${code} lake (distractors)`);
      }
    }
  }

  // Largest city ---------------------------------------------------------
  if (!curatedCityCountries.has(code)) {
    const city = largestCityByCountry.get(code);
    if (city) {
      const name = city.properties.NAME_DE || city.properties.NAME;
      const point = [
        Number(city.properties.LONGITUDE.toFixed(4)),
        Number(city.properties.LATITUDE.toFixed(4)),
      ];
      const continentPool = cityPoolByContinent.get(continent) ?? [];
      const localNames = new Set(
        (placesByCountry.get(code) ?? []).map(
          (place) => place.properties.NAME_DE || place.properties.NAME,
        ),
      );
      const options = distractors(
        name,
        continentPool.filter((cityName) => !localNames.has(cityName)),
        rng,
      );
      if (options.length === 4) {
        const factId = `gen-city-${code}`;
        const population =
          city.properties.POP_MIN ?? city.properties.POP_MAX;
        addFact({
          id: factId,
          country: code,
          category: "city",
          interactions: ["mc"],
          difficulty: 2,
          question: `Welche Stadt ${country.name_in} ist die größte?`,
          answer: { label: name, point },
          options,
          fact:
            population && population > 0
              ? `${name} ist mit rund ${Math.round(population).toLocaleString("de-DE")} Einwohnern die größte Stadt ${country.name_in}.`
              : `${name} ist die größte Stadt ${country.name_in}.`,
          source: "https://www.naturalearthdata.com/",
        });
        generatedReveals[factId] = {
          kind: "point",
          point,
          bbox: [point[0] - 0.25, point[1] - 0.2, point[0] + 0.25, point[1] + 0.2],
          labelPoint: point,
          label: name,
        };
      } else {
        skipped.push(`${code} city (distractors)`);
      }
    }
  }

  // Neighbor -------------------------------------------------------------
  if (!curatedNeighborCountries.has(code)) {
    const neighbors = (neighborByCountry.get(code) ?? []).filter((neighbor) =>
      countryByCode.has(neighbor),
    );
    if (neighbors.length > 0) {
      const chosen = neighbors[0];
      const neighbor = countryByCode.get(chosen);
      const neighborSet = new Set(neighbors);
      const sameContinent = countries
        .filter(
          (other) =>
            other.continent === continent &&
            other.code !== code &&
            !neighborSet.has(other.code),
        )
        .map((other) => other.name.de);
      const options = distractors(
        neighbor.name.de,
        sameContinent.length >= 3
          ? sameContinent
          : countries
              .filter((other) => other.code !== code && !neighborSet.has(other.code))
              .map((other) => other.name.de),
        rng,
      );
      if (options.length === 4) {
        addFact({
          id: `gen-neighbor-${code}`,
          country: code,
          category: "neighbor",
          interactions: ["mc"],
          difficulty: 2,
          question: `Welches Land grenzt an ${country.name_acc}?`,
          answer: { label: neighbor.name.de, countryCode: neighbor.code },
          options,
          fact: `${country.name.de} grenzt an ${neighbor.name.de}.`,
          source: "https://www.naturalearthdata.com/",
        });
      } else {
        skipped.push(`${code} neighbor (distractors)`);
      }
    }
  }

  // Sea ------------------------------------------------------------------
  if (!curatedSeaCountries.has(code)) {
    const sea = seaByCountry.get(code);
    if (sea) {
      const name = marineName(sea);
      const continentPool = seaPoolByContinent.get(continent) ?? [];
      const options = distractors(name, continentPool, rng);
      if (options.length === 4) {
        const factId = `gen-sea-${code}`;
        addFact({
          id: factId,
          country: code,
          category: "sea",
          interactions: ["mc"],
          difficulty: 2,
          question: `Welches Meer grenzt an ${country.name_acc}?`,
          answer: { label: name },
          options,
          fact: `${country.name.de} grenzt an ${name}.`,
          source: "https://www.naturalearthdata.com/",
        });
        generatedReveals[factId] = createPolygonReveal(
          sea,
          name,
          [
            country.focus_bbox[0] - 4,
            country.focus_bbox[1] - 4,
            country.focus_bbox[2] + 4,
            country.focus_bbox[3] + 4,
          ],
        );
      } else {
        skipped.push(`${code} sea (distractors)`);
      }
    }
  }

  // Strait ---------------------------------------------------------------
  if (!curatedStraitCountries.has(code)) {
    const strait = straitByCountry.get(code);
    if (strait) {
      const name = marineName(strait);
      const continentPool = straitPoolByContinent.get(continent) ?? [];
      const globalPool = unique(
        [...straitPoolByContinent.values()].flat(),
      );
      const options = distractors(
        name,
        continentPool.length >= 3 ? continentPool : globalPool,
        rng,
      );
      if (options.length === 4) {
        const factId = `gen-strait-${code}`;
        addFact({
          id: factId,
          country: code,
          category: "strait",
          interactions: ["mc"],
          difficulty: 3,
          question: `Welche Meerenge grenzt an ${country.name_acc}?`,
          answer: { label: name },
          options,
          fact: `${country.name.de} grenzt an ${name}.`,
          source: "https://www.naturalearthdata.com/",
        });
        generatedReveals[factId] = createPolygonReveal(
          strait,
          name,
          [
            country.focus_bbox[0] - 4,
            country.focus_bbox[1] - 4,
            country.focus_bbox[2] + 4,
            country.focus_bbox[3] + 4,
          ],
        );
      } else {
        skipped.push(`${code} strait (distractors)`);
      }
    }
  }

  // Currency -------------------------------------------------------------
  const extra = extras?.countries?.[code];
  const currencies: string[] = (extra?.currencies ?? []).filter(
    (currency: string) =>
      !["Korean mun", "SOV", "Münzen Osttimors", "bosnischer Dinar"].includes(
        currency,
      ),
  );
  if (currencies.length) {
    const label = currencies.join(" und ");
    const currencyPool = unique(
      Object.values(extras.countries).flatMap(
        (entry: any) => entry.currencies ?? [],
      ),
    ).filter(
      (currency) =>
        !currencies.includes(currency) &&
        !["Korean mun", "SOV", "Münzen Osttimors", "bosnischer Dinar"].includes(
          currency,
        ),
    );
    const options = distractors(label, currencyPool, rng);
    if (options.length === 4) {
      addFact({
        id: `gen-currency-${code}`,
        country: code,
        category: "currency",
        interactions: ["mc"],
        difficulty: 2,
        question: `Welche Währung wird ${country.name_in} verwendet?`,
        answer: { label, countryCode: code },
        options,
        fact: `Die Währung ${country.name_in} ist ${label}.`,
        source: "https://query.wikidata.org/",
      });
    } else {
      skipped.push(`${code} currency (distractors)`);
    }
  }

  // Official language ----------------------------------------------------
  const languages: string[] = extra?.languages ?? [];
  if (languages.length >= 1 && languages.length <= 3) {
    const label =
      languages.length === 1
        ? languages[0]
        : languages.length === 2
          ? `${languages[0]} und ${languages[1]}`
          : `${languages[0]}, ${languages[1]} und ${languages[2]}`;
    const languagePool = unique(
      Object.values(extras.countries).flatMap(
        (entry: any) => entry.languages ?? [],
      ),
    ).filter(
      (language) =>
        !languages.includes(language) &&
        !/Gebärdensprache|Sign Language|britisches Englisch|amerikanisches Englisch|australisches Englisch|kanadisches Englisch/i.test(
          language,
        ),
    );
    const options = distractors(label, languagePool, rng);
    if (options.length === 4) {
      const plural = languages.length > 1;
      addFact({
        id: `gen-language-${code}`,
        country: code,
        category: "language",
        interactions: ["mc"],
        difficulty: 2,
        question: plural
          ? `Welche Sprachen sind ${country.name_in} Amtssprachen?`
          : `Welche Sprache ist ${country.name_in} Amtssprache?`,
        answer: { label, countryCode: code },
        options,
        fact: plural
          ? `Die Amtssprachen ${country.name_in} sind ${label}.`
          : `Die Amtssprache ${country.name_in} ist ${label}.`,
        source: "https://query.wikidata.org/",
      });
    } else {
      skipped.push(`${code} language (distractors)`);
    }
  }

  // Landforms: desert, mountain range, island, peninsula -----------------
  if (feature) {
    const paddedFocus: [number, number, number, number] = [
      country.focus_bbox[0] - 5,
      country.focus_bbox[1] - 5,
      country.focus_bbox[2] + 5,
      country.focus_bbox[3] + 5,
    ];
    for (const [category, featurecla] of Object.entries(
      LANDFORM_CATEGORIES,
    )) {
      const hits = landformFeatures.filter((candidate: any) => {
        if (candidate.properties.FEATURECLA !== featurecla) return false;
        if (!inBBox(bbox(candidate), paddedFocus)) return false;
        return intersects(feature, candidate);
      });
      const uniqueHits = new Map<string, any>();
      for (const hit of hits) {
        const name = landformName(hit);
        if (!name) continue;
        const previous = uniqueHits.get(name);
        if (!previous || area(hit) > area(previous)) {
          uniqueHits.set(name, hit);
        }
      }
      const chosen = [...uniqueHits.entries()].sort(
        (a, b) => area(b[1]) - area(a[1]),
      )[0];
      if (!chosen) continue;

      const [name, landform] = chosen;
      const pool = (landformPoolByCategory.get(category) ?? []).filter(
        (candidate) => !uniqueHits.has(candidate),
      );
      const options = distractors(name, pool, rng);
      if (options.length !== 4) {
        skipped.push(`${code} ${category} (distractors)`);
        continue;
      }

      const prompts: Record<string, string> = {
        desert: `Welche Wüste liegt ${country.name_in}?`,
        mountain_range: `Welches Gebirge liegt ${country.name_in}?`,
        island: `Welche Insel liegt ${country.name_in}?`,
        peninsula: `Welche Halbinsel liegt ${country.name_in}?`,
      };
      const facts: Record<string, string> = {
        desert: `Die Wüste ${name} liegt ${country.name_in}.`,
        mountain_range: `Das Gebirge ${name} liegt ${country.name_in}.`,
        island: `Die Insel ${name} liegt ${country.name_in}.`,
        peninsula: `Die Halbinsel ${name} liegt ${country.name_in}.`,
      };

      const factId = `gen-${category}-${code}`;
      addFact({
        id: factId,
        country: code,
        category,
        interactions: ["mc"],
        difficulty: 3,
        question: prompts[category],
        answer: { label: name },
        options,
        fact: facts[category],
        source: "https://www.naturalearthdata.com/",
      });
      generatedReveals[factId] = createPolygonReveal(
        landform,
        name,
        [
          country.focus_bbox[0] - 6,
          country.focus_bbox[1] - 6,
          country.focus_bbox[2] + 6,
          country.focus_bbox[3] + 6,
        ],
      );
    }
  }
}

// --- Population and area comparisons -------------------------------------

const byContinent = new Map<string, any[]>();
for (const country of countries) {
  const bucket = byContinent.get(country.continent);
  if (bucket) bucket.push(country);
  else byContinent.set(country.continent, [country]);
}

function comparisonFacts(
  key: "population" | "area_km2",
  idPrefix: string,
  category: "population" | "area",
  prompt: (a: string, b: string) => string,
  factText: (winner: string, loser: string) => string,
) {
  for (const list of byContinent.values()) {
    const ranked = list
      .filter((country) => typeof country[key] === "number" && country[key] > 0)
      .sort((a, b) => b[key] - a[key]);
    const rankByCode = new Map(
      ranked.map((country, index) => [country.code, index]),
    );

    for (const country of ranked) {
      const rng = mulberry32(seedFor(country.code, idPrefix));
      const rank = rankByCode.get(country.code) ?? 0;
      const candidates = ranked.filter((other) => {
        if (other.code === country.code) return false;
        const otherRank = rankByCode.get(other.code) ?? 0;
        const distance = Math.abs(otherRank - rank);
        return distance >= 1 && distance <= 8;
      });
      const peer =
        candidates[Math.floor(rng() * candidates.length)] ??
        ranked.find((other) => other.code !== country.code);
      if (!peer) continue;

      const countryValue = country[key] as number;
      const peerValue = peer[key] as number;
      const winner = countryValue >= peerValue ? country : peer;
      const loser = winner === country ? peer : country;
      const options = shuffle(
        [country.name.de, peer.name.de],
        rng,
      );
      addFact({
        id: `${idPrefix}-${country.code}`,
        country: country.code,
        category,
        interactions: ["mc"],
        difficulty: 2,
        question: prompt(country.name.de, peer.name.de),
        answer: { label: winner.name.de, countryCode: winner.code },
        options,
        fact: factText(winner.name.de, loser.name.de),
        source:
          "https://api.worldbank.org/v2/ (World Bank Open Data, CC BY 4.0)",
      });
    }
  }
}

comparisonFacts(
  "population",
  "gen-pop",
  "population",
  (a, b) => `Welches Land hat mehr Einwohner: ${a} oder ${b}?`,
  (winner, loser) =>
    `${winner} hat mehr Einwohner als ${loser}.`,
);

comparisonFacts(
  "area_km2",
  "gen-area",
  "area",
  (a, b) => `Welches Land ist flächenmäßig größer: ${a} oder ${b}?`,
  (winner, loser) => `${winner} ist flächenmäßig größer als ${loser}.`,
);

// --- Write output ---------------------------------------------------------

const factsFile = path.join(ROOT, "public/data/facts/generated.json");
fs.writeFileSync(factsFile, `${JSON.stringify(generated, null, 2)}\n`);

const revealsFile = path.join(ROOT, "public/data/reveals/generated.json");
fs.mkdirSync(path.dirname(revealsFile), { recursive: true });
fs.writeFileSync(
  revealsFile,
  `${JSON.stringify(generatedReveals)}\n`,
);

console.log(
  `Wrote ${generated.length} generated facts to public/data/facts/generated.json`,
);
console.log(
  `Wrote ${Object.keys(generatedReveals).length} generated reveals to public/data/reveals/generated.json`,
);
console.log(
  "Categories:",
  Object.entries(stats)
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => `${key}=${value}`)
    .join(", "),
);
if (skipped.length) {
  console.log(`Skipped ${skipped.length}: ${skipped.slice(0, 20).join(", ")}${skipped.length > 20 ? " …" : ""}`);
}
