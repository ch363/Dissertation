import { Injectable } from '@nestjs/common';
import { DELIVERY_METHOD } from '@prisma/client';
import { DeliveryMethodStrategy } from './delivery-method-strategy.interface';

/**
 * DeliveryMethodRegistry
 * 
 * Registry pattern for managing delivery method strategies.
 * Demonstrates:
 * - Strategy Pattern: Encapsulates delivery method algorithms
 * - Open/Closed Principle: Open for extension (new strategies), closed for modification
 * - Dependency Inversion: Depends on DeliveryMethodStrategy abstraction
 * 
 * Usage:
 * ```
 * const strategy = registry.get(DELIVERY_METHOD.MULTIPLE_CHOICE);
 * const stepItem = strategy.buildStepItem(question, variant, teaching, lessonId);
 * ```
 */
@Injectable()
export class DeliveryMethodRegistry {
  private strategies = new Map<DELIVERY_METHOD, DeliveryMethodStrategy>();

  /**
   * Register a strategy for a delivery method.
   */
  register(strategy: DeliveryMethodStrategy): void {
    const method = strategy.getMethod();
    if (this.strategies.has(method)) {
      throw new Error(
        `Strategy for ${method} is already registered`,
      );
    }
    this.strategies.set(method, strategy);
  }

  /**
   * Get strategy for a delivery method.
   * Throws if strategy not found.
   */
  get(method: DELIVERY_METHOD): DeliveryMethodStrategy {
    const strategy = this.strategies.get(method);
    if (!strategy) {
      throw new Error(
        `No strategy registered for delivery method: ${method}`,
      );
    }
    return strategy;
  }

  /**
   * Check if a strategy is registered for a delivery method.
   */
  has(method: DELIVERY_METHOD): boolean {
    return this.strategies.has(method);
  }

  /**
   * Get all registered delivery methods.
   */
  getRegisteredMethods(): DELIVERY_METHOD[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Build step item using the appropriate strategy.
   */
  buildStepItem(
    method: DELIVERY_METHOD,
    question: any,
    variantData: any,
    teaching: any,
    lessonId: string,
  ) {
    return this.get(method).buildStepItem(question, variantData, teaching, lessonId);
  }

  /**
   * Build question data using the appropriate strategy.
   */
  buildQuestionData(
    method: DELIVERY_METHOD,
    question: any,
    variant: any,
    teaching: any,
  ) {
    return this.get(method).buildQuestionData(question, variant, teaching);
  }

  /**
   * Build prompt using the appropriate strategy.
   */
  buildPrompt(method: DELIVERY_METHOD, context: any) {
    return this.get(method).buildPrompt(context);
  }

  /**
   * Validate answer using the appropriate strategy.
   */
  validateAnswer(
    method: DELIVERY_METHOD,
    userAnswer: string,
    correctData: any,
    teaching: any,
    variantData: any,
  ) {
    return this.get(method).validateAnswer(
      userAnswer,
      correctData,
      teaching,
      variantData,
    );
  }

  /**
   * Get exercise type using the appropriate strategy.
   */
  getExerciseType(method: DELIVERY_METHOD) {
    return this.get(method).getExerciseType();
  }

  /**
   * Get time estimate using the appropriate strategy.
   */
  getTimeEstimate(method: DELIVERY_METHOD) {
    return this.get(method).getTimeEstimate();
  }

  /**
   * Check if method requires grammar checking.
   */
  requiresGrammarCheck(method: DELIVERY_METHOD) {
    return this.get(method).requiresGrammarCheck();
  }
}
