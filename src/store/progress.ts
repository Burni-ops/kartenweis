import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FactCategory, RunSummary } from "../game/types";
import { evaluateAchievements } from "../game/achievements";

export interface FactProgress {
  seen: number;
  correct: number;
  wrong: number;
  mastery: number;
  lastSeen: number;
  category?: FactCategory;
  country?: string;
}

export interface DailyProgress {
  lastPlayed: string | null;
  streak: number;
  completed: number;
}

const EMPTY_DAILY: DailyProgress = {
  lastPlayed: null,
  streak: 0,
  completed: 0,
};

interface ProgressState {
  facts: Record<string, FactProgress>;
  runs: RunSummary[];
  totalXp: number;
  bestStreak: number;
  visitedCountries: Record<string, number>;
  achievements: Record<string, number>;
  daily: DailyProgress;
  recordAnswer: (
    factId: string,
    correct: boolean,
    meta?: { category?: FactCategory; country?: string },
  ) => void;
  recordRun: (summary: RunSummary) => void;
  recordCountryVisit: (code: string) => void;
  recordDaily: (date: string) => void;
  reset: () => void;
}

function mergeUnlocked(
  existing: Record<string, number>,
  ids: string[],
): Record<string, number> {
  let next = existing;
  for (const id of ids) {
    if (next[id]) continue;
    if (next === existing) next = { ...existing };
    next[id] = Date.now();
  }
  return next;
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      facts: {},
      runs: [],
      totalXp: 0,
      bestStreak: 0,
      visitedCountries: {},
      achievements: {},
      daily: { ...EMPTY_DAILY },

      recordAnswer: (factId, correct, meta) =>
        set((state) => {
          const previous = state.facts[factId] ?? {
            seen: 0,
            correct: 0,
            wrong: 0,
            mastery: 0,
            lastSeen: 0,
          };

          const facts = {
            ...state.facts,
            [factId]: {
              seen: previous.seen + 1,
              correct: previous.correct + (correct ? 1 : 0),
              wrong: previous.wrong + (correct ? 0 : 1),
              mastery: Math.max(
                0,
                Math.min(5, previous.mastery + (correct ? 1 : -1)),
              ),
              lastSeen: Date.now(),
              category: meta?.category ?? previous.category,
              country: meta?.country ?? previous.country,
            },
          };

          const unlocked = evaluateAchievements({
            runs: state.runs,
            totalXp: state.totalXp,
            facts,
            visitedCountries: state.visitedCountries,
            daily: state.daily,
          });

          return {
            facts,
            achievements: mergeUnlocked(state.achievements, unlocked),
          };
        }),

      recordRun: (summary) =>
        set((state) => {
          const runs = [summary, ...state.runs].slice(0, 50);
          const totalXp = state.totalXp + summary.score;
          const bestStreak = Math.max(state.bestStreak, summary.bestStreak);
          const unlocked = evaluateAchievements({
            runs,
            totalXp,
            facts: state.facts,
            visitedCountries: state.visitedCountries,
            daily: state.daily,
            summary,
          });

          return {
            runs,
            totalXp,
            bestStreak,
            achievements: mergeUnlocked(state.achievements, unlocked),
          };
        }),

      recordCountryVisit: (code) =>
        set((state) => {
          const visitedCountries = {
            ...state.visitedCountries,
            [code]: (state.visitedCountries[code] ?? 0) + 1,
          };
          const unlocked = evaluateAchievements({
            runs: state.runs,
            totalXp: state.totalXp,
            facts: state.facts,
            visitedCountries,
            daily: state.daily,
          });
          return {
            visitedCountries,
            achievements: mergeUnlocked(state.achievements, unlocked),
          };
        }),

      recordDaily: (date) =>
        set((state) => {
          if (state.daily.lastPlayed === date) return state;

          const previous = state.daily.lastPlayed
            ? new Date(`${state.daily.lastPlayed}T00:00:00`)
            : null;
          const current = new Date(`${date}T00:00:00`);
          const isConsecutive =
            previous !== null &&
            current.getTime() - previous.getTime() === 86_400_000;
          const daily: DailyProgress = {
            lastPlayed: date,
            streak: isConsecutive ? state.daily.streak + 1 : 1,
            completed: state.daily.completed + 1,
          };
          const unlocked = evaluateAchievements({
            runs: state.runs,
            totalXp: state.totalXp,
            facts: state.facts,
            visitedCountries: state.visitedCountries,
            daily,
          });
          return {
            daily,
            achievements: mergeUnlocked(state.achievements, unlocked),
          };
        }),

      reset: () =>
        set({
          facts: {},
          runs: [],
          totalXp: 0,
          bestStreak: 0,
          visitedCountries: {},
          achievements: {},
          daily: { ...EMPTY_DAILY },
        }),
    }),
    {
      name: "kartenweis.progress.v1",
      version: 2,
      migrate: (persisted: unknown) => {
        const state = (persisted ?? {}) as Partial<ProgressState>;
        return {
          ...state,
          visitedCountries: state.visitedCountries ?? {},
          achievements: state.achievements ?? {},
          daily: state.daily ?? { ...EMPTY_DAILY },
        } as ProgressState;
      },
    },
  ),
);

export function masteryMap(): Record<string, number> {
  const { facts } = useProgress.getState();
  return Object.fromEntries(
    Object.entries(facts).map(([id, progress]) => [id, progress.mastery]),
  );
}
