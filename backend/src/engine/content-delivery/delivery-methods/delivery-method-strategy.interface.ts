import { DELIVERY_METHOD } from '@prisma/client';

/**
 * DeliveryMethodStrategy Interface
 * 
 * Strategy pattern for delivery method-specific behavior.
 * Follows Open/Closed Principle - new delivery methods can be added
 * without modifying existing code.
 * 
 * Each delivery method implements this interface to provide:
 * - Step item building
 * - Question data generation
 * - Prompt building
 * - Answer validation
 * - Exercise type classification
 * - Time estimation
 */

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

export interface DeliveryMethodStrategy {
  /**
   * Get the delivery method this strategy handles.
   */
  getMethod(): DELIVERY_METHOD;

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

  /**
   * Validate user answer against correct answer.
   */
  validateAnswer(
    userAnswer: string,
    correctData: any,
    teaching: any,
    variantData: any,
  ): ValidationResult;

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
