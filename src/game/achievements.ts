import type { FactCategory, RunSummary } from "./types";

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first-run",
    title: "Erste Schritte",
    description: "Schließe deinen ersten Run ab.",
    icon: "🌍",
  },
  {
    id: "perfect-run",
    title: "Perfekte Runde",
    description: "Beantworte 10 von 10 Fragen richtig.",
    icon: "🏆",
  },
  {
    id: "streak-5",
    title: "Serie 5",
    description: "Erreiche eine Serie von 5 richtigen Antworten.",
    icon: "🔥",
  },
  {
    id: "streak-10",
    title: "Serie 10",
    description: "Erreiche eine Serie von 10 richtigen Antworten.",
    icon: "⚡",
  },
  {
    id: "run-10",
    title: "Dranbleiber",
    description: "Spiele 10 Runs.",
    icon: "🎯",
  },
  {
    id: "xp-1000",
    title: "XP-Sammler",
    description: "Sammle 1.000 XP.",
    icon: "💎",
  },
  {
    id: "regions-5",
    title: "Bundesland-Kenner",
    description: "Meistere 5 Bundesländer oder Kantone.",
    icon: "🗺️",
  },
  {
    id: "rivers-5",
    title: "Flusskundler",
    description: "Meistere 5 Flüsse.",
    icon: "🌊",
  },
  {
    id: "mountains-5",
    title: "Gipfelstürmer",
    description: "Meistere 5 Berge.",
    icon: "🏔️",
  },
  {
    id: "seas-5",
    title: "Meereskundler",
    description: "Meistere 5 Meere oder Meerengen.",
    icon: "⚓",
  },
  {
    id: "atlas-10",
    title: "Atlas-Fan",
    description: "Besuche 10 Länder im Atlas.",
    icon: "📖",
  },
  {
    id: "daily-3",
    title: "Tagesroutine",
    description: "Spiele die Tages-Challenge an 3 Tagen in Folge.",
    icon: "📅",
  },
];

export interface AchievementFact {
  mastery: number;
  category?: FactCategory;
}

export interface AchievementContext {
  runs: RunSummary[];
  totalXp: number;
  facts: Record<string, AchievementFact>;
  visitedCountries: Record<string, number>;
  daily: { lastPlayed: string | null; streak: number; completed: number };
  summary?: RunSummary;
}

function masteredByCategory(
  facts: Record<string, AchievementFact>,
  categories: FactCategory[],
): number {
  return Object.values(facts).filter(
    (fact) =>
      fact.mastery >= 4 &&
      fact.category &&
      categories.includes(fact.category),
  ).length;
}

/** Returns all achievement ids that are currently fulfilled. */
export function evaluateAchievements(
  context: AchievementContext,
): string[] {
  const ids: string[] = [];
  const runs = context.runs;
  const summary = context.summary;
  const lastRun = summary ?? runs[0];

  if (runs.length >= 1) ids.push("first-run");
  if (
    summary &&
    summary.total >= 10 &&
    summary.correctCount === summary.total
  ) {
    ids.push("perfect-run");
  }
  if ((lastRun?.bestStreak ?? 0) >= 5) ids.push("streak-5");
  if ((lastRun?.bestStreak ?? 0) >= 10) ids.push("streak-10");
  if (runs.length >= 10) ids.push("run-10");
  if (context.totalXp >= 1000) ids.push("xp-1000");
  if (masteredByCategory(context.facts, ["region"]) >= 5) {
    ids.push("regions-5");
  }
  if (masteredByCategory(context.facts, ["river"]) >= 5) {
    ids.push("rivers-5");
  }
  if (masteredByCategory(context.facts, ["mountain"]) >= 5) {
    ids.push("mountains-5");
  }
  if (masteredByCategory(context.facts, ["sea", "strait"]) >= 5) {
    ids.push("seas-5");
  }
  if (Object.keys(context.visitedCountries).length >= 10) {
    ids.push("atlas-10");
  }
  if (context.daily.streak >= 3) ids.push("daily-3");
  return ids;
}

export function achievementById(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((achievement) => achievement.id === id);
}
