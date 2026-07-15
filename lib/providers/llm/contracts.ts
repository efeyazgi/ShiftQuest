import { z } from "zod";

import type { SafeProviderError } from "../errors";

import type {
  CEFRLevel,
  RoleplayFeedback,
  Scenario,
  ScenarioCategory,
  VocabularyItem,
} from "@/types";

export const cefrLevelSchema = z.enum(["B1", "B2"]);
export const scenarioCategorySchema = z.enum([
  "office",
  "production",
  "meeting",
  "quality",
  "safety",
  "career",
]);

const safeLine = (maximum: number) => z.string().trim().min(1).max(maximum);

export const scenarioGenerationInputSchema = z.object({
  level: cefrLevelSchema,
  category: scenarioCategorySchema.optional(),
  weakVocabulary: z.array(safeLine(80)).max(12).default([]),
});

export type ScenarioGenerationInput = z.infer<
  typeof scenarioGenerationInputSchema
>;

const vocabularySchema = z.object({
  id: safeLine(100),
  term: safeLine(100),
  meaningTr: safeLine(180),
  partOfSpeech: z.enum([
    "noun",
    "verb",
    "adjective",
    "adverb",
    "pronoun",
    "preposition",
    "conjunction",
    "interjection",
    "phrase",
    "phrasal verb",
    "idiom",
  ]),
  ipa: z.string().trim().max(100),
  pronunciationTr: z.string().trim().max(120),
  exampleEn: safeLine(300),
  exampleTr: safeLine(300),
  category: z.union([scenarioCategorySchema, z.literal("general")]),
  level: cefrLevelSchema,
  tags: z.array(safeLine(40)).max(8),
  audioText: z.string().trim().max(200).optional(),
});

const characterSchema = z.object({
  id: safeLine(80),
  name: safeLine(80),
  role: safeLine(100),
  roleTr: safeLine(100),
  avatar: safeLine(200),
  accent: z.enum(["american", "british"]),
});

const choiceOptionSchema = z.object({
  id: safeLine(60),
  text: safeLine(400),
  isCorrect: z.boolean(),
  quality: z.enum([
    "correct",
    "grammar-error",
    "too-direct",
    "too-formal",
    "unnatural",
    "off-topic",
  ]),
  feedbackEn: safeLine(400),
  feedbackTr: safeLine(400),
  naturalAlternative: z.string().trim().max(400).optional(),
});

const dialogueChoiceStepSchema = z.object({
  id: safeLine(80),
  type: z.literal("dialogue-choice"),
  title: safeLine(120),
  instructionEn: safeLine(300),
  instructionTr: safeLine(300),
  prompt: safeLine(600),
  promptTr: z.string().trim().max(600).optional(),
  dialogue: z
    .object({
      speakerId: safeLine(80),
      text: safeLine(500),
      translationTr: safeLine(500),
      ttsText: safeLine(500),
    })
    .optional(),
  ttsText: z.string().trim().max(500).optional(),
  xp: z.number().int().min(0).max(500),
  targetVocabularyIds: z.array(safeLine(100)).max(10),
  hint: z.object({
    en: safeLine(300),
    tr: z.string().trim().max(300).optional(),
  }),
  explanationEn: safeLine(500),
  explanationTr: safeLine(500),
  options: z.array(choiceOptionSchema).min(3).max(4),
  correctOptionId: safeLine(60),
});

/**
 * AI-generated MVP scenarios deliberately use the most reliable mini-game shape.
 * Static seed content can use every ScenarioStep variant from the shared types.
 */
