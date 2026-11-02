import { describe, expect, it } from "vitest";
import { evaluateAchievements, type AchievementContext } from "./achievements";
import type { RunSummary } from "./types";

const baseSummary: RunSummary = {
  config: { scope: "europe", count: 10, seed: 1 },
  score: 1000,
  correctCount: 10,
  total: 10,
  bestStreak: 10,
  startedAt: 0,
  finishedAt: 1,
};

function context(overrides: Partial<AchievementContext> = {}): AchievementContext {
  return {
    runs: [baseSummary],
    totalXp: 1000,
    facts: {},
    visitedCountries: {},
    daily: { lastPlayed: null, streak: 0, completed: 0 },
    summary: baseSummary,
    ...overrides,
  };
}

describe("evaluateAchievements", () => {
  it("unlocks run, streak and XP achievements", () => {
    const ids = evaluateAchievements(context());
    expect(ids).toContain("first-run");
    expect(ids).toContain("perfect-run");
    expect(ids).toContain("streak-5");
    expect(ids).toContain("streak-10");
    expect(ids).toContain("xp-1000");
  });

  it("unlocks category achievements from mastery", () => {
    const facts = Object.fromEntries(
      Array.from({ length: 5 }, (_, index) => [
        `river-${index}`,
        { mastery: 4, category: "river" as const },
      ]),
    );
    const ids = evaluateAchievements(context({ facts }));
    expect(ids).toContain("rivers-5");
    expect(ids).not.toContain("regions-5");
  });

  it("unlocks atlas and daily achievements", () => {
    const ids = evaluateAchievements(
      context({
        visitedCountries: Object.fromEntries(
          Array.from({ length: 10 }, (_, index) => [`C${index}`, 1]),
        ),
        daily: { lastPlayed: "2026-11-02", streak: 3, completed: 3 },
      }),
    );
    expect(ids).toContain("atlas-10");
    expect(ids).toContain("daily-3");
  });

  it("does not unlock perfect run for a short run", () => {
    const ids = evaluateAchievements(
      context({
        summary: {
          ...baseSummary,
          correctCount: 3,
          total: 3,
          bestStreak: 3,
        },
      }),
    );
    expect(ids).not.toContain("perfect-run");
    expect(ids).not.toContain("streak-5");
  });
});
