/**
 * FSRS (Free Spaced Repetition Scheduler) Algorithm Implementation
 *
 * Pure implementation of the FSRS algorithm for spaced repetition.
 * This is a pure function with no dependencies on NestJS or Prisma.
 *
 * Algorithm details:
 * - Stability (S): Memory strength, duration until retention drops to 90%
 * - Difficulty (D): Inherent complexity of the material
 * - Retrievability (R): Current probability of recall
 *
 * Based on FSRS-4.5 with 17 parameters (w0-w16)
 * @see https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm
 */

import { correctToGrade, scoreToGrade } from './grade';

export interface FsrsState {
  stability: number;
  difficulty: number;
  lastReview: Date;
  repetitions: number;
}

export interface FsrsResult {
  stability: number;
  difficulty: number;
  repetitions: number;
  nextDue: Date;
  intervalDays: number;
}

export interface FsrsParameters {
  w0: number; // Initial stability for grade 1
  w1: number; // Initial stability multiplier
  w2: number; // Initial difficulty for grade 4
  w3: number; // Initial difficulty multiplier
  w4: number; // Difficulty adjustment factor
  w5: number; // Mean reversion factor
  w6: number; // Stability increase factor (success)
  w7: number; // Difficulty exponent (success)
  w8: number; // Stability exponent (success)
  w9: number; // Retrievability factor (success)
  w10: number; // Stability base (failure)
  w11: number; // Difficulty exponent (failure)
  w12: number; // Stability exponent (failure)
  w13: number; // Retrievability factor (failure)
  w14: number; // Additional parameter
  w15: number; // Additional parameter
  w16: number; // Additional parameter
}

/**
 * Default FSRS-4.5 parameters
 * These are optimized default values that work well for most users
 */
export const DEFAULT_FSRS_PARAMETERS: FsrsParameters = {
  w0: 0.4872,
  w1: 1.4003,
  w2: 3.7145,
  w3: 13.8206,
  w4: 5.1618,
  w5: 1.2298,
  w6: 0.8975,
  w7: 0.031,
  w8: 1.6474,
  w9: 0.1367,
  w10: 1.0461,
  w11: 2.1072,
  w12: 0.0793,
  w13: 0.3246,
  w14: 1.587,
  w15: 0.2272,
  w16: 2.8755,
};

/**
 * Calculate initial stability after first review
 * S₀(G) = w₀ · (w₁ · (G - 1) + 1)
 *
 * @param grade Review grade (0-5)
 * @param params FSRS parameters
 * @returns Initial stability
 */
export function calculateInitialStability(
  grade: number,
  params: FsrsParameters = DEFAULT_FSRS_PARAMETERS,
): number {
  const clampedGrade = Math.max(0, Math.min(5, Math.round(grade)));
  const stability = params.w0 * (params.w1 * (clampedGrade - 1) + 1);
  // Ensure stability is valid and within reasonable bounds
  if (!isFinite(stability) || stability <= 0) {
    return 0.1; // Fallback: minimum stability
  }
  return Math.max(0.1, Math.min(365, stability));
}

/**
 * Calculate initial difficulty after first review
 * D₀(G) = w₂ · (w₃ · (G - 4) + 1)
 *
 * @param grade Review grade (0-5)
 * @param params FSRS parameters
 * @returns Initial difficulty
 */
export function calculateInitialDifficulty(
  grade: number,
  params: FsrsParameters = DEFAULT_FSRS_PARAMETERS,
): number {
  const clampedGrade = Math.max(0, Math.min(5, Math.round(grade)));
  const difficulty = params.w2 * (params.w3 * (clampedGrade - 4) + 1);
  // Ensure difficulty is valid and within reasonable bounds
  if (!isFinite(difficulty) || difficulty <= 0) {
    return 5.0; // Fallback: medium difficulty
  }
  return Math.max(0.1, Math.min(10.0, difficulty));
}

/**
 * Calculate retrievability (probability of recall)
 * R = exp(-t/S)
 *
 * @param elapsedDays Days elapsed since last review
 * @param stability Current stability
 * @returns Retrievability (0-1)
 */
export function calculateRetrievability(
  elapsedDays: number,
  stability: number,
): number {
  if (stability <= 0) return 0;
  if (elapsedDays <= 0) return 1;
  return Math.exp(-elapsedDays / stability);
}

/**
 * Update difficulty after a review
 * D' = w₅ · D₀(3) + (1 - w₅) · (D + w₄ · (G - 3))
 *
 * @param currentDifficulty Current difficulty
 * @param grade Review grade (0-5)
 * @param params FSRS parameters
 * @returns Updated difficulty
 */
