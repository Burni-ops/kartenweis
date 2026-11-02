import { describe, expect, it } from "vitest";
import { dailySeed, seedFromString, todayKey } from "./daily";

describe("daily", () => {
  it("formats the local date key", () => {
    expect(todayKey(new Date(2026, 10, 2))).toBe("2026-11-02");
    expect(todayKey(new Date(2026, 0, 9))).toBe("2026-01-09");
  });

  it("hashes strings deterministically", () => {
    expect(seedFromString("abc")).toBe(seedFromString("abc"));
    expect(seedFromString("abc")).not.toBe(seedFromString("abd"));
  });

  it("creates a stable daily seed", () => {
    const date = new Date(2026, 10, 2);
    expect(dailySeed(date)).toBe(dailySeed(date));
    expect(dailySeed(date)).not.toBe(dailySeed(new Date(2026, 10, 3)));
  });
});
