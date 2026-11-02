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
const europeFile = path.join(DATA, "maps", "europe.geojson");
const regionsFile = path.join(DATA, "maps", "dach-regions.geojson");

for (const file of [countryFile, europeFile, regionsFile]) {
  if (!fs.existsSync(file)) {
    fail(`Missing file: ${path.relative(ROOT, file)}`);
  }
}

if (errors.length === 0) {
  const dataset = readJson(countryFile);
  const europe = readJson(europeFile);
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
    if (!country.flag_url || !fs.existsSync(flagFile)) {
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
    europe.features.map((feature: any) => String(feature.properties?.code)),
  );
  for (const code of mapCodes) {
    if (!countries.has(code)) {
      fail(`Europe map contains unknown country code: ${code}`);
    }
  }
  for (const code of countries.keys()) {
    if (!mapCodes.has(code)) {
      fail(`Country missing from Europe map: ${code}`);
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
    if (!["DE", "AT", "CH"].includes(region.country)) {
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

  const expectedRegions: Record<string, number> = { DE: 16, AT: 9, CH: 26 };
  for (const [code, expected] of Object.entries(expectedRegions)) {
    const actual = [...regions.features].filter(
      (feature: any) => feature.properties?.country === code,
    ).length;
    if (actual !== expected) {
      fail(`${code}: expected ${expected} regions, found ${actual}`);
    }
  }

  console.log(
    `Validated ${countries.size} countries, ${mapCodes.size} map shapes and ${regionCodes.size} DACH regions.`,
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
