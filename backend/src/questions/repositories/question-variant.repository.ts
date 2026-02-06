import { Injectable } from '@nestjs/common';
import { QuestionVariant, DELIVERY_METHOD, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaRepository } from '../../common/repositories';

/**
 * IQuestionVariantRepository
 *
 * Repository interface for question variant data access.
 * Used by answer validation and delivery method services.
 */
export interface IQuestionVariantRepository {
  /**
   * Find a variant by question ID and delivery method.
   */
  findByQuestionAndMethod(
    questionId: string,
    deliveryMethod: DELIVERY_METHOD,
  ): Promise<QuestionVariant | null>;

  /**
   * Find all variants for a question.
   */
  findManyByQuestionId(questionId: string): Promise<QuestionVariant[]>;

  /**
   * Find variants for multiple questions.
   */
  findManyByQuestionIds(questionIds: string[]): Promise<QuestionVariant[]>;

  /**
   * Upsert a variant (create or update).
   */
  upsert(
    questionId: string,
    deliveryMethod: DELIVERY_METHOD,
    data?: Prisma.JsonValue,
  ): Promise<QuestionVariant>;

  /**
   * Delete a variant by question and method.
   */
  deleteByQuestionAndMethod(
    questionId: string,
    deliveryMethod: DELIVERY_METHOD,
  ): Promise<void>;

  /**
   * Get available delivery methods for a question.
   */
  getDeliveryMethodsForQuestion(questionId: string): Promise<DELIVERY_METHOD[]>;
}

/**
 * QuestionVariantRepository
 *
 * Data access layer for question variants.
 * Handles the composite key (questionId, deliveryMethod) pattern.
 */
@Injectable()
export class QuestionVariantRepository
  extends PrismaRepository<
    QuestionVariant,
    Prisma.QuestionVariantCreateInput,
    Prisma.QuestionVariantUpdateInput
  >
  implements IQuestionVariantRepository
{
  constructor(prisma: PrismaService) {
    super(prisma, 'questionVariant');
  }

  async findByQuestionAndMethod(
    questionId: string,
    deliveryMethod: DELIVERY_METHOD,
  ): Promise<QuestionVariant | null> {
    try {
      return await this.getModel().findUnique({
        where: {
          questionId_deliveryMethod: { questionId, deliveryMethod },
        },
      });
    } catch (error) {
      this.logger.logError('Failed to find question variant', error, {
        questionId,
        deliveryMethod,
      });
      throw error;
    }
  }

  async findManyByQuestionId(questionId: string): Promise<QuestionVariant[]> {
    try {
      return await this.getModel().findMany({
        where: { questionId },
      });
    } catch (error) {
      this.logger.logError('Failed to find question variants', error, {
        questionId,
      });
      throw error;
    }
  }

  async findManyByQuestionIds(questionIds: string[]): Promise<QuestionVariant[]> {
    try {
      return await this.getModel().findMany({
        where: {
          questionId: { in: questionIds },
        },
      });
    } catch (error) {
      this.logger.logError('Failed to find question variants', error, {
        questionIds,
      });
      throw error;
    }
  }

  async upsert(
    questionId: string,
    deliveryMethod: DELIVERY_METHOD,
    data?: Prisma.JsonValue,
  ): Promise<QuestionVariant> {
    try {
      return await this.getModel().upsert({
        where: {
          questionId_deliveryMethod: { questionId, deliveryMethod },
        },
        update: {
          data: data ?? {},
        },
        create: {
          questionId,
          deliveryMethod,
          data: data ?? {},
        },
      });
    } catch (error) {
      this.logger.logError('Failed to upsert question variant', error, {
        questionId,
        deliveryMethod,
      });
      throw error;
    }
  }

  async deleteByQuestionAndMethod(
    questionId: string,
    deliveryMethod: DELIVERY_METHOD,
  ): Promise<void> {
    try {
      await this.getModel().delete({
        where: {
          questionId_deliveryMethod: { questionId, deliveryMethod },
        },
      });
    } catch (error) {
      this.logger.logError('Failed to delete question variant', error, {
        questionId,
        deliveryMethod,
      });
      throw error;
    }
  }

  async getDeliveryMethodsForQuestion(
    questionId: string,
  ): Promise<DELIVERY_METHOD[]> {
    try {
      const variants = await this.getModel().findMany({
        where: { questionId },
        select: { deliveryMethod: true },
      });
      return variants.map((v) => v.deliveryMethod);
    } catch (error) {
      this.logger.logError('Failed to get delivery methods', error, {
        questionId,
      });
      throw error;
    }
  }
}
