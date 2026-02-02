const MIN_MINUTES = 3;
const MAX_MINUTES = 15;
const MINUTES_PER_CARD = 0.5;
const RANGE_BUFFER = 2;

export function estimateReviewMinutes(dueCount: number): number {
  if (dueCount <= 0) return 0;
  const raw = Math.ceil(dueCount * MINUTES_PER_CARD);
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, raw));
}

export type ReviewMinutesRange = { min: number; max: number };

export function estimateReviewMinutesRange(dueCount: number): ReviewMinutesRange {
  if (dueCount <= 0) return { min: 0, max: 0 };
  const min = estimateReviewMinutes(dueCount);
  const max = Math.min(MAX_MINUTES, min + RANGE_BUFFER);
  return { min, max: max > min ? max : min };
}

export function formatReviewMinutesRange(dueCount: number): string {
  const { min, max } = estimateReviewMinutesRange(dueCount);
  if (min <= 0) return '0 min';
  return max > min ? `~${min}–${max} min` : `~${min} min`;
}

export function formatReviewMinutesRangeFromEstimate(estimatedMinutes: number): string {
  if (estimatedMinutes <= 0) return '0 min';
  const min = estimatedMinutes;
  const max = Math.min(MAX_MINUTES, min + RANGE_BUFFER);
  return max > min ? `~${min}–${max} min` : `~${min} min`;
}
