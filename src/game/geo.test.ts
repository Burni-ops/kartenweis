import { describe, expect, it } from "vitest";
import {
  formatDistance,
  haversineKm,
  precisionForDistance,
  precisionMultiplier,
} from "./geo";

const BERLIN: [number, number] = [13.405, 52.52];
const MUNICH: [number, number] = [11.577, 48.137];

describe("haversineKm", () => {
  it("returns 0 for the same point", () => {
    expect(haversineKm(BERLIN, BERLIN)).toBeCloseTo(0, 6);
  });

  it("calculates the Berlin–Munich distance", () => {
    expect(haversineKm(BERLIN, MUNICH)).toBeGreaterThan(490);
    expect(haversineKm(BERLIN, MUNICH)).toBeLessThan(515);
  });
});

describe("precisionForDistance", () => {
  it.each([
    [0, "perfect"],
    [25, "perfect"],
    [26, "great"],
    [75, "great"],
    [76, "close"],
    [150, "close"],
    [151, "miss"],
  ] as const)("maps %s km to %s", (distance, expected) => {
    expect(precisionForDistance(distance)).toBe(expected);
  });

  it("returns decreasing multipliers", () => {
    expect(precisionMultiplier("perfect")).toBe(1);
    expect(precisionMultiplier("great")).toBeGreaterThan(
      precisionMultiplier("close"),
    );
    expect(precisionMultiplier("miss")).toBe(0);
  });
});

describe("formatDistance", () => {
  it("formats kilometres in German", () => {
    expect(formatDistance(87.4)).toBe("87 km");
    expect(formatDistance(0.4)).toBe("unter 1 km");
  });
});
