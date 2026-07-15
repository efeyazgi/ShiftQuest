export type LeitnerBox = 1 | 2 | 3 | 4 | 5;

export const LEITNER_INTERVAL_DAYS: Readonly<Record<LeitnerBox, number>> = {
  1: 1,
  2: 2,
  3: 4,
  4: 8,
  5: 16,
};

export type LeitnerState = {
  box: LeitnerBox;
  lastReviewedAt?: string;
  nextReviewAt: string;
};

function toLeitnerBox(value: number): LeitnerBox {
  return Math.max(1, Math.min(5, Math.round(value))) as LeitnerBox;
}

function addUtcDays(date: Date, days: number): string {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString();
}

export function createInitialLeitnerState(now: Date = new Date()): LeitnerState {
  return { box: 1, nextReviewAt: now.toISOString() };
}

export function scheduleLeitnerReview(
  state: LeitnerState,
  correct: boolean,
  reviewedAt: Date = new Date(),
): LeitnerState {
  const box = correct ? toLeitnerBox(state.box + 1) : 1;
  return {
    box,
    lastReviewedAt: reviewedAt.toISOString(),
    nextReviewAt: addUtcDays(reviewedAt, LEITNER_INTERVAL_DAYS[box]),
  };
}

export const reviewWithLeitner = scheduleLeitnerReview;
