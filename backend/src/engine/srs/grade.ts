/**
 * FSRS grade mapping utilities
 *
 * FSRS consumes a review "grade" on a 0–5 scale.
 * These helpers translate app-level performance signals (score/correctness)
 * into that grade scale.
 */

/**
 * Convert a score (0-100) to a FSRS grade (0-5).
 *
 * @param score Score from 0-100
 * @returns Grade value 0-5
 */
export function scoreToGrade(score: number): number {
  const clamped = Math.max(0, Math.min(100, score));

  if (clamped >= 95) return 5;
  if (clamped >= 85) return 4;
  if (clamped >= 70) return 3;
  if (clamped >= 50) return 2;
  if (clamped >= 30) return 1;
  return 0;
}

/**
 * Convert correct/incorrect (and optionally time) to a FSRS grade (0-5).
 *
 * @param correct Whether the answer was correct
 * @param timeMs Time taken in milliseconds (optional, for refinement)
 * @returns Grade value 0-5
 */
export function correctToGrade(correct: boolean, timeMs?: number): number {
  if (!correct) return 0;

  if (timeMs !== undefined) {
    if (timeMs < 5000) return 5;
    if (timeMs < 10000) return 4;
    return 3;
  }

  return 3;
}
