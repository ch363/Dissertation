import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResetProgressDto } from './dto/reset-progress.dto';
import { LoggerService } from '../common/logger';

/**
 * ProgressResetService
 * 
 * Handles all progress reset operations.
 * Follows Single Responsibility Principle - focused only on resetting user progress.
 */
@Injectable()
export class ProgressResetService {
  private readonly logger = new LoggerService(ProgressResetService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Reset all progress for a user.
   * Optionally includes XP and delivery method scores.
   */
  async resetAllProgress(userId: string, options?: ResetProgressDto) {
    return this.prisma.$transaction(async (tx) => {
      await tx.userLesson.deleteMany({ where: { userId } });
      await tx.userTeachingView.deleteMany({ where: { userId } });
      await tx.userQuestionPerformance.deleteMany({ where: { userId } });

      if (options?.includeXp) {
        await tx.userKnowledgeLevelProgress.deleteMany({ where: { userId } });
        await tx.user.update({
          where: { id: userId },
          data: {
            knowledgePoints: 0,
            knowledgeLevel: 'A1',
          },
        });
      }

      if (options?.includeDeliveryMethodScores) {
        await tx.userDeliveryMethodScore.deleteMany({ where: { userId } });
      }

      this.logger.info(`Reset all progress for user ${userId}`, {
        includeXp: options?.includeXp,
        includeDeliveryMethodScores: options?.includeDeliveryMethodScores,
      });

      return {
        message: 'All progress reset successfully',
        resetXp: options?.includeXp || false,
        resetDeliveryMethodScores:
          options?.includeDeliveryMethodScores || false,
      };
    });
  }

  /**
   * Reset progress for a specific lesson.
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

    const questionIds = lesson.teachings.flatMap((t) =>
      t.questions.map((q) => q.id),
    );
    const teachingIds = lesson.teachings.map((t) => t.id);

    return this.prisma.$transaction(async (tx) => {
      await tx.userLesson.deleteMany({
        where: {
          userId,
          lessonId,
        },
      });

      await tx.userTeachingView.deleteMany({
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

      this.logger.info(`Reset lesson progress for user ${userId}`, {
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
   */
  async resetQuestionProgress(userId: string, questionId: string) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    await this.prisma.userQuestionPerformance.deleteMany({
      where: {
        userId,
        questionId,
      },
    });

    this.logger.info(`Reset question progress for user ${userId}`, {
      questionId,
    });

    return {
      message: `Progress for question ${questionId} reset successfully`,
      questionId,
    };
  }
}
