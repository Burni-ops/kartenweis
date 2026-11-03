import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { Country, Region } from "../data/types";
import { buildRun } from "./questions";
import { mulberry32 } from "./random";
import type { Fact } from "./types";

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
const facts = [
  ...(JSON.parse(
    fs.readFileSync(
      path.join(root, "public/data/facts/europe.json"),
      "utf8",
    ),
  ) as Fact[]),
  ...(JSON.parse(
    fs.readFileSync(
      path.join(root, "public/data/facts/generated.json"),
      "utf8",
    ),
  ) as Fact[]),
];

describe("real data + question engine", () => {
  it("can build every fact and includes sea and strait questions", () => {
    const run = buildRun(
      { scope: "continent", continent: "europe", count: 1000, seed: 1 },
      countries,
      regions,
      facts,
      {},
      mulberry32(1),
    );

    expect(run.length).toBeGreaterThan(200);
    expect(run.some((question) => question.category === "sea")).toBe(true);
    expect(run.some((question) => question.category === "strait")).toBe(true);
    expect(
      run
        .filter((question) => question.interaction === "mc")
        .every(
          (question) =>
            question.options.length === 4 ||
            question.options.length === 2,
        ),
    ).toBe(true);
    expect(
      run.some(
        (question) =>
          question.focus.kind === "continent" &&
          question.focus.id === "europe" &&
          question.countryCode === "EU",
      ),
    ).toBe(true);

    for (const category of [
      "currency",
      "language",
      "population",
      "area",
      "desert",
      "mountain_range",
      "island",
    ]) {
      expect(facts.some((fact) => fact.category === category)).toBe(true);
    }
  });
});
