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
}
