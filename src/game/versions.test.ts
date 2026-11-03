import { describe, expect, it } from "vitest";
import { compareVersions } from "./versions";

describe("compareVersions", () => {
  it("compares plain semantic versions", () => {
    expect(compareVersions("0.1.0", "0.1.0")).toBe(0);
    expect(compareVersions("0.2.0", "0.1.9")).toBe(1);
    expect(compareVersions("0.1.0", "1.0.0")).toBe(-1);
  });

  it("ignores a leading v and handles missing parts", () => {
    expect(compareVersions("v1.2", "1.2.0")).toBe(0);
    expect(compareVersions("v1.2.1", "1.2")).toBe(1);
  });

  it("handles prerelease suffixes numerically", () => {
    expect(compareVersions("1.0.0-beta", "1.0.0")).toBe(0);
    expect(compareVersions("1.0.1", "1.0.0-beta")).toBe(1);
  });
});