export function updateDifficulty(
  currentDifficulty: number,
  grade: number,
  params: FsrsParameters = DEFAULT_FSRS_PARAMETERS,
): number {
  const clampedGrade = Math.max(0, Math.min(5, Math.round(grade)));
  const d0 = calculateInitialDifficulty(3, params); // D₀(3) - mean difficulty
  const meanReversion = params.w5 * d0;
  const adjustment =
    (1 - params.w5) * (currentDifficulty + params.w4 * (clampedGrade - 3));
  const newDifficulty = meanReversion + adjustment;
  // Clamp difficulty to valid range (0.1 to 10.0) to prevent invalid calculations
  return Math.max(0.1, Math.min(10.0, newDifficulty));
}

/**
 * Update stability after a successful review
 * S'ₛ = S · (1 + e^w₆ · (D')^w₇ · S^w₈ · (e^((1-R)·w₉) - 1))
 *
 * @param currentStability Current stability
 * @param updatedDifficulty Updated difficulty
 * @param retrievability Current retrievability
 * @param params FSRS parameters
 * @returns Updated stability
 */
export function updateStabilitySuccess(
  currentStability: number,
  updatedDifficulty: number,
  retrievability: number,
  params: FsrsParameters = DEFAULT_FSRS_PARAMETERS,
): number {
  // Validate inputs
  if (!isFinite(currentStability) || currentStability <= 0) {
    currentStability = 0.1;
  }
  if (!isFinite(updatedDifficulty) || updatedDifficulty <= 0) {
    updatedDifficulty = 5.0;
  }
  if (!isFinite(retrievability) || retrievability < 0 || retrievability > 1) {
    retrievability = 0.5;
  }

  const expW6 = Math.exp(params.w6);
  const dPowW7 = Math.pow(updatedDifficulty, params.w7);
  const sPowW8 = Math.pow(currentStability, params.w8);
  const expTerm = Math.exp((1 - retrievability) * params.w9) - 1;

  const multiplier = 1 + expW6 * dPowW7 * sPowW8 * expTerm;
  const newStability = currentStability * multiplier;

  // Ensure stability is valid and within reasonable bounds
  if (!isFinite(newStability) || newStability <= 0) {
    return Math.max(0.1, currentStability * 1.1); // Fallback: small increase
  }

  // Clamp to reasonable maximum (365 days)
  return Math.min(365, Math.max(0.1, newStability));
}

/**
 * Update stability after a failed review
 * S'ₓ = w₁₀ · (D')^w₁₁ · S^w₁₂ · (e^((1-R)·w₁₃) - 1)
 *
 * @param currentStability Current stability
 * @param updatedDifficulty Updated difficulty
 * @param retrievability Current retrievability
 * @param params FSRS parameters
 * @returns Updated stability
 */
export function updateStabilityFailure(
  currentStability: number,
  updatedDifficulty: number,
  retrievability: number,
  params: FsrsParameters = DEFAULT_FSRS_PARAMETERS,
): number {
  // Validate inputs
  if (!isFinite(currentStability) || currentStability <= 0) {
    currentStability = 0.1;
  }
  if (!isFinite(updatedDifficulty) || updatedDifficulty <= 0) {
    updatedDifficulty = 5.0;
  }
  if (!isFinite(retrievability) || retrievability < 0 || retrievability > 1) {
    retrievability = 0.5;
  }

  const dPowW11 = Math.pow(updatedDifficulty, params.w11);
  const sPowW12 = Math.pow(currentStability, params.w12);
  const expTerm = Math.exp((1 - retrievability) * params.w13) - 1;

  const newStability = params.w10 * dPowW11 * sPowW12 * expTerm;

  // Ensure stability is valid and within reasonable bounds
  if (!isFinite(newStability) || newStability <= 0) {
    return 0.1; // Fallback: minimum stability
  }

  // Clamp to reasonable maximum (365 days)
  return Math.min(365, Math.max(0.1, newStability));
}

/**
 * Calculate next review interval for target retention
 * R = 0.9 = exp(-interval/S)
 * intervalDays = -S · ln(R)
 *
 * Note: this returns a fractional number of days (supports intra-day scheduling).
 *
 * @param stability Current stability
 * @param targetRetention Target retention rate (default 0.9)
 * @returns Interval in days
 */
export function calculateNextInterval(
  stability: number,
  targetRetention: number = 0.9,
): number {
  if (stability <= 0) return 1;
  if (targetRetention <= 0 || targetRetention >= 1) {
    throw new Error('Target retention must be between 0 and 1');
  }
  // intervalDays = -S · ln(R)
  const intervalDays = -stability * Math.log(targetRetention);
  // Guardrail: avoid pathological 0/near-0 intervals causing immediate loops.
  // 5 minutes in days.
  const minIntervalDays = 5 / (24 * 60);
  if (!isFinite(intervalDays) || intervalDays <= 0) return 1;
  return Math.max(minIntervalDays, intervalDays);
}

