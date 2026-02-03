import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DELIVERY_METHOD } from '@prisma/client';
import { OptionsGeneratorService } from './options-generator.service';
import { LoggerService } from '../common/logger';

@Injectable()
export class ContentLookupService {
  private readonly logger = new LoggerService(ContentLookupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly optionsGenerator: OptionsGeneratorService,
  ) {}

  private determineTranslationDirection(questionId: string): boolean {
    const hash = questionId
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return hash % 2 === 0;
  }

  private isLikelyItalian(text: string): boolean {
    if (!text) return false;
    const lowerText = text.toLowerCase().trim();

    const hasItalianChars = /[àèéìíîòóùú]/.test(text);

    const commonItalianWords = [
      'ciao',
      'grazie',
      'prego',
      'scusa',
      'bene',
      'sì',
      'no',
      'buongiorno',
      'buonasera',
      'per favore',
      'mille',
      'molto',
      'arrivederci',
      'come',
      'stai',
      'sto',
      'bene',
      'male',
    ];
    const isCommonItalian = commonItalianWords.some(
      (word) =>
        lowerText === word ||
        lowerText.startsWith(word + ' ') ||
        lowerText.endsWith(' ' + word) ||
        lowerText.includes(' ' + word + ' '),
    );

    return hasItalianChars || isCommonItalian;
  }

  private areOptionsInSameLanguage(
    sourceText: string,
    options: string[],
  ): boolean {
    if (!sourceText || !options || options.length === 0) return false;

    const sourceIsItalian = this.isLikelyItalian(sourceText);

    let sameLanguageCount = 0;
    for (const option of options) {
      const optionIsItalian = this.isLikelyItalian(option);
      if (optionIsItalian === sourceIsItalian) {
        sameLanguageCount++;
      }
    }

    return sameLanguageCount > options.length / 2;
  }

