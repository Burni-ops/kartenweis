import { useCallback, useEffect, useMemo, useState } from "react";
import type { FeatureCollection, Geometry } from "geojson";
import MapView from "../map/MapView";
import CountrySheet from "../components/CountrySheet";
import QuestionCard from "../components/QuestionCard";
import ResultCard from "../components/ResultCard";
import RunHud from "../components/RunHud";
import AtlasPanel from "../components/AtlasPanel";
import CollectionPanel from "../components/CollectionPanel";
import SettingsPanel from "../components/SettingsPanel";
import OnboardingOverlay from "../components/OnboardingOverlay";
import {
  loadCountries,
  loadDachRegions,
  loadEuropeMap,
  loadFacts,
  loadReveals,
} from "../data/load";
import { buildRun } from "../game/questions";
import { mulberry32 } from "../game/random";
import { evaluateAnswer } from "../game/scoring";
import { questionHasReveal } from "../game/reveal";
import {
  buildAtlasFeatures,
  factIdsForCountry,
  masteryForIds,
} from "../game/atlas";
import { dailySeed, todayKey } from "../game/daily";
import { masteryMap, useProgress } from "../store/progress";
import { useSettings } from "../store/settings";
import { playClick, playCorrect, playWrong } from "../audio/sfx";
import type {
  CountriesDataset,
  Country,
  Region,
  RegionFeatureCollection,
} from "../data/types";
import type {
  AnswerFeedback,
  Fact,
  RevealMap,
  RunConfig,
  RunState,
  RunSummary,
  UserAnswer,
} from "../game/types";

type Mode = "browse" | "run" | "result" | "atlas";

