import type { Achievement, AchievementRequirement } from "@/types";

export type AchievementFacts = {
  completedScenarios: number;
  bestScenarioAccuracy: number;
  completedByCategory: Partial<Record<string, number>>;
  streakDays: number;
  savedVocabulary: number;
  noHintScenarioAccuracy: number;
  quickResponseWins: number;
  roleplaysCompleted: number;
  bossBattlesCompleted: number;
  masteredVocabulary: number;
};

export type AchievementEvaluation = {
  achievement: Achievement;
  active: boolean;
  unlocked: boolean;
  currentValue: number;
  targetValue: number;
  inactiveReason?: string;
};

function metricValue(
  facts: AchievementFacts,
  requirement: AchievementRequirement,
): number | null {
  switch (requirement.metric) {
    case "completedScenarios":
      return requirement.category
        ? facts.completedByCategory[requirement.category] ?? 0
        : facts.completedScenarios;
    case "scenarioAccuracy":
      return facts.bestScenarioAccuracy;
    case "streakDays":
      return facts.streakDays;
    case "savedVocabulary":
      return facts.savedVocabulary;
    case "noHintScenarioAccuracy":
      return facts.noHintScenarioAccuracy;
    case "quickResponseWins":
      return facts.quickResponseWins;
    case "roleplaysCompleted":
      return facts.roleplaysCompleted;
    case "bossBattlesCompleted":
      return facts.bossBattlesCompleted;
    case "masteredVocabulary":
      return facts.masteredVocabulary;
    default:
      return null;
  }
}

function compare(value: number, requirement: AchievementRequirement): boolean {
  if (requirement.operator === "gte") return value >= requirement.value;
  if (requirement.operator === "lte") return value <= requirement.value;
  return value === requirement.value;
}

export function evaluateAchievement(
  achievement: Achievement,
  facts: AchievementFacts,
): AchievementEvaluation {
  const currentValue = metricValue(facts, achievement.requirement);
  if (currentValue === null) {
    return {
      achievement,
      active: false,
      unlocked: false,
      currentValue: 0,
      targetValue: achievement.requirement.value,
      inactiveReason: `“${achievement.requirement.metric}” metriği için evaluator yok.`,
    };
  }

  return {
    achievement,
    active: true,
    unlocked: compare(currentValue, achievement.requirement),
    currentValue,
    targetValue: achievement.requirement.value,
  };
}

export function evaluateAchievements(
  facts: AchievementFacts,
  definitions: readonly Achievement[],
): AchievementEvaluation[] {
  return definitions.map((achievement) => evaluateAchievement(achievement, facts));
}
