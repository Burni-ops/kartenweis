import type { RunState } from "../game/types";

type Props = {
  run: RunState;
  onExit: () => void;
};

export default function RunHud({ run, onExit }: Props) {
  const current = run.index + 1;

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 p-3 sm:p-5">
      <div className="glass pointer-events-auto mx-auto flex w-full max-w-2xl items-center gap-3 rounded-2xl px-3 py-2.5">
        <button
          type="button"
          onClick={onExit}
          aria-label="Run beenden"
          title="Run beenden und Ergebnis ansehen"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper-deep text-ink-muted transition hover:bg-line hover:text-ink"
        >
          ←
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-muted">
            <span>Frage {current}</span>
            <span className="rounded-full bg-teal-soft px-2 py-0.5 text-[10px] font-extrabold text-teal">
              ∞ Endlos
            </span>
            <span className="text-ink">{run.score} Punkte</span>
          </div>
        </div>
        <div
          className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-extrabold ${
            run.streak > 0
              ? "bg-gold/20 text-ink"
              : "bg-paper-deep text-ink-muted"
          }`}
          title="Serie richtiger Antworten"
        >
          🔥 {run.streak}
        </div>
      </div>
    </header>
  );
}
