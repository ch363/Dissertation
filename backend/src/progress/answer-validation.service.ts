import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ValidateAnswerDto } from './dto/validate-answer.dto';
import { ValidateAnswerResponseDto } from './dto/validate-answer-response.dto';
import { ValidatePronunciationDto } from './dto/validate-pronunciation.dto';
import {
  PronunciationResponseDto,
  WordAnalysisDto,
} from './dto/pronunciation-response.dto';
import { DELIVERY_METHOD } from '@prisma/client';
import { LoggerService } from '../common/logger';
import { ContentLookupService } from '../content/content-lookup.service';
import { GrammarService } from '../grammar/grammar.service';
import { PronunciationService } from '../speech/pronunciation/pronunciation.service';
import { OnboardingPreferencesService } from '../onboarding/onboarding-preferences.service';
import { QuestionRepository } from '../questions/questions.repository';
import { QuestionVariantRepository } from '../questions/repositories';

/**
 * AnswerValidationService
 * 
 * Validates user answers and pronunciation across different delivery methods.
 * Follows Single Responsibility Principle - focused on answer correctness checking.
 * 
 * DIP Compliance: Uses repository abstractions instead of direct Prisma access.
 */

/** Delivery methods that use free-text input and get grammatical correctness. */
const GRAMMATICAL_TEXT_METHODS: DELIVERY_METHOD[] = [
  DELIVERY_METHOD.TEXT_TRANSLATION,
  DELIVERY_METHOD.FILL_BLANK,
  DELIVERY_METHOD.SPEECH_TO_TEXT,
];

/** Get language code for grammar check based on delivery method */
function getGrammarCheckLanguageCode(deliveryMethod: DELIVERY_METHOD): string {
  if (
    deliveryMethod === DELIVERY_METHOD.TEXT_TRANSLATION ||
    deliveryMethod === DELIVERY_METHOD.FLASHCARD
  ) {
    return 'en-GB'; // User types in their language (English)
  }
  return 'it'; // User types/speaks in learning language (Italian)
}

@Injectable()
export class AnswerValidationService {
  private readonly logger = new LoggerService(AnswerValidationService.name);

  constructor(
    private readonly questionRepository: QuestionRepository,
    private readonly questionVariantRepository: QuestionVariantRepository,
    private readonly contentLookup: ContentLookupService,
    private readonly grammarService: GrammarService,
    private readonly pronunciationService: PronunciationService,
    private readonly onboardingPreferences: OnboardingPreferencesService,
  ) {}

