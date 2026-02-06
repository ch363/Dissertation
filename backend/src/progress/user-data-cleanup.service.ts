import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UserLessonRepository } from './repositories/user-lesson.repository';
import { UserTeachingCompletedRepository } from './repositories/user-teaching-completed.repository';
import {
  UserQuestionPerformanceRepository,
  UserKnowledgeLevelProgressRepository,
  UserDeliveryMethodScoreRepository,
} from '../engine/repositories';
import { LoggerService } from '../common/logger';

/**
 * Options for user data cleanup operations.
 */
export interface CleanupOptions {
  /** Include XP/knowledge level progress in cleanup */
  includeXp?: boolean;
  /** Include delivery method scores in cleanup */
  includeDeliveryMethodScores?: boolean;
  /** Reset user's knowledge points and level to defaults */
  resetUserKnowledge?: boolean;
}

/**
 * Result of a cleanup operation.
 */
export interface CleanupResult {
  lessonsDeleted: number;
  teachingsDeleted: number;
  performancesDeleted: number;
  xpDeleted?: number;
  deliveryMethodScoresDeleted?: number;
  userKnowledgeReset?: boolean;
}

/**
 * UserDataCleanupService
 *
 * Centralized service for cleaning up user data.
 * Consolidates duplicate delete patterns (DRY principle).
 *
 * Used by:
 * - ProgressResetService: For resetting user progress
 * - MeAccountService: For account deletion
 */
@Injectable()
export class UserDataCleanupService {
  private readonly logger = new LoggerService(UserDataCleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly userLessonRepository: UserLessonRepository,
    private readonly userTeachingCompletedRepository: UserTeachingCompletedRepository,
    private readonly userQuestionPerformanceRepository: UserQuestionPerformanceRepository,
    private readonly userKnowledgeLevelProgressRepository: UserKnowledgeLevelProgressRepository,
    private readonly userDeliveryMethodScoreRepository: UserDeliveryMethodScoreRepository,
  ) {}

  /**
   * Delete all user progress data.
   * Runs within a new transaction.
   */
  async deleteAllUserProgress(
    userId: string,
    options?: CleanupOptions,
  ): Promise<CleanupResult> {
    return this.prisma.$transaction(async (tx) => {
      return this.deleteAllUserProgressInTransaction(userId, tx, options);
    });
  }

  /**
   * Delete all user progress data within an existing transaction.
   * Use this when you need to combine cleanup with other operations.
   */
  async deleteAllUserProgressInTransaction(
    userId: string,
    tx: Prisma.TransactionClient,
    options?: CleanupOptions,
  ): Promise<CleanupResult> {
    // Core progress data (always deleted)
    const lessonsResult = await tx.userLesson.deleteMany({ where: { userId } });
    const teachingsResult = await tx.userTeachingCompleted.deleteMany({ where: { userId } });
    const performancesResult = await tx.userQuestionPerformance.deleteMany({ where: { userId } });

    const result: CleanupResult = {
      lessonsDeleted: lessonsResult.count,
      teachingsDeleted: teachingsResult.count,
      performancesDeleted: performancesResult.count,
    };

    // Optional: XP/knowledge level progress
    if (options?.includeXp) {
      const xpResult = await tx.userKnowledgeLevelProgress.deleteMany({ where: { userId } });
      result.xpDeleted = xpResult.count;
    }

    // Optional: Reset user knowledge points and level
    if (options?.resetUserKnowledge) {
      await tx.user.update({
        where: { id: userId },
        data: {
          knowledgePoints: 0,
          knowledgeLevel: 'A1',
        },
      });
      result.userKnowledgeReset = true;
    }

    // Optional: Delivery method scores
    if (options?.includeDeliveryMethodScores) {
      const scoresResult = await tx.userDeliveryMethodScore.deleteMany({ where: { userId } });
      result.deliveryMethodScoresDeleted = scoresResult.count;
    }

    this.logger.logInfo(`Cleaned up user data for ${userId}`, {
      ...result,
      options,
    });

    return result;
  }

  /**
   * Delete all user data for account deletion.
   * Includes all progress and scores.
   */
  async deleteAllUserDataForAccountDeletion(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<CleanupResult> {
    return this.deleteAllUserProgressInTransaction(userId, tx, {
      includeXp: true,
      includeDeliveryMethodScores: true,
    });
  }
}
