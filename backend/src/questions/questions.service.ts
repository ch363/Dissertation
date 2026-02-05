import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { Question, DELIVERY_METHOD } from '@prisma/client';
import { QuestionRepository } from './questions.repository';
import { LoggerService } from '../common/logger';

/**
 * QuestionsService
 *
 * Business logic layer for Question operations.
 * Uses repository pattern for data access (Dependency Inversion Principle).
 */
@Injectable()
export class QuestionsService {
  private readonly logger = new LoggerService(QuestionsService.name);

  constructor(
    @Inject('IQuestionRepository')
    private readonly questionRepository: QuestionRepository,
  ) {}

  /**
   * Find all questions, optionally filtered by teaching.
   */
  async findAll(teachingId?: string): Promise<Question[]> {
    return this.questionRepository.findAllWithTeaching(teachingId);
  }

  /**
   * Find a question by ID.
   */
  async findOne(id: string): Promise<Question> {
    const question =
      await this.questionRepository.findByIdWithTeachingAndLesson(id);
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
    return question;
  }

  /**
   * Update delivery methods for a question.
   */
  async updateDeliveryMethods(
    questionId: string,
    deliveryMethods: DELIVERY_METHOD[],
  ): Promise<Question | null> {
    if (deliveryMethods.length === 0) {
      throw new BadRequestException('At least one delivery method is required');
    }

    // Verify question exists
    const question = await this.questionRepository.findById(questionId);
    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    // Upsert variants for each delivery method
    await Promise.all(
      deliveryMethods.map((deliveryMethod) =>
        this.questionRepository.upsertVariant(questionId, deliveryMethod),
      ),
    );

    return this.questionRepository.findByIdWithVariants(questionId);
  }

  /**
   * Create a new question.
   */
  async create(data: any): Promise<Question> {
    return this.questionRepository.create(data);
  }

  /**
   * Update a question.
   */
  async update(id: string, data: any): Promise<Question> {
    return this.questionRepository.update(id, data);
  }

  /**
   * Delete a question.
   */
  async remove(id: string): Promise<void> {
    await this.questionRepository.delete(id);
  }

  /**
   * Count questions.
   */
  async count(where?: any): Promise<number> {
    return this.questionRepository.count(where);
  }
}
