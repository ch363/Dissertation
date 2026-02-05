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
 * TextTranslationStrategy
 * 
 * Strategy implementation for text translation questions.
 * Demonstrates Strategy Pattern - encapsulates translation-specific behavior.
 */
@Injectable()
export class TextTranslationStrategy implements DeliveryMethodStrategy {
  getMethod(): DELIVERY_METHOD {
    return DELIVERY_METHOD.TEXT_TRANSLATION;
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
      deliveryMethod: DELIVERY_METHOD.TEXT_TRANSLATION,
      prompt: 'Translate this phrase',
    };

    if (variantData?.source) {
      baseItem.source = variantData.source;
    } else {
      baseItem.source = teaching.learningLanguageString;
    }

    if (variantData?.answer) {
      baseItem.answer = variantData.answer;
    } else {
      baseItem.answer = teaching.userLanguageString;
    }

    if (variantData?.hint) {
      baseItem.hint = variantData.hint;
    }

    return baseItem;
  }

  buildQuestionData(question: any, variant: any, teaching: any): QuestionData {
    const data = variant?.data || {};
    return {
      source: data.source || teaching.learningLanguageString,
      answer: data.answer || teaching.userLanguageString,
      hint: data.hint,
      prompt: 'Translate to English',
    };
  }

  buildPrompt(context: PromptContext): string {
    return 'Translate to English';
  }

  validateAnswer(
    userAnswer: string,
    correctData: any,
    teaching: any,
    variantData: any,
  ): ValidationResult {
    const correctAnswer = variantData?.answer || teaching.userLanguageString;
    const normalizedUser = this.normalize(userAnswer);

    // Check primary answers (split by /)
    const primaryAnswers = correctAnswer
      .toLowerCase()
      .split('/')
      .map((ans: string) => ans.trim())
      .filter((ans: string) => ans.length > 0);

    const exact = primaryAnswers.some(
      (correctAns: string) => this.normalize(correctAns) === normalizedUser,
    );

    // Check acceptable alternatives
    let meaningCorrect = false;
    if (!exact && variantData?.acceptableAlternatives) {
      const alternatives = variantData.acceptableAlternatives
        .split('/')
        .map((a: string) => a.trim())
        .filter((a: string) => a.length > 0);
      meaningCorrect = alternatives.some(
        (alt: string) => this.normalize(alt) === normalizedUser,
      );
    }

    return { exact, meaningCorrect };
  }

  private normalize(text: string): string {
    return text
      .replace(/\s*\([^)]*\)/g, ' ') // Remove parentheticals
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\s]/gu, '')
      .replace(/\s+/g, ' ');
  }

  getExerciseType(): 'translation' {
    return 'translation';
  }

  getTimeEstimate(): number {
    return 30; // 30 seconds average
  }

  requiresGrammarCheck(): boolean {
    return true;
  }
}
