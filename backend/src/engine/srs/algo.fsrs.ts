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
  w0: number;
  w1: number;
  w2: number;
  w3: number;
  w4: number;
  w5: number;
  w6: number;
  w7: number;
  w8: number;
  w9: number;
  w10: number;
  w11: number;
  w12: number;
  w13: number;
  w14: number;
  w15: number;
  w16: number;
}

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

export function calculateInitialStability(
  grade: number,
  params: FsrsParameters = DEFAULT_FSRS_PARAMETERS,
): number {
  const clampedGrade = Math.max(0, Math.min(5, Math.round(grade)));
  const stability = params.w0 * (params.w1 * (clampedGrade - 1) + 1);
  if (!isFinite(stability) || stability <= 0) {
    return 0.1;
  }
  return Math.max(0.1, Math.min(365, stability));
}

export function calculateInitialDifficulty(
  grade: number,
  params: FsrsParameters = DEFAULT_FSRS_PARAMETERS,
): number {
  const clampedGrade = Math.max(0, Math.min(5, Math.round(grade)));
  const difficulty = params.w2 * (params.w3 * (clampedGrade - 4) + 1);
  if (!isFinite(difficulty) || difficulty <= 0) {
    return 5.0;
  }
  return Math.max(0.1, Math.min(10.0, difficulty));
}

export function calculateRetrievability(
  elapsedDays: number,
  stability: number,
): number {
  if (stability <= 0) return 0;
  if (elapsedDays <= 0) return 1;
  return Math.exp(-elapsedDays / stability);
}

export function updateDifficulty(
  currentDifficulty: number,
  grade: number,
  params: FsrsParameters = DEFAULT_FSRS_PARAMETERS,
): number {
  const clampedGrade = Math.max(0, Math.min(5, Math.round(grade)));
  const d0 = calculateInitialDifficulty(3, params);
  const meanReversion = params.w5 * d0;
  const adjustment =
    (1 - params.w5) * (currentDifficulty + params.w4 * (clampedGrade - 3));
  const newDifficulty = meanReversion + adjustment;
  return Math.max(0.1, Math.min(10.0, newDifficulty));
}

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

  if (!isFinite(newStability) || newStability <= 0) {
    return Math.max(0.1, currentStability * 1.1);
  }

  return Math.min(365, Math.max(0.1, newStability));
}

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

  if (!isFinite(newStability) || newStability <= 0) {
    return 0.1;
  }

  return Math.min(365, Math.max(0.1, newStability));
}

export function calculateNextInterval(
  stability: number,
  targetRetention: number = 0.9,
): number {
  if (stability <= 0) return 1;
  if (targetRetention <= 0 || targetRetention >= 1) {
    throw new Error('Target retention must be between 0 and 1');
  }
  const intervalDays = -stability * Math.log(targetRetention);
  const minIntervalDays = 5 / (24 * 60);
  if (!isFinite(intervalDays) || intervalDays <= 0) return 1;
  return Math.max(minIntervalDays, intervalDays);
}

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
    stability = calculateInitialStability(clampedGrade, params);
    difficulty = calculateInitialDifficulty(clampedGrade, params);
    repetitions = clampedGrade >= 3 ? 1 : 0;
  } else {
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

    const elapsedMs = now.getTime() - currentState.lastReview.getTime();
    const elapsedDays = Math.max(0, elapsedMs / (1000 * 60 * 60 * 24));

    const retrievability = calculateRetrievability(
      elapsedDays,
      currentState.stability,
    );

    difficulty = updateDifficulty(
      currentState.difficulty,
      clampedGrade,
      params,
    );

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
      repetitions = 0;
    }

    stability = Math.max(0.1, stability);
  }

  if (!isFinite(stability) || stability <= 0) {
    stability = 0.1;
  }
  if (!isFinite(difficulty) || difficulty <= 0) {
    difficulty = 5.0;
  }
  if (!isFinite(repetitions) || repetitions < 0) {
    repetitions = 0;
  }

  const intervalDays = calculateNextInterval(stability, 0.9);

  if (!isFinite(intervalDays) || intervalDays <= 0) {
    const fallbackIntervalDays = 1;
    const nextDue = new Date(
      now.getTime() + fallbackIntervalDays * 24 * 60 * 60 * 1000,
    );
    return {
      stability,
      difficulty,
      repetitions,
      nextDue,
      intervalDays: fallbackIntervalDays,
    };
  }

  const nextDue = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

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

export function getInitialFsrsState(): FsrsState {
  return {
    stability: 0,
    difficulty: 0,
    lastReview: new Date(),
    repetitions: 0,
  };
}
