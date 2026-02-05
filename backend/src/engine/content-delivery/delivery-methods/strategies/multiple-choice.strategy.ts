import { Injectable } from '@nestjs/common';
import { DELIVERY_METHOD } from '@prisma/client';
import {
  DeliveryMethodStrategy,
  QuestionData,
  ValidationResult,
  PromptContext,
  PracticeStepItem,
} from '../delivery-method-strategy.interface';

/**
 * MultipleChoiceStrategy
 * 
 * Strategy implementation for multiple choice questions.
 * Demonstrates Strategy Pattern - encapsulates MCQ-specific behavior.
 */
@Injectable()
export class MultipleChoiceStrategy implements DeliveryMethodStrategy {
  getMethod(): DELIVERY_METHOD {
    return DELIVERY_METHOD.MULTIPLE_CHOICE;
  }

  buildStepItem(
    question: any,
    variantData: any,
    teaching: any,
    lessonId: string,
  ): PracticeStepItem {
    const baseItem: PracticeStepItem = {
      type: 'practice',
      questionId: question.id,
      teachingId: teaching.id,
      lessonId,
      deliveryMethod: DELIVERY_METHOD.MULTIPLE_CHOICE,
      prompt: teaching.learningLanguageString,
    };

    if (variantData?.options) {
      baseItem.options = variantData.options;
    }
    if (variantData?.correctOptionId) {
      baseItem.correctOptionId = variantData.correctOptionId;
    }
    if (variantData?.sourceText) {
      baseItem.sourceText = variantData.sourceText;
    }

    return baseItem;
  }

  buildQuestionData(question: any, variant: any, teaching: any): QuestionData {
    const data = variant?.data || {};
    return {
      prompt: teaching.learningLanguageString,
      options: data.options || [],
      correctOptionId: data.correctOptionId,
      sourceText: data.sourceText,
    };
  }

  buildPrompt(context: PromptContext): string {
    if (context.variant?.sourceText) {
      return `Translate: ${context.variant.sourceText}`;
    }
    return `What does "${context.learningLanguageString}" mean?`;
  }

  validateAnswer(
    userAnswer: string,
    correctData: any,
    teaching: any,
    variantData: any,
  ): ValidationResult {
    const correctOptionId = correctData.correctOptionId || variantData?.correctOptionId;
    const exact = userAnswer === correctOptionId;
    return { exact, meaningCorrect: false };
  }

  getExerciseType(): 'vocabulary' {
    return 'vocabulary';
  }

  getTimeEstimate(): number {
    return 15; // 15 seconds average
  }

  requiresGrammarCheck(): boolean {
    return false;
  }
}
