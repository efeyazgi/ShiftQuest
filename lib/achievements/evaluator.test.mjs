import assert from "node:assert/strict";
import test from "node:test";

import { achievements } from "../../data/achievements.ts";
import { evaluateAchievement, evaluateAchievements } from "./evaluator.ts";

const emptyFacts = {
  completedScenarios: 0,
  bestScenarioAccuracy: 0,
  completedByCategory: {},
  streakDays: 0,
  savedVocabulary: 0,
  noHintScenarioAccuracy: 0,
  quickResponseWins: 0,
  roleplaysCompleted: 0,
  bossBattlesCompleted: 0,
  masteredVocabulary: 0,
};

test("every achievement definition has an active evaluator", () => {
  const evaluations = evaluateAchievements(emptyFacts, achievements);
  assert.equal(evaluations.length, achievements.length);
  assert.deepEqual(
    evaluations.filter((evaluation) => !evaluation.active).map((evaluation) => evaluation.achievement.id),
    [],
  );
});
test("no-hint achievement requires both zero hints fact and at least 80 percent", () => {
  const achievement = achievements.find((item) => item.id === "no-hint-needed");
  assert.ok(achievement);
  assert.equal(evaluateAchievement(achievement, { ...emptyFacts, noHintScenarioAccuracy: 79 }).unlocked, false);
  assert.equal(evaluateAchievement(achievement, { ...emptyFacts, noHintScenarioAccuracy: 80 }).unlocked, true);
});

test("vocabulary builder unlocks at 25 saved expressions", () => {
  const achievement = achievements.find((item) => item.id === "vocabulary-builder");
  assert.ok(achievement);
  assert.equal(evaluateAchievement(achievement, { ...emptyFacts, savedVocabulary: 24 }).unlocked, false);
  assert.equal(evaluateAchievement(achievement, { ...emptyFacts, savedVocabulary: 25 }).unlocked, true);
});
