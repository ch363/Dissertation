import { Injectable } from '@nestjs/common';
import { UserKnowledgeLevelProgress, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaRepository } from '../../common/repositories';

/**
 * IUserKnowledgeLevelProgressRepository
 *
 * Repository interface for user knowledge level (XP) progress tracking.
 * Used for XP history, weekly progress, and account management.
 */
export interface IUserKnowledgeLevelProgressRepository {
  /**
   * Find progress records for a user within a date range.
   */
  findManyByUserInRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<UserKnowledgeLevelProgress[]>;

  /**
   * Find all progress records for a user.
   */
  findManyByUserId(userId: string): Promise<UserKnowledgeLevelProgress[]>;

  /**
   * Aggregate XP sum for a user, optionally within a date range.
   */
  aggregateSum(
    userId: string,
    options?: { startDate?: Date; endDate?: Date },
  ): Promise<number>;

  /**
   * Create a new progress record (XP event).
   */
  createProgressRecord(userId: string, value: number): Promise<UserKnowledgeLevelProgress>;

  /**
   * Delete all progress records for a user (for account reset/deletion).
   */
  deleteAllByUserId(userId: string): Promise<number>;

  /**
   * Get total XP for a user.
   */
  getTotalXp(userId: string): Promise<number>;
}

/**
 * UserKnowledgeLevelProgressRepository
 *
 * Data access layer for user XP progress tracking.
 * Each record represents an XP gain event with timestamp.
 */
@Injectable()
export class UserKnowledgeLevelProgressRepository
  extends PrismaRepository<
    UserKnowledgeLevelProgress,
    Prisma.UserKnowledgeLevelProgressCreateInput,
    Prisma.UserKnowledgeLevelProgressUpdateInput
  >
  implements IUserKnowledgeLevelProgressRepository
{
  constructor(prisma: PrismaService) {
    super(prisma, 'userKnowledgeLevelProgress');
  }

  async findManyByUserInRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<UserKnowledgeLevelProgress[]> {
    try {
      return await this.getModel().findMany({
        where: {
          userId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { createdAt: 'asc' },
      });
    } catch (error) {
      this.logger.logError('Failed to find progress in range', error, {
        userId,
        startDate,
        endDate,
      });
      throw error;
    }
  }

  async findManyByUserId(userId: string): Promise<UserKnowledgeLevelProgress[]> {
    try {
      return await this.getModel().findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.logError('Failed to find user progress', error, { userId });
      throw error;
    }
  }

  async aggregateSum(
    userId: string,
    options?: { startDate?: Date; endDate?: Date },
  ): Promise<number> {
    try {
      const where: Prisma.UserKnowledgeLevelProgressWhereInput = { userId };

      if (options?.startDate || options?.endDate) {
        where.createdAt = {};
        if (options.startDate) {
          where.createdAt.gte = options.startDate;
        }
        if (options.endDate) {
          where.createdAt.lte = options.endDate;
        }
      }

      const result = await this.getModel().aggregate({
        where,
        _sum: { value: true },
      });

      return result._sum.value ?? 0;
    } catch (error) {
      this.logger.logError('Failed to aggregate XP sum', error, {
        userId,
        options,
      });
      throw error;
    }
  }

  async createProgressRecord(
    userId: string,
    value: number,
  ): Promise<UserKnowledgeLevelProgress> {
    try {
      return await this.getModel().create({
        data: {
          userId,
          value,
        },
      });
    } catch (error) {
      this.logger.logError('Failed to create progress record', error, {
        userId,
        value,
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
      this.logger.logError('Failed to delete user progress', error, { userId });
      throw error;
    }
  }

  async getTotalXp(userId: string): Promise<number> {
    return this.aggregateSum(userId);
  }
}
