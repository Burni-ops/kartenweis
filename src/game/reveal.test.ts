import { describe, expect, it } from "vitest";
import {
  pointReveal,
  questionHasReveal,
  resolveGeometryReveal,
} from "./reveal";
import type { Question, RevealMap } from "./types";

const question: Question = {
  factId: "de-rhine",
  countryCode: "DE",
  category: "river",
  interaction: "mc",
  prompt: "Längster Fluss?",
  options: ["Rhein", "Donau", "Elbe", "Main"],
  answer: { label: "Rhein" },
  fact: "Der Rhein ist der längste Flussabschnitt.",
  source: "https://example.org",
  difficulty: 2,
  focus: { kind: "country", code: "DE" },
};

const reveals: RevealMap = {
  "de-rhine": {
    kind: "line",
    geometry: {
      type: "LineString",
      coordinates: [
        [7.5, 47.5],
        [6.9, 51],
      ],
    },
    bbox: [6.9, 47.5, 7.5, 51],
    labelPoint: [7.2, 49.2],
    label: "Rhein",
  },
};

describe("reveal resolution", () => {
  it("uses the reveals map for rivers without a point", () => {
    expect(resolveGeometryReveal(question, reveals)).toEqual(
      reveals["de-rhine"],
    );
    expect(questionHasReveal(question, reveals)).toBe(true);
  });

  it("uses a point reveal for capitals and peaks", () => {
    const capital: Question = {
      ...question,
      factId: "capital:DE",
      category: "capital",
      answer: { label: "Berlin", point: [13.4, 52.5] },
    };
    const reveal = resolveGeometryReveal(capital, {});
    expect(reveal?.kind).toBe("point");
    expect(reveal?.point).toEqual([13.4, 52.5]);
    expect(reveal?.bbox[0]).toBeLessThan(13.4);
    expect(reveal?.bbox[2]).toBeGreaterThan(13.4);
  });

  it("does not create a geometry reveal for countries or regions", () => {
    const country: Question = {
      ...question,
      factId: "country:FR",
      answer: { label: "Frankreich", countryCode: "FR" },
    };
    expect(resolveGeometryReveal(country, {})).toBeNull();
    expect(questionHasReveal(country, {})).toBe(true);
  });

  it("builds a point reveal with a bbox", () => {
    const reveal = pointReveal([10, 50], "Test");
    expect(reveal.kind).toBe("point");
    expect(reveal.bbox).toHaveLength(4);
    expect(reveal.label).toBe("Test");
  });
});
