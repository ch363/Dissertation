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
    const minIntervalDays = 5 / (24 * 60);

    const previousAttempt = await this.prisma.userQuestionPerformance.findFirst(
      {
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
      },
    );

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

    const allUserAttempts = await this.prisma.userQuestionPerformance.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 1000,
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

    const params: FsrsParameters = getOptimizedParametersForUser(reviewRecords);

    let currentState: FsrsState | null = null;

    if (previousAttempt) {
      if (
        previousAttempt.stability != null &&
        previousAttempt.difficulty != null
      ) {
        currentState = {
          stability: previousAttempt.stability,
          difficulty: previousAttempt.difficulty,
          lastReview: previousAttempt.lastRevisedAt || now,
          repetitions: previousAttempt.repetitions || 0,
        };
      }
    }

    const grade = attemptToGrade(result);

    const newState = calculateFsrs(currentState, grade, now, params);

    const validatedStability =
      isFinite(newState.stability) && newState.stability > 0
        ? Math.max(0.1, Math.min(365, newState.stability))
        : 0.1;

    const validatedDifficulty =
      isFinite(newState.difficulty) && newState.difficulty > 0
        ? Math.max(0.1, Math.min(10.0, newState.difficulty))
        : 5.0;

    const validatedIntervalDaysFloat =
      isFinite(newState.intervalDays) && newState.intervalDays > 0
        ? Math.max(minIntervalDays, newState.intervalDays)
        : 1;

    // Prisma schema stores intervalDays as Int; use 0 for intra-day intervals.
    const intervalDaysForDb =
      validatedIntervalDaysFloat < 1
        ? 0
        : Math.max(1, Math.round(validatedIntervalDaysFloat));

    const validatedRepetitions =
      isFinite(newState.repetitions) && newState.repetitions >= 0
        ? Math.max(0, Math.round(newState.repetitions))
        : 0;

    // Validate next due date
    let validatedNextDue: Date;
    if (
      newState.nextDue instanceof Date &&
      !isNaN(newState.nextDue.getTime())
    ) {
      validatedNextDue = newState.nextDue;
    } else {
      validatedNextDue = new Date(now);
      validatedNextDue.setDate(validatedNextDue.getDate() + 1);
    }

    return {
      nextReviewDue: validatedNextDue,
      intervalDays: intervalDaysForDb,
      repetitions: validatedRepetitions,
      stability: validatedStability,
      difficulty: validatedDifficulty,
    };
  }
}