  /**
   * Validate text-based answer for a question.
   */
  async validateAnswer(
    userId: string,
    questionId: string,
    dto: ValidateAnswerDto,
  ): Promise<ValidateAnswerResponseDto> {
    const variantData = await this.validateInputFormat(
      questionId,
      dto.deliveryMethod,
    );

    const { teaching, questionData, feedbackDepth } =
      await this.fetchAnswerData(userId, questionId, dto.deliveryMethod);

    const compareResult = this.compareAnswersResult(
      dto.deliveryMethod,
      dto.answer,
      questionData,
      teaching,
      variantData,
    );

    // For translation/flashcard, accept both exact and meaning-correct answers
    const isCorrect =
      compareResult.exact ||
      (compareResult.meaningCorrect &&
        (dto.deliveryMethod === DELIVERY_METHOD.TEXT_TRANSLATION ||
          dto.deliveryMethod === DELIVERY_METHOD.FLASHCARD));

    const score = this.calculateAnswerScore(isCorrect);

    // Check grammar for text-based methods
    let grammaticalCorrectness: number | undefined;
    if (
      GRAMMATICAL_TEXT_METHODS.includes(dto.deliveryMethod) &&
      typeof dto.answer === 'string' &&
      dto.answer.trim().length > 0
    ) {
      const grammarLang = getGrammarCheckLanguageCode(dto.deliveryMethod);
      const grammarResult = await this.grammarService.checkGrammar(
        dto.answer.trim(),
        grammarLang,
      );
      if (grammarResult !== null) {
        grammaticalCorrectness = Math.round(grammarResult.score);
      }
    }

    // Build extra feedback for meaning-correct but inexact answers
    let extra:
      | {
          meaningCorrect: boolean;
          naturalPhrasing?: string;
          feedbackWhy?: string;
          acceptedVariants?: string[];
        }
      | undefined;

    if (
      compareResult.meaningCorrect &&
      !compareResult.exact &&
      (dto.deliveryMethod === DELIVERY_METHOD.TEXT_TRANSLATION ||
        dto.deliveryMethod === DELIVERY_METHOD.FLASHCARD)
    ) {
      const correctAnswerSource =
        typeof variantData?.answer === 'string' &&
        variantData.answer.trim().length > 0
          ? variantData.answer
          : (teaching.userLanguageString ?? '');
      const primaryDisplayList = correctAnswerSource
        .split('/')
        .map((s) => s.trim())
        .filter(Boolean);
      const naturalPhrasing = primaryDisplayList[0];
      const acceptedVariants = primaryDisplayList.slice(1);
      const feedbackWhy =
        typeof variantData?.feedbackWhy === 'string' &&
        variantData.feedbackWhy.trim().length > 0
          ? variantData.feedbackWhy
          : teaching.tip;

      extra = {
        meaningCorrect: true,
        naturalPhrasing,
        ...(feedbackWhy && { feedbackWhy }),
        ...(acceptedVariants.length > 0 && { acceptedVariants }),
      };
    } else if (
      compareResult.exact &&
      (dto.deliveryMethod === DELIVERY_METHOD.TEXT_TRANSLATION ||
        dto.deliveryMethod === DELIVERY_METHOD.FLASHCARD)
    ) {
      const correctAnswerSource =
        typeof variantData?.answer === 'string' &&
        variantData.answer.trim().length > 0
          ? variantData.answer
          : (teaching.userLanguageString ?? '');
      const primaryDisplayList = correctAnswerSource
        .split('/')
        .map((s) => s.trim())
        .filter(Boolean);
      const acceptedVariants = primaryDisplayList.slice(1);
      if (acceptedVariants.length > 0) {
        extra = {
          meaningCorrect: false,
          acceptedVariants,
        };
      }
    }

    // Only include grammar score when answer is correct or meaning-correct
    const includeGrammarScore =
      (isCorrect || extra?.meaningCorrect === true) &&
      grammaticalCorrectness !== undefined;

    return this.buildValidationResponse(
      isCorrect,
      score,
      questionData,
      teaching,
      feedbackDepth,
      includeGrammarScore ? grammaticalCorrectness : undefined,
      extra,
    );
  }

  /**
   * Validate pronunciation for a question.
   * Uses repositories for DIP compliance.
   */
  async validatePronunciation(
    userId: string,
    questionId: string,
    dto: ValidatePronunciationDto,
  ): Promise<PronunciationResponseDto> {
    // Use repositories instead of direct Prisma calls
    const [question, variant] = await Promise.all([
      this.questionRepository.findByIdWithVariantsAndSkillTags(questionId),
      this.questionVariantRepository.findByQuestionAndMethod(
        questionId,
        DELIVERY_METHOD.TEXT_TO_SPEECH,
      ),
    ]);

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    const variantData = variant?.data as any;
    const expectedText =
      variantData?.answer || question.teaching.learningLanguageString;

    if (!expectedText) {
      throw new BadRequestException(
        `No expected text for pronunciation validation`,
      );
    }

    // Call pronunciation service
    const pronunciationResult =
      await this.pronunciationService.assess({
        audioBase64: dto.audioBase64,
        referenceText: expectedText,
        locale: 'it-IT',
      });

    // Map to response DTO
    const ACCEPTABLE_THRESHOLD = 80;
    const wordAnalysis: WordAnalysisDto[] =
      pronunciationResult.words?.map((w) => ({
        word: w.word,
        score: w.accuracy,
        feedback: w.accuracy >= ACCEPTABLE_THRESHOLD ? 'perfect' : 'could_improve',
        errorType: w.errorType,
        phonemes: w.phonemes?.map((p) => ({
          phoneme: p.phoneme,
          accuracy: p.accuracy,
        })),
      })) || [];

    const overallScore = pronunciationResult.scores.pronunciation;
    return {
      isCorrect: overallScore >= ACCEPTABLE_THRESHOLD,
      score: overallScore,
      overallScore,
      transcription: pronunciationResult.recognizedText ?? '',
      words: wordAnalysis,
    };
  }

