import { Injectable } from '@nestjs/common';
import { UserQuestionPerformance, Prisma, DELIVERY_METHOD } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaRepository, IReadRepository } from '../../common/repositories';

/**
 * Type for performance record with question and teaching details.
 */
export type PerformanceWithQuestion = UserQuestionPerformance & {
  question: {
    id: string;
    teaching: {
      id: true;
      userLanguageString: string;
      learningLanguageString: string;
    };
  };
};

/**
 * Input for creating a new performance record.
 */
export interface CreatePerformanceInput {
  userId: string;
  questionId: string;
  deliveryMethod: DELIVERY_METHOD;
  score: number;
  timeToComplete: number;
  percentageAccuracy?: number;
  attempts?: number;
  lastRevisedAt: Date;
  nextReviewDue: Date;
  intervalDays: number;
  stability: number;
  difficulty: number;
  repetitions: number;
}

/**
 * IUserQuestionPerformanceRepository
 *
 * Repository interface for user question performance data.
 * Used by engine services for performance analysis and progress reset.
 */
export interface IUserQuestionPerformanceRepository
  extends IReadRepository<UserQuestionPerformance> {
  /**
   * Find performances for a user with optional limit.
   */
  findManyByUserId(
    userId: string,
    options?: { take?: number; select?: Prisma.UserQuestionPerformanceSelect },
  ): Promise<UserQuestionPerformance[]>;

  /**
   * Find distinct question IDs attempted by user.
   */
  findDistinctQuestionIdsByUser(userId: string): Promise<string[]>;

  /**
   * Count due reviews using latest attempt per question.
   */
  countDueReviewsLatestPerQuestion(userId: string, now: Date): Promise<number>;

  /**
   * Find the next review due date after a given date.
   */
  findFirstNextReviewDue(userId: string, afterDate: Date): Promise<Date | null>;

  /**
   * Delete all performance records for a user and question.
   */
  deleteByUserAndQuestion(userId: string, questionId: string): Promise<number>;

  /**
   * Delete all performance records for a user.
   */
  deleteAllByUserId(userId: string): Promise<number>;

  /**
   * Create a new performance record.
   */
  createPerformance(data: CreatePerformanceInput): Promise<UserQuestionPerformance>;

  /**
   * Find performances for a user with question details included.
   */
  findManyByUserWithQuestion(
    userId: string,
    options?: { where?: Prisma.UserQuestionPerformanceWhereInput },
  ): Promise<PerformanceWithQuestion[]>;

  /**
   * Get the latest performance record per question for a user.
   */
  groupLatestByQuestion(userId: string): Promise<PerformanceWithQuestion[]>;

  /**
   * Find recent performances for a user with question details.
   */
  findRecentByUser(userId: string, limit: number): Promise<PerformanceWithQuestion[]>;
}

/**
 * UserQuestionPerformanceRepository
 *
 * Data access layer for user question performance data.
 * Implements IUserQuestionPerformanceRepository for DIP compliance.
 */
