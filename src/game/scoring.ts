import {
  haversineKm,
  precisionForDistance,
  precisionMultiplier,
  type Precision,
} from "./geo";
import type { AnswerFeedback, Question, UserAnswer } from "./types";

export const MAX_STREAK_MULTIPLIER = 2;

export function streakMultiplier(streak: number): number {
  return Math.min(1 + Math.max(0, streak) * 0.1, MAX_STREAK_MULTIPLIER);
}

export interface Evaluation {
  feedback: AnswerFeedback;
  correct: boolean;
  points: number;
  distanceKm: number | null;
  precision: Precision | null;
}

function basePoints(question: Question): number {
  return 100 * question.difficulty;
}

export function evaluateAnswer(
  question: Question,
  answer: UserAnswer,
  streak: number,
): Evaluation {
  let correct = false;
  let points = 0;
  let distanceKm: number | null = null;
  let precision: Precision | null = null;
  let userLabel: string | null = null;
  let userPoint: [number, number] | null = null;

  if (question.interaction === "mc" && answer.kind === "mc") {
    correct = answer.value === question.answer.label;
    userLabel = answer.value;
    points = correct
      ? Math.round(basePoints(question) * streakMultiplier(streak))
      : 0;
  }

  if (question.interaction === "drag" && answer.kind === "drag") {
    if (question.answer.point) {
      distanceKm = haversineKm(answer.point, question.answer.point);
      precision = precisionForDistance(distanceKm);
      correct = precision !== "miss";
      points = Math.round(
        basePoints(question) *
          precisionMultiplier(precision) *
          streakMultiplier(streak),
      );
      userLabel = "Deine Position";
      userPoint = answer.point;
    }
  }

  if (
    question.interaction === "tap-country" &&
    answer.kind === "tap-country"
  ) {
    correct = answer.countryCode === question.answer.countryCode;
    userLabel = answer.countryCode;
    points = correct
      ? Math.round(basePoints(question) * streakMultiplier(streak))
      : 0;
  }

  if (question.interaction === "tap-region" && answer.kind === "tap-region") {
    correct = answer.regionCode === question.answer.regionCode;
    userLabel = answer.regionCode;
    points = correct
      ? Math.round(basePoints(question) * streakMultiplier(streak))
      : 0;
  }

  return {
    feedback: {
      correct,
      points,
      answerLabel: question.answer.label,
      userLabel,
      userPoint,
      distanceKm,
      precision,
      fact: question.fact,
    },
    correct,
    points,
    distanceKm,
    precision,
  };
}

export function accuracy(correct: number, total: number): number {
  if (total <= 0) return 0;
  return correct / total;
}
