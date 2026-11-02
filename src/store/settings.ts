import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Difficulty = "auto" | "easy" | "hard";

interface SettingsState {
  sound: boolean;
  reducedMotion: boolean;
  difficulty: Difficulty;
  onboardingDone: boolean;
  setSound: (value: boolean) => void;
  setReducedMotion: (value: boolean) => void;
  setDifficulty: (value: Difficulty) => void;
  completeOnboarding: () => void;
  resetSettings: () => void;
}

const DEFAULTS = {
  sound: true,
  reducedMotion: false,
  difficulty: "auto" as Difficulty,
  onboardingDone: false,
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setSound: (sound) => set({ sound }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setDifficulty: (difficulty) => set({ difficulty }),
      completeOnboarding: () => set({ onboardingDone: true }),
      resetSettings: () => set({ ...DEFAULTS }),
    }),
    {
      name: "spasmitflaggen.settings.v1",
      version: 1,
    },
  ),
);
