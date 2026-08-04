import { getScenarioById, getScenarioStep } from "@/data/scenarios";
import type {
  AnswerAttempt,
  LearningActivity,
  ScenarioCategory,
  UserProgress,
} from "@/types";

import type { AchievementFacts } from "./evaluator";

const categories: ScenarioCategory[] = [
  "office",
  "production",
  "meeting",
  "quality",
  "safety",
  "career",
];

export function buildAchievementFacts(
  progress: UserProgress,
  attempts: readonly AnswerAttempt[],
  activities: readonly LearningActivity[],
): AchievementFacts {
  const completedByCategory: Partial<Record<ScenarioCategory, number>> =
    Object.fromEntries(categories.map((category) => [category, 0]));

  for (const scenarioId of progress.completedScenarioIds) {
    const scenario = getScenarioById(scenarioId);
    if (scenario) {
      completedByCategory[scenario.category] =
        (completedByCategory[scenario.category] ?? 0) + 1;
    }
  }

  const bestScenarioAccuracy = Math.max(
    0,
    ...Object.values(progress.scenarioProgress).map((scenario) => scenario.bestAccuracy),
  );
  const noHintScenarioAccuracy = Math.max(
    0,
    ...activities
      .filter((activity) =>
        activity.type === "scenario-complete"
        && activity.metadata?.hintsUsed === 0,
      )
      .map((activity) => {
        const accuracy = activity.metadata?.accuracy;
        return typeof accuracy === "number" ? accuracy : 0;
      }),
  );
  const quickResponseWins = attempts.filter((attempt) => {
    if (!attempt.correct || attempt.questionType !== "quick-response") return false;
    const step = getScenarioStep(attempt.scenarioId, attempt.stepId);
    return step?.type === "quick-response"
      && attempt.responseTimeMs <= step.timeLimitSeconds * 1_000;
  }).length;
  const roleplaysCompleted = new Set(
    attempts
      .filter((attempt) => attempt.questionType === "roleplay")
      .map((attempt) => `${attempt.scenarioId}:${attempt.stepId}`),
  ).size;
  const bossBattlesCompleted = progress.completedScenarioIds.filter(
    (scenarioId) => getScenarioById(scenarioId)?.isBoss,
  ).length;
  const vocabulary = Object.values(progress.vocabularyProgress);

  return {
    completedScenarios: progress.completedScenarioIds.length,
    bestScenarioAccuracy,
    completedByCategory,
    streakDays: progress.streakDays,
    savedVocabulary: vocabulary.length,
    noHintScenarioAccuracy,
    quickResponseWins,
    roleplaysCompleted,
    bossBattlesCompleted,
    masteredVocabulary: vocabulary.filter((item) => item.masteryScore >= 80).length,
  };
}