  // Private helper methods

  private async validateInputFormat(
    questionId: string,
    deliveryMethod: DELIVERY_METHOD,
  ): Promise<any> {
    // Use repository instead of direct Prisma call
    const variant = await this.questionVariantRepository.findByQuestionAndMethod(
      questionId,
      deliveryMethod,
    );

    if (!variant) {
      throw new BadRequestException(
        `Question ${questionId} does not support ${deliveryMethod} delivery method`,
      );
    }

    return (variant.data ?? undefined) as any | undefined;
  }

  private async fetchAnswerData(
    userId: string,
    questionId: string,
    deliveryMethod: DELIVERY_METHOD,
  ) {
    // Use repository instead of direct Prisma call
    const question = await this.questionRepository.findByIdWithDetails(questionId);

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    const lessonId = question.teaching.lesson.id;
    const teaching = question.teaching;

    const questionData = await this.contentLookup.getQuestionData(
      questionId,
      lessonId,
      deliveryMethod,
    );

    if (!questionData) {
      throw new NotFoundException(
        `Question data not found for question ${questionId} in lesson ${lessonId}`,
      );
    }

    const onboardingPrefs =
      await this.onboardingPreferences.getOnboardingPreferences(userId);
    const feedbackDepth = onboardingPrefs.feedbackDepth ?? 0.6;

    return {
      question,
      teaching,
      questionData,
      lessonId,
      feedbackDepth,
    };
  }

  /**
   * Compare user answer to correct answers.
   * Returns both exact match and meaning-correct match status.
   */
  private compareAnswersResult(
    deliveryMethod: DELIVERY_METHOD,
    userAnswer: string,
    questionData: any,
    teaching: any,
    variantData: any,
  ): { exact: boolean; meaningCorrect: boolean } {
    // Multiple choice: compare option IDs
    if (deliveryMethod === DELIVERY_METHOD.MULTIPLE_CHOICE) {
      if (!questionData.correctOptionId) {
        throw new BadRequestException(
          `Question does not support MULTIPLE_CHOICE delivery method`,
        );
      }
      const exact = userAnswer === questionData.correctOptionId;
      return { exact, meaningCorrect: false };
    }

    const normalizedUserAnswer = this.normalizeAnswerForComparison(userAnswer);
    let correctAnswerSource: string;

    // Determine correct answer source based on delivery method
    if (
      deliveryMethod === DELIVERY_METHOD.TEXT_TRANSLATION ||
      deliveryMethod === DELIVERY_METHOD.FLASHCARD
    ) {
      correctAnswerSource =
        typeof variantData?.answer === 'string' &&
        variantData.answer.trim().length > 0
          ? variantData.answer
          : teaching.userLanguageString;
    } else if (
      deliveryMethod === DELIVERY_METHOD.FILL_BLANK ||
      deliveryMethod === DELIVERY_METHOD.SPEECH_TO_TEXT ||
      deliveryMethod === DELIVERY_METHOD.TEXT_TO_SPEECH
    ) {
      correctAnswerSource =
        typeof variantData?.answer === 'string' &&
        variantData.answer.trim().length > 0
          ? variantData.answer
          : teaching.learningLanguageString;
    } else {
      throw new BadRequestException(
        `Unsupported delivery method for validation: ${deliveryMethod}`,
      );
    }

    // Check primary answers (split by /)
    const primaryAnswers = correctAnswerSource
      .toLowerCase()
      .split('/')
      .map((ans) => ans.trim())
      .filter((ans) => ans.length > 0);

    const exact = primaryAnswers.some(
      (correctAns) =>
        this.normalizeAnswerForComparison(correctAns) === normalizedUserAnswer,
    );

    // Check acceptable alternatives for translation/flashcard
    let meaningCorrect = false;
    if (
      !exact &&
      (deliveryMethod === DELIVERY_METHOD.TEXT_TRANSLATION ||
        deliveryMethod === DELIVERY_METHOD.FLASHCARD)
    ) {
      const alternativesSource =
        typeof variantData?.acceptableAlternatives === 'string' &&
        variantData.acceptableAlternatives.trim().length > 0
          ? variantData.acceptableAlternatives
          : null;
      if (alternativesSource) {
        const alternatives = alternativesSource
          .split('/')
          .map((a) => a.trim())
          .filter((a) => a.length > 0);
        meaningCorrect = alternatives.some(
          (alt) =>
            this.normalizeAnswerForComparison(alt) === normalizedUserAnswer,
        );
      }
    }

    return { exact, meaningCorrect };
  }

