import type { Country, Region } from "../data/types";
import type { Fact } from "../game/types";
import {
  factIdsForCountry,
  masteryForIds,
  type MasterySummary,
} from "../game/atlas";
import { ACHIEVEMENTS } from "../game/achievements";
import { useProgress } from "../store/progress";

type Props = {
  countries: Country[];
  facts: Fact[];
  regions: Region[];
  onClose: () => void;
};

const numberFormat = new Intl.NumberFormat("de-DE");

function Stats({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-paper-deep/70 px-3 py-3 text-center">
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
        {label}
      </div>
      <div className="mt-0.5 text-lg font-extrabold text-ink">{value}</div>
    </div>
  );
}

function Stars({ mastery }: { mastery: MasterySummary }) {
  return (
    <span className="text-sm text-gold">
      {"★".repeat(mastery.stars)}
      <span className="text-line">{"★".repeat(3 - mastery.stars)}</span>
    </span>
  );
}

export default function CollectionPanel({
  countries,
  facts,
  regions,
  onClose,
}: Props) {
  const progress = useProgress((state) => state.facts);
  const runs = useProgress((state) => state.runs);
  const totalXp = useProgress((state) => state.totalXp);
  const bestStreak = useProgress((state) => state.bestStreak);
  const visitedCountries = useProgress(
    (state) => state.visitedCountries,
  );
  const achievements = useProgress((state) => state.achievements);
  const daily = useProgress((state) => state.daily);
  const reset = useProgress((state) => state.reset);

  const masteryList = countries
    .map((country) => ({
      country,
      mastery: masteryForIds(
        factIdsForCountry(country, facts, regions),
        progress,
      ),
    }))
    .sort(
      (a, b) =>
        b.mastery.percent - a.mastery.percent ||
        a.country.name.de.localeCompare(b.country.name.de, "de"),
    );

  const unlockedCount = Object.keys(achievements).length;

  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-ink/35 p-3 backdrop-blur-sm sm:p-6">
      <div className="max-h-[88dvh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/70 bg-paper p-5 shadow-2xl sm:p-6">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-teal text-2xl text-white">
            🏆
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal">
              Deine Sammlung
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              Fortschritt & Erfolge
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Sammlung schließen"
            className="grid h-9 w-9 place-items-center rounded-full bg-paper-deep text-ink-muted transition hover:bg-line hover:text-ink"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stats
            label="XP"
            value={numberFormat.format(totalXp)}
          />
          <Stats label="Runs" value={String(runs.length)} />
          <Stats label="Beste Serie" value={String(bestStreak)} />
          <Stats
            label="Tages-Streak"
            value={`${daily.streak} 🔥`}
          />
        </div>

        <div className="mt-5 flex items-center justify-between">
          <h3 className="text-sm font-extrabold uppercase tracking-[0.12em] text-ink-muted">
            Erfolge
          </h3>
          <span className="text-xs font-semibold text-ink-muted">
            {unlockedCount}/{ACHIEVEMENTS.length}
          </span>
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {ACHIEVEMENTS.map((achievement) => {
            const unlocked = Boolean(achievements[achievement.id]);
            return (
              <div
                key={achievement.id}
                className={`flex items-start gap-3 rounded-2xl border px-3 py-2.5 ${
                  unlocked
                    ? "border-teal/40 bg-teal-soft/50"
                    : "border-line/70 bg-white/50 opacity-65"
                }`}
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-lg shadow-sm">
                  {achievement.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold">{achievement.title}</div>
                  <div className="text-xs text-ink-muted">
                    {achievement.description}
                  </div>
                </div>
                <div className="ml-auto text-sm">
                  {unlocked ? "✅" : "🔒"}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <h3 className="text-sm font-extrabold uppercase tracking-[0.12em] text-ink-muted">
            Länder-Mastery
          </h3>
          <span className="text-xs font-semibold text-ink-muted">
            {Object.keys(visitedCountries).length} besucht
          </span>
        </div>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {masteryList.map(({ country, mastery }) => (
            <div
              key={country.code}
              className="flex items-center gap-2.5 rounded-xl border border-line/60 bg-white/60 px-2.5 py-2"
            >
              <img
                src={country.flag_url}
                alt=""
                className="h-6 w-6 rounded object-cover"
              />
              <span className="min-w-0 flex-1 truncate text-xs font-bold">
                {country.name.de}
              </span>
              <span className="text-[10px] font-semibold text-ink-muted">
                {mastery.learned}/{mastery.total}
              </span>
              <div className="h-1.5 w-12 overflow-hidden rounded-full bg-line/60">
                <div
                  className="h-full rounded-full bg-teal"
                  style={{ width: `${mastery.percent}%` }}
                />
              </div>
              <Stars mastery={mastery} />
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-3">
          <p className="text-[10px] text-ink-muted">
            Tages-Challenge: {daily.lastPlayed ?? "noch nicht gespielt"}
          </p>
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  "Wirklich den gesamten Fortschritt löschen?",
                )
              ) {
                reset();
              }
            }}
            className="rounded-full border border-coral/30 px-3 py-1.5 text-[11px] font-bold text-coral transition hover:bg-coral/10"
          >
            Fortschritt löschen
          </button>
        </div>
      </div>
    </div>
  );
}
