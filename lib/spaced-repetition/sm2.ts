export type SM2Quality = 0 | 1 | 2 | 3 | 4 | 5;

export type SM2State = {
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  lastReviewedAt?: string;
  nextReviewAt: string;
};

export function createInitialSM2State(now: Date = new Date()): SM2State {
  return {
    repetitions: 0,
    intervalDays: 0,
    easeFactor: 2.5,
    nextReviewAt: now.toISOString(),
  };
}

function addUtcDays(date: Date, days: number): string {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString();
}

/** A compact SM-2 scheduler. Quality below 3 resets the learning interval. */
export function scheduleSM2Review(
  state: SM2State,
  quality: SM2Quality,
  reviewedAt: Date = new Date(),
): SM2State {
  const safeEase = Math.max(1.3, Number.isFinite(state.easeFactor) ? state.easeFactor : 2.5);
  const nextEase = Math.max(
    1.3,
    safeEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  );

  let repetitions: number;
  let intervalDays: number;
  if (quality < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    repetitions = Math.max(0, Math.floor(state.repetitions)) + 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 6;
    else intervalDays = Math.max(1, Math.round(state.intervalDays * nextEase));
  }

  return {
    repetitions,
    intervalDays,
    easeFactor: Math.round(nextEase * 100) / 100,
    lastReviewedAt: reviewedAt.toISOString(),
    nextReviewAt: addUtcDays(reviewedAt, intervalDays),
  };
}

export const reviewWithSM2 = scheduleSM2Review;
