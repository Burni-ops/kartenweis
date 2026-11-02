import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const RAW = path.join(ROOT, "data", "raw");
const OUT = path.join(ROOT, "public", "flags");

const FLAG_FALLBACK = {
  KOS: "xk",
  SOL: "so",
  CYN: "tr",
  SAH: "eh",
  FRA: "fr",
  NOR: "no",
};

function countryCode(p) {
  const candidate =
    p.ISO_A2_EH && p.ISO_A2_EH !== "-99" ? p.ISO_A2_EH : p.ISO_A2;
  if (candidate && candidate !== "-99") return candidate.toLowerCase();
  return (FLAG_FALLBACK[p.ADM0_A3] ?? "").toLowerCase();
}

const exclusions = new Set(["GIB", "JEY", "GGY", "IMN", "ALD", "FRO"]);
const continents = new Set([
  "Europe",
  "Asia",
  "Africa",
  "North America",
  "South America",
  "Oceania",
]);

const countries = JSON.parse(
  fs.readFileSync(path.join(RAW, "ne_10m_admin_0_countries.geojson"), "utf8"),
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
  .map((feature) => countryCode(feature.properties))
  .filter(Boolean);

const unique = [...new Set(countries)];
fs.mkdirSync(OUT, { recursive: true });

let downloaded = 0;
let skipped = 0;
for (const code of unique) {
  const target = path.join(OUT, `${code}.svg`);
  if (fs.existsSync(target) && fs.statSync(target).size > 100) {
    continue;
  }
  const response = await fetch(`https://flagcdn.com/${code}.svg`);
  if (!response.ok) {
    console.warn(`skip ${code}: HTTP ${response.status}`);
    skipped += 1;
    continue;
  }
  const text = await response.text();
  if (!text.includes("<svg")) {
    console.warn(`skip ${code}: not svg`);
    skipped += 1;
    continue;
  }
  fs.writeFileSync(target, text);
  downloaded += 1;
}

console.log(
  `Flags: ${unique.length} countries, ${downloaded} downloaded, ${skipped} skipped, ${fs.readdirSync(OUT).length} files total.`,
);