  private async fetchQuestionRecord(
    questionId: string,
    deliveryMethod: DELIVERY_METHOD,
  ) {
    return Promise.all([
      this.prisma.question.findUnique({
        where: { id: questionId },
        select: {
          id: true,
          teachingId: true,
          skillTags: {
            select: {
              name: true,
            },
          },
          teaching: {
            select: {
              userLanguageString: true,
              learningLanguageString: true,
              tip: true,
              skillTags: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.questionVariant.findUnique({
        where: {
          questionId_deliveryMethod: {
            questionId,
            deliveryMethod,
          },
        },
        select: {
          data: true,
        },
      }),
    ]);
  }

  private determineAnswerDirection(
    questionId: string,
    teaching: { userLanguageString: string; learningLanguageString: string },
  ): { isLearningToUser: boolean; sourceText: string; correctAnswer: string } {
    const isLearningToUser = this.determineTranslationDirection(questionId);
    const sourceText = isLearningToUser
      ? teaching.learningLanguageString
      : teaching.userLanguageString;
    const correctAnswer = isLearningToUser
      ? teaching.userLanguageString
      : teaching.learningLanguageString;

    return { isLearningToUser, sourceText, correctAnswer };
  }

  private buildQuestionPrompt(
    deliveryMethod: DELIVERY_METHOD,
    variantData: any,
    context: {
      sourceText?: string;
      source?: string;
      /** When true, prompt says "to English"; when false, "to Italian". Used for TEXT_TRANSLATION/FLASHCARD. */
      isToEnglish?: boolean;
    },
  ): string {
    const customPrompt =
      typeof variantData?.prompt === 'string' && variantData.prompt.length > 0
        ? variantData.prompt
        : undefined;

    if (customPrompt) {
      return customPrompt;
    }

    switch (deliveryMethod) {
      case DELIVERY_METHOD.MULTIPLE_CHOICE:
        return context.sourceText
          ? `How do you say '${context.sourceText}'?`
          : 'Select the correct translation';

      case DELIVERY_METHOD.TEXT_TRANSLATION:
      case DELIVERY_METHOD.FLASHCARD: {
        const target = context.isToEnglish === false ? 'Italian' : 'English';
        return context.source
          ? `Translate '${context.source}' to ${target}`
          : `Translate to ${target}`;
      }

      case DELIVERY_METHOD.FILL_BLANK:
        return 'Complete the sentence';

      case DELIVERY_METHOD.SPEECH_TO_TEXT:
      case DELIVERY_METHOD.TEXT_TO_SPEECH:
        return 'Listen and type what you hear';

      default:
        return 'Answer the question';
    }
  }

  private async generateMCQOptions(
    questionId: string,
    lessonId: string,
    variantData: any,
    direction: { isLearningToUser: boolean; sourceText: string; correctAnswer: string },
  ): Promise<{
    options: Array<{ id: string; label: string }>;
    correctOptionId: string;
    explanation?: string;
  } | null> {
    const { isLearningToUser, sourceText, correctAnswer } = direction;

    const variantOptions: Array<{ id: string; label: string; isCorrect?: boolean }> | undefined =
      Array.isArray(variantData?.options) ? variantData.options : undefined;

    if (variantOptions && variantOptions.length > 0) {
      const labels = variantOptions.map((o) => o.label);
      if (!this.areOptionsInSameLanguage(sourceText || '', labels)) {
        const correctOption = variantOptions.find((o) => o.isCorrect);
        return {
          options: variantOptions.map((o) => ({ id: o.id, label: o.label })),
          correctOptionId: correctOption?.id ?? variantOptions[0].id,
          explanation:
            typeof variantData?.explanation === 'string'
              ? variantData.explanation
              : undefined,
        };
      } else {
        this.logger.logWarn(
          `MULTIPLE_CHOICE question ${questionId} has options in same language as sourceText. Regenerating options dynamically.`,
          { sourceText, labels },
        );
      }
    }

    if (!correctAnswer) {
      this.handleQuestionErrors(
        'MISSING_CORRECT_ANSWER',
        questionId,
        `Missing correct answer. Teaching data incomplete.`,
      );
      return null;
    }

    try {
      const generatedOptions = await this.optionsGenerator.generateOptions(
        correctAnswer,
        lessonId,
        isLearningToUser,
      );

      if (generatedOptions?.options?.length > 0) {
        return {
          options: generatedOptions.options.map((opt) => ({
            id: opt.id,
            label: opt.label,
          })),
          correctOptionId: generatedOptions.correctOptionId,
        };
      }

      return await this.createFallbackMCQOptions(
        questionId,
        lessonId,
        correctAnswer,
        isLearningToUser,
      );
    } catch (error) {
      this.handleQuestionErrors(
        'MCQ_GENERATION_FAILED',
        questionId,
        'Error generating MCQ options',
        error,
      );
      return await this.createFallbackMCQOptions(
        questionId,
        lessonId,
        correctAnswer,
        isLearningToUser,
      );
    }
  }

  private async createFallbackMCQOptions(
    questionId: string,
    lessonId: string,
    correctAnswer: string,
    isLearningToUser: boolean,
  ): Promise<{
    options: Array<{ id: string; label: string }>;
    correctOptionId: string;
  }> {
    const fallbackOptions: string[] = [correctAnswer];

    try {
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          teachings: {
            select: {
              userLanguageString: true,
              learningLanguageString: true,
            },
          },
        },
      });

      if (lesson) {
        for (const t of lesson.teachings) {
          const candidate = isLearningToUser
            ? t.userLanguageString
            : t.learningLanguageString;
          if (
            candidate &&
            candidate.toLowerCase() !== correctAnswer.toLowerCase() &&
            !fallbackOptions.some((opt) => opt.toLowerCase() === candidate.toLowerCase())
          ) {
            fallbackOptions.push(candidate);
            if (fallbackOptions.length >= 4) break;
          }
        }
      }
    } catch (error) {
      this.logger.logError(`Error fetching lesson teachings for fallback`, { error });
    }

    const commonWords = isLearningToUser
      ? ['Yes', 'No', 'Hello', 'Goodbye']
      : ['Sì', 'No', 'Ciao', 'Arrivederci'];

    for (const word of commonWords) {
      if (fallbackOptions.length >= 4) break;
      if (
        word.toLowerCase() !== correctAnswer.toLowerCase() &&
        !fallbackOptions.includes(word)
      ) {
        fallbackOptions.push(word);
      }
    }

    while (fallbackOptions.length < 4) {
      fallbackOptions.push(isLearningToUser ? 'Option' : 'Opzione');
    }

    const shuffled = fallbackOptions.sort(() => Math.random() - 0.5);
    const correctIdx = shuffled.findIndex(
      (l) => l.toLowerCase() === correctAnswer.toLowerCase(),
    );

    return {
      options: shuffled.map((label, idx) => ({
        id: `opt${idx + 1}`,
        label,
      })),
      correctOptionId: `opt${correctIdx !== -1 ? correctIdx + 1 : 1}`,
    };
  }

  private async buildQuestionOptions(
    questionId: string,
    lessonId: string,
    blankAnswer: string,
  ): Promise<Array<{ id: string; label: string }>> {
    try {
      const generatedOptions = await this.optionsGenerator.generateOptions(
        blankAnswer,
        lessonId,
        false,
      );

      if (generatedOptions?.options?.length > 0) {
        return generatedOptions.options.map((opt) => ({
          id: opt.id,
          label: opt.label,
        }));
      }

      return await this.createFallbackFillBlankOptions(
        lessonId,
        blankAnswer,
      );
    } catch (error) {
      this.handleQuestionErrors(
        'FILL_BLANK_OPTIONS_FAILED',
        questionId,
        'Error generating fill-blank options',
        error,
      );
      return this.createMinimalFillBlankOptions(blankAnswer);
    }
  }

  private async createFallbackFillBlankOptions(
    lessonId: string,
    blankAnswer: string,
  ): Promise<Array<{ id: string; label: string }>> {
    const fallbackOptions: string[] = [blankAnswer];

    try {
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          teachings: {
            select: {
              learningLanguageString: true,
            },
          },
        },
      });

      if (lesson) {
        for (const t of lesson.teachings) {
          if (t.learningLanguageString) {
            const words = t.learningLanguageString.split(' ');
            for (const word of words) {
              if (
                word.toLowerCase() !== blankAnswer.toLowerCase() &&
                !fallbackOptions.some(
                  (opt) => opt.toLowerCase() === word.toLowerCase(),
                )
              ) {
                fallbackOptions.push(word);
                if (fallbackOptions.length >= 4) break;
              }
            }
            if (fallbackOptions.length >= 4) break;
          }
        }
      }
    } catch (error) {
      this.logger.logError('Error creating fallback fill-blank options', { error });
    }

