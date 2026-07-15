import { careerRegions, careerTitles, GAME_TITLE_DISCLAIMER } from "@/data/career";
import type {
  AnswerAttempt,
  CampusLocation,
  CareerTitle,
  CEFRLevel,
  UserProgress,
} from "@/types";

export const CAREER_TITLE_DISCLAIMER = GAME_TITLE_DISCLAIMER;
export const CAREER_TITLES: readonly CareerTitle[] = careerTitles;
export const REGION_XP_THRESHOLDS: Readonly<Record<CampusLocation, number>> =
  Object.fromEntries(
    careerRegions.map((region) => [region.id, region.requiredXp]),
  ) as Record<CampusLocation, number>;

export type CareerProgress = {
  currentTitle: CareerTitle;
  nextTitle: CareerTitle | null;
  rank: number;
  xpIntoRank: number;
  xpForNextRank: number;
  xpRemaining: number;
  percentage: number;
};

export function getCareerProgress(totalXp: number): CareerProgress {
  const safeXp = Math.max(0, Math.floor(Number.isFinite(totalXp) ? totalXp : 0));
  let currentIndex = 0;
  for (let index = 0; index < CAREER_TITLES.length; index += 1) {
    if (safeXp >= CAREER_TITLES[index]!.minimumXp) currentIndex = index;
  }

  const currentTitle = CAREER_TITLES[currentIndex]!;
  const nextTitle = CAREER_TITLES[currentIndex + 1] ?? null;
  const xpIntoRank = safeXp - currentTitle.minimumXp;
  const xpForNextRank = nextTitle
    ? nextTitle.minimumXp - currentTitle.minimumXp
    : 0;
  const xpRemaining = nextTitle ? Math.max(0, nextTitle.minimumXp - safeXp) : 0;
  const percentage = nextTitle
    ? Math.min(100, Math.round((xpIntoRank / xpForNextRank) * 100))
    : 100;

  return {
    currentTitle,
    nextTitle,
    rank: currentTitle.rank,
    xpIntoRank,
    xpForNextRank,
    xpRemaining,
    percentage,
  };
}

export function getUnlockedRegions(totalXp: number): CampusLocation[] {
  const safeXp = Math.max(0, Number.isFinite(totalXp) ? totalXp : 0);
  return careerRegions
    .filter((region) => safeXp >= region.requiredXp)
    .sort((left, right) => left.requiredXp - right.requiredXp)
    .map((region) => region.id);
}

export function applyProgressReward(
  progress: UserProgress,
  reward: { xp: number; coins: number },
): UserProgress {
  const currentXp = Number.isFinite(progress.totalXp) ? progress.totalXp : 0;
  const currentCoins = Number.isFinite(progress.coins) ? progress.coins : 0;
  const earnedXp = Number.isFinite(reward.xp) ? Math.max(0, Math.round(reward.xp)) : 0;
  const earnedCoins = Number.isFinite(reward.coins)
    ? Math.max(0, Math.round(reward.coins))
    : 0;
  const totalXp = Math.max(0, currentXp + earnedXp);
  const career = getCareerProgress(totalXp);
  return {
    ...progress,
    totalXp,
    coins: Math.max(0, currentCoins + earnedCoins),
    currentTitleId: career.currentTitle.id,
    unlockedRegionIds: getUnlockedRegions(totalXp),
  };
}

export type AdaptiveDifficulty = {
  level: CEFRLevel;
  support: "high" | "standard" | "low";
  optionCount: 3 | 4;
  sentenceLength: "short" | "medium" | "long";
  turkishHints: "frequent" | "on-request" | "minimal";
  distractorSimilarity: "low" | "medium" | "high";
  introduceLessCommonVocabulary: boolean;
};

export function calculateAdaptiveDifficulty(
  level: CEFRLevel,
  recentAttempts: readonly Pick<
    AnswerAttempt,
    "correct" | "attemptNumber" | "hintUsed"
  >[],
): AdaptiveDifficulty {
  if (recentAttempts.length === 0) {
    return level === "B1"
      ? {
          level,
          support: "high",
          optionCount: 3,
          sentenceLength: "short",
          turkishHints: "frequent",
          distractorSimilarity: "low",
          introduceLessCommonVocabulary: false,
        }
      : {
          level,
          support: "standard",
          optionCount: 4,
          sentenceLength: "medium",
          turkishHints: "on-request",
          distractorSimilarity: "medium",
          introduceLessCommonVocabulary: true,
        };
  }

  const accuracy =
    recentAttempts.filter((attempt) => attempt.correct).length /
    recentAttempts.length;
  const hintRate =
    recentAttempts.filter((attempt) => attempt.hintUsed).length /
    recentAttempts.length;
  const averageAttempts =
    recentAttempts.reduce((sum, attempt) => sum + attempt.attemptNumber, 0) /
    recentAttempts.length;
  const needsSupport = accuracy < 0.62 || hintRate > 0.55 || averageAttempts > 1.8;
  const readyForChallenge =
    accuracy >= 0.88 && hintRate < 0.2 && averageAttempts <= 1.2;

  if (needsSupport) {
    return {
      level,
      support: "high",
      optionCount: 3,
      sentenceLength: "short",
      turkishHints: "frequent",
      distractorSimilarity: "low",
      introduceLessCommonVocabulary: false,
    };
  }

  if (readyForChallenge) {
    return {
      level,
      support: "low",
      optionCount: 4,
      sentenceLength: "long",
      turkishHints: "minimal",
      distractorSimilarity: "high",
      introduceLessCommonVocabulary: true,
    };
  }

  return {
    level,
    support: "standard",
    optionCount: level === "B1" ? 3 : 4,
    sentenceLength: level === "B1" ? "short" : "medium",
    turkishHints: level === "B1" ? "frequent" : "on-request",
    distractorSimilarity: "medium",
    introduceLessCommonVocabulary: level === "B2",
  };
}

export const getCareerTitle = (totalXp: number): CareerTitle =>
  getCareerProgress(totalXp).currentTitle;
