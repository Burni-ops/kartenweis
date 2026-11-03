import type { AnswerFeedback, Question, UserAnswer } from "../game/types";
import { formatDistance } from "../game/geo";

const ICONS: Record<string, string> = {
  capital: "🏙️",
  city: "🏙️",
  country: "🌍",
  river: "🌊",
  mountain: "🏔️",
  lake: "💧",
  sea: "🌊",
  strait: "⚓",
  landmark: "🏛️",
  neighbor: "🤝",
  region: "🗺️",
  extreme: "⚡",
};

const PRECISION_LABEL: Record<string, string> = {
  perfect: "Perfekt",
  great: "Sehr gut",
  close: "Knapp daneben",
  miss: "Daneben",
};

const CATEGORY_LABEL: Record<string, string> = {
  capital: "Hauptstadt",
  city: "Stadt",
  country: "Länderwissen",
  river: "Fluss",
  mountain: "Berg",
  lake: "See",
  sea: "Meer",
  strait: "Meerenge",
  landmark: "Wahrzeichen",
  neighbor: "Nachbar",
  region: "Region",
  extreme: "Extrem",
};

type Props = {
  question: Question;
  feedback: AnswerFeedback | null;
  onAnswer: (answer: UserAnswer) => void;
  onNext: () => void;
  onSkip: () => void;
  isLast: boolean;
  showRevealHint: boolean;
};

export default function QuestionCard({
  question,
  feedback,
  onAnswer,
  onNext,
  onSkip,
  isLast,
  showRevealHint,
}: Props) {
  const isMapQuestion = question.interaction !== "mc";

  return (
    <div className="relative z-30 shrink-0">
      <div className="sheet safe-bottom sheet-enter pointer-events-auto mx-auto w-[94%] max-w-2xl rounded-t-3xl px-5 pt-4 sm:mb-5 sm:rounded-3xl">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-ink/15 sm:hidden" />

        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-teal-soft text-xl">
            {ICONS[question.category] ?? "🧭"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal">
              {CATEGORY_LABEL[question.category] ?? "Frage"}
            </div>
            <h2 className="text-base font-extrabold leading-snug tracking-tight sm:text-lg">
              {question.prompt}
            </h2>
          </div>
          {feedback && (
            <div
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold ${
                feedback.correct
                  ? "bg-teal/15 text-teal"
                  : "bg-coral/15 text-coral"
              }`}
            >
              {feedback.correct ? `+${feedback.points}` : "+0"}
            </div>
          )}
        </div>

        {!feedback && question.interaction === "mc" && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {question.options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onAnswer({ kind: "mc", value: option })}
                className="rounded-2xl border border-line bg-white/80 px-3 py-3 text-left text-sm font-bold text-ink shadow-sm transition hover:border-teal hover:bg-teal-soft/60 active:scale-[0.99]"
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {!feedback && isMapQuestion && (
          <div className="mt-4 rounded-2xl border border-dashed border-teal/40 bg-teal-soft/30 px-4 py-3">
            <p className="text-sm font-semibold text-ink">
              {question.interaction === "drag"
                ? "Ziehe das Symbol an die richtige Stelle auf der Karte."
                : question.interaction === "tap-country"
                  ? "Tippe das Land auf der Karte an."
                  : "Tippe die Region auf der Karte an."}
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Du kannst die Karte vorher zoomen und verschieben.
            </p>
          </div>
        )}

        {!feedback && isMapQuestion && (
          <button
            type="button"
            onClick={onSkip}
            className="mt-3 w-full rounded-2xl border border-line bg-white/60 px-4 py-2 text-xs font-bold text-ink-muted transition hover:border-coral hover:text-coral"
          >
            Ich weiß es nicht
          </button>
        )}

        {feedback && (
          <div className="mt-3" aria-live="polite">
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {feedback.correct ? "✅" : "❌"}
              </span>
              <span
                className={`text-sm font-extrabold ${
                  feedback.correct ? "text-teal" : "text-coral"
                }`}
              >
                {feedback.correct ? "Richtig!" : "Leider falsch"}
              </span>
              {feedback.distanceKm !== null && (
                <span className="text-xs font-semibold text-ink-muted">
                  {PRECISION_LABEL[feedback.precision ?? "miss"]} ·{" "}
                  {formatDistance(feedback.distanceKm)} entfernt
                </span>
              )}
            </div>

            <div className="mt-2 rounded-2xl bg-paper-deep/70 px-3.5 py-2.5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                Richtige Antwort
              </div>
              <div className="text-sm font-bold">{feedback.answerLabel}</div>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                {feedback.fact}
              </p>
            </div>

            {showRevealHint && (
              <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-teal">
                <span>🗺️</span>
                Auf der Karte markiert: {feedback.answerLabel}
              </div>
            )}

            <button
              type="button"
              onClick={onNext}
              className="mt-3 w-full rounded-2xl bg-teal px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-teal/90 active:scale-[0.99]"
            >
              {isLast ? "Ergebnis ansehen" : "Weiter"}
            </button>
          </div>
        )}

        {isMapQuestion && (
          <p className="mt-2 text-center text-[10px] text-ink-muted">
            Tippe auf die Karte, um Länder und Regionen zu erkunden.
          </p>
        )}
      </div>
    </div>
  );
}
