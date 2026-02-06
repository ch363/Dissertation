import { Injectable } from '@nestjs/common';
import { UserTeachingCompleted, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaRepository } from '../../common/repositories';

/**
 * IUserTeachingCompletedRepository
 *
 * Repository interface for user teaching completion tracking.
 * Extends the read-only UserTeachingViewRepository with write operations.
 */
export interface IUserTeachingCompletedRepository {
  /**
   * Find a teaching completion record by composite key.
   */
  findByUserAndTeaching(
    userId: string,
    teachingId: string,
  ): Promise<UserTeachingCompleted | null>;

  /**
   * Find all completed teachings for a user.
   */
  findManyByUserId(userId: string): Promise<UserTeachingCompleted[]>;

  /**
   * Find completed teachings for a user filtered by lesson.
   */
  findManyByUserAndLesson(
    userId: string,
    lessonId: string,
  ): Promise<UserTeachingCompleted[]>;

  /**
   * Get set of teaching IDs the user has completed.
   */
  getCompletedTeachingIdsByUserId(userId: string): Promise<Set<string>>;

  /**
   * Mark a teaching as completed (upsert pattern).
   * Creates or updates the completion record.
   */
  markCompleted(userId: string, teachingId: string): Promise<UserTeachingCompleted>;

  /**
   * Mark multiple teachings as completed for a user.
   */
  markManyCompleted(
    userId: string,
    teachingIds: string[],
  ): Promise<UserTeachingCompleted[]>;

  /**
   * Delete all completion records for a user.
   */
  deleteAllByUserId(userId: string): Promise<number>;

  /**
   * Delete completion record for a specific teaching.
   */
  deleteByUserAndTeaching(userId: string, teachingId: string): Promise<void>;

  /**
   * Count completed teachings for a user.
   */
  countByUserId(userId: string): Promise<number>;

  /**
   * Find teaching completions within a date range (for study time calculations).
   */
  findManyByUserInRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<UserTeachingCompleted[]>;

  /**
   * Count completed teachings for a specific lesson.
   */
  countByUserAndTeachingIds(
    userId: string,
    teachingIds: string[],
  ): Promise<number>;

  /**
   * Find the most recent teaching completion for a user with full details.
   */
  findMostRecentByUser(userId: string): Promise<UserTeachingCompletedWithDetails | null>;
}

/**
 * Type for teaching completion with teaching and lesson details.
 */
export type UserTeachingCompletedWithDetails = UserTeachingCompleted & {
  teaching: {
    id: string;
    userLanguageString: string;
    learningLanguageString: string;
    lesson: {
      id: string;
      title: string;
      module: {
        id: string;
        title: string;
      };
    };
  };
};

/**
 * UserTeachingCompletedRepository
 *
 * Data access layer for user teaching completions.
 * Handles the composite key (userId, teachingId) pattern.
 *
 * Note: This complements UserTeachingViewRepository which is read-only.
 * This repository provides write operations for teaching completions.
 */
