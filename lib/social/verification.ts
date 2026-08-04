import { getScenarioById } from "@/data/scenarios";

import { isCanonicalAnswerCorrect } from "./canonical-answer";

export type SubmittedAttempt = {
  stepId: string;
  answer: string | string[];
};

export type VerifiedCompletion = {
  scenarioId: string;
  category: string;
  accuracy: number;
  verifiedXp: number;
  isBoss: boolean;
  roleplayCompleted: boolean;
};

export function verifyScenarioSubmission(
  scenarioId: string,
  attempts: readonly SubmittedAttempt[],
): VerifiedCompletion | null {
  const scenario = getScenarioById(scenarioId);
  if (!scenario || attempts.length !== scenario.steps.length) return null;

  const attemptsByStep = new Map(attempts.map((attempt) => [attempt.stepId, attempt]));
  if (attemptsByStep.size !== scenario.steps.length) return null;
  if (scenario.steps.some((step) => !attemptsByStep.has(step.id))) return null;

  const correctness = scenario.steps.map((step) =>
    isCanonicalAnswerCorrect(step, attemptsByStep.get(step.id)!.answer),
  );
  const correctCount = correctness.filter(Boolean).length;
  const accuracy = Math.round(correctCount / scenario.steps.length * 100);
  const roleplayCompleted = scenario.steps.some((step, index) =>
    step.type === "roleplay" && correctness[index],
  );

  return {
    scenarioId: scenario.id,
    category: scenario.category,
    accuracy,
    verifiedXp: Math.max(0, Math.round(scenario.xpReward * accuracy / 100)),
    isBoss: scenario.isBoss,
    roleplayCompleted,
  };
}
