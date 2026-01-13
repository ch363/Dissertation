/**
 * SRS (Spaced Repetition System) Service
 * 
 * This service manages spaced repetition scheduling using the SM-2 algorithm.
 * SRS state is stored directly in UserQuestionPerformance (append-only).
 * 
 * This is a SERVICE LAYER, not middleware. It's called by ProgressService
 * after recording an attempt. It does NOT handle HTTP requests directly.
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { calculateSm2, scoreToQuality, correctToQuality, getInitialSm2State } from './algo.sm2';
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
    easeFactor: number;
    repetitions: number;
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
        intervalDays: true,
        easeFactor: true,
        repetitions: true,
      },
    });

    const currentState = previousAttempt
      ? {
          intervalDays: previousAttempt.intervalDays || 1,
          easeFactor: previousAttempt.easeFactor || 2.5,
          repetitions: previousAttempt.repetitions || 0,
        }
      : getInitialSm2State();

    // Convert result to quality score
    let quality: number;
    if (result.score !== undefined) {
      quality = scoreToQuality(result.score);
    } else {
      quality = correctToQuality(result.correct, result.timeMs);
    }

    // Calculate new state using SM-2
    const newState = calculateSm2(currentState, quality, now);

    return {
      nextReviewDue: newState.nextDue,
      intervalDays: newState.intervalDays,
      easeFactor: newState.easeFactor,
      repetitions: newState.repetitions,
    };
  }
}