    const commonWords = ['Sì', 'No', 'Ciao', 'Grazie', 'Per', 'Mille', 'Molto', 'Bene'];
    for (const word of commonWords) {
      if (fallbackOptions.length >= 4) break;
      if (
        word.toLowerCase() !== blankAnswer.toLowerCase() &&
        !fallbackOptions.some((opt) => opt.toLowerCase() === word.toLowerCase())
      ) {
        fallbackOptions.push(word);
      }
    }

    const shuffled = fallbackOptions.sort(() => Math.random() - 0.5);
    return shuffled.map((label, idx) => ({
      id: `opt${idx + 1}`,
      label,
    }));
  }

  private createMinimalFillBlankOptions(
    blankAnswer: string,
  ): Array<{ id: string; label: string }> {
    return [
      { id: 'opt1', label: blankAnswer },
      { id: 'opt2', label: 'Sì' },
      { id: 'opt3', label: 'No' },
      { id: 'opt4', label: 'Ciao' },
    ];
  }

  private formatQuestionResponse(
    result: any,
    teaching: any,
    question: any,
  ): any {
    const questionTagNames = question.skillTags?.map((tag) => tag.name) || [];
    const teachingTagNames = teaching.skillTags?.map((tag) => tag.name) || [];
    result.skillTags = Array.from(
      new Set([...questionTagNames, ...teachingTagNames]),
    );

    if (!result.hint && teaching.tip) {
      result.hint = teaching.tip;
    }

    return result;
  }

  private handleQuestionErrors(
    errorType: string,
    questionId: string,
    message: string,
    error?: any,
  ): void {
    const errorContext = {
      errorType,
      questionId,
      timestamp: new Date().toISOString(),
    };

    this.logger.logError(`[${errorType}] ${message}`, {
      ...errorContext,
      error,
      stack: error instanceof Error ? error.stack : undefined,
    });
  }

  async getQuestionData(
    questionId: string,
    lessonId: string,
    deliveryMethod: DELIVERY_METHOD,
  ): Promise<{
    options?: Array<{ id: string; label: string }>;
    correctOptionId?: string;
    text?: string;
    answer?: string;
    hint?: string;
    audioUrl?: string;
    source?: string;
    sourceText?: string;
    explanation?: string;
    prompt?: string;
    skillTags?: string[];
  } | null> {
    const [question, variant] = await this.fetchQuestionRecord(
      questionId,
      deliveryMethod,
    );

    if (!question || !question.teaching) {
      return null;
    }

    const teaching = question.teaching;
    const variantData = (variant?.data ?? undefined) as any | undefined;
    const result: any = {};

    switch (deliveryMethod) {
      case DELIVERY_METHOD.MULTIPLE_CHOICE: {
        const direction = this.determineAnswerDirection(questionId, teaching);

        const mcqResult = await this.generateMCQOptions(
          questionId,
          lessonId,
          variantData,
          direction,
        );

        if (!mcqResult) {
          return null;
        }

        result.options = mcqResult.options;
        result.correctOptionId = mcqResult.correctOptionId;
        result.sourceText = direction.sourceText;
        if (mcqResult.explanation) {
          result.explanation = mcqResult.explanation;
        }

        result.prompt = this.buildQuestionPrompt(
          deliveryMethod,
          variantData,
          { sourceText: direction.sourceText },
        );

        if (!result.options || result.options.length === 0 || !result.correctOptionId) {
          this.handleQuestionErrors(
            'MCQ_VALIDATION_FAILED',
            questionId,
            'Failed final validation for MCQ options',
          );
          const correctAnswer = direction.correctAnswer;
          result.options = [
            { id: 'opt1', label: correctAnswer || 'Option 1' },
            { id: 'opt2', label: direction.isLearningToUser ? 'Yes' : 'Sì' },
            { id: 'opt3', label: direction.isLearningToUser ? 'No' : 'No' },
            { id: 'opt4', label: direction.isLearningToUser ? 'Hello' : 'Ciao' },
          ];
          result.correctOptionId = 'opt1';
        }
        break;
      }

      case DELIVERY_METHOD.TEXT_TRANSLATION:
      case DELIVERY_METHOD.FLASHCARD: {
        result.source = variantData?.source ?? teaching.learningLanguageString;
        const sourceIsItalian = this.isLikelyItalian(result.source);
        result.answer =
          variantData?.answer ??
          (sourceIsItalian ? teaching.userLanguageString : teaching.learningLanguageString);
        result.hint = variantData?.hint ?? teaching.tip;
        result.prompt = this.buildQuestionPrompt(deliveryMethod, variantData, {
          source: result.source,
          isToEnglish: sourceIsItalian,
        });
        break;
      }

      case DELIVERY_METHOD.FILL_BLANK: {
        if (variantData?.text && variantData?.answer) {
          result.text = variantData.text;
          result.answer = variantData.answer;
          result.hint = variantData?.hint ?? teaching.tip;
          result.prompt = this.buildQuestionPrompt(
            deliveryMethod,
            variantData,
            {},
          );

          const blankAnswer = String(result.answer);
          result.options = await this.buildQuestionOptions(
            questionId,
            lessonId,
            blankAnswer,
          );

          if (!result.options || result.options.length === 0) {
            result.options = this.createMinimalFillBlankOptions(blankAnswer);
          }
        } else {
          const learningPhrase = teaching.learningLanguageString.trim();

          if (learningPhrase.includes(' ')) {
            const words = learningPhrase.split(' ');
            const lastWord = words[words.length - 1];
            result.text = learningPhrase.replace(
              new RegExp(
                `\\s+${lastWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
              ),
              ' ___',
            );
            result.answer = lastWord;
          } else {
            result.text = `___ ${learningPhrase}`;
            result.answer = learningPhrase;
          }

          result.prompt = this.buildQuestionPrompt(
            deliveryMethod,
            variantData,
            {},
          );

          result.options = await this.buildQuestionOptions(
            questionId,
            lessonId,
            result.answer,
          );

          if (!result.options || result.options.length === 0) {
            result.options = this.createMinimalFillBlankOptions(result.answer);
          }
        }
        break;
      }

      case DELIVERY_METHOD.SPEECH_TO_TEXT:
      case DELIVERY_METHOD.TEXT_TO_SPEECH: {
        result.answer = variantData?.answer ?? teaching.learningLanguageString;
        result.prompt = this.buildQuestionPrompt(
          deliveryMethod,
          variantData,
          {},
        );
        break;
      }
    }

    return this.formatQuestionResponse(result, teaching, question);
  }
}