  private normalizeAnswerForComparison(s: string): string {
    return s
      .replace(/\s*\([^)]*\)/g, ' ') // strip parentheticals
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\s]/gu, '') // remove non-letter characters
      .replace(/\s+/g, ' ') // normalize whitespace
      .trim();
  }

  private calculateAnswerScore(isCorrect: boolean): number {
    return isCorrect ? 100 : 0;
  }

  private buildFeedback(
    isCorrect: boolean,
    hint: string | undefined,
    teaching: any,
    feedbackDepth: number,
  ): string | undefined {
    if (feedbackDepth < 0.45) {
      return undefined;
    }

    if (feedbackDepth < 0.75) {
      if (!isCorrect && hint) {
        return hint;
      }
      return undefined;
    }

    if (!isCorrect) {
      let detailedFeedback = '';
      if (hint) {
        detailedFeedback = hint;
      }
      if (teaching.tip) {
        if (detailedFeedback) {
          detailedFeedback += ` ${teaching.tip}`;
        } else {
          detailedFeedback = teaching.tip;
        }
      }
      if (teaching.userLanguageString && teaching.learningLanguageString) {
        const translationNote = `Remember: "${teaching.learningLanguageString}" means "${teaching.userLanguageString}"`;
        if (detailedFeedback) {
          detailedFeedback += ` ${translationNote}`;
        } else {
          detailedFeedback = translationNote;
        }
      }
      return detailedFeedback || undefined;
    }

    if (isCorrect && feedbackDepth >= 0.75) {
      return 'Excellent!';
    }

    return undefined;
  }

  private buildValidationResponse(
    isCorrect: boolean,
    score: number,
    questionData: any,
    teaching: any,
    feedbackDepth: number,
    grammaticalCorrectness?: number,
    extra?: {
      meaningCorrect: boolean;
      naturalPhrasing?: string;
      feedbackWhy?: string;
      acceptedVariants?: string[];
    },
  ): ValidateAnswerResponseDto {
    let feedback: string | undefined;
    if (extra?.meaningCorrect && !isCorrect && extra.naturalPhrasing) {
      feedback = `Meaning is correct; more natural phrasing: "${extra.naturalPhrasing}"`;
    } else {
      feedback = this.buildFeedback(
        isCorrect,
        questionData.hint,
        teaching,
        feedbackDepth,
      );
    }

    return {
      isCorrect,
      score,
      feedback,
      ...(grammaticalCorrectness !== undefined && { grammaticalCorrectness }),
      ...(extra?.meaningCorrect !== undefined && {
        meaningCorrect: extra.meaningCorrect,
      }),
      ...(extra?.naturalPhrasing !== undefined && {
        naturalPhrasing: extra.naturalPhrasing,
      }),
      ...(extra?.feedbackWhy !== undefined &&
        extra.feedbackWhy && { feedbackWhy: extra.feedbackWhy }),
      ...(extra?.acceptedVariants !== undefined &&
        extra.acceptedVariants.length > 0 && {
          acceptedVariants: extra.acceptedVariants,
        }),
    };
  }
}
