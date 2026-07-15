import type {
  AnalyticsSummary,
  AnswerAttempt,
  CategoryPerformance,
  LearningErrorType,
  ScenarioCategory,
  ScenarioStepType,
  SkillScores,
  StrugglingVocabulary,
} from "@/types";

export type PerformanceAnalysisOptions = {
  now?: Date;
  recentWindowDays?: number;
  vocabularyMastery?: Readonly<Record<string, number>>;
  strugglingVocabularyLimit?: number;
};

const CATEGORY_LABELS: Record<ScenarioCategory, string> = {
  office: "office communication",
  production: "production communication",
  meeting: "meeting communication",
  quality: "quality and documentation",
  safety: "safety communication",
  career: "career and social communication",
};

const ERROR_LABELS: Record<LearningErrorType, string> = {
  grammar: "grammar",
  vocabulary: "vocabulary choice",
  listening: "listening",
  tone: "professional tone",
  "word-order": "word order",
  comprehension: "comprehension",
  timeout: "response timing",
};

function roundedPercentage(correct: number, total: number): number {
  return total === 0 ? 0 : Math.round((correct / total) * 10_000) / 100;
}

function average(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function accuracyFor(attempts: readonly AnswerAttempt[]): number {
  return roundedPercentage(
    attempts.filter((attempt) => attempt.correct).length,
    attempts.length,
  );
}

function categoryPerformance(
  attempts: readonly AnswerAttempt[],
): CategoryPerformance[] {
  const categories = new Map<ScenarioCategory, AnswerAttempt[]>();
  for (const attempt of attempts) {
    const group = categories.get(attempt.category) ?? [];
    group.push(attempt);
    categories.set(attempt.category, group);
  }

  return [...categories.entries()]
    .map(([category, group]) => ({
      category,
      attempts: group.length,
      correct: group.filter((attempt) => attempt.correct).length,
      accuracy: accuracyFor(group),
      averageResponseTimeMs: average(
        group
          .map((attempt) => attempt.responseTimeMs)
          .filter((value) => Number.isFinite(value) && value >= 0),
      ),
    }))
    .sort((left, right) => left.category.localeCompare(right.category));
}

function rankCategories(performance: readonly CategoryPerformance[]): {
  strongestCategory?: ScenarioCategory;
  weakestCategory?: ScenarioCategory;
} {
  if (performance.length === 0) return {};

  const strongest = [...performance].sort(
    (left, right) =>
      right.accuracy - left.accuracy ||
      right.attempts - left.attempts ||
      left.category.localeCompare(right.category),
  )[0];
  const weakest = [...performance].sort(
    (left, right) =>
      left.accuracy - right.accuracy ||
      right.attempts - left.attempts ||
      left.category.localeCompare(right.category),
  )[0];

  return {
    strongestCategory: strongest?.category,
    weakestCategory: weakest?.category,
  };
}

function findMostFrequentError(
  attempts: readonly AnswerAttempt[],
): LearningErrorType | undefined {
  const counts = new Map<LearningErrorType, number>();
  for (const attempt of attempts) {
    if (attempt.correct || !attempt.errorType) continue;
    counts.set(attempt.errorType, (counts.get(attempt.errorType) ?? 0) + 1);
  }

  return [...counts.entries()].sort(
    (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
  )[0]?.[0];
}

function findStrugglingVocabulary(
  attempts: readonly AnswerAttempt[],
  options: PerformanceAnalysisOptions,
): StrugglingVocabulary[] {
  const vocabulary = new Map<
    string,
    { correct: number; incorrect: number; lastSeenAt: string; lastSeenMs: number }
  >();

  for (const attempt of attempts) {
    const seenMs = Date.parse(attempt.createdAt);
    for (const vocabularyId of new Set(attempt.vocabularyIds)) {
      const current = vocabulary.get(vocabularyId) ?? {
        correct: 0,
        incorrect: 0,
        lastSeenAt: attempt.createdAt,
        lastSeenMs: Number.isFinite(seenMs) ? seenMs : 0,
      };
      if (attempt.correct) current.correct += 1;
      else current.incorrect += 1;
      if (Number.isFinite(seenMs) && seenMs >= current.lastSeenMs) {
        current.lastSeenMs = seenMs;
        current.lastSeenAt = attempt.createdAt;
      }
      vocabulary.set(vocabularyId, current);
    }
  }

  return [...vocabulary.entries()]
    .filter(([, value]) => value.incorrect > 0)
    .map(([vocabularyId, value]) => ({
      vocabularyId,
      incorrectCount: value.incorrect,
      lastSeenAt: value.lastSeenAt,
      masteryScore: Math.max(
        0,
        Math.min(
          100,
          Math.round(
            options.vocabularyMastery?.[vocabularyId] ??
              roundedPercentage(value.correct, value.correct + value.incorrect),
          ),
        ),
      ),
    }))
    .sort(
      (left, right) =>
        right.incorrectCount - left.incorrectCount ||
        left.masteryScore - right.masteryScore ||
        Date.parse(right.lastSeenAt) - Date.parse(left.lastSeenAt),
    )
    .slice(0, options.strugglingVocabularyLimit ?? 10);
}

const VOCABULARY_TYPES: ReadonlySet<ScenarioStepType> = new Set([
  "fill-blank",
  "matching",
  "word-puzzle",
]);
const GRAMMAR_TYPES: ReadonlySet<ScenarioStepType> = new Set([
  "sentence-builder",
  "fill-blank",
]);
const COMMUNICATION_TYPES: ReadonlySet<ScenarioStepType> = new Set([
  "dialogue-choice",
  "tone-check",
  "quick-response",
  "roleplay",
  "boss-battle",
]);

function skillAccuracy(
  attempts: readonly AnswerAttempt[],
  predicate: (attempt: AnswerAttempt) => boolean,
  fallback: number,
): number {
  const matching = attempts.filter(predicate);
  return matching.length === 0 ? fallback : accuracyFor(matching);
}

function calculateSkillScores(attempts: readonly AnswerAttempt[]): SkillScores {
  const overall = accuracyFor(attempts);
  return {
    vocabulary: skillAccuracy(
      attempts,
      (attempt) =>
        VOCABULARY_TYPES.has(attempt.questionType) ||
        attempt.errorType === "vocabulary",
      overall,
    ),
    listening: skillAccuracy(
      attempts,
      (attempt) =>
        attempt.questionType === "listening" || attempt.errorType === "listening",
      overall,
    ),
    grammar: skillAccuracy(
      attempts,
      (attempt) =>
        GRAMMAR_TYPES.has(attempt.questionType) || attempt.errorType === "grammar",
      overall,
    ),
    communication: skillAccuracy(
      attempts,
      (attempt) => COMMUNICATION_TYPES.has(attempt.questionType),
      overall,
    ),
  };
}

export function buildPerformanceInsights(input: {
  strongestCategory?: ScenarioCategory;
  weakestCategory?: ScenarioCategory;
  mostFrequentError?: LearningErrorType;
  averageResponseTimeMs: number;
  improvementPercent: number;
  attemptCount: number;
}): string[] {
  if (input.attemptCount === 0) {
    return ["Complete a mission to unlock your first performance insight."];
  }

  const insights: string[] = [];
  if (input.strongestCategory) {
    insights.push(
      `You perform best in ${CATEGORY_LABELS[input.strongestCategory]}.`,
    );
  }
  if (
    input.weakestCategory &&
    input.weakestCategory !== input.strongestCategory
  ) {
    insights.push(
      `A short review of ${CATEGORY_LABELS[input.weakestCategory]} would help most.`,
    );
  }
  if (input.mostFrequentError) {
    insights.push(
      `Your most frequent challenge is ${ERROR_LABELS[input.mostFrequentError]}.`,
    );
  }
  if (input.improvementPercent >= 5) {
    insights.push(
      `Your recent accuracy improved by ${input.improvementPercent.toFixed(1)} percentage points.`,
    );
  } else if (input.improvementPercent <= -5) {
    insights.push(
      "Recent accuracy dipped; review due vocabulary before the next mission.",
    );
  } else if (input.averageResponseTimeMs > 20_000) {
    insights.push(
      "Your answers are accurate enough to start practising quicker responses.",
    );
  }

  return insights.slice(0, 5);
}

export function calculatePerformanceAnalysis(
  attempts: readonly AnswerAttempt[],
  options: PerformanceAnalysisOptions = {},
): AnalyticsSummary {
  const now = options.now ?? new Date();
  const windowDays = Math.max(1, Math.min(90, options.recentWindowDays ?? 7));
  const recentStart = now.getTime() - windowDays * 86_400_000;
  const previousStart = recentStart - windowDays * 86_400_000;
  const recentAttempts = attempts.filter((attempt) => {
    const timestamp = Date.parse(attempt.createdAt);
    return Number.isFinite(timestamp) && timestamp >= recentStart && timestamp <= now.getTime();
  });
  const previousAttempts = attempts.filter((attempt) => {
    const timestamp = Date.parse(attempt.createdAt);
    return Number.isFinite(timestamp) && timestamp >= previousStart && timestamp < recentStart;
  });

  const performance = categoryPerformance(attempts);
  const ranked = rankCategories(performance);
  const mostFrequentError = findMostFrequentError(attempts);
  const averageResponseTimeMs = average(
    attempts
      .map((attempt) => attempt.responseTimeMs)
      .filter((value) => Number.isFinite(value) && value >= 0),
  );
  const recentAccuracy = accuracyFor(recentAttempts);
  const previousAccuracy = accuracyFor(previousAttempts);
  const improvementPercent =
    recentAttempts.length > 0 && previousAttempts.length > 0
      ? Math.round((recentAccuracy - previousAccuracy) * 10) / 10
      : 0;
  const insights = buildPerformanceInsights({
    ...ranked,
    mostFrequentError,
    averageResponseTimeMs,
    improvementPercent,
    attemptCount: attempts.length,
  });

  return {
    generatedAt: now.toISOString(),
    ...ranked,
    categoryPerformance: performance,
    strugglingVocabulary: findStrugglingVocabulary(attempts, options),
    mostFrequentError,
    averageResponseTimeMs,
    recentAccuracy,
    previousAccuracy,
    improvementPercent,
    skillScores: calculateSkillScores(attempts),
    insights,
  };
}

export const calculateAnalytics = calculatePerformanceAnalysis;
