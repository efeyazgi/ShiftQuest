import type { VocabularyProgress } from "@/types";

import {
  scheduleLeitnerReview,
  type LeitnerBox,
} from "./leitner";

export {
  createInitialLeitnerState,
  LEITNER_INTERVAL_DAYS,
  reviewWithLeitner,
  scheduleLeitnerReview,
} from "./leitner";
export type { LeitnerBox, LeitnerState } from "./leitner";
export {
  createInitialSM2State,
  reviewWithSM2,
  scheduleSM2Review,
} from "./sm2";
export type { SM2Quality, SM2State } from "./sm2";

function clampMastery(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function clampDifficulty(value: number): 1 | 2 | 3 | 4 | 5 {
  return Math.max(1, Math.min(5, Math.round(value))) as 1 | 2 | 3 | 4 | 5;
}

/** Updates the persisted vocabulary shape using the lightweight Leitner schedule. */
export function reviewVocabularyProgress(
  progress: VocabularyProgress,
  correct: boolean,
  reviewedAt: Date = new Date(),
): VocabularyProgress {
  const review = scheduleLeitnerReview(
    {
      box: progress.leitnerBox as LeitnerBox,
      lastReviewedAt: progress.lastReviewedAt,
      nextReviewAt: progress.nextReviewAt,
    },
    correct,
    reviewedAt,
  );

  return {
    ...progress,
    lastReviewedAt: review.lastReviewedAt,
    nextReviewAt: review.nextReviewAt,
    correctCount: progress.correctCount + (correct ? 1 : 0),
    incorrectCount: progress.incorrectCount + (correct ? 0 : 1),
    masteryScore: clampMastery(
      progress.masteryScore + (correct ? 7 + review.box * 2 : -15),
    ),
    difficulty: clampDifficulty(progress.difficulty + (correct ? -1 : 1)),
    leitnerBox: review.box,
  };
}

export function isReviewDue(
  progress: Pick<VocabularyProgress, "nextReviewAt">,
  at: Date = new Date(),
): boolean {
  const dueAt = Date.parse(progress.nextReviewAt);
  return Number.isFinite(dueAt) && dueAt <= at.getTime();
}

export function sortByReviewPriority<T extends Pick<VocabularyProgress, "nextReviewAt" | "masteryScore">>(
  items: readonly T[],
): T[] {
  return [...items].sort((left, right) => {
    const dateDifference = Date.parse(left.nextReviewAt) - Date.parse(right.nextReviewAt);
    return dateDifference || left.masteryScore - right.masteryScore;
  });
}
