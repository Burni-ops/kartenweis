import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, "public");
const DATA = path.join(PUBLIC, "data");

const errors: string[] = [];
const warnings: string[] = [];

function readJson(file: string): any {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(
      `Cannot read ${path.relative(ROOT, file)}: ${(error as Error).message}`,
    );
  }
}

function fail(message: string) {
  errors.push(message);
}

function warn(message: string) {
  warnings.push(message);
}

const countryFile = path.join(DATA, "countries.json");
const worldFile = path.join(DATA, "maps", "world.geojson");
const regionsFile = path.join(
  DATA,
  "maps",
  "world-regions.geojson",
);
const revealsFile = path.join(DATA, "reveals", "europe.json");
const generatedFactsFile = path.join(DATA, "facts", "generated.json");
const generatedRevealsFile = path.join(DATA, "reveals", "generated.json");

for (const file of [
  countryFile,
  worldFile,
  regionsFile,
  revealsFile,
  generatedFactsFile,
  generatedRevealsFile,
]) {
  if (!fs.existsSync(file)) {
    fail(`Missing file: ${path.relative(ROOT, file)}`);
  }
}

if (errors.length === 0) {
  const dataset = readJson(countryFile);
  const world = readJson(worldFile);
  const regions = readJson(regionsFile);

  const countries = new Map<string, any>();
  for (const country of dataset.countries) {
    if (countries.has(country.code)) {
      fail(`Duplicate country code: ${country.code}`);
    }
    countries.set(country.code, country);

    if (!/^[A-Z]{2}$/.test(country.code)) {
      fail(`Invalid country code: ${country.code}`);
    }
    if (!country.name?.de || !country.name?.en) {
      fail(`${country.code}: missing localized name`);
    }
    for (const key of ["name_von", "name_in", "name_acc"] as const) {
      if (!country[key] || typeof country[key] !== "string") {
        fail(`${country.code}: missing ${key}`);
      }
    }
    if (!dataset.continents.some((continent: any) => continent.id === country.continent)) {
      fail(`${country.code}: unknown continent ${country.continent}`);
    }
    if (!Array.isArray(country.bbox) || country.bbox.length !== 4) {
      fail(`${country.code}: invalid bbox`);
    }
    if (!Array.isArray(country.focus_bbox) || country.focus_bbox.length !== 4) {
      fail(`${country.code}: invalid focus_bbox`);
    }
    if (
      country.bbox &&
      country.focus_bbox &&
      (country.focus_bbox[0] < country.bbox[0] - 0.01 ||
        country.focus_bbox[1] < country.bbox[1] - 0.01 ||
        country.focus_bbox[2] > country.bbox[2] + 0.01 ||
        country.focus_bbox[3] > country.bbox[3] + 0.01)
    ) {
      fail(`${country.code}: focus_bbox is outside bbox`);
    }
    if (!(country.area_km2 > 0)) {
      fail(`${country.code}: area_km2 must be positive`);
    }
    if (!(country.population > 0)) {
      fail(`${country.code}: population must be positive`);
    }
    const flagRel = (country.flag_url ?? "").replace(/^\//, "");
    const flagFile = path.join(PUBLIC, flagRel);
    if (
      !country.flag_url ||
      (!fs.existsSync(flagFile) && !/^https?:\/\//.test(country.flag_url))
    ) {
      fail(`${country.code}: missing flag asset (${country.flag_url})`);
    }
    if (
      country.capital?.point &&
      (country.capital.point[0] < country.bbox[0] - 0.1 ||
        country.capital.point[0] > country.bbox[2] + 0.1 ||
        country.capital.point[1] < country.bbox[1] - 0.1 ||
        country.capital.point[1] > country.bbox[3] + 0.1)
    ) {
      fail(`${country.code}: capital lies outside bbox`);
    }
    if (country.has_regions && !country.region_label) {
      fail(`${country.code}: has_regions without region_label`);
    }
    if (!country.has_regions && country.regions_map) {
      warn(`${country.code}: regions_map without has_regions`);
    }
  }

  const mapCodes = new Set<string>(
    world.features
      .filter((feature: any) => feature.properties?.playable)
      .map((feature: any) => String(feature.properties?.code)),
  );
  for (const code of countries.keys()) {
    if (!mapCodes.has(code)) {
      fail(`Country missing from world map: ${code}`);
    }
  }

  const regionCodes = new Set<string>();
  for (const feature of regions.features) {
    const region = feature.properties;
    if (!region?.code || regionCodes.has(region.code)) {
      fail(`Invalid or duplicate region code: ${region?.code}`);
      continue;
    }
    regionCodes.add(region.code);
    if (!region.name_de || !region.name_en) {
      fail(`${region.code}: missing localized name`);
    }
    if (
      !countries.has(region.country)
    ) {
      fail(`${region.code}: unexpected country ${region.country}`);
    }
    if (!Array.isArray(region.bbox) || region.bbox.length !== 4) {
      fail(`${region.code}: invalid bbox`);
    }
    if (!(region.area_km2 > 0)) {
      fail(`${region.code}: area_km2 must be positive`);
    }
    const country = countries.get(region.country);
    if (
      country &&
      region.bbox &&
      (region.bbox[0] < country.bbox[0] - 0.2 ||
        region.bbox[1] < country.bbox[1] - 0.2 ||
        region.bbox[2] > country.bbox[2] + 0.2 ||
        region.bbox[3] > country.bbox[3] + 0.2)
    ) {
      fail(`${region.code}: region bbox is outside ${region.country}`);
    }
  }

  const expectedRegions: Record<string, number> = {
    DE: 16,
    AT: 9,
    CH: 26,
    FR: 18,
    IT: 20,
    ES: 19,
    PL: 16,
    NL: 12,
  };
  for (const [code, expected] of Object.entries(expectedRegions)) {
    const actual = [...regions.features].filter(
      (feature: any) => feature.properties?.country === code,
    ).length;
    if (actual !== expected) {
      fail(`${code}: expected ${expected} regions, found ${actual}`);
    }
  }

  const factsFile = path.join(DATA, "facts", "europe.json");
  if (fs.existsSync(factsFile)) {
    const facts = [
      ...readJson(factsFile),
      ...readJson(generatedFactsFile),
    ];
    const factIds = new Set<string>();
    const categories = new Set([
      "country",
      "capital",
      "city",
      "river",
      "mountain",
      "lake",
      "sea",
      "strait",
      "landmark",
      "neighbor",
      "region",
      "extreme",
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
      "waterfall",
    ]);

    for (const fact of facts) {
      if (!fact.id || factIds.has(fact.id)) {
        fail(`Invalid or duplicate fact id: ${fact.id}`);
        continue;
      }
      factIds.add(fact.id);
      if (fact.country !== "EU" && !countries.has(fact.country)) {
        fail(`${fact.id}: unknown country ${fact.country}`);
      }
      if (!categories.has(fact.category)) {
        fail(`${fact.id}: unknown category ${fact.category}`);
      }
      if (!Array.isArray(fact.interactions) || fact.interactions.length === 0) {
        fail(`${fact.id}: missing interactions`);
      }
      if (
        fact.interactions?.includes("mc") &&
        (!Array.isArray(fact.options) ||
          ![2, 4].includes(fact.options.length) ||
          new Set(fact.options).size !== fact.options.length ||
          !fact.options.includes(fact.answer?.label))
      ) {
        fail(`${fact.id}: MC options must be unique values including the answer`);
      }
      if (
        fact.interactions?.includes("drag") &&
        !Array.isArray(fact.answer?.point)
      ) {
        fail(`${fact.id}: drag interaction without answer point`);
      }
      if (
        fact.interactions?.includes("tap-region") &&
        !fact.answer?.regionCode
      ) {
        fail(`${fact.id}: tap-region interaction without regionCode`);
      }
      if (
        fact.interactions?.includes("tap-country") &&
        !fact.answer?.countryCode
      ) {
        fail(`${fact.id}: tap-country interaction without countryCode`);
      }
      if (fact.focus === "europe" && fact.country !== "EU") {
        warn(`${fact.id}: Europe focus on a country-specific fact`);
      }
      if (!fact.source) {
        fail(`${fact.id}: missing source`);
      }
    }

    console.log(
      `Validated ${facts.length} facts (curated + generated).`,
    );

    const reveals = {
      ...readJson(revealsFile),
      ...readJson(generatedRevealsFile),
    };
    for (const [id, reveal] of Object.entries<any>(reveals)) {
      if (!factIds.has(id)) {
        fail(`Reveal references unknown fact: ${id}`);
      }
      if (!reveal.label) {
        fail(`${id}: reveal without label`);
      }
      if (!Array.isArray(reveal.bbox) || reveal.bbox.length !== 4) {
        fail(`${id}: reveal without valid bbox`);
      }
      if (reveal.kind === "point" && !Array.isArray(reveal.point)) {
        fail(`${id}: point reveal without point`);
      }
      if (
        (reveal.kind === "line" || reveal.kind === "polygon") &&
        !reveal.geometry
      ) {
        fail(`${id}: geometry reveal without geometry`);
      }
    }

    for (const fact of facts) {
      if (
        ["river", "lake", "sea", "strait"].includes(fact.category) &&
        !reveals[fact.id]
      ) {
        fail(`${fact.id}: missing map reveal for ${fact.category}`);
      }
    }

    console.log(
      `Validated ${Object.keys(reveals).length} map reveals (curated + generated).`,
    );
  }

  console.log(
    `Validated ${countries.size} countries, ${mapCodes.size} map shapes and ${regionCodes.size} regions.`,
  );
}

for (const message of warnings) {
  console.warn(`WARN  ${message}`);
}

if (errors.length > 0) {
  for (const message of errors) {
    console.error(`ERROR ${message}`);
  }
  console.error(`\n${errors.length} validation error(s).`);
  process.exit(1);
}

console.log("Data validation passed.");
