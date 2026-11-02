import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const root = new URL("../", import.meta.url);

const exclusions = new Set(["GIB", "JEY", "GGY", "IMN", "ALD", "FRO"]);
const continents = new Set([
  "Europe",
  "Asia",
  "Africa",
  "North America",
  "South America",
  "Oceania",
]);

const featureCountries = JSON.parse(
  readFileSync(
    new URL("data/raw/ne_10m_admin_0_countries.geojson", root),
    "utf8",
  ),
).features
  .filter((feature) => {
    const p = feature.properties;
    return (
      ["Sovereign country", "Country", "Disputed"].includes(p.TYPE) &&
      !exclusions.has(p.ADM0_A3) &&
      continents.has(p.CONTINENT) &&
      !(p.ADM0_DIF === 1 && p.SOVEREIGNT !== p.ADMIN)
    );
  })
  .map((feature) => feature.properties);

const wikidata = JSON.parse(
  readFileSync(new URL("data/raw/wikidata-world.json", root), "utf8"),
);
const byQid = new Map(wikidata.map((entry) => [entry.qid, entry]));

function parsePoint(value) {
  if (!value) return null;
  const match = /^Point\(([-\d.]+)\s+([-\d.]+)\)$/.exec(value);
  if (!match) return null;
  return [Number(match[1]), Number(match[2])];
}

function codeFor(p) {
  const candidate =
    p.ISO_A2_EH && p.ISO_A2_EH !== "-99" ? p.ISO_A2_EH : p.ISO_A2;
  if (candidate && candidate !== "-99") return candidate;
  return { FRA: "FR", NOR: "NO", KOS: "XK" }[p.ADM0_A3] ?? p.ADM0_A3;
}

function chunk(items, size) {
  const result = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

const WB_CODE = { SDS: "SSD" };

const iso3Codes = featureCountries
  .map((p) => p.ADM0_A3)
  .filter((code) => !["KOS", "SOL", "CYN", "VAT", "TWN"].includes(code))
  .map((code) => WB_CODE[code] ?? code);

const indicators = {
  population: "SP.POP.TOTL",
  area_km2: "AG.SRF.TOTL.K2",
};

const worldBank = {};
for (const [key, indicator] of Object.entries(indicators)) {
  for (const batch of chunk(iso3Codes, 10)) {
    const url = `https://api.worldbank.org/v2/country/${batch.join(";")}/indicator/${indicator}?format=json&per_page=200&date=2023`;
    let rows = null;
    for (let attempt = 1; attempt <= 4 && !rows; attempt += 1) {
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(60_000),
        });
        if (!response.ok) {
          console.warn(
            `World Bank ${indicator}: HTTP ${response.status} (attempt ${attempt})`,
          );
        } else {
          const json = await response.json();
          if (Array.isArray(json[1])) rows = json[1];
          else console.warn(`World Bank ${indicator}: unexpected payload`);
        }
      } catch (error) {
        console.warn(
          `World Bank ${indicator}: ${error.message} (attempt ${attempt})`,
        );
      }
      if (!rows) await new Promise((resolve) => setTimeout(resolve, 1200));
    }
    console.log(
      `World Bank ${indicator}: ${batch.length} codes, ${rows?.length ?? 0} rows`,
    );
    for (const row of rows ?? []) {
      if (row.value === null) continue;
      worldBank[row.countryiso3code] ??= {};
      // Keep the latest non-null value per indicator.
      const previous = worldBank[row.countryiso3code][key];
      if (!previous || Number(row.date) > previous.year) {
        worldBank[row.countryiso3code][key] = {
          value: row.value,
          year: Number(row.date),
        };
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}

const output = {};
const missing = [];

for (const feature of featureCountries) {
  const code = codeFor(feature);
  const wiki = byQid.get(feature.WIKIDATAID);
  const wb = worldBank[WB_CODE[feature.ADM0_A3] ?? feature.ADM0_A3] ?? {};
  const population = wb.population ?? null;
  const area = wb.area_km2 ?? null;
  const highestPoint =
    wiki?.highest && parsePoint(wiki.coord)
      ? {
          name: wiki.highest,
          elevation_m: wiki.elevation_m,
          point: parsePoint(wiki.coord),
        }
      : null;

  if (!wiki) missing.push(`${code}: Wikidata`);
  if (!population) missing.push(`${code}: population`);
  if (!area) missing.push(`${code}: area`);
  if (!highestPoint?.point) missing.push(`${code}: highest point`);

  output[code] = {
    wikidata: feature.WIKIDATAID ?? null,
    name: wiki?.name ?? feature.NAME_DE ?? feature.NAME,
    capital: wiki?.capital ?? null,
    population: population?.value ?? null,
    population_year: population?.year ?? null,
    area_km2: area?.value ?? null,
    area_year: area?.year ?? null,
    highest_point: highestPoint,
    // Natural Earth fallbacks for countries without World Bank rows.
    ne_population: feature.POP_EST ?? null,
    ne_population_year: feature.POP_YEAR ?? null,
  };
}

const reference = {
  retrieved_at: new Date().toISOString(),
  sources: {
    wikidata: "https://query.wikidata.org/",
    world_bank: "https://api.worldbank.org/v2/",
    natural_earth: "https://www.naturalearthdata.com/",
  },
  countries: output,
};

mkdirSync(new URL("data/reference/", root), { recursive: true });
writeFileSync(
  new URL("data/reference/world.json", root),
  `${JSON.stringify(reference, null, 2)}\n`,
);

console.log(
  `Wrote reference data for ${Object.keys(output).length} countries to data/reference/world.json`,
);
if (missing.length) {
  console.warn(`Missing (${missing.length}): ${missing.join(", ")}`);
}
