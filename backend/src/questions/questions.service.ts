import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Question, DELIVERY_METHOD } from '@prisma/client';
import { QuestionRepository } from './questions.repository';
import { BaseCrudService } from '../common/services/base-crud.service';

/**
 * QuestionsService
 *
 * Business logic layer for Question operations.
 * Extends BaseCrudService for standard CRUD (DRY principle).
 * Uses repository pattern for data access (Dependency Inversion Principle).
 */
@Injectable()
export class QuestionsService extends BaseCrudService<Question> {
  constructor(private readonly questionRepository: QuestionRepository) {
    super(questionRepository, 'Question');
  }

  /**
   * Find all questions, optionally filtered by teaching.
   */
  async findAllByTeaching(teachingId?: string): Promise<Question[]> {
    return this.questionRepository.findAllWithTeaching(teachingId);
  }

  /**
   * Find a question by ID with teaching and lesson info.
   * Overrides base findOne for richer data.
   */
  override async findOne(id: string): Promise<Question> {
    const question =
      await this.questionRepository.findByIdWithTeachingAndLesson(id);
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
    return question;
  }

  /**
   * Update delivery methods for a question.
   * Custom business logic for managing question variants.
   */
  async updateDeliveryMethods(
    questionId: string,
    deliveryMethods: DELIVERY_METHOD[],
  ): Promise<Question | null> {
    if (deliveryMethods.length === 0) {
      throw new BadRequestException('At least one delivery method is required');
    }

    // Verify question exists
    await this.questionRepository.findByIdOrThrow(questionId, 'Question');

    // Upsert variants for each delivery method
    await Promise.all(
      deliveryMethods.map((deliveryMethod) =>
        this.questionRepository.upsertVariant(questionId, deliveryMethod),
      ),
    );

    return this.questionRepository.findByIdWithVariants(questionId);
  }
}
