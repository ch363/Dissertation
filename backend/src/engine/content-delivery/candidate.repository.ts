import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DELIVERY_METHOD,
  KNOWLEDGE_LEVEL,
  Prisma,
  Question,
  UserQuestionPerformance,
} from '@prisma/client';
import { LoggerService } from '../../common/logger/logger.service';
import { isMissingColumnOrSchemaMismatchError } from '../../common/utils/prisma-error.util';

/**
 * QuestionWithDetails type representing a question with all related data
 * needed for candidate evaluation.
 */
export type QuestionWithDetails = Question & {
  variants: Array<{ deliveryMethod: DELIVERY_METHOD }>;
  skillTags: Array<{ name: string }>;
  teaching: {
    id: string;
    lessonId: string;
    tip: string | null;
    knowledgeLevel: KNOWLEDGE_LEVEL;
    skillTags: Array<{ name: string }>;
    lesson: {
      id: string;
      moduleId: string;
    };
  };
};

/**
 * ICandidateRepository
 *
 * Repository interface for candidate selection data access.
 * Abstracts the complex queries needed by CandidateService.
 */
export interface ICandidateRepository {
  /**
   * Find question IDs belonging to a specific lesson.
   */
  findQuestionIdsByLesson(lessonId: string): Promise<string[]>;

  /**
   * Find question IDs belonging to a specific module.
   */
  findQuestionIdsByModule(moduleId: string): Promise<string[]>;

  /**
   * Find user performances with optional question ID filtering.
   * Returns an empty array on schema mismatch errors for graceful degradation.
   */
  findPerformancesByUserWithFilter(
    userId: string,
    questionIds?: string[],
  ): Promise<UserQuestionPerformance[]>;

  /**
   * Find questions with all related details needed for candidate evaluation.
   */
  findQuestionsWithDetails(questionIds: string[]): Promise<QuestionWithDetails[]>;

  /**
   * Find a single question with all details.
   */
  findQuestionWithDetails(questionId: string): Promise<QuestionWithDetails | null>;

  /**
   * Find recent attempts for a specific user and question.
   */
  findRecentAttempts(
    userId: string,
    questionId: string,
    limit: number,
  ): Promise<UserQuestionPerformance[]>;

  /**
   * Find new (unattempted) questions for a user within a scope.
   */
  findNewQuestions(
    userId: string,
    options: { lessonId?: string; moduleId?: string },
  ): Promise<QuestionWithDetails[]>;

  /**
   * Find all distinct question IDs that a user has attempted.
   */
  findAttemptedQuestionIds(userId: string): Promise<string[]>;

  /**
   * Find questions by lesson or module scope with full details.
   */
  findQuestionsWithDetailsByScope(options: {
    lessonId?: string;
    moduleId?: string;
  }): Promise<QuestionWithDetails[]>;
}

/**
 * CandidateRepository
 *
 * Data access layer for candidate selection operations.
 * Provides optimized queries for review and new candidate retrieval.
 */
@Injectable()
export class CandidateRepository implements ICandidateRepository {
  private readonly logger = new LoggerService(CandidateRepository.name);

  /**
   * Include clause for questions with all related details.
   */
  private readonly questionDetailsInclude = {
    variants: {
      select: { deliveryMethod: true },
    },
    skillTags: {
      select: { name: true },
    },
    teaching: {
      include: {
        lesson: {
          select: { id: true, moduleId: true },
        },
        skillTags: {
          select: { name: true },
        },
      },
    },
  } as const;

  constructor(private readonly prisma: PrismaService) {}

  async findQuestionIdsByLesson(lessonId: string): Promise<string[]> {
    try {
      const questions = await this.prisma.question.findMany({
        where: {
          teaching: { lessonId },
        },
        select: { id: true },
      });
      return questions.map((q) => q.id);
    } catch (error) {
      this.logger.logError('Failed to find question IDs by lesson', error, {
        lessonId,
      });
      throw error;
    }
  }