@Injectable()
export class UserTeachingCompletedRepository
  extends PrismaRepository<
    UserTeachingCompleted,
    Prisma.UserTeachingCompletedCreateInput,
    Prisma.UserTeachingCompletedUpdateInput
  >
  implements IUserTeachingCompletedRepository
{
  constructor(prisma: PrismaService) {
    super(prisma, 'userTeachingCompleted');
  }

  async findByUserAndTeaching(
    userId: string,
    teachingId: string,
  ): Promise<UserTeachingCompleted | null> {
    try {
      return await this.getModel().findUnique({
        where: {
          userId_teachingId: { userId, teachingId },
        },
      });
    } catch (error) {
      this.logger.logError('Failed to find teaching completion', error, {
        userId,
        teachingId,
      });
      throw error;
    }
  }

  async findManyByUserId(userId: string): Promise<UserTeachingCompleted[]> {
    try {
      return await this.getModel().findMany({
        where: { userId },
      });
    } catch (error) {
      this.logger.logError('Failed to find teaching completions', error, {
        userId,
      });
      throw error;
    }
  }

  async findManyByUserAndLesson(
    userId: string,
    lessonId: string,
  ): Promise<UserTeachingCompleted[]> {
    try {
      return await this.getModel().findMany({
        where: {
          userId,
          teaching: { lessonId },
        },
        select: { teachingId: true, userId: true, startedAt: true, endedAt: true, createdAt: true },
      });
    } catch (error) {
      this.logger.logError('Failed to find teaching completions by lesson', error, {
        userId,
        lessonId,
      });
      throw error;
    }
  }

  async getCompletedTeachingIdsByUserId(userId: string): Promise<Set<string>> {
    try {
      const completions = await this.getModel().findMany({
        where: { userId },
        select: { teachingId: true },
      });
      return new Set(completions.map((c) => c.teachingId));
    } catch (error) {
      this.logger.logError('Failed to get completed teaching IDs', error, {
        userId,
      });
      throw error;
    }
  }

  async markCompleted(
    userId: string,
    teachingId: string,
  ): Promise<UserTeachingCompleted> {
    const now = new Date();
    try {
      return await this.getModel().upsert({
        where: {
          userId_teachingId: { userId, teachingId },
        },
        update: {
          endedAt: now,
        },
        create: {
          userId,
          teachingId,
          startedAt: now,
          endedAt: now,
        },
      });
    } catch (error) {
      this.logger.logError('Failed to mark teaching completed', error, {
        userId,
        teachingId,
      });
      throw error;
    }
  }

  async markManyCompleted(
    userId: string,
    teachingIds: string[],
  ): Promise<UserTeachingCompleted[]> {
    const now = new Date();
    try {
      const results: UserTeachingCompleted[] = [];
      for (const teachingId of teachingIds) {
        const result = await this.getModel().upsert({
          where: {
            userId_teachingId: { userId, teachingId },
          },
          update: {
            endedAt: now,
          },
          create: {
            userId,
            teachingId,
            startedAt: now,
            endedAt: now,
          },
        });
        results.push(result);
      }
      return results;
    } catch (error) {
      this.logger.logError('Failed to mark teachings completed', error, {
        userId,
        teachingIds,
      });
      throw error;
    }
  }

  async deleteAllByUserId(userId: string): Promise<number> {
    try {
      const result = await this.getModel().deleteMany({
        where: { userId },
      });
      return result.count;
    } catch (error) {
      this.logger.logError('Failed to delete teaching completions', error, {
        userId,
      });
      throw error;
    }
  }

  async deleteByUserAndTeaching(
    userId: string,
    teachingId: string,
  ): Promise<void> {
    try {
      await this.getModel().delete({
        where: {
          userId_teachingId: { userId, teachingId },
        },
      });
    } catch (error) {
      this.logger.logError('Failed to delete teaching completion', error, {
        userId,
        teachingId,
      });
      throw error;
    }
  }

  async countByUserId(userId: string): Promise<number> {
    try {
      return await this.getModel().count({
        where: { userId },
      });
    } catch (error) {
      this.logger.logError('Failed to count teaching completions', error, {
        userId,
      });
      throw error;
    }
  }

  async findManyByUserInRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<UserTeachingCompleted[]> {
    try {
      return await this.getModel().findMany({
        where: {
          userId,
          endedAt: { gte: startDate, lte: endDate, not: null },
          startedAt: { not: null },
        },
        select: {
          userId: true,
          teachingId: true,
          startedAt: true,
          endedAt: true,
          createdAt: true,
        },
      });
    } catch (error) {
      this.logger.logError('Failed to find teaching completions in range', error, {
        userId,
        startDate,
        endDate,
      });
      throw error;
    }
  }

  async countByUserAndTeachingIds(
    userId: string,
    teachingIds: string[],
  ): Promise<number> {
    try {
      return await this.getModel().count({
        where: {
          userId,
          teachingId: { in: teachingIds },
        },
      });
    } catch (error) {
      this.logger.logError('Failed to count teaching completions by IDs', error, {
        userId,
        teachingIds,
      });
      throw error;
    }
  }

  async findMostRecentByUser(
    userId: string,
  ): Promise<UserTeachingCompletedWithDetails | null> {
    try {
      return (await this.getModel().findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          teaching: {
            select: {
              id: true,
              userLanguageString: true,
              learningLanguageString: true,
              lesson: {
                select: {
                  id: true,
                  title: true,
                  module: {
                    select: {
                      id: true,
                      title: true,
                    },
                  },
                },
              },
            },
          },
        },
      })) as unknown as UserTeachingCompletedWithDetails | null;
    } catch (error) {
      this.logger.logError('Failed to find most recent teaching completion', error, {
        userId,
      });
      throw error;
    }
  }
}
