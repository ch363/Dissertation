import {
  FsrsParameters,
  DEFAULT_FSRS_PARAMETERS,
  calculateFsrs,
  FsrsState,
  attemptToGrade,
} from './algo.fsrs';
import { scoreToGrade } from './grade';

export interface ReviewRecord {
  createdAt: Date;
  lastRevisedAt: Date | null;
  nextReviewDue: Date | null;
  score: number;
  stability: number | null;
  difficulty: number | null;
  intervalDays: number | null;
  repetitions: number | null;
}

export interface OptimizationResult {
  parameters: FsrsParameters;
  error: number;
  iterations: number;
}

export function calculatePredictionError(
  records: ReviewRecord[],
  params: FsrsParameters,
): number {
  if (records.length < 2) return 0;

  let totalError = 0;
  let errorCount = 0;

  let currentState: FsrsState | null = null;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const grade = scoreToGrade(record.score);

    if (i === 0) {
      currentState = {
        stability: record.stability || 0,
        difficulty: record.difficulty || 0,
        lastReview: record.createdAt,
        repetitions: record.repetitions || 0,
      };
      continue;
    }

    const previousRecord = records[i - 1];
    const elapsedMs =
      record.createdAt.getTime() - previousRecord.createdAt.getTime();
    const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);

    if (currentState && elapsedDays > 0) {
      const predictedResult = calculateFsrs(
        currentState,
        grade,
        record.createdAt,
        params,
      );

      const actualInterval = record.intervalDays || 1;
      const predictedInterval = predictedResult.intervalDays;

      const intervalError =
        Math.abs(predictedInterval - actualInterval) /
        Math.max(actualInterval, 1);
      totalError += intervalError;
      errorCount++;

      currentState = {
        stability: predictedResult.stability,
        difficulty: predictedResult.difficulty,
        lastReview: record.createdAt,
        repetitions: predictedResult.repetitions,
      };
    }
  }

  return errorCount > 0 ? totalError / errorCount : 0;
}

export function optimizeParameters(
  records: ReviewRecord[],
  initialParams: FsrsParameters = DEFAULT_FSRS_PARAMETERS,
  maxIterations: number = 50,
  learningRate: number = 0.01,
  minError: number = 0.001,
): OptimizationResult {
  if (records.length < 10) {
    return {
      parameters: initialParams,
      error: 0,
      iterations: 0,
    };
  }

  const currentParams = { ...initialParams };
  let currentError = calculatePredictionError(records, currentParams);
  let bestParams = { ...currentParams };
  let bestError = currentError;

  const bounds: Record<keyof FsrsParameters, { min: number; max: number }> = {
    w0: { min: 0.1, max: 2.0 },
    w1: { min: 0.5, max: 3.0 },
    w2: { min: 1.0, max: 10.0 },
    w3: { min: 5.0, max: 30.0 },
    w4: { min: 1.0, max: 15.0 },
    w5: { min: 0.1, max: 2.0 },
    w6: { min: -2.0, max: 3.0 },
    w7: { min: -0.1, max: 0.2 },
    w8: { min: 0.5, max: 3.0 },
    w9: { min: 0.01, max: 0.5 },
    w10: { min: 0.1, max: 3.0 },
    w11: { min: 0.5, max: 5.0 },
    w12: { min: 0.01, max: 0.3 },
    w13: { min: 0.1, max: 1.0 },
    w14: { min: 0.5, max: 5.0 },
    w15: { min: 0.1, max: 1.0 },
    w16: { min: 1.0, max: 10.0 },
  };

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    if (currentError < minError) {
      break;
    }

    const gradients: Partial<FsrsParameters> = {};
    const stepSize = 0.001;

    for (const key of Object.keys(currentParams) as Array<
      keyof FsrsParameters
    >) {
      const paramValue = currentParams[key];
      const bound = bounds[key];

      const testParams = { ...currentParams };
      testParams[key] = Math.min(bound.max, paramValue + stepSize);
      const errorForward = calculatePredictionError(records, testParams);

      testParams[key] = Math.max(bound.min, paramValue - stepSize);
      const errorBackward = calculatePredictionError(records, testParams);

      gradients[key] = (errorForward - errorBackward) / (2 * stepSize);
    }

    let improved = false;
    for (const key of Object.keys(currentParams) as Array<
      keyof FsrsParameters
    >) {
      const gradient = gradients[key] || 0;
      const bound = bounds[key];
      const newValue = currentParams[key] - learningRate * gradient;
      currentParams[key] = Math.max(bound.min, Math.min(bound.max, newValue));
    }

    currentError = calculatePredictionError(records, currentParams);

    if (currentError < bestError) {
      bestError = currentError;
      bestParams = { ...currentParams };
      improved = true;
    }

    if (!improved && iteration > 5) {
      learningRate *= 0.9;
    }
  }

  return {
    parameters: bestParams,
    error: bestError,
    iterations: maxIterations,
  };
}

export function getOptimizedParametersForUser(
  allRecords: ReviewRecord[],
): FsrsParameters {
  if (allRecords.length < 20) {
    return DEFAULT_FSRS_PARAMETERS;
  }

  const result = optimizeParameters(
    allRecords,
    DEFAULT_FSRS_PARAMETERS,
    30,
    0.01,
    0.01,
  );

  return result.parameters;
}
