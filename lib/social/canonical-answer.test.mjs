import assert from "node:assert/strict";
import test from "node:test";

import { isCanonicalAnswerCorrect } from "./canonical-answer.ts";

const baseStep = {
  id: "step-1",
  title: "Test",
  instructionEn: "Test",
  instructionTr: "Test",
  prompt: "Test",
  xp: 10,
  targetVocabularyIds: [],
  hint: { en: "Hint" },
  explanationEn: "Test",
  explanationTr: "Test",
};

test("choice answers are recomputed from the canonical option id", () => {
  const step = {
    ...baseStep,
    type: "dialogue-choice",
    options: [],
    correctOptionId: "canonical-correct",
  };
  assert.equal(isCanonicalAnswerCorrect(step, "canonical-correct"), true);
  assert.equal(isCanonicalAnswerCorrect(step, "client-claims-correct"), false);
});
test("matching answers use canonical pair order", () => {
  const step = {
    ...baseStep,
    type: "matching",
    pairs: [
      { id: "a", left: "A", right: "1" },
      { id: "b", left: "B", right: "2" },
    ],
    shuffleRight: true,
  };
  assert.equal(isCanonicalAnswerCorrect(step, ["1", "2"]), true);
  assert.equal(isCanonicalAnswerCorrect(step, ["2", "1"]), false);
});

test("empty boss answers cannot pass by substring behavior", () => {
  const step = {
    ...baseStep,
    type: "boss-battle",
    bossName: "Test boss",
    phases: [{
      id: "phase-1",
      phaseType: "summarize",
      prompt: "Summarize",
      expectedAnswer: "Expected answer",
      targetVocabularyIds: [],
    }],
    minimumPhasesToPass: 1,
    bonusXp: 0,
  };
  assert.equal(isCanonicalAnswerCorrect(step, [""]), false);
  assert.equal(isCanonicalAnswerCorrect(step, ["Expected answer, clearly."]), true);
});
