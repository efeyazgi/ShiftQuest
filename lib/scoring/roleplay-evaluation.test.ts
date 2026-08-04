import { describe, expect, it } from "vitest";
import type { RoleplayEvaluationContext, RoleplayEvaluationDraft } from "@/types";
import {
  buildDeterministicRoleplayDraft,
  detectTargetVocabulary,
  finalizeRoleplayEvaluation,
} from "./roleplay-evaluation";

const criteria = [
  { id: "goal", label: "Communication goal", description: "The requested decision is explicit.", weight: 30 },
  { id: "tone", label: "Professional tone", description: "The tone is professional and diplomatic.", weight: 30 },
  { id: "vocabulary", label: "Target vocabulary", description: "A target expression is accurate.", weight: 25 },
  { id: "grammar", label: "Grammar and precision", description: "Grammar preserves the meaning.", weight: 15 },
];

const makeContext = (message: string): RoleplayEvaluationContext => ({
  scenarioId: "office-priority-reset-b2",
  stepId: "office-b2-5",
  message,
  level: "B2",
  role: "Engineering Manager",
  openingLine: "Which priority should lead?",
  userGoal: "Ask for a priority decision and explain how you will communicate the update.",
  minimumWords: 18,
  maximumWords: 65,
  successCriteria: criteria,
  targetVocabulary: [
    { id: "office-keep-updated", term: "keep someone updated", acceptedForms: ["keep you updated", "keep the team updated"] },
  ],
  sampleAnswer: "Could we confirm which priority should lead? I can then keep you updated and revise the timeline for both sponsors.",
});

describe("roleplay evaluation grounding", () => {
  it("rejects a long-enough response that misses the goal and target expression", () => {
    const context = makeContext(
      "I am writing this response because it needs enough words to continue. The weather seems pleasant today and I hope everyone has a good afternoon.",
    );
    const hallucinatedDraft: RoleplayEvaluationDraft = {
      goalAchieved: false,
      goalEvidence: "",
      criteria: criteria.map((criterion) => ({
        criterionId: criterion.id,
        score: 95,
        met: true,
        evidenceQuote: context.message,
        feedbackTr: "Güçlü.",
      })),
      targetVocabulary: [{
        vocabularyId: "office-keep-updated",
        usedCorrectly: true,
        evidenceQuote: "keep you updated",
        feedbackTr: "Bu ifadeyi kullanman çok mantıklı.",
      }],
      strengths: [{ labelTr: "Hedef ifadeyi çok iyi kullandın.", evidenceQuote: context.message }],
      improvements: [],
      polishedAnswer: context.sampleAnswer,
      summaryTr: "İyi deneme.",
    };

    const result = finalizeRoleplayEvaluation(context, hallucinatedDraft);

    expect(result.wordCount).toBeGreaterThanOrEqual(context.minimumWords);
    expect(result.passed).toBe(false);
    expect(result.goalAchieved).toBe(false);
    expect(result.usedTargetVocabulary).toEqual([]);
    expect(result.criteria.find((item) => item.criterionId === "vocabulary")?.score).toBe(0);
    expect(result.strengths).toEqual([]);
    expect(result.improvements.map((item) => item.issueTr).join(" ")).toContain("hedef ifadelerden hiçbiri");
  });

  it("accepts a grounded high-scoring response that uses an accepted phrase variant", () => {
    const message = "I can keep you updated after I review the attached draft. Could we confirm which priority should lead so I can revise the timeline and manage expectations with both sponsors?";
    const context = makeContext(message);
    const draft: RoleplayEvaluationDraft = {
      goalAchieved: true,
      goalEvidence: "Could we confirm which priority should lead",
      criteria: [
        { criterionId: "goal", score: 90, met: true, evidenceQuote: "Could we confirm which priority should lead", feedbackTr: "Karar talebi açık." },
        { criterionId: "tone", score: 86, met: true, evidenceQuote: "I can keep you updated after I review the attached draft", feedbackTr: "Ton iş birlikçi." },
        { criterionId: "vocabulary", score: 88, met: true, evidenceQuote: "keep you updated", feedbackTr: "Hedef ifade doğru." },
        { criterionId: "grammar", score: 90, met: true, evidenceQuote: "so I can revise the timeline", feedbackTr: "Yapı açık." },
      ],
      targetVocabulary: [{ vocabularyId: "office-keep-updated", usedCorrectly: true, evidenceQuote: "keep you updated", feedbackTr: "Bağlam içinde doğru." }],
      strengths: [{ labelTr: "Karar talebi net.", evidenceQuote: "Could we confirm which priority should lead" }],
      improvements: [],
      polishedAnswer: message,
      summaryTr: "Görev amacını karşılayan güçlü bir yanıt.",
    };

    const result = finalizeRoleplayEvaluation(context, draft);

    expect(detectTargetVocabulary(message, context.targetVocabulary)[0]?.matchedForm).toBe("keep you updated");
    expect(result.passed).toBe(true);
    expect(result.overallScore).toBeGreaterThanOrEqual(70);
    expect(result.usedTargetVocabulary).toEqual([
      expect.objectContaining({ matchedForm: "keep you updated", usedCorrectly: true }),
    ]);
  });

  it("normalizes punctuation while preserving whole-expression matching", () => {
    const targets = [
      { id: "tradeoff", term: "scope trade-off", acceptedForms: ["scope tradeoff"] },
      { id: "sop", term: "standard operating procedure (SOP)", acceptedForms: ["SOP"] },
    ];

    expect(detectTargetVocabulary("We should discuss the scope trade off and check the SOP.", targets))
      .toEqual([
        expect.objectContaining({ target: expect.objectContaining({ id: "tradeoff" }) }),
        expect.objectContaining({ target: expect.objectContaining({ id: "sop" }) }),
      ]);
    expect(detectTargetVocabulary("This is a sophisticated update.", [targets[1]])).toEqual([]);
  });

  it("uses the same hard gates in the deterministic no-key fallback", () => {
    const weakContext = makeContext("This response has enough ordinary words to continue but it avoids the requested decision and contains no assigned expression at all today.");
    const strongContext = makeContext("Could we confirm which priority should lead? I can keep you updated after the review, revise the shared timeline and explain the decision clearly to both sponsors.");

    const weak = finalizeRoleplayEvaluation(weakContext, buildDeterministicRoleplayDraft(weakContext));
    const strong = finalizeRoleplayEvaluation(strongContext, buildDeterministicRoleplayDraft(strongContext));

    expect(weak.passed).toBe(false);
    expect(strong.passed).toBe(true);
    expect(strong.usedTargetVocabulary[0]).toEqual(expect.objectContaining({ usedCorrectly: true }));
  });
});
