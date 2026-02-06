import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResetProgressDto } from './dto/reset-progress.dto';
import { LoggerService } from '../common/logger';
import { UserDataCleanupService } from './user-data-cleanup.service';
import { UserQuestionPerformanceRepository } from '../engine/repositories';

/**
 * ProgressResetService
 *
 * Handles all progress reset operations.
 * Follows Single Responsibility Principle - focused only on resetting user progress.
 * Uses UserDataCleanupService for core cleanup operations (DRY compliance).
 */
@Injectable()
export class ProgressResetService {
  private readonly logger = new LoggerService(ProgressResetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly userDataCleanupService: UserDataCleanupService,
    private readonly userQuestionPerformanceRepository: UserQuestionPerformanceRepository,
  ) {}

  /**
   * Reset all progress for a user.
   * Optionally includes XP and delivery method scores.
   */
  async resetAllProgress(userId: string, options?: ResetProgressDto) {
    const result = await this.userDataCleanupService.deleteAllUserProgress(userId, {
      includeXp: options?.includeXp,
      includeDeliveryMethodScores: options?.includeDeliveryMethodScores,
      resetUserKnowledge: options?.includeXp, // Reset user record when XP is reset
    });

    this.logger.logInfo(`Reset all progress for user ${userId}`, {
      includeXp: options?.includeXp,
      includeDeliveryMethodScores: options?.includeDeliveryMethodScores,
      result,
    });

    return {
      message: 'All progress reset successfully',
      resetXp: options?.includeXp || false,
      resetDeliveryMethodScores: options?.includeDeliveryMethodScores || false,
    };
  }

  /**
   * Reset progress for a specific lesson.
   * Uses transaction for atomicity across multiple deletions.
   */
  async resetLessonProgress(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        teachings: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    const questionIds = lesson.teachings.flatMap((t) => t.questions.map((q) => q.id));
    const teachingIds = lesson.teachings.map((t) => t.id);

    // Use transaction for atomic deletion across multiple tables
    return this.prisma.$transaction(async (tx) => {
      await tx.userLesson.deleteMany({
        where: {
          userId,
          lessonId,
        },
      });

      await tx.userTeachingCompleted.deleteMany({
        where: {
          userId,
          teachingId: { in: teachingIds },
        },
      });

      if (questionIds.length > 0) {
        await tx.userQuestionPerformance.deleteMany({
          where: {
            userId,
            questionId: { in: questionIds },
          },
        });
      }

      this.logger.logInfo(`Reset lesson progress for user ${userId}`, {
        lessonId,
      });

      return {
        message: `Progress for lesson ${lessonId} reset successfully`,
        lessonId,
      };
    });
  }

  /**
   * Reset progress for a specific question.
   * Uses repository for single entity deletion.
   */
  async resetQuestionProgress(userId: string, questionId: string) {
    // Verify question exists
    const exists = await this.userQuestionPerformanceRepository.exists({
      questionId,
    });

    if (!exists) {
      // Check if the question itself exists
      const question = await this.prisma.question.findUnique({
        where: { id: questionId },
      });

      if (!question) {
        throw new NotFoundException(`Question with ID ${questionId} not found`);
      }
    }

    // Delete all performance records for this question using repository
    await this.userQuestionPerformanceRepository.deleteByUserAndQuestion(userId, questionId);

    this.logger.logInfo(`Reset question progress for user ${userId}`, {
      questionId,
    });

    return {
      message: `Progress for question ${questionId} reset successfully`,
      questionId,
    };
  }
}
