import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RunSummary } from "../game/types";

export interface FactProgress {
  seen: number;
  correct: number;
  wrong: number;
  mastery: number;
  lastSeen: number;
}

interface ProgressState {
  facts: Record<string, FactProgress>;
  runs: RunSummary[];
  totalXp: number;
  bestStreak: number;
  recordAnswer: (factId: string, correct: boolean) => void;
  recordRun: (summary: RunSummary) => void;
  reset: () => void;
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      facts: {},
      runs: [],
      totalXp: 0,
      bestStreak: 0,

      recordAnswer: (factId, correct) =>
        set((state) => {
          const previous = state.facts[factId] ?? {
            seen: 0,
            correct: 0,
            wrong: 0,
            mastery: 0,
            lastSeen: 0,
          };

          return {
            facts: {
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
              },
            },
          };
        }),

      recordRun: (summary) =>
        set((state) => ({
          runs: [summary, ...state.runs].slice(0, 50),
          totalXp: state.totalXp + summary.score,
          bestStreak: Math.max(state.bestStreak, summary.bestStreak),
        })),

      reset: () =>
        set({
          facts: {},
          runs: [],
          totalXp: 0,
          bestStreak: 0,
        }),
    }),
    {
      name: "spasmitflaggen.progress.v1",
      version: 1,
    },
  ),
);

export function masteryMap(): Record<string, number> {
  const { facts } = useProgress.getState();
  return Object.fromEntries(
    Object.entries(facts).map(([id, progress]) => [id, progress.mastery]),
  );
}