  async findQuestionIdsByModule(moduleId: string): Promise<string[]> {
    try {
      const questions = await this.prisma.question.findMany({
        where: {
          teaching: {
            lesson: { moduleId },
          },
        },
        select: { id: true },
      });
      return questions.map((q) => q.id);
    } catch (error) {
      this.logger.logError('Failed to find question IDs by module', error, {
        moduleId,
      });
      throw error;
    }
  }

  async findPerformancesByUserWithFilter(
    userId: string,
    questionIds?: string[],
  ): Promise<UserQuestionPerformance[]> {
    try {
      const where: Prisma.UserQuestionPerformanceWhereInput = {
        userId,
        ...(questionIds ? { questionId: { in: questionIds } } : {}),
      };

      return await this.prisma.userQuestionPerformance.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error: unknown) {
      // Gracefully handle schema mismatch errors (e.g., during migrations)
      if (isMissingColumnOrSchemaMismatchError(error)) {
        this.logger.warn(
          'Schema mismatch when fetching performances, returning empty array',
        );
        return [];
      }
      this.logger.logError('Failed to find user performances', error, {
        userId,
        questionIds,
      });
      throw error;
    }
  }

  async findQuestionsWithDetails(
    questionIds: string[],
  ): Promise<QuestionWithDetails[]> {
    try {
      if (questionIds.length === 0) {
        return [];
      }
      const questions = await this.prisma.question.findMany({
        where: { id: { in: questionIds } },
        include: this.questionDetailsInclude,
      });
      return questions as unknown as QuestionWithDetails[];
    } catch (error) {
      this.logger.logError('Failed to find questions with details', error, {
        questionIds,
      });
      throw error;
    }
  }

  async findQuestionWithDetails(
    questionId: string,
  ): Promise<QuestionWithDetails | null> {
    try {
      return await this.prisma.question.findUnique({
        where: { id: questionId },
        include: this.questionDetailsInclude,
      }) as QuestionWithDetails | null;
    } catch (error) {
      this.logger.logError('Failed to find question with details', error, {
        questionId,
      });
      throw error;
    }
  }

  async findRecentAttempts(
    userId: string,
    questionId: string,
    limit: number,
  ): Promise<UserQuestionPerformance[]> {
    try {
      return await this.prisma.userQuestionPerformance.findMany({
        where: {
          userId,
          questionId,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      this.logger.logError('Failed to find recent attempts', error, {
        userId,
        questionId,
        limit,
      });
      throw error;
    }
  }

  async findNewQuestions(
    userId: string,
    options: { lessonId?: string; moduleId?: string },
  ): Promise<QuestionWithDetails[]> {
    try {
      // First, get all attempted question IDs
      const attemptedIds = await this.findAttemptedQuestionIds(userId);
      const attemptedSet = new Set(attemptedIds);

      // Find questions in scope with full details
      const allQuestions = await this.findQuestionsWithDetailsByScope(options);

      // Filter out attempted questions
      return allQuestions.filter((q) => !attemptedSet.has(q.id));
    } catch (error) {
      this.logger.logError('Failed to find new questions', error, {
        userId,
        options,
      });
      throw error;
    }
  }

  async findAttemptedQuestionIds(userId: string): Promise<string[]> {
    try {
      const performances = await this.prisma.userQuestionPerformance.findMany({
        where: { userId },
        select: { questionId: true },
        distinct: ['questionId'],
      });
      return performances.map((p) => p.questionId);
    } catch (error) {
      this.logger.logError('Failed to find attempted question IDs', error, {
        userId,
      });
      throw error;
    }
  }

  async findQuestionsWithDetailsByScope(options: {
    lessonId?: string;
    moduleId?: string;
  }): Promise<QuestionWithDetails[]> {
    try {
      const whereClause: Prisma.QuestionWhereInput = {};

      if (options.lessonId) {
        whereClause.teaching = { lessonId: options.lessonId };
      } else if (options.moduleId) {
        whereClause.teaching = { lesson: { moduleId: options.moduleId } };
      }

      const questions = await this.prisma.question.findMany({
        where: whereClause,
        include: this.questionDetailsInclude,
      });
      return questions as unknown as QuestionWithDetails[];
    } catch (error) {
      this.logger.logError('Failed to find questions by scope', error, {
        options,
      });
      throw error;
    }
  }
}