/**
 * Calculate FSRS state after a review
 *
 * @param currentState Current FSRS state
 * @param grade Review grade (0-5)
 * @param now Current date/time
 * @param params FSRS parameters
 * @returns New FSRS state with next due date
 */
export function calculateFsrs(
  currentState: FsrsState | null,
  grade: number,
  now: Date = new Date(),
  params: FsrsParameters = DEFAULT_FSRS_PARAMETERS,
): FsrsResult {
  const clampedGrade = Math.max(0, Math.min(5, Math.round(grade)));
  const isFirstReview = !currentState || currentState.repetitions === 0;

  let stability: number;
  let difficulty: number;
  let repetitions: number;

  if (isFirstReview) {
    // First review: initialize stability and difficulty
    stability = calculateInitialStability(clampedGrade, params);
    difficulty = calculateInitialDifficulty(clampedGrade, params);
    repetitions = clampedGrade >= 3 ? 1 : 0;
  } else {
    // Validate current state
    if (!isFinite(currentState.stability) || currentState.stability <= 0) {
      currentState.stability = 0.1;
    }
    if (!isFinite(currentState.difficulty) || currentState.difficulty <= 0) {
      currentState.difficulty = 5.0;
    }
    if (
      !(currentState.lastReview instanceof Date) ||
      isNaN(currentState.lastReview.getTime())
    ) {
      currentState.lastReview = now;
    }

    // Calculate elapsed time
    const elapsedMs = now.getTime() - currentState.lastReview.getTime();
    const elapsedDays = Math.max(0, elapsedMs / (1000 * 60 * 60 * 24));

    // Calculate retrievability
    const retrievability = calculateRetrievability(
      elapsedDays,
      currentState.stability,
    );

    // Update difficulty
    difficulty = updateDifficulty(
      currentState.difficulty,
      clampedGrade,
      params,
    );

    // Update stability based on success/failure
    // Grade >= 3 is considered success
    if (clampedGrade >= 3) {
      stability = updateStabilitySuccess(
        currentState.stability,
        difficulty,
        retrievability,
        params,
      );
      repetitions = currentState.repetitions + 1;
    } else {
      stability = updateStabilityFailure(
        currentState.stability,
        difficulty,
        retrievability,
        params,
      );
      repetitions = 0; // Reset on failure
    }

    // Ensure minimum stability
    stability = Math.max(0.1, stability);
  }

  // Validate all calculated values
  if (!isFinite(stability) || stability <= 0) {
    stability = 0.1;
  }
  if (!isFinite(difficulty) || difficulty <= 0) {
    difficulty = 5.0;
  }
  if (!isFinite(repetitions) || repetitions < 0) {
    repetitions = 0;
  }

  // Calculate next interval with target retention R=0.9
  const intervalDays = calculateNextInterval(stability, 0.9);

  // Validate interval
  if (!isFinite(intervalDays) || intervalDays <= 0) {
    const fallbackIntervalDays = 1;
    const nextDue = new Date(now.getTime() + fallbackIntervalDays * 24 * 60 * 60 * 1000);
    return {
      stability,
      difficulty,
      repetitions,
      nextDue,
      intervalDays: fallbackIntervalDays,
    };
  }

  // Calculate next due date
  const nextDue = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  // Validate next due date
  if (isNaN(nextDue.getTime())) {
    const fallbackDate = new Date(now);
    fallbackDate.setDate(fallbackDate.getDate() + 1);
    return {
      stability,
      difficulty,
      repetitions,
      nextDue: fallbackDate,
      intervalDays: 1,
    };
  }

  return {
    stability,
    difficulty,
    repetitions,
    nextDue,
    intervalDays,
  };
}

/**
 * Convert attempt features to FSRS grade
 * Reuses existing quality conversion functions
 *
 * @param result Attempt result
 * @returns Grade (0-5)
 */
export function attemptToGrade(result: {
  correct: boolean;
  timeMs: number;
  score?: number;
}): number {
  if (result.score !== undefined) {
    return scoreToGrade(result.score);
  }
  return correctToGrade(result.correct, result.timeMs);
}

/**
 * Get initial FSRS state for a new item
 */
export function getInitialFsrsState(): FsrsState {
  return {
    stability: 0,
    difficulty: 0,
    lastReview: new Date(),
    repetitions: 0,
  };
}
