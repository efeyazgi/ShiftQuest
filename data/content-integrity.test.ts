import { describe, expect, it } from "vitest";
import { CEFR_LEVELS, type ScenarioCategory } from "@/types";
import { advancedVocabulary } from "./advanced-vocabulary";
import { LEVEL_PROFILES } from "./levels";
import { scenarios } from "./scenarios";
import { vocabularyById, vocabulary } from "./vocabulary";

const categories: ScenarioCategory[] = ["office", "production", "meeting", "quality", "safety", "career"];

describe("seed content integrity", () => {
  it("contains every level/category mission and the planned totals", () => {
    expect(scenarios).toHaveLength(24);
    expect(vocabulary).toHaveLength(180);
    expect(scenarios.flatMap((scenario) => scenario.steps)).toHaveLength(144);

    for (const level of CEFR_LEVELS) {
      for (const category of categories) {
        expect(scenarios.filter((scenario) => scenario.level === level && scenario.category === category)).toHaveLength(1);
      }
    }
  });

  it("has unique IDs, resolvable vocabulary and valid roleplay rubrics", () => {
    expect(new Set(scenarios.map((scenario) => scenario.id)).size).toBe(scenarios.length);
    expect(new Set(vocabulary.map((item) => item.id)).size).toBe(vocabulary.length);

    for (const scenario of scenarios) {
      for (const id of scenario.targetVocabularyIds) expect(vocabularyById.has(id), `${scenario.id}: ${id}`).toBe(true);
      for (const step of scenario.steps) {
        for (const id of step.targetVocabularyIds) expect(vocabularyById.has(id), `${step.id}: ${id}`).toBe(true);
        if ("options" in step) {
          expect(new Set(step.options.map((option) => option.id)).size, step.id).toBe(step.options.length);
        }
        if (step.type === "boss-battle") {
          for (const phase of step.phases) {
            for (const id of phase.targetVocabularyIds) expect(vocabularyById.has(id), `${phase.id}: ${id}`).toBe(true);
          }
        }
        if (step.type === "roleplay") {
          expect(step.successCriteria.reduce((sum, criterion) => sum + criterion.weight, 0)).toBe(100);
        }
      }
    }
  });

  it("defines six new expressions per advanced level/category pair", () => {
    expect(advancedVocabulary).toHaveLength(72);
    for (const level of ["C1", "C2"] as const) {
      for (const category of categories) {
        expect(advancedVocabulary.filter((item) => item.level === level && item.category === category)).toHaveLength(6);
      }
    }
  });

  it("keeps independent C1 and C2 unlock chains with Office open first", () => {
    for (const level of ["C1", "C2"] as const) {
      const chain = scenarios.filter((scenario) => scenario.level === level).sort((a, b) => a.sortOrder - b.sortOrder);
      expect(chain.map((scenario) => scenario.category)).toEqual(categories);
      expect(chain[0].unlock.requiredScenarioIds).toEqual([]);
      for (let index = 1; index < chain.length; index += 1) {
        expect(chain[index].unlock.requiredScenarioIds).toEqual([chain[index - 1].id]);
      }
      expect(chain.every((scenario) => scenario.unlock.requiredXp === 0)).toBe(true);
      expect(chain.every((scenario) => scenario.steps.filter((step) => step.type === "roleplay").length === 1)).toBe(true);
    }
  });

  it("defines the canonical roleplay ranges and advanced final-step formats", () => {
    expect(CEFR_LEVELS).toEqual(["B1", "B2", "C1", "C2"]);
    expect(LEVEL_PROFILES.B1.roleplayWords).toEqual({ minimum: 12, maximum: 55 });
    expect(LEVEL_PROFILES.B2.roleplayWords).toEqual({ minimum: 18, maximum: 65 });
    expect(LEVEL_PROFILES.C1.roleplayWords).toEqual({ minimum: 25, maximum: 80 });
    expect(LEVEL_PROFILES.C2.roleplayWords).toEqual({ minimum: 35, maximum: 110 });

    for (const scenario of scenarios.filter((item) => item.level === "C1")) {
      expect(scenario.steps.at(-1)?.type).toBe("quick-response");
    }
    for (const scenario of scenarios.filter((item) => item.level === "C2")) {
      expect(scenario.steps.at(-1)?.type).toBe("boss-battle");
      expect(scenario.steps.at(-1)).toEqual(expect.objectContaining({ minimumPhasesToPass: 2 }));
    }
  });
});
