import type { RunSummary } from "../game/types";

type Props = {
  summary: RunSummary;
  onRestart: () => void;
  onExit: () => void;
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-paper-deep/70 px-3 py-2.5 text-center">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
        {label}
      </div>
      <div className="mt-0.5 text-lg font-extrabold text-ink">{value}</div>
    </div>
  );
}

export default function ResultCard({ summary, onRestart, onExit }: Props) {
  const accuracy =
    summary.total > 0
      ? Math.round((summary.correctCount / summary.total) * 100)
      : 0;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center p-4">
      <div className="pointer-events-auto w-full max-w-md rounded-3xl border border-white/70 bg-white/95 p-6 shadow-2xl backdrop-blur-xl">
        <div className="text-center">
          <div className="text-4xl">
            {accuracy >= 80 ? "🏆" : accuracy >= 50 ? "🎉" : "🧭"}
          </div>
          <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-teal">
            Run beendet
          </div>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight">
            {summary.score.toLocaleString("de-DE")} Punkte
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {accuracy >= 80
              ? "Stark! Du kennst dich aus."
              : accuracy >= 50
                ? "Guter Lauf — weiter so."
                : "Jede Runde macht dich besser."}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <Stat label="Richtig" value={`${summary.correctCount}/${summary.total}`} />
          <Stat label="Quote" value={`${accuracy}%`} />
          <Stat label="Beste Serie" value={`${summary.bestStreak}`} />
        </div>

        <div className="mt-4 rounded-2xl bg-teal-soft/60 px-4 py-3 text-center text-sm font-semibold text-teal">
          +{summary.score.toLocaleString("de-DE")} XP gesammelt
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onRestart}
            className="flex-1 rounded-2xl bg-teal px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-teal/90 active:scale-[0.99]"
          >
            Nochmal
          </button>
          <button
            type="button"
            onClick={onExit}
            className="rounded-2xl border border-line bg-white px-4 py-3 text-sm font-bold text-ink transition hover:border-teal hover:text-teal"
          >
            Zur Karte
          </button>
        </div>
      </div>
    </div>
  );
}