export const generatedScenarioSchema = z
  .object({
    id: safeLine(120),
    slug: safeLine(120),
    title: safeLine(160),
    titleTr: safeLine(160),
    descriptionEn: safeLine(600),
    descriptionTr: safeLine(600),
    level: cefrLevelSchema,
    category: scenarioCategorySchema,
    location: z.enum([
      "office-hub",
      "production-floor",
      "control-room",
      "quality-lab",
      "meeting-room",
      "safety-zone",
      "maintenance-area",
      "training-center",
    ]),
    estimatedMinutes: z.number().int().min(3).max(15),
    characters: z.array(characterSchema).min(1).max(4),
    steps: z.array(dialogueChoiceStepSchema).min(5).max(8),
    targetVocabularyIds: z.array(safeLine(100)).min(5).max(12),
    targetVocabulary: z.array(vocabularySchema).min(5).max(12),
    xpReward: z.number().int().min(0).max(2_000),
    coinReward: z.number().int().min(0).max(500),
    unlock: z.object({
      requiredXp: z.number().int().min(0).max(1_000_000),
      requiredScenarioIds: z.array(safeLine(120)).max(20),
      requiredTitleId: z.string().trim().max(100).optional(),
    }),
    evaluation: z.object({
      successMessageEn: safeLine(400),
      successMessageTr: safeLine(400),
      reviewMessageEn: safeLine(400),
      reviewMessageTr: safeLine(400),
      naturalExpressions: z.array(safeLine(250)).min(2).max(8),
    }),
    sortOrder: z.number().int().min(0).max(100_000),
    isBoss: z.boolean(),
    communicationOnly: z.boolean().optional(),
  })
  .superRefine((scenario, context) => {
    const vocabularyIds = new Set(scenario.targetVocabulary.map((item) => item.id));
    for (const id of scenario.targetVocabularyIds) {
      if (!vocabularyIds.has(id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Missing vocabulary payload for ${id}`,
          path: ["targetVocabularyIds"],
        });
      }
    }

    for (const [stepIndex, step] of scenario.steps.entries()) {
      const correctOptions = step.options.filter((option) => option.isCorrect);
      if (
        correctOptions.length !== 1 ||
        correctOptions[0]?.id !== step.correctOptionId
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Each step must identify exactly one correct option",
          path: ["steps", stepIndex, "correctOptionId"],
        });
      }
    }
  });

export type GeneratedScenario = Scenario & {
  targetVocabulary: VocabularyItem[];
};

export const feedbackInputSchema = z.object({
  message: safeLine(2_000),
  level: cefrLevelSchema,
  role: z.string().trim().max(100).optional(),
  context: z.string().trim().max(2_000).optional(),
});

export type FeedbackInput = z.infer<typeof feedbackInputSchema>;

const scoreSchema = z.number().int().min(0).max(100);

export const feedbackSchema = z.object({
  grammar: scoreSchema,
  vocabulary: scoreSchema,
  naturalness: scoreSchema,
  professionalTone: scoreSchema,
  clarity: scoreSchema,
  summary: safeLine(500),
  corrections: z
    .array(
      z.object({
        original: z.string().trim().max(500),
        suggestion: safeLine(500),
        reason: safeLine(500),
      }),
    )
    .max(5),
  correction: safeLine(600),
  strengths: z.array(safeLine(220)).max(4).default([]),
});

export type FeedbackResult = RoleplayFeedback & {
  correction: string;
  strengths: string[];
};

export const roleplayInputSchema = feedbackInputSchema.extend({
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: safeLine(1_500),
      }),
    )
    .max(16)
    .default([]),
});

export type RoleplayInput = z.infer<typeof roleplayInputSchema>;

export const roleplayResultSchema = z.object({
  reply: safeLine(1_000),
  feedback: feedbackSchema,
  suggestedPhrases: z.array(safeLine(250)).min(1).max(4),
  sessionComplete: z.boolean(),
});

export type RoleplayResult = z.infer<typeof roleplayResultSchema>;

export interface LLMProvider {
  readonly id: string;
  readonly kind: "mock" | "provider";
  testConnection(): Promise<void>;
  generateScenario(input: ScenarioGenerationInput): Promise<GeneratedScenario>;
  evaluateFeedback(input: FeedbackInput): Promise<FeedbackResult>;
  continueRoleplay(input: RoleplayInput): Promise<RoleplayResult>;
}

export type ProviderSource = LLMProvider["kind"];

export type LLMRunResult<T> = {
  data: T;
  source: ProviderSource;
  fallback?: boolean;
  providerError?: SafeProviderError;
};

export type { CEFRLevel, ScenarioCategory };
