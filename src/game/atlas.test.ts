import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { Country, Region } from "../data/types";
import type { Fact, RevealMap } from "./types";
import {
  buildAtlasFeatures,
  factIdsForCountry,
  masteryForIds,
} from "./atlas";

const root = process.cwd();
const countries = (
  JSON.parse(
    fs.readFileSync(path.join(root, "public/data/countries.json"), "utf8"),
  ) as { countries: Country[] }
).countries;
const regions = (
  JSON.parse(
    fs.readFileSync(
      path.join(root, "public/data/maps/world-regions.geojson"),
      "utf8",
    ),
  ) as { features: Array<{ properties: Region }> }
).features.map((feature) => feature.properties);
const facts = JSON.parse(
  fs.readFileSync(
    path.join(root, "public/data/facts/europe.json"),
    "utf8",
  ),
) as Fact[];
const reveals = JSON.parse(
  fs.readFileSync(
    path.join(root, "public/data/reveals/europe.json"),
    "utf8",
  ),
) as RevealMap;

const germany = countries.find((country) => country.code === "DE")!;

describe("atlas", () => {
  it("builds point, region, river, lake and country features for Germany", () => {
    const features = buildAtlasFeatures(
      germany,
      facts,
      reveals,
      regions,
    );

    expect(
      features.some(
        (feature) => feature.id === "capital:DE" && feature.kind === "point",
      ),
    ).toBe(true);
    expect(
      features.some(
        (feature) => feature.id === "peak:DE" && feature.kind === "point",
      ),
    ).toBe(true);
    expect(
      features.some(
        (feature) =>
          feature.id === "region:DE-BY" && feature.kind === "region",
      ),
    ).toBe(true);
    expect(
      features.some(
        (feature) => feature.id === "de-rhine" && feature.kind === "line",
      ),
    ).toBe(true);
    expect(
      features.some(
        (feature) =>
          feature.id === "de-bodensee" && feature.kind === "polygon",
      ),
    ).toBe(true);
    expect(
      features.some(
        (feature) =>
          feature.id === "de-neighbor" &&
          feature.kind === "country" &&
          feature.countryCode === "IT",
      ),
    ).toBe(true);
  });

  it("calculates country fact ids and mastery", () => {
    const ids = factIdsForCountry(germany, facts, regions);
    expect(ids).toContain("capital:DE");
    expect(ids).toContain("region:DE-BY");
    expect(ids).toContain("de-rhine");

    const summary = masteryForIds(ids, {
      "capital:DE": { mastery: 5 },
      "peak:DE": { mastery: 4 },
    });
    expect(summary.learned).toBe(2);
    expect(summary.total).toBe(ids.length);
    expect(summary.percent).toBeGreaterThan(0);
    expect(summary.stars).toBe(0);

    const full = masteryForIds(["a", "b"], {
      a: { mastery: 5 },
      b: { mastery: 5 },
    });
    expect(full.stars).toBe(3);
    expect(full.percent).toBe(100);
  });
});
