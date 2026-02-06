import { DELIVERY_METHOD } from '@prisma/client';

/**
 * Delivery Method Strategy Interfaces
 * 
 * Split into focused interfaces following Interface Segregation Principle (ISP).
 * Each interface represents a cohesive set of operations.
 * 
 * Benefits of ISP:
 * - Consumers only depend on interfaces they use
 * - Easier to implement partial strategies
 * - Better testability with focused mocks
 */

// =============================================================================
// Data Types
// =============================================================================

export interface QuestionData {
  prompt?: string;
  options?: Array<{ id: string; label: string }>;
  correctOptionId?: string;
  sourceText?: string;
  text?: string;
  answer?: string;
  hint?: string;
  source?: string;
}

export interface ValidationResult {
  exact: boolean;
  meaningCorrect: boolean;
}

export interface PromptContext {
  userLanguageString: string;
  learningLanguageString: string;
  variant?: any;
}

export interface PracticeStepItem {
  type: 'practice';
  questionId: string;
  teachingId: string;
  lessonId: string;
  deliveryMethod: DELIVERY_METHOD;
  prompt?: string;
  [key: string]: any; // Additional delivery-method-specific fields
}

// =============================================================================
// ISP: Segregated Interfaces
// =============================================================================

/**
 * IDeliveryMethodIdentifier
 * 
 * Basic identification for a delivery method strategy.
 */
export interface IDeliveryMethodIdentifier {
  /**
   * Get the delivery method this strategy handles.
   */
  getMethod(): DELIVERY_METHOD;
}

/**
 * IStepItemBuilder
 * 
 * Builds step items and question data for session plans.
 * Used by SessionPlanService and StepBuilderService.
 */
export interface IStepItemBuilder {
  /**
   * Build a practice step item with delivery-method-specific data.
   */
  buildStepItem(
    question: any,
    variantData: any,
    teaching: any,
    lessonId: string,
  ): PracticeStepItem;

  /**
   * Build question data payload for this delivery method.
   */
  buildQuestionData(question: any, variant: any, teaching: any): QuestionData;

  /**
   * Build prompt text for this delivery method.
   */
  buildPrompt(context: PromptContext): string;
}

/**
 * IAnswerValidator
 * 
 * Validates user answers against correct answers.
 * Used by AnswerValidationService.
 */
export interface IAnswerValidator {
  /**
   * Validate user answer against correct answer.
   */
  validateAnswer(
    userAnswer: string,
    correctData: any,
    teaching: any,
    variantData: any,
  ): ValidationResult;
}

/**
 * IExerciseMetadata
 * 
 * Provides metadata about the delivery method.
 * Used for exercise classification, time estimation, and feature flags.
 */
export interface IExerciseMetadata {
  /**
   * Get exercise type classification for this delivery method.
   */
  getExerciseType(): 'speaking' | 'translation' | 'grammar' | 'vocabulary';

  /**
   * Get estimated time to complete (in seconds).
   */
  getTimeEstimate(): number;

  /**
   * Whether this delivery method requires grammar checking.
   */
  requiresGrammarCheck(): boolean;
}

// =============================================================================
// Combined Interface (Backward Compatible)
// =============================================================================

/**
 * DeliveryMethodStrategy
 * 
 * Complete strategy interface combining all capabilities.
 * Maintains backward compatibility while allowing consumers
 * to depend only on the interfaces they need.
 * 
 * Example usage:
 * - Use IStepItemBuilder when only building step items
 * - Use IAnswerValidator when only validating answers
 * - Use DeliveryMethodStrategy for full implementation
 */
export interface DeliveryMethodStrategy
  extends IDeliveryMethodIdentifier,
    IStepItemBuilder,
    IAnswerValidator,
    IExerciseMetadata {}
