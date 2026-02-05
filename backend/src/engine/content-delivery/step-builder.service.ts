import { Injectable, BadRequestException } from '@nestjs/common';
import { ContentLookupService } from '../../content/content-lookup.service';
import { DELIVERY_METHOD } from '@prisma/client';
import { PracticeStepItem, SessionContext } from './session-types';
import { LoggerService } from '../../common/logger';
import { DeliveryMethodRegistry } from './delivery-methods/delivery-method-registry';

/**
 * StepBuilderService
 * 
 * Builds session step items from questions and teachings.
 * Follows Single Responsibility Principle - focused on step construction.
 * Demonstrates Strategy Pattern - uses DeliveryMethodRegistry for method-specific logic.
 */
@Injectable()
export class StepBuilderService {
  private readonly logger = new LoggerService(StepBuilderService.name);

  constructor(
    private contentLookup: ContentLookupService,
    private deliveryMethodRegistry: DeliveryMethodRegistry,
  ) {}

  /**
   * Build a practice step item from question data.
   * Uses DeliveryMethodRegistry (Strategy Pattern) for method-specific logic.
   * 
   * SOLID Principles Demonstrated:
   * - Open/Closed: New delivery methods added via strategies, no changes here
   * - Strategy Pattern: Delegates to appropriate strategy for each method
   */
  async buildPracticeStepItem(
    question: any,
    deliveryMethod: DELIVERY_METHOD,
    teachingId: string,
    lessonId: string,
  ): Promise<PracticeStepItem> {
    if (!question) {
      throw new BadRequestException('Question data is required');
    }

    try {
      // Get variant data for this delivery method
      const questionData = await this.contentLookup.getQuestionData(
        question.id,
        lessonId,
        deliveryMethod,
      );

      if (!questionData) {
        this.logger.logError(
          'Failed to get question data',
          undefined,
          { questionId: question.id, deliveryMethod },
        );
      }

      // Use strategy pattern to build step item
      // This replaces the large switch statement with polymorphic behavior
      if (this.deliveryMethodRegistry.has(deliveryMethod)) {
        return this.deliveryMethodRegistry.buildStepItem(
          deliveryMethod,
          question,
          questionData,
          question.teaching,
          lessonId,
        );
      }

      // Fallback for methods without strategies yet
      this.logger.logWarn(
        `No strategy registered for ${deliveryMethod}, using fallback`,
        { deliveryMethod },
      );

      return this.buildStepItemFallback(
        question,
        questionData,
        deliveryMethod,
        teachingId,
        lessonId,
      );
    } catch (error) {
      this.logger.logError('Failed to build practice step item', error, {
        questionId: question.id,
        deliveryMethod,
      });
      throw error;
    }
  }

  /**
   * Fallback method for delivery methods without strategies.
   * TODO: Remove once all strategies are implemented.
   */
  private buildStepItemFallback(
    question: any,
    questionData: any,
    deliveryMethod: DELIVERY_METHOD,
    teachingId: string,
    lessonId: string,
  ): PracticeStepItem {
    const baseItem: PracticeStepItem = {
      type: 'practice',
      questionId: question.id,
      teachingId,
      lessonId,
      deliveryMethod,
      prompt: question.teaching?.learningLanguageString || questionData?.prompt,
    };

    // Populate fields based on question data
    if (questionData) {
      Object.assign(baseItem, questionData);
    }

    return baseItem;
  }

  /**
   * Build session title from context.
   */
  buildTitle(context: SessionContext): string {
    if (context.lessonId) {
      return 'Lesson Practice';
    }
    if (context.mode === 'review') {
      return 'Review Session';
    }
    return 'Practice Session';
  }
}
