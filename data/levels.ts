import type { CEFRLevel } from "@/types";

export type LevelProfile = {
  label: string;
  routeLabel: string;
  description: string;
  optionCount: 3 | 4;
  sentenceLength: "short" | "medium" | "long";
  turkishHints: "frequent" | "on-request" | "minimal";
  distractorSimilarity: "low" | "medium" | "high";
  playbackRate: 0.75 | 1 | 1.25;
  roleplayWords: { minimum: number; maximum: number };
  generatedStepXp: number;
  generatedScenarioXp: number;
  generatedCoins: number;
  estimatedMinutes: number;
  badgeClassName: string;
  progressColor: "cyan" | "lime" | "amber" | "coral";
};

export const LEVEL_PROFILES: Record<CEFRLevel, LevelProfile> = {
  B1: {
    label: "Intermediate",
    routeLabel: "Supported route",
    description: "Kısa ve açık konuşmalar; sık Türkçe destek ve belirgin seçenekler.",
    optionCount: 3,
    sentenceLength: "short",
    turkishHints: "frequent",
    distractorSimilarity: "low",
    playbackRate: 0.75,
    roleplayWords: { minimum: 12, maximum: 55 },
    generatedStepXp: 22,
    generatedScenarioXp: 140,
    generatedCoins: 28,
    estimatedMinutes: 6,
    badgeClassName: "border-cyan/20 bg-cyan/[0.06] text-cyan/70",
    progressColor: "cyan",
  },
  B2: {
    label: "Upper intermediate",
    routeLabel: "Challenge route",
    description: "Daha doğal diyaloglar, yakın seçenekler ve nüanslı profesyonel ton.",
    optionCount: 4,
    sentenceLength: "medium",
    turkishHints: "on-request",
    distractorSimilarity: "medium",
    playbackRate: 1,
    roleplayWords: { minimum: 18, maximum: 65 },
    generatedStepXp: 28,
    generatedScenarioXp: 180,
    generatedCoins: 36,
    estimatedMinutes: 8,
    badgeClassName: "border-lime/20 bg-lime/[0.06] text-lime/70",
    progressColor: "lime",
  },
  C1: {
    label: "Advanced",
    routeLabel: "Diplomatic route",
    description: "Örtük anlam, diplomatik itiraz, hedging ve kanıta dayalı uzun yanıtlar.",
    optionCount: 4,
    sentenceLength: "long",
    turkishHints: "minimal",
    distractorSimilarity: "high",
    playbackRate: 1,
    roleplayWords: { minimum: 25, maximum: 80 },
    generatedStepXp: 34,
    generatedScenarioXp: 220,
    generatedCoins: 44,
    estimatedMinutes: 10,
    badgeClassName: "border-amber/25 bg-amber/[0.07] text-amber",
    progressColor: "amber",
  },
  C2: {
    label: "Proficient",
    routeLabel: "Executive route",
    description: "Register değişimi, belirsizlik altında sentez ve hassas anlam ayrımları.",
    optionCount: 4,
    sentenceLength: "long",
    turkishHints: "minimal",
    distractorSimilarity: "high",
    playbackRate: 1.25,
    roleplayWords: { minimum: 35, maximum: 110 },
    generatedStepXp: 40,
    generatedScenarioXp: 270,
    generatedCoins: 54,
    estimatedMinutes: 12,
    badgeClassName: "border-coral/25 bg-coral/[0.07] text-coral",
    progressColor: "coral",
  },
};

export function getLevelProfile(level: CEFRLevel): LevelProfile {
  return LEVEL_PROFILES[level];
}