@Injectable()
export class UserQuestionPerformanceRepository
  extends PrismaRepository<
    UserQuestionPerformance,
    Prisma.UserQuestionPerformanceCreateInput,
    Prisma.UserQuestionPerformanceUpdateInput
  >
  implements IUserQuestionPerformanceRepository
{
  constructor(prisma: PrismaService) {
    super(prisma, 'userQuestionPerformance');
  }

  async findManyByUserId(
    userId: string,
    options?: { take?: number; select?: Prisma.UserQuestionPerformanceSelect },
  ): Promise<UserQuestionPerformance[]> {
    return this.getModel().findMany({
      where: { userId },
      ...(options?.take && { take: options.take }),
      ...(options?.select && { select: options.select }),
    });
  }

  async findDistinctQuestionIdsByUser(userId: string): Promise<string[]> {
    const results = await this.getModel().findMany({
      where: { userId },
      select: { questionId: true },
      distinct: ['questionId'],
    });
    return results.map((r) => r.questionId);
  }

  async countDueReviewsLatestPerQuestion(
    userId: string,
    now: Date,
  ): Promise<number> {
    type Row = { count: bigint };
    const result = await this.prisma.$queryRaw<Row[]>`
      SELECT COUNT(*) AS count FROM (
        SELECT question_id, next_review_due,
               ROW_NUMBER() OVER (PARTITION BY question_id ORDER BY created_at DESC) AS rn
        FROM user_question_performance
        WHERE user_id = ${userId}::uuid
      ) sub
      WHERE rn = 1 AND next_review_due IS NOT NULL AND next_review_due <= ${now}
    `;
    return Number(result[0]?.count ?? 0);
  }

  async findFirstNextReviewDue(
    userId: string,
    afterDate: Date,
  ): Promise<Date | null> {
    const result = await this.getModel().findFirst({
      where: {
        userId,
        nextReviewDue: {
          gt: afterDate,
          not: null,
        },
      },
      orderBy: { nextReviewDue: 'asc' },
      select: { nextReviewDue: true },
    });
    return result?.nextReviewDue ?? null;
  }

  async deleteByUserAndQuestion(
    userId: string,
    questionId: string,
  ): Promise<number> {
    try {
      const result = await this.getModel().deleteMany({
        where: { userId, questionId },
      });
      return result.count;
    } catch (error) {
      this.logger.logError('Failed to delete question performance', error, {
        userId,
        questionId,
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
      this.logger.logError('Failed to delete user performances', error, {
        userId,
      });
      throw error;
    }
  }

  /**
   * Include clause for question with teaching details.
   */
  private readonly questionWithTeachingInclude = {
    question: {
      include: {
        teaching: {
          select: {
            id: true,
            userLanguageString: true,
            learningLanguageString: true,
          },
        },
      },
    },
  } as const;

  async createPerformance(
    data: CreatePerformanceInput,
  ): Promise<UserQuestionPerformance> {
    try {
      return await this.getModel().create({
        data: {
          userId: data.userId,
          questionId: data.questionId,
          deliveryMethod: data.deliveryMethod,
          score: data.score,
          timeToComplete: data.timeToComplete,
          percentageAccuracy: data.percentageAccuracy,
          attempts: data.attempts,
          lastRevisedAt: data.lastRevisedAt,
          nextReviewDue: data.nextReviewDue,
          intervalDays: data.intervalDays,
          stability: data.stability,
          difficulty: data.difficulty,
          repetitions: data.repetitions,
        },
      });
    } catch (error) {
      this.logger.logError('Failed to create performance record', error, {
        userId: data.userId,
        questionId: data.questionId,
      });
      throw error;
    }
  }

  async findManyByUserWithQuestion(
    userId: string,
    options?: { where?: Prisma.UserQuestionPerformanceWhereInput },
  ): Promise<PerformanceWithQuestion[]> {
    try {
      return (await this.getModel().findMany({
        where: {
          userId,
          ...options?.where,
        },
        include: this.questionWithTeachingInclude,
      })) as unknown as PerformanceWithQuestion[];
    } catch (error) {
      this.logger.logError('Failed to find performances with questions', error, {
        userId,
        options,
      });
      throw error;
    }
  }

  async groupLatestByQuestion(userId: string): Promise<PerformanceWithQuestion[]> {
    try {
      // Get latest performance per question using groupBy
      const latestPerformances = await this.getModel().groupBy({
        by: ['questionId'],
        where: { userId },
        _max: {
          createdAt: true,
        },
      });

      if (latestPerformances.length === 0) {
        return [];
      }

      // Fetch actual performance records with question details
      const performances = await this.getModel().findMany({
        where: {
          userId,
          OR: latestPerformances.map((lp) => ({
            questionId: lp.questionId,
            createdAt: lp._max.createdAt!,
          })),
        },
        include: this.questionWithTeachingInclude,
      });

      return performances as unknown as PerformanceWithQuestion[];
    } catch (error) {
      this.logger.logError('Failed to group latest by question', error, {
        userId,
      });
      throw error;
    }
  }

  async findRecentByUser(
    userId: string,
    limit: number,
  ): Promise<PerformanceWithQuestion[]> {
    try {
      return (await this.getModel().findMany({
        where: { userId },
        include: {
          question: {
            select: {
              id: true,
              teaching: {
                select: {
                  userLanguageString: true,
                  learningLanguageString: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      })) as unknown as PerformanceWithQuestion[];
    } catch (error) {
      this.logger.logError('Failed to find recent performances', error, {
        userId,
        limit,
      });
      throw error;
    }
  }
}
