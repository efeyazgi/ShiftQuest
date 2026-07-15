import { xpAwards } from "@/data/career";
import type { AnswerAttempt, MissionResult } from "@/types";

export type AnswerScoreInput = Pick<
  AnswerAttempt,
  "correct" | "attemptNumber" | "responseTimeMs" | "hintUsed"
> & {
  baseXp?: number;
  combo?: number;
  fastResponseThresholdMs?: number;
};

export type AnswerScore = {
  score: number;
  xpEarned: number;
  coinsEarned: number;
  bonuses: {
    firstTry: number;
    noHint: number;
    quickResponse: number;
    combo: number;
  };
};

function nonNegativeInteger(value: number): number {
  return Math.max(0, Math.round(Number.isFinite(value) ? value : 0));
}

export function calculateAnswerScore(input: AnswerScoreInput): AnswerScore {
  if (!input.correct) {
    return {
      score: 0,
      xpEarned: 0,
      coinsEarned: 0,
      bonuses: { firstTry: 0, noHint: 0, quickResponse: 0, combo: 0 },
    };
  }

  const baseXp = nonNegativeInteger(input.baseXp ?? xpAwards.correctAnswer);
  const firstTry = input.attemptNumber === 1 ? xpAwards.firstTryBonus : 0;
  const noHint = !input.hintUsed ? Math.round(baseXp * 0.1) : 0;
  const quickResponse =
    input.responseTimeMs > 0 &&
    input.responseTimeMs <= (input.fastResponseThresholdMs ?? 8_000)
      ? Math.round(baseXp * 0.1)
      : 0;
  const combo = Math.min(5, nonNegativeInteger(input.combo ?? 0));
  const comboBonus = Math.round(baseXp * combo * 0.04);
  const xpEarned = baseXp + firstTry + noHint + quickResponse + comboBonus;
  const attemptPenalty = Math.min(35, Math.max(0, input.attemptNumber - 1) * 12);
  const score = Math.max(
    50,
    Math.min(
      100,
      100 - attemptPenalty - (input.hintUsed ? 10 : 0) +
        (quickResponse > 0 ? 5 : 0),
    ),
  );

  return {
    score,
    xpEarned,
    coinsEarned: Math.max(1, Math.floor(xpEarned / 10)),
    bonuses: { firstTry, noHint, quickResponse, combo: comboBonus },
  };
}

export type MissionRewardInput = {
  attempts: AnswerAttempt[];
  baseXpReward: number;
  baseCoinReward: number;
  isBossBattle?: boolean;
  isDailyShift?: boolean;
  streakDays?: number;
};

export type MissionReward = {
  score: number;
  accuracy: number;
  correctAnswers: number;
  totalSteps: number;
  firstTryCorrect: number;
  hintsUsed: number;
  xpEarned: number;
  coinsEarned: number;
  bonuses: {
    flawlessXp: number;
    noHintXp: number;
    bossXp: number;
    dailyXp: number;
    streakXp: number;
  };
};

function groupAttemptsByStep(
  attempts: AnswerAttempt[],
): Map<string, AnswerAttempt[]> {
  const groups = new Map<string, AnswerAttempt[]>();
  for (const attempt of attempts) {
    const group = groups.get(attempt.stepId) ?? [];
    group.push(attempt);
    groups.set(attempt.stepId, group);
  }

  for (const group of groups.values()) {
    group.sort(
      (left, right) =>
        left.attemptNumber - right.attemptNumber ||
        Date.parse(left.createdAt) - Date.parse(right.createdAt),
    );
  }
  return groups;
}

export function calculateMissionRewards(
  input: MissionRewardInput,
): MissionReward {
  const groups = groupAttemptsByStep(input.attempts);
  const totalSteps = groups.size;
  let correctAnswers = 0;
  let firstTryCorrect = 0;
  let hintsUsed = 0;

  for (const attempts of groups.values()) {
    const solved = attempts.some((attempt) => attempt.correct);
    if (solved) correctAnswers += 1;
    if (attempts[0]?.correct) firstTryCorrect += 1;
    if (attempts.some((attempt) => attempt.hintUsed)) hintsUsed += 1;
  }

  const accuracy = totalSteps === 0 ? 0 : correctAnswers / totalSteps;
  const firstTryRate = totalSteps === 0 ? 0 : firstTryCorrect / totalSteps;
  const baseXp = nonNegativeInteger(input.baseXpReward) * accuracy;
  const flawlessXp =
    accuracy === 1 && totalSteps > 0 ? xpAwards.perfectScenario : 0;
  const noHintXp = hintsUsed === 0 && totalSteps > 0 ? Math.round(baseXp * 0.1) : 0;
  const bossXp = input.isBossBattle ? xpAwards.bossBattle : 0;
  const dailyXp = input.isDailyShift ? xpAwards.dailyShift : 0;
  const streakXp =
    nonNegativeInteger(input.streakDays ?? 0) > 0 ? xpAwards.streakDay : 0;
  const xpEarned = nonNegativeInteger(
    baseXp + flawlessXp + noHintXp + bossXp + dailyXp + streakXp,
  );
  const coinMultiplier = 0.45 + accuracy * 0.55;
  const coinsEarned =
    correctAnswers === 0
      ? 0
      : nonNegativeInteger(
          input.baseCoinReward * coinMultiplier + (input.isBossBattle ? 10 : 0),
        );
  const score = Math.round(
    Math.min(100, accuracy * 75 + firstTryRate * 20 + (hintsUsed === 0 ? 5 : 0)),
  );

  return {
    score,
    accuracy: Math.round(accuracy * 10_000) / 100,
    correctAnswers,
    totalSteps,
    firstTryCorrect,
    hintsUsed,
    xpEarned,
    coinsEarned,
    bonuses: { flawlessXp, noHintXp, bossXp, dailyXp, streakXp },
  };
}

export type MissionResultInput = MissionRewardInput & {
  scenarioId: string;
  completedAt?: string;
  newVocabularyIds?: string[];
};

export function buildMissionResult(input: MissionResultInput): MissionResult {
  const reward = calculateMissionRewards(input);
  const incorrectVocabulary = new Set<string>();
  for (const attempt of input.attempts) {
    if (!attempt.correct) {
      for (const vocabularyId of attempt.vocabularyIds) {
        incorrectVocabulary.add(vocabularyId);
      }
    }
  }

  return {
    scenarioId: input.scenarioId,
    completedAt: input.completedAt ?? new Date().toISOString(),
    score: reward.score,
    accuracy: reward.accuracy,
    correctAnswers: reward.correctAnswers,
    totalSteps: reward.totalSteps,
    xpEarned: reward.xpEarned,
    coinsEarned: reward.coinsEarned,
    hintsUsed: reward.hintsUsed,
    firstTryCorrect: reward.firstTryCorrect,
    newVocabularyIds: [...new Set(input.newVocabularyIds ?? [])],
    reviewVocabularyIds: [...incorrectVocabulary],
    attempts: input.attempts.map((attempt) => ({ ...attempt })),
  };
}

export const scoreAnswer = calculateAnswerScore;
export const scoreMission = calculateMissionRewards;
