import { Injectable } from '@nestjs/common';
import { UserLesson, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaRepository } from '../../common/repositories';
import { LoggerService } from '../../common/logger';

/**
 * IUserLessonRepository
 *
 * Repository interface for user lesson progress tracking.
 * Handles composite key operations for UserLesson model.
 */
export interface IUserLessonRepository {
  /**
   * Find a user lesson by composite key.
   */
  findByUserAndLesson(userId: string, lessonId: string): Promise<UserLesson | null>;

  /**
   * Find all lessons for a user with optional includes.
   */
  findManyByUserId(
    userId: string,
    options?: {
      include?: Prisma.UserLessonInclude;
      orderBy?: Prisma.UserLessonOrderByWithRelationInput;
    },
  ): Promise<UserLesson[]>;

  /**
   * Start a lesson for a user (upsert pattern).
   */
  startLesson(
    userId: string,
    lessonId: string,
    include?: Prisma.UserLessonInclude,
  ): Promise<UserLesson>;

  /**
   * End a lesson for a user.
   */
  endLesson(userId: string, lessonId: string): Promise<UserLesson>;

  /**
   * Update completed teachings count.
   */
  updateCompletedTeachings(
    userId: string,
    lessonId: string,
    completedCount: number,
  ): Promise<UserLesson>;

  /**
   * Upsert a user lesson record.
   */
  upsert(
    userId: string,
    lessonId: string,
    data: {
      completedTeachings: number;
      startedAt?: Date;
    },
  ): Promise<UserLesson>;

  /**
   * Delete all lessons for a user.
   */
  deleteAllByUserId(userId: string): Promise<number>;

  /**
   * Find all user lessons with lesson details (title, module, teachings count).
   */
  findManyWithLessonDetails(userId: string): Promise<UserLessonWithDetails[]>;

  /**
   * Count all lessons for a user.
   */
  countByUserId(userId: string): Promise<number>;

  /**
   * Find user lessons within a date range (for study time calculations).
   */
  findManyByUserInRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<UserLesson[]>;
}

/**
 * Type for user lesson with lesson and module details.
 */
export type UserLessonWithDetails = UserLesson & {
  lesson: {
    id: string;
    title: string;
    module: {
      id: string;
      title: string;
    };
    teachings: Array<{ id: string }>;
  };
};

/**
 * UserLessonRepository
 *
 * Data access layer for user lesson progress.
 * Handles the composite key (userId, lessonId) pattern.
 */
@Injectable()
export class UserLessonRepository
  extends PrismaRepository<
    UserLesson,
    Prisma.UserLessonCreateInput,
    Prisma.UserLessonUpdateInput
  >
  implements IUserLessonRepository
{
  constructor(prisma: PrismaService) {
    super(prisma, 'userLesson');
  }

  async findByUserAndLesson(
    userId: string,
    lessonId: string,
  ): Promise<UserLesson | null> {
    try {
      return await this.getModel().findUnique({
        where: {
          userId_lessonId: { userId, lessonId },
        },
      });
    } catch (error) {
      this.logger.logError('Failed to find user lesson', error, {
        userId,
        lessonId,
      });
      throw error;
    }
  }

  async findManyByUserId(
    userId: string,
    options?: {
      include?: Prisma.UserLessonInclude;
      orderBy?: Prisma.UserLessonOrderByWithRelationInput;
    },
  ): Promise<UserLesson[]> {
    try {
      return await this.getModel().findMany({
        where: { userId },
        include: options?.include,
        orderBy: options?.orderBy,
      });
    } catch (error) {
      this.logger.logError('Failed to find user lessons', error, { userId });
      throw error;
    }
  }

  async startLesson(
    userId: string,
    lessonId: string,
    include?: Prisma.UserLessonInclude,
  ): Promise<UserLesson> {
    const now = new Date();
    try {
      return await this.getModel().upsert({
        where: {
          userId_lessonId: { userId, lessonId },
        },
        update: {
          startedAt: now,
          updatedAt: now,
        },
        create: {
          userId,
          lessonId,
          completedTeachings: 0,
          startedAt: now,
        },
        include,
      });
    } catch (error) {
      this.logger.logError('Failed to start lesson', error, {
        userId,
        lessonId,
      });
      throw error;
    }
  }

  async endLesson(userId: string, lessonId: string): Promise<UserLesson> {
    const now = new Date();
    try {
      return await this.getModel().update({
        where: {
          userId_lessonId: { userId, lessonId },
        },
        data: {
          endedAt: now,
          updatedAt: now,
        },
      });
    } catch (error) {
      this.logger.logError('Failed to end lesson', error, { userId, lessonId });
      throw error;
    }
  }

  async updateCompletedTeachings(
    userId: string,
    lessonId: string,
    completedCount: number,
  ): Promise<UserLesson> {
    const now = new Date();
    try {
      return await this.getModel().update({
        where: {
          userId_lessonId: { userId, lessonId },
        },
        data: {
          completedTeachings: completedCount,
          updatedAt: now,
        },
      });
    } catch (error) {
      this.logger.logError('Failed to update completed teachings', error, {
        userId,
        lessonId,
        completedCount,
      });
      throw error;
    }
  }

  async upsert(
    userId: string,
    lessonId: string,
    data: {
      completedTeachings: number;
      startedAt?: Date;
    },
  ): Promise<UserLesson> {
    const now = new Date();
    try {
      return await this.getModel().upsert({
        where: {
          userId_lessonId: { userId, lessonId },
        },
        update: {
          completedTeachings: data.completedTeachings,
          updatedAt: now,
        },
        create: {
          userId,
          lessonId,
          completedTeachings: data.completedTeachings,
          startedAt: data.startedAt ?? now,
        },
      });
    } catch (error) {
      this.logger.logError('Failed to upsert user lesson', error, {
        userId,
        lessonId,
        data,
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
      this.logger.logError('Failed to delete user lessons', error, { userId });
      throw error;
    }
  }

  async findManyWithLessonDetails(userId: string): Promise<UserLessonWithDetails[]> {
    try {
      return (await this.getModel().findMany({
        where: { userId },
        include: {
          lesson: {
            include: {
              module: {
                select: {
                  id: true,
                  title: true,
                },
              },
              teachings: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      })) as unknown as UserLessonWithDetails[];
    } catch (error) {
      this.logger.logError('Failed to find user lessons with details', error, {
        userId,
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
      this.logger.logError('Failed to count user lessons', error, { userId });
      throw error;
    }
  }

  async findManyByUserInRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<UserLesson[]> {
    try {
      return await this.getModel().findMany({
        where: {
          userId,
          endedAt: { gte: startDate, lte: endDate, not: null },
          startedAt: { not: null },
        },
        select: {
          id: true,
          userId: true,
          lessonId: true,
          startedAt: true,
          endedAt: true,
          completedTeachings: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      this.logger.logError('Failed to find user lessons in range', error, {
        userId,
        startDate,
        endDate,
      });
      throw error;
    }
  }
}
