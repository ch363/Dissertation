import { Injectable } from '@nestjs/common';
import { Question, DELIVERY_METHOD, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaRepository } from '../common/repositories';
import {
  teachingIncludeWithStrings,
  teachingIncludeWithLesson,
} from '../common/prisma/selects';

/**
 * QuestionRepository
 *
 * Data access layer for Question entities.
 * Extends PrismaRepository to provide CRUD operations
 * and adds domain-specific query methods.
 */
@Injectable()
export class QuestionRepository extends PrismaRepository<
  Question,
  Prisma.QuestionCreateInput,
  Prisma.QuestionUpdateInput
> {
  constructor(prisma: PrismaService) {
    super(prisma, 'question');
  }

  /**
   * Find all questions, optionally filtered by teaching.
   */
  async findAllWithTeaching(teachingId?: string): Promise<Question[]> {
    const where = teachingId ? { teachingId } : {};
    return this.getModel().findMany({
      where,
      include: teachingIncludeWithStrings,
    });
  }

  /**
   * Find a question by ID with teaching and lesson included.
   */
  async findByIdWithTeachingAndLesson(id: string): Promise<Question | null> {
    return this.getModel().findUnique({
      where: { id },
      include: teachingIncludeWithLesson,
    });
  }

  /**
   * Find a question by ID with teaching strings.
   */
  async findByIdWithTeaching(id: string): Promise<Question | null> {
    return this.getModel().findUnique({
      where: { id },
      include: teachingIncludeWithStrings,
    });
  }

  /**
   * Upsert a question variant for a delivery method.
   */
  async upsertVariant(
    questionId: string,
    deliveryMethod: DELIVERY_METHOD,
  ): Promise<void> {
    await this.prisma.questionVariant.upsert({
      where: {
        questionId_deliveryMethod: {
          questionId,
          deliveryMethod,
        },
      },
      update: {},
      create: {
        questionId,
        deliveryMethod,
        data: {},
      },
    });
  }

  /**
   * Find question with variants included.
   */
  async findByIdWithVariants(id: string): Promise<Question | null> {
    return this.getModel().findUnique({
      where: { id },
      include: {
        variants: true,
        ...teachingIncludeWithStrings,
      },
    });
  }

  /**
   * Find questions by teaching ID.
   */
  async findByTeachingId(teachingId: string): Promise<Question[]> {
    return this.findAll({
      where: { teachingId },
    });
  }

  /**
   * Find a question by ID with teaching and skill tags included.
   * Used by ContentDataService for engine operations.
   */
  async findByIdWithTeachingAndSkillTags(id: string): Promise<Question | null> {
    return this.getModel().findUnique({
      where: { id },
      include: {
        teaching: {
          include: {
            skillTags: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Find all question IDs.
   * Used by ContentDeliveryService for dashboard calculations.
   */
  async findAllIds(): Promise<string[]> {
    const questions = await this.getModel().findMany({
      select: { id: true },
    });
    return questions.map((q) => q.id);
  }

  /**
   * Find a question by ID with full details including teaching, lesson, and skill tags.
   * Used by QuestionAttemptService for recording attempts.
   */
  async findByIdWithDetails(id: string) {
    return this.getModel().findUnique({
      where: { id },
      include: {
        teaching: {
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
              },
            },
            skillTags: {
              select: {
                name: true,
              },
            },
          },
        },
        skillTags: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  /**
   * Find a question by ID with variants and skill tags included.
   * Used by AnswerValidationService for validating responses.
   */
  async findByIdWithVariantsAndSkillTags(id: string) {
    return this.getModel().findUnique({
      where: { id },
      include: {
        variants: true,
        skillTags: {
          select: {
            name: true,
          },
        },
        teaching: {
          select: {
            id: true,
            learningLanguageString: true,
            userLanguageString: true,
            lessonId: true,
          },
        },
      },
    });
  }
}
