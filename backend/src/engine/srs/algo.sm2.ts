/**
 * SM-2 Algorithm Implementation
 * 
 * Pure implementation of the SuperMemo 2 algorithm for spaced repetition.
 * This is a pure function with no dependencies on NestJS or Prisma.
 * 
 * Algorithm details:
 * - Ease Factor (EF): Starts at 2.5, adjusts based on performance
 * - Interval: Days until next review
 * - Repetitions: Number of successful consecutive reviews
 * 
 * @see https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 */

export interface Sm2State {
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
}

export interface Sm2Result {
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  nextDue: Date;
}

/**
 * Calculate new SRS state after an attempt.
 * 
 * @param currentState Current SRS state
 * @param quality Quality of recall (0-5):
 *   5: Perfect response
 *   4: Correct response after hesitation
 *   3: Correct response with serious difficulty
 *   2: Incorrect response; correct one remembered
 *   1: Incorrect response; correct one seems familiar
 *   0: Complete blackout
 * @param now Current date/time
 * @returns New SRS state with next due date
 */
export function calculateSm2(
  currentState: Sm2State,
  quality: number,
  now: Date = new Date(),
): Sm2Result {
  // Clamp quality to valid range
  const q = Math.max(0, Math.min(5, Math.round(quality)));

  let { intervalDays, easeFactor, repetitions } = currentState;

  // Update ease factor
  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));

  // Minimum ease factor is 1.3
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  // Update interval and repetitions based on quality
  if (q < 3) {
    // Incorrect or difficult response - reset
    repetitions = 0;
    intervalDays = 1;
  } else {
    // Correct response
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }
    repetitions = repetitions + 1;
  }

  // Calculate next due date
  const nextDue = new Date(now);
  nextDue.setDate(nextDue.getDate() + intervalDays);

  return {
    intervalDays,
    easeFactor,
    repetitions,
    nextDue,
  };
}

/**
 * Convert a score (0-100) to SM-2 quality (0-5).
 * 
 * @param score Score from 0-100
 * @returns Quality value 0-5
 */
export function scoreToQuality(score: number): number {
  // Clamp score to 0-100
  const clamped = Math.max(0, Math.min(100, score));

  // Map to quality scale
  if (clamped >= 95) return 5;
  if (clamped >= 85) return 4;
  if (clamped >= 70) return 3;
  if (clamped >= 50) return 2;
  if (clamped >= 30) return 1;
  return 0;
}

/**
 * Convert correct/incorrect to SM-2 quality.
 * 
 * @param correct Whether the answer was correct
 * @param timeMs Time taken in milliseconds (optional, for refinement)
 * @returns Quality value 0-5
 */
export function correctToQuality(correct: boolean, timeMs?: number): number {
  if (!correct) {
    return 0; // Incorrect = quality 0
  }

  // If correct, use time as a factor (faster = better)
  if (timeMs !== undefined) {
    // Assume ideal time is < 5 seconds for a good response
    if (timeMs < 5000) {
      return 5; // Fast and correct = perfect
    }
    if (timeMs < 10000) {
      return 4; // Moderate time = good
    }
    return 3; // Slow but correct = acceptable
  }

  // Default: correct = quality 3 (acceptable)
  return 3;
}

/**
 * Get initial SM-2 state for a new item.
 */
export function getInitialSm2State(): Sm2State {
  return {
    intervalDays: 1,
    easeFactor: 2.5,
    repetitions: 0,
  };
}
