/**
 * FSRS Parameter Optimizer
 * 
 * Optimizes FSRS parameters (w0-w16) based on user's historical performance data.
 * Uses gradient descent to minimize prediction error between actual and predicted retention.
 */

import { FsrsParameters, DEFAULT_FSRS_PARAMETERS, calculateFsrs, FsrsState, attemptToGrade } from './algo.fsrs';
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

/**
 * Extract review history from UserQuestionPerformance records
 * 
 * @param records Historical performance records ordered by createdAt
 * @returns Array of review records with timing information
 */
export function extractReviewHistory(records: ReviewRecord[]): ReviewRecord[] {
  return records.filter((r) => r.createdAt != null);
}

/**
 * Calculate prediction error for a set of parameters
 * 
 * @param records Historical review records
 * @param params FSRS parameters to test
 * @returns Mean squared error between predicted and actual outcomes
 */
export function calculatePredictionError(
  records: ReviewRecord[],
  params: FsrsParameters,
): number {
  if (records.length < 2) return 0; // Need at least 2 reviews to calculate error

  let totalError = 0;
  let errorCount = 0;

  let currentState: FsrsState | null = null;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const grade = scoreToGrade(record.score); // Convert score (0-100) to grade (0-5)

    if (i === 0) {
      // First review: initialize state
      currentState = {
        stability: record.stability || 0,
        difficulty: record.difficulty || 0,
        lastReview: record.createdAt,
        repetitions: record.repetitions || 0,
      };
      continue;
    }

    // Calculate elapsed time since last review
    const previousRecord = records[i - 1];
    const elapsedMs = record.createdAt.getTime() - previousRecord.createdAt.getTime();
    const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);

    if (currentState && elapsedDays > 0) {
      // Predict what the interval should have been
      const predictedResult = calculateFsrs(currentState, grade, record.createdAt, params);
      
      // Compare predicted interval with actual interval
      const actualInterval = record.intervalDays || 1;
      const predictedInterval = predictedResult.intervalDays;
      
      // Calculate error (normalized)
      const intervalError = Math.abs(predictedInterval - actualInterval) / Math.max(actualInterval, 1);
      totalError += intervalError;
      errorCount++;

      // Update state for next iteration
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


/**
 * Optimize FSRS parameters using gradient descent
 * 
 * @param records Historical review records
 * @param initialParams Starting parameters (default: DEFAULT_FSRS_PARAMETERS)
 * @param maxIterations Maximum optimization iterations
 * @param learningRate Learning rate for gradient descent
 * @param minError Minimum error threshold to stop early
 * @returns Optimized parameters and error metrics
 */
export function optimizeParameters(
  records: ReviewRecord[],
  initialParams: FsrsParameters = DEFAULT_FSRS_PARAMETERS,
  maxIterations: number = 50,
  learningRate: number = 0.01,
  minError: number = 0.001,
): OptimizationResult {
  if (records.length < 10) {
    // Not enough data for optimization, return defaults
    return {
      parameters: initialParams,
      error: 0,
      iterations: 0,
    };
  }

  let currentParams = { ...initialParams };
  let currentError = calculatePredictionError(records, currentParams);
  let bestParams = { ...currentParams };
  let bestError = currentError;

  // Parameter bounds to prevent unrealistic values
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
      break; // Good enough
    }

    // Calculate gradients using finite differences
    const gradients: Partial<FsrsParameters> = {};
    const stepSize = 0.001;

    for (const key of Object.keys(currentParams) as Array<keyof FsrsParameters>) {
      const paramValue = currentParams[key];
      const bound = bounds[key];

      // Forward difference
      const testParams = { ...currentParams };
      testParams[key] = Math.min(bound.max, paramValue + stepSize);
      const errorForward = calculatePredictionError(records, testParams);

      // Backward difference
      testParams[key] = Math.max(bound.min, paramValue - stepSize);
      const errorBackward = calculatePredictionError(records, testParams);

      // Gradient approximation
      gradients[key] = (errorForward - errorBackward) / (2 * stepSize);
    }

    // Update parameters using gradient descent
    let improved = false;
    for (const key of Object.keys(currentParams) as Array<keyof FsrsParameters>) {
      const gradient = gradients[key] || 0;
      const bound = bounds[key];
      const newValue = currentParams[key] - learningRate * gradient;
      currentParams[key] = Math.max(bound.min, Math.min(bound.max, newValue));
    }

    // Recalculate error
    currentError = calculatePredictionError(records, currentParams);

    // Keep track of best parameters
    if (currentError < bestError) {
      bestError = currentError;
      bestParams = { ...currentParams };
      improved = true;
    }

    // If no improvement, reduce learning rate
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

/**
 * Get optimized parameters for a user based on their historical performance
 * This is a simplified version that optimizes per-user, not per-question
 * 
 * @param allRecords All historical records for a user across all questions
 * @returns Optimized parameters or defaults if insufficient data
 */
export function getOptimizedParametersForUser(
  allRecords: ReviewRecord[],
): FsrsParameters {
  if (allRecords.length < 20) {
    // Not enough data, return defaults
    return DEFAULT_FSRS_PARAMETERS;
  }

  // Group records by question to analyze patterns
  // For now, use all records together for user-level optimization
  const result = optimizeParameters(allRecords, DEFAULT_FSRS_PARAMETERS, 30, 0.01, 0.01);

  return result.parameters;
}
