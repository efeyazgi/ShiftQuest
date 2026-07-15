type GeminiJsonSchema = {
  type: "object" | "array" | "string" | "integer" | "number" | "boolean";
  properties?: Record<string, GeminiJsonSchema>;
  required?: string[];
  items?: GeminiJsonSchema;
  enum?: string[];
  description?: string;
};

const text = (description?: string): GeminiJsonSchema => ({
  type: "string",
  ...(description ? { description } : {}),
});
const integer = (description?: string): GeminiJsonSchema => ({
  type: "integer",
  ...(description ? { description } : {}),
});
const boolean = (description?: string): GeminiJsonSchema => ({
  type: "boolean",
  ...(description ? { description } : {}),
});
const enumText = (values: string[]): GeminiJsonSchema => ({
  type: "string",
  enum: values,
});
const array = (items: GeminiJsonSchema): GeminiJsonSchema => ({
  type: "array",
  items,
});
const object = (
  properties: Record<string, GeminiJsonSchema>,
  optional: string[] = [],
): GeminiJsonSchema => ({
  type: "object",
  properties,
  required: Object.keys(properties).filter((key) => !optional.includes(key)),
});

export const googleFeedbackJsonSchema = object({
  grammar: integer("Score from 0 to 100."),
  vocabulary: integer("Score from 0 to 100."),
  naturalness: integer("Score from 0 to 100."),
  professionalTone: integer("Score from 0 to 100."),
  clarity: integer("Score from 0 to 100."),
  summary: text(),
  corrections: array(
    object({
      original: text(),
      suggestion: text(),
      reason: text(),
    }),
  ),
  correction: text("The complete polished learner sentence."),
  strengths: array(text()),
});

export const googleRoleplayJsonSchema = object({
  reply: text(),
  feedback: googleFeedbackJsonSchema,
  suggestedPhrases: array(text()),
  sessionComplete: boolean(),
});

const categorySchema = enumText([
  "office",
  "production",
  "meeting",
  "quality",
  "safety",
  "career",
]);
const levelSchema = enumText(["B1", "B2"]);

const vocabularySchema = object(
  {
    id: text(),
    term: text(),
    meaningTr: text(),
    partOfSpeech: enumText([
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
    ipa: text(),
    pronunciationTr: text(),
    exampleEn: text(),
    exampleTr: text(),
    category: enumText([
      "office",
      "production",
      "meeting",
      "quality",
      "safety",
      "career",
      "general",
    ]),
    level: levelSchema,
    tags: array(text()),
    audioText: text(),
  },
  ["audioText"],
);

const characterSchema = object({
  id: text(),
  name: text(),
  role: text(),
  roleTr: text(),
  avatar: text(),
  accent: enumText(["american", "british"]),
});

const choiceOptionSchema = object(
  {
    id: text(),
    text: text(),
    isCorrect: boolean(),
    quality: enumText([
      "correct",
      "grammar-error",
      "too-direct",
      "too-formal",
      "unnatural",
      "off-topic",
    ]),
    feedbackEn: text(),
    feedbackTr: text(),
    naturalAlternative: text(),
  },
  ["naturalAlternative"],
);

const dialogueChoiceStepSchema = object(
  {
    id: text(),
    type: enumText(["dialogue-choice"]),
    title: text(),
    instructionEn: text(),
    instructionTr: text(),
    prompt: text(),
    promptTr: text(),
    dialogue: object({
      speakerId: text(),
      text: text(),
      translationTr: text(),
      ttsText: text(),
    }),
    ttsText: text(),
    xp: integer(),
    targetVocabularyIds: array(text()),
    hint: object(
      {
        en: text(),
        tr: text(),
      },
      ["tr"],
    ),
    explanationEn: text(),
    explanationTr: text(),
    options: array(choiceOptionSchema),
    correctOptionId: text(),
  },
  ["promptTr", "dialogue", "ttsText"],
);

export const googleScenarioJsonSchema = object(
  {
    id: text(),
    slug: text(),
    title: text(),
    titleTr: text(),
    descriptionEn: text(),
    descriptionTr: text(),
    level: levelSchema,
    category: categorySchema,
    location: enumText([
      "office-hub",
      "production-floor",
      "control-room",
      "quality-lab",
      "meeting-room",
      "safety-zone",
      "maintenance-area",
      "training-center",
    ]),
    estimatedMinutes: integer(),
    characters: array(characterSchema),
    steps: array(dialogueChoiceStepSchema),
    targetVocabularyIds: array(text()),
    targetVocabulary: array(vocabularySchema),
    xpReward: integer(),
    coinReward: integer(),
    unlock: object(
      {
        requiredXp: integer(),
        requiredScenarioIds: array(text()),
        requiredTitleId: text(),
      },
      ["requiredTitleId"],
    ),
    evaluation: object({
      successMessageEn: text(),
      successMessageTr: text(),
      reviewMessageEn: text(),
      reviewMessageTr: text(),
      naturalExpressions: array(text()),
    }),
    sortOrder: integer(),
    isBoss: boolean(),
    communicationOnly: boolean(),
  },
  ["communicationOnly"],
);

export type { GeminiJsonSchema };