export default function App() {
  const [dataset, setDataset] = useState<CountriesDataset | null>(null);
  const [europe, setEurope] = useState<FeatureCollection<Geometry> | null>(
    null,
  );
  const [regionsGeo, setRegionsGeo] =
    useState<RegionFeatureCollection | null>(null);
  const [facts, setFacts] = useState<Fact[] | null>(null);
  const [reveals, setReveals] = useState<RevealMap | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [mode, setMode] = useState<Mode>("browse");
  const [run, setRun] = useState<RunState | null>(null);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [atlasCountry, setAtlasCountry] = useState<Country | null>(null);
  const [atlasSelectedId, setAtlasSelectedId] = useState<string | null>(null);
  const [atlasLayers, setAtlasLayers] = useState({
    points: true,
    water: true,
    regions: true,
  });
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const recordAnswer = useProgress((state) => state.recordAnswer);
  const recordRun = useProgress((state) => state.recordRun);
  const recordCountryVisit = useProgress(
    (state) => state.recordCountryVisit,
  );
  const recordDaily = useProgress((state) => state.recordDaily);
  const progressFacts = useProgress((state) => state.facts);
  const daily = useProgress((state) => state.daily);
  const sound = useSettings((state) => state.sound);
  const reducedMotion = useSettings((state) => state.reducedMotion);
  const onboardingDone = useSettings(
    (state) => state.onboardingDone,
  );
  const completeOnboarding = useSettings(
    (state) => state.completeOnboarding,
  );

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (window as unknown as { __app?: unknown }).__app = {
      mode,
      run,
      feedback,
      summary,
    };
  }, [mode, run, feedback, summary]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      loadCountries(),
      loadEuropeMap(),
      loadDachRegions(),
      loadFacts(),
      loadReveals(),
    ])
      .then(([countries, map, regions, factList, revealMap]) => {
        if (cancelled) return;
        setDataset(countries);
        setEurope(map);
        setRegionsGeo(regions);
        setFacts(factList);
        setReveals(revealMap);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setError(
          reason instanceof Error
            ? reason.message
            : "Die Spieldaten konnten nicht geladen werden.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle(
      "reduce-motion",
      reducedMotion,
    );
  }, [reducedMotion]);

  const regions = useMemo(
    () =>
      regionsGeo
        ? regionsGeo.features.map(
            (feature) => feature.properties as Region,
          )
        : [],
    [regionsGeo],
  );

  const activeQuestion =
    mode === "run" && run ? (run.questions[run.index] ?? null) : null;
  const showRevealHint =
    activeQuestion && reveals
      ? questionHasReveal(activeQuestion, reveals)
      : false;

  const today = todayKey();
  const dailyDone = daily.lastPlayed === today;

  const atlasFeatures = useMemo(
    () =>
      atlasCountry && facts && reveals
        ? buildAtlasFeatures(atlasCountry, facts, reveals, regions)
        : [],
    [atlasCountry, facts, reveals, regions],
  );

  const atlasSelectedFeature = useMemo(
    () =>
      atlasFeatures.find((feature) => feature.id === atlasSelectedId) ??
      null,
    [atlasFeatures, atlasSelectedId],
  );

  const atlasMastery = useMemo(
    () =>
      atlasCountry && facts
        ? masteryForIds(
            factIdsForCountry(atlasCountry, facts, regions),
            progressFacts,
          )
        : null,
    [atlasCountry, facts, regions, progressFacts],
  );

  const selectedCountryMastery = useMemo(
    () =>
      selectedCountry && facts
        ? masteryForIds(
            factIdsForCountry(selectedCountry, facts, regions),
            progressFacts,
          )
        : null,
    [selectedCountry, facts, regions, progressFacts],
  );

  const handleSelectCountry = useCallback((country: Country | null) => {
    setSelectedCountry(country);
    setSelectedRegion(null);
  }, []);

  const handleSelectRegion = useCallback((region: Region | null) => {
    setSelectedRegion(region);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedCountry(null);
    setSelectedRegion(null);
  }, []);

  const beginRun = useCallback(
    (config: RunConfig) => {
      if (!dataset || !facts) return;

      const questions = buildRun(
        config,
        dataset.countries,
        regions,
        facts,
        masteryMap(),
        mulberry32(config.seed),
      );

      if (questions.length === 0) return;

      playClick(sound);
      setSelectedCountry(null);
      setSelectedRegion(null);
      setAtlasCountry(null);
      setAtlasSelectedId(null);
      setCollectionOpen(false);
      setRun({
        config,
        questions,
        index: 0,
        score: 0,
        streak: 0,
        bestStreak: 0,
        correctCount: 0,
        startedAt: Date.now(),
      });
      setFeedback(null);
      setSummary(null);
      setMode("run");
    },
    [dataset, facts, regions, sound],
  );

  const startRun = useCallback(
    (scope: "europe" | "country", countryCode?: string) => {
      beginRun({
        scope,
        countryCode,
        count: 10,
        seed: Math.floor(Math.random() * 0xffffffff),
      });
    },
    [beginRun],
  );

  const handleStartEurope = useCallback(() => {
    startRun("europe");
  }, [startRun]);

  const handleStartCountry = useCallback(
    (countryCode: string) => {
      startRun("country", countryCode);
    },
    [startRun],
  );

  const handleStartDaily = useCallback(() => {
    if (dailyDone) return;
    beginRun({
      scope: "europe",
      count: 10,
      seed: dailySeed(),
      daily: true,
    });
  }, [beginRun, dailyDone]);

  const handleOpenAtlas = useCallback(
    (country: Country) => {
      setSelectedCountry(country);
      setSelectedRegion(null);
      setAtlasCountry(country);
      setAtlasSelectedId(null);
      setAtlasLayers({ points: true, water: true, regions: true });
      setCollectionOpen(false);
      setMode("atlas");
      recordCountryVisit(country.code);
    },
    [recordCountryVisit],
  );

  const handleCloseAtlas = useCallback(() => {
    setMode("browse");
    setAtlasCountry(null);
    setAtlasSelectedId(null);
  }, []);

  const handleToggleAtlasLayer = useCallback(
    (key: keyof typeof atlasLayers) => {
      setAtlasLayers((previous) => ({
        ...previous,
        [key]: !previous[key],
      }));
    },
    [atlasLayers],
  );

  const handleOpenCollection = useCallback(() => {
    setCollectionOpen(true);
  }, []);

  const handleCloseCollection = useCallback(() => {
    setCollectionOpen(false);
  }, []);

  const handleRunAnswer = useCallback(
    (answer: UserAnswer) => {
      if (!run || feedback) return;
      const question = run.questions[run.index];
      if (!question) return;

      const evaluation = evaluateAnswer(question, answer, run.streak);
      recordAnswer(question.factId, evaluation.correct, {
        category: question.category,
        country: question.countryCode,
      });
      if (evaluation.correct) playCorrect(sound);
      else playWrong(sound);
      setFeedback(evaluation.feedback);
      setRun((previous) => {
        if (!previous) return previous;
        const nextStreak = evaluation.correct
          ? previous.streak + 1
          : 0;
        return {
          ...previous,
          score: previous.score + evaluation.points,
          streak: nextStreak,
          bestStreak: Math.max(previous.bestStreak, nextStreak),
          correctCount:
            previous.correctCount + (evaluation.correct ? 1 : 0),
        };
      });
    },
    [run, feedback, recordAnswer, sound],
  );

  const handleSkip = useCallback(() => {
    if (!run || feedback) return;
    const question = run.questions[run.index];
    if (!question) return;

    recordAnswer(question.factId, false, {
      category: question.category,
      country: question.countryCode,
    });
    playWrong(sound);
    setFeedback({
      correct: false,
      points: 0,
      answerLabel: question.answer.label,
      userLabel: null,
      distanceKm: null,
      precision: null,
      fact: question.fact,
    });
    setRun((previous) =>
      previous ? { ...previous, streak: 0 } : previous,
    );
  }, [run, feedback, recordAnswer]);

  const handleNext = useCallback(() => {
    if (!run) return;

    if (run.index + 1 < run.questions.length) {
      setRun({ ...run, index: run.index + 1 });
      setFeedback(null);
      return;
    }

    const result: RunSummary = {
      config: run.config,
      score: run.score,
      correctCount: run.correctCount,
      total: run.questions.length,
      bestStreak: run.bestStreak,
      startedAt: run.startedAt,
      finishedAt: Date.now(),
    };
    recordRun(result);
    if (run.config.daily) {
      recordDaily(todayKey());
    }
    setSummary(result);
    setFeedback(null);
    setMode("result");
  }, [run, recordRun, recordDaily]);

  const handleRestart = useCallback(() => {
    if (!summary) return;
    startRun(summary.config.scope, summary.config.countryCode);
  }, [summary, startRun]);

  const handleExitRun = useCallback(() => {
    if (
      mode === "run" &&
      !window.confirm(
        "Run beenden? Der Fortschritt in diesem Run geht verloren.",
      )
    ) {
      return;
    }
    setMode("browse");
    setRun(null);
    setFeedback(null);
    setSummary(null);
  }, [mode]);

  const handleExitResult = useCallback(() => {
    setMode("browse");
    setRun(null);
    setFeedback(null);
    setSummary(null);
  }, []);

  if (error) {
    return (
      <main className="map-shell grid place-items-center bg-paper p-6">
        <div className="glass max-w-md rounded-3xl p-6 text-center">
          <div className="text-3xl">🧭</div>
          <h1 className="mt-3 text-lg font-extrabold">Daten nicht gefunden</h1>
          <p className="mt-2 text-sm text-ink-muted">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-2xl bg-teal px-4 py-2 text-sm font-bold text-white"
          >
            Neu laden
          </button>
        </div>
      </main>
    );
  }

  if (!dataset || !europe || !regionsGeo || !facts || !reveals) {
    return (
      <main className="map-shell grid place-items-center bg-paper">
        <div className="glass flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-semibold">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-teal border-t-transparent" />
          Lade Geografie …
        </div>
      </main>
    );
  }

  return (
    <main className="map-shell flex flex-col">
      <div className="relative min-h-0 flex-1">
        <MapView
          countries={dataset.countries}
          europe={europe}
          regions={regionsGeo}
          selectedCountry={selectedCountry}
          selectedRegion={selectedRegion}
          onSelectCountry={handleSelectCountry}
          onSelectRegion={handleSelectRegion}
          runQuestion={activeQuestion}
          runFeedback={mode === "run" ? feedback : null}
          onRunAnswer={handleRunAnswer}
          reveals={reveals}
          atlasCountry={atlasCountry}
          atlasFeatures={atlasFeatures}
          atlasSelectedFeature={atlasSelectedFeature}
          onSelectAtlasFeature={setAtlasSelectedId}
          atlasLayers={atlasLayers}
        />

        {mode === "browse" && (
          <header className="pointer-events-none absolute inset-x-0 top-0 z-20 p-3 sm:p-5">
            <div className="glass pointer-events-auto mx-auto flex w-full max-w-2xl items-center gap-3 rounded-2xl px-3.5 py-2.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal text-xl text-white shadow-sm">
                🗺️
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-extrabold leading-tight tracking-tight">
                  Spasmitflaggen
                </div>
                <div className="text-[11px] font-medium text-ink-muted">
                  Europa · {dataset.countries.length} Länder · M3
                </div>
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleStartEurope}
                  className="rounded-full bg-teal px-3 py-1.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-teal/90 active:scale-[0.98]"
                >
                  ▶ <span className="hidden sm:inline">Europa-</span>Run
                </button>
                <button
                  type="button"
                  onClick={handleStartDaily}
                  disabled={dailyDone}
                  aria-label={
                    dailyDone
                      ? "Tages-Challenge erledigt"
                      : "Tages-Challenge starten"
                  }
                  title={
                    dailyDone
                      ? "Tages-Challenge erledigt"
                      : "Tages-Challenge starten"
                  }
                  className="grid h-8 w-8 place-items-center rounded-full bg-teal-soft text-sm text-teal transition hover:bg-teal-soft/70 disabled:opacity-50"
                >
                  📅
                </button>
                <button
                  type="button"
                  onClick={handleOpenCollection}
                  aria-label="Sammlung öffnen"
                  title="Sammlung öffnen"
                  className="grid h-8 w-8 place-items-center rounded-full bg-paper-deep text-sm text-ink-muted transition hover:bg-line hover:text-ink"
                >
                  🏆
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  aria-label="Einstellungen öffnen"
                  title="Einstellungen öffnen"
                  className="hidden h-9 w-9 place-items-center rounded-full bg-paper-deep text-sm text-ink-muted transition hover:bg-line hover:text-ink sm:grid"
                >
                  ⚙️
                </button>
              </div>
            </div>
          </header>
        )}

        {mode === "run" && run && activeQuestion && (
          <RunHud run={run} onExit={handleExitRun} />
        )}
      </div>

      {mode === "browse" && (
        <div className="relative z-20 shrink-0">
          <CountrySheet
            country={selectedCountry}
            regions={regions.filter(
              (region) => region.country === selectedCountry?.code,
            )}
            selectedRegion={selectedRegion}
            mastery={selectedCountryMastery}
            dailyDone={dailyDone}
            onSelectRegion={handleSelectRegion}
            onClose={handleClose}
            onStartRun={handleStartCountry}
            onStartEurope={handleStartEurope}
            onStartDaily={handleStartDaily}
            onOpenAtlas={handleOpenAtlas}
          />
        </div>
      )}

      {mode === "atlas" && atlasCountry && atlasMastery && (
        <AtlasPanel
          country={atlasCountry}
          features={atlasFeatures}
          mastery={atlasMastery}
          progress={progressFacts}
          selectedId={atlasSelectedId}
          onSelect={setAtlasSelectedId}
          onClose={handleCloseAtlas}
          layers={atlasLayers}
          onToggleLayer={handleToggleAtlasLayer}
        />
      )}

      {mode === "run" && run && activeQuestion && (
        <div className="relative z-30 shrink-0">
          <QuestionCard
            question={activeQuestion}
            feedback={feedback}
            onAnswer={handleRunAnswer}
            onNext={handleNext}
            onSkip={handleSkip}
            isLast={run.index + 1 >= run.questions.length}
            showRevealHint={showRevealHint}
          />
        </div>
      )}

      {mode === "result" && summary && (
        <ResultCard
          summary={summary}
          onRestart={handleRestart}
          onExit={handleExitResult}
        />
      )}

      {collectionOpen && (
        <CollectionPanel
          countries={dataset.countries}
          facts={facts}
          regions={regions}
          onClose={handleCloseCollection}
        />
      )}

      {settingsOpen && (
        <SettingsPanel onClose={() => setSettingsOpen(false)} />
      )}

      {!onboardingDone && (
        <OnboardingOverlay onDone={completeOnboarding} />
      )}
    </main>
  );
}
