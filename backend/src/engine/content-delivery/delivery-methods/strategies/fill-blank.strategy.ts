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
 * FillBlankStrategy
 * 
 * Strategy implementation for fill-in-the-blank questions.
 * Demonstrates Strategy Pattern - encapsulates fill-blank-specific behavior.
 */
@Injectable()
export class FillBlankStrategy implements DeliveryMethodStrategy {
  getMethod(): DELIVERY_METHOD {
    return DELIVERY_METHOD.FILL_BLANK;
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
      deliveryMethod: DELIVERY_METHOD.FILL_BLANK,
      prompt: variantData?.text || teaching.learningLanguageString,
    };

    if (variantData?.text) {
      baseItem.text = variantData.text;
    }
    if (variantData?.answer) {
      baseItem.answer = variantData.answer;
    }
    if (variantData?.hint) {
      baseItem.hint = variantData.hint;
    }
    if (variantData?.options) {
      baseItem.options = variantData.options;
    }

    return baseItem;
  }

  buildQuestionData(question: any, variant: any, teaching: any): QuestionData {
    const data = variant?.data || {};
    return {
      text: data.text || teaching.learningLanguageString,
      answer: data.answer || teaching.learningLanguageString,
      hint: data.hint,
      options: data.options,
    };
  }

  buildPrompt(context: PromptContext): string {
    if (context.variant?.text) {
      return `Fill in the blank: ${context.variant.text}`;
    }
    return 'Complete the sentence';
  }

  validateAnswer(
    userAnswer: string,
    correctData: any,
    teaching: any,
    variantData: any,
  ): ValidationResult {
    const correctAnswer = variantData?.answer || teaching.learningLanguageString;
    const normalizedUser = this.normalize(userAnswer);
    const normalizedCorrect = this.normalize(correctAnswer);
    
    const exact = normalizedUser === normalizedCorrect;
    return { exact, meaningCorrect: false };
  }

  private normalize(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\s]/gu, '')
      .replace(/\s+/g, ' ');
  }

  getExerciseType(): 'grammar' {
    return 'grammar';
  }

  getTimeEstimate(): number {
    return 20; // 20 seconds average
  }

  requiresGrammarCheck(): boolean {
    return true;
  }
}
