/**
 * SRS (Spaced Repetition System) Service
 * 
 * This service manages spaced repetition scheduling using the FSRS algorithm.
 * SRS state is stored directly in UserQuestionPerformance (append-only).
 * 
 * This is a SERVICE LAYER, not middleware. It's called by ProgressService
 * after recording an attempt. It does NOT handle HTTP requests directly.
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  calculateFsrs,
  attemptToGrade,
  FsrsState,
  FsrsParameters,
  DEFAULT_FSRS_PARAMETERS,
} from './algo.fsrs';
import { getOptimizedParametersForUser, ReviewRecord } from './fsrs-optimizer';
import { AttemptFeatures } from './types';

@Injectable()
export class SrsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate SRS state for a question attempt.
   * Returns the state that should be stored in UserQuestionPerformance.
   * 
   * @param userId User ID
   * @param questionId Question ID
   * @param result Attempt result
   * @returns SRS state to store in the new UserQuestionPerformance row
   */
  async calculateQuestionState(
    userId: string,
    questionId: string,
    result: AttemptFeatures,
  ): Promise<{
    nextReviewDue: Date;
    intervalDays: number;
    repetitions: number;
    stability?: number;
    difficulty?: number;
  }> {
    const now = new Date();

    // Get previous SRS state from latest UserQuestionPerformance row
    const previousAttempt = await this.prisma.userQuestionPerformance.findFirst({
      where: {
        userId,
        questionId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        stability: true,
        difficulty: true,
        repetitions: true,
        lastRevisedAt: true,
        intervalDays: true,
      },
    });

    // Get all historical attempts for this user/question for parameter optimization
    const allAttempts = await this.prisma.userQuestionPerformance.findMany({
      where: {
        userId,
        questionId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        createdAt: true,
        lastRevisedAt: true,
        nextReviewDue: true,
        score: true,
        stability: true,
        difficulty: true,
        intervalDays: true,
        repetitions: true,
      },
    });

    // Get all user's historical data for parameter optimization
    const allUserAttempts = await this.prisma.userQuestionPerformance.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 1000, // Limit to prevent performance issues
      select: {
        createdAt: true,
        lastRevisedAt: true,
        nextReviewDue: true,
        score: true,
        stability: true,
        difficulty: true,
        intervalDays: true,
        repetitions: true,
      },
    });

    // Convert to ReviewRecord format for optimizer
    const reviewRecords: ReviewRecord[] = allUserAttempts.map((attempt) => ({
      createdAt: attempt.createdAt,
      lastRevisedAt: attempt.lastRevisedAt,
      nextReviewDue: attempt.nextReviewDue,
      score: attempt.score,
      stability: attempt.stability,
      difficulty: attempt.difficulty,
      intervalDays: attempt.intervalDays,
      repetitions: attempt.repetitions,
    }));

    // Get optimized parameters for user (or use defaults)
    const params: FsrsParameters = getOptimizedParametersForUser(reviewRecords);

    // Build current FSRS state
    let currentState: FsrsState | null = null;

    if (previousAttempt) {
      // Check if we have FSRS state (stability/difficulty)
      if (previousAttempt.stability != null && previousAttempt.difficulty != null) {
        // We have FSRS state
        currentState = {
          stability: previousAttempt.stability,
          difficulty: previousAttempt.difficulty,
          lastReview: previousAttempt.lastRevisedAt || now,
          repetitions: previousAttempt.repetitions || 0,
        };
      }
    }

    // Convert attempt result to grade (0-5)
    const grade = attemptToGrade(result);

    // Calculate new state using FSRS
    const newState = calculateFsrs(currentState, grade, now, params);

    // Validate all returned values to prevent database errors
    const validatedStability = isFinite(newState.stability) && newState.stability > 0
      ? Math.max(0.1, Math.min(365, newState.stability))
      : 0.1;
    
    const validatedDifficulty = isFinite(newState.difficulty) && newState.difficulty > 0
      ? Math.max(0.1, Math.min(10.0, newState.difficulty))
      : 5.0;
    
    const validatedIntervalDays = isFinite(newState.intervalDays) && newState.intervalDays > 0
      ? Math.max(1, Math.round(newState.intervalDays))
      : 1;
    
    const validatedRepetitions = isFinite(newState.repetitions) && newState.repetitions >= 0
      ? Math.max(0, Math.round(newState.repetitions))
      : 0;
    
    // Validate next due date
    let validatedNextDue: Date;
    if (newState.nextDue instanceof Date && !isNaN(newState.nextDue.getTime())) {
      validatedNextDue = newState.nextDue;
    } else {
      // Fallback: set to 1 day from now
      validatedNextDue = new Date(now);
      validatedNextDue.setDate(validatedNextDue.getDate() + 1);
    }

    return {
      nextReviewDue: validatedNextDue,
      intervalDays: validatedIntervalDays,
      repetitions: validatedRepetitions,
      stability: validatedStability,
      difficulty: validatedDifficulty,
    };
  }
}
