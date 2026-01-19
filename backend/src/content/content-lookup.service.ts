import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DELIVERY_METHOD } from '@prisma/client';
import { OptionsGeneratorService } from './options-generator.service';

/**
 * Service to look up question data from database
 * Uses Teaching relationship to get userLanguageString and learningLanguageString
 * Generates MCQ options dynamically using OptionsGeneratorService
 */
@Injectable()
export class ContentLookupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly optionsGenerator: OptionsGeneratorService,
  ) {}

  /**
   * Determine translation direction based on question ID
   * Uses a hash of the question ID to ensure consistency - same question always has same direction
   * @param questionId The question ID to determine direction for
   * @returns true if translating from learning language to user language, false otherwise
   */
  private determineTranslationDirection(questionId: string): boolean {
    // Use a simple hash of the question ID to determine direction
    // This ensures consistency - same question always has same direction
    const hash = questionId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return hash % 2 === 0; // Even hash = learning to user, odd = user to learning
  }

  /**
   * Detect if text is likely Italian or English
   * Uses heuristics: Italian-specific characters and common Italian words
   * @param text The text to analyze
   * @returns true if text appears to be Italian, false if English
   */
  private isLikelyItalian(text: string): boolean {
    if (!text) return false;
    const lowerText = text.toLowerCase().trim();
    
    // Check for Italian-specific characters (à, è, é, ì, í, î, ò, ó, ù, ú)
    const hasItalianChars = /[àèéìíîòóùú]/.test(text);
    
    // Check for common Italian words
    const commonItalianWords = [
      'ciao', 'grazie', 'prego', 'scusa', 'bene', 'sì', 'no', 
      'buongiorno', 'buonasera', 'per favore', 'mille', 'molto',
      'arrivederci', 'come', 'stai', 'sto', 'bene', 'male'
    ];
    const isCommonItalian = commonItalianWords.some(word => 
      lowerText === word || lowerText.startsWith(word + ' ') || lowerText.endsWith(' ' + word) || lowerText.includes(' ' + word + ' ')
    );
    
    return hasItalianChars || isCommonItalian;
  }

  /**
   * Check if options are in the same language as sourceText
   * @param sourceText The source text to translate
   * @param options Array of option labels
   * @returns true if options appear to be in the same language as sourceText
   */
  private areOptionsInSameLanguage(sourceText: string, options: string[]): boolean {
    if (!sourceText || !options || options.length === 0) return false;
    
    const sourceIsItalian = this.isLikelyItalian(sourceText);
    
    // Check if majority of options are in the same language as source
    let sameLanguageCount = 0;
    for (const option of options) {
      const optionIsItalian = this.isLikelyItalian(option);
      if (optionIsItalian === sourceIsItalian) {
        sameLanguageCount++;
      }
    }
    
    // If more than half the options are in the same language as source, consider it a match
    return sameLanguageCount > options.length / 2;
  }

  /**
   * Get question data by question ID
   * Uses Teaching relationship instead of questionData JSON
   */
  async getQuestionData(questionId: string, lessonId: string, deliveryMethod: DELIVERY_METHOD): Promise<{
    options?: Array<{ id: string; label: string }>;
    correctOptionId?: string;
    text?: string;
    answer?: string;
    hint?: string;
    audioUrl?: string;
    source?: string;
    sourceText?: string; // For translation MCQ
    explanation?: string;
    prompt?: string;
    skillTags?: string[];
  } | null> {
    const [question, variant] = await Promise.all([
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

    if (!question || !question.teaching) {
      return null;
    }

    const teaching = question.teaching;
    const variantData = (variant?.data ?? undefined) as any | undefined;
    const result: any = {};

    // Use tip from teaching as hint
    result.hint = teaching.tip || undefined;

    // Extract skill tags from both question and teaching, deduplicate
    const questionTagNames = question.skillTags?.map(tag => tag.name) || [];
    const teachingTagNames = teaching.skillTags?.map(tag => tag.name) || [];
    result.skillTags = Array.from(new Set([...questionTagNames, ...teachingTagNames]));

    // Determine answer and source based on delivery method
    switch (deliveryMethod) {
      case DELIVERY_METHOD.MULTIPLE_CHOICE:
        // Determine source text for translation MCQ (consistent per question)
        // For MCQ, determine direction: learning->user or user->learning
        const isLearningToUser = this.determineTranslationDirection(questionId);
        const sourceText = isLearningToUser
          ? teaching.learningLanguageString
          : teaching.userLanguageString;

        // Prefer QuestionVariant.data options when present
        const variantOptions: Array<{ id: string; label: string; isCorrect?: boolean }> | undefined =
          Array.isArray(variantData?.options) ? variantData.options : undefined;

        if (variantOptions && variantOptions.length > 0) {
          const labels = variantOptions.map((o) => o.label);
          // If options look like they are in the same language as source, fall back to dynamic generation
          if (!this.areOptionsInSameLanguage(sourceText || '', labels)) {
            result.options = variantOptions.map((o) => ({ id: o.id, label: o.label }));
            const correct = variantOptions.find((o) => o.isCorrect);
            result.correctOptionId = correct?.id ?? variantOptions[0].id;
            result.sourceText = sourceText;
            result.prompt =
              typeof variantData?.prompt === 'string' && variantData.prompt.length > 0
                ? variantData.prompt
                : (sourceText ? `How do you say '${sourceText}'?` : undefined);
            if (typeof variantData?.explanation === 'string') {
              result.explanation = variantData.explanation;
            }
            break;
          } else {
            console.warn(
              `MULTIPLE_CHOICE question ${questionId} has options in same language as sourceText. Regenerating options dynamically.`,
              { sourceText, labels },
            );
          }
        }

        // Generate options dynamically (either no DB options, or DB options were in wrong language)
        // Fallback: Generate options dynamically (for backwards compatibility)
        if (!result.options) {
          const correctAnswer = isLearningToUser
            ? teaching.userLanguageString
            : teaching.learningLanguageString;

          // Validate that we have required data
          if (!correctAnswer) {
            console.error(`MULTIPLE_CHOICE question ${questionId} missing correct answer. Teaching:`, {
              userLanguageString: teaching.userLanguageString,
              learningLanguageString: teaching.learningLanguageString,
              isLearningToUser,
            });
            // Return null to indicate failure
            return null;
          }

          // Generate options dynamically
          try {
            const generatedOptions = await this.optionsGenerator.generateOptions(
            correctAnswer,
            lessonId,
            isLearningToUser,
          );

          if (!generatedOptions || !generatedOptions.options || generatedOptions.options.length === 0) {
            console.error(`Failed to generate options for question ${questionId}. Correct answer: ${correctAnswer}, Lesson ID: ${lessonId}`);
            // Fallback: create options from other teachings in the lesson
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
            
            const fallbackOptions: string[] = [correctAnswer];
            if (lesson) {
              for (const t of lesson.teachings) {
                const candidate = isLearningToUser ? t.userLanguageString : t.learningLanguageString;
                if (candidate && candidate.toLowerCase() !== correctAnswer.toLowerCase()) {
                  fallbackOptions.push(candidate);
                  if (fallbackOptions.length >= 4) break;
                }
              }
            }
            
            // Pad with common words if needed
            const commonWords = isLearningToUser 
              ? ['Yes', 'No', 'Hello', 'Goodbye']
              : ['Sì', 'No', 'Ciao', 'Arrivederci'];
            for (const word of commonWords) {
              if (fallbackOptions.length >= 4) break;
              if (word.toLowerCase() !== correctAnswer.toLowerCase() && !fallbackOptions.includes(word)) {
                fallbackOptions.push(word);
              }
            }
            
            // Shuffle and create options
            const shuffled = fallbackOptions.sort(() => Math.random() - 0.5);
            result.options = shuffled.map((label, idx) => ({
              id: `opt${idx + 1}`,
              label,
            }));
            const correctIdx = shuffled.findIndex((l) => l === correctAnswer);
            result.correctOptionId = `opt${correctIdx + 1}`;
          } else {
            result.options = generatedOptions.options.map((opt) => ({
              id: opt.id,
              label: opt.label,
            }));
            result.correctOptionId = generatedOptions.correctOptionId;
          }
          result.sourceText = sourceText;
          result.prompt = `How do you say '${sourceText}'?`;
        } catch (error) {
          console.error(`Error generating options for question ${questionId}:`, error);
          if (error instanceof Error) {
            console.error('Error stack:', error.stack);
          }
          // Fallback: create options from other teachings in the lesson
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
            
            const fallbackOptions: string[] = [correctAnswer];
            if (lesson) {
              for (const t of lesson.teachings) {
                const candidate = isLearningToUser ? t.userLanguageString : t.learningLanguageString;
                if (candidate && candidate.toLowerCase() !== correctAnswer.toLowerCase()) {
                  fallbackOptions.push(candidate);
                  if (fallbackOptions.length >= 4) break;
                }
              }
            }
            
            // Pad with common words if needed
            const commonWords = isLearningToUser 
              ? ['Yes', 'No', 'Hello', 'Goodbye']
              : ['Sì', 'No', 'Ciao', 'Arrivederci'];
            for (const word of commonWords) {
              if (fallbackOptions.length >= 4) break;
              if (word.toLowerCase() !== correctAnswer.toLowerCase() && !fallbackOptions.includes(word)) {
                fallbackOptions.push(word);
              }
            }
            
            // Shuffle and create options
            const shuffled = fallbackOptions.sort(() => Math.random() - 0.5);
            result.options = shuffled.map((label, idx) => ({
              id: `opt${idx + 1}`,
              label,
            }));
            const correctIdx = shuffled.findIndex((l) => l === correctAnswer);
            result.correctOptionId = `opt${correctIdx + 1}`;
          } catch (fallbackError) {
            console.error('Fallback options generation also failed:', fallbackError);
            // Last resort: minimal options
            result.options = [
              { id: 'opt1', label: correctAnswer },
              { id: 'opt2', label: isLearningToUser ? 'Yes' : 'Sì' },
              { id: 'opt3', label: isLearningToUser ? 'No' : 'No' },
              { id: 'opt4', label: isLearningToUser ? 'Hello' : 'Ciao' },
            ];
            result.correctOptionId = 'opt1';
          }
          result.sourceText = sourceText || undefined;
          result.prompt = sourceText ? `How do you say '${sourceText}'?` : undefined;
        }
        }
        
        // Final validation: ensure we always have options and correctOptionId
        if (!result.options || result.options.length === 0 || !result.correctOptionId) {
          console.error(`MULTIPLE_CHOICE question ${questionId} failed to generate valid options. Result:`, {
            hasOptions: !!result.options,
            optionsLength: result.options?.length,
            hasCorrectOptionId: !!result.correctOptionId,
          });
          // Last resort: ensure we have at least minimal options
          if (!result.options || result.options.length === 0) {
            const correctAnswer = isLearningToUser
              ? teaching.userLanguageString
              : teaching.learningLanguageString;
            result.options = [
              { id: 'opt1', label: correctAnswer || 'Option 1' },
              { id: 'opt2', label: isLearningToUser ? 'Yes' : 'Sì' },
              { id: 'opt3', label: isLearningToUser ? 'No' : 'No' },
              { id: 'opt4', label: isLearningToUser ? 'Hello' : 'Ciao' },
            ];
          }
          if (!result.correctOptionId) {
            result.correctOptionId = 'opt1';
          }
        }
        break;

      case DELIVERY_METHOD.TEXT_TRANSLATION:
      case DELIVERY_METHOD.FLASHCARD:
        result.source = variantData?.source ?? teaching.learningLanguageString;
        result.answer = variantData?.answer ?? teaching.userLanguageString;
        result.hint = variantData?.hint ?? result.hint;
        result.prompt =
          typeof variantData?.prompt === 'string' && variantData.prompt.length > 0
            ? variantData.prompt
            : `Translate '${result.source}' to English`;
        break;

      case DELIVERY_METHOD.FILL_BLANK:
        // Prefer variant payload if provided
        if (variantData?.text && variantData?.answer) {
          result.text = variantData.text;
          result.answer = variantData.answer;
          result.hint = variantData?.hint ?? result.hint;
          result.prompt =
            typeof variantData?.prompt === 'string' && variantData.prompt.length > 0
              ? variantData.prompt
              : 'Complete the sentence';

          // Generate options for tap-to-fill UI (mobile expects options for FILL_BLANK)
          const blankAnswer = String(result.answer);
          try {
            const generatedOptions = await this.optionsGenerator.generateOptions(
              blankAnswer,
              lessonId,
              false, // Fill blank uses learning language
            );
            if (generatedOptions?.options?.length) {
              result.options = generatedOptions.options.map((opt) => ({
                id: opt.id,
                label: opt.label,
              }));
            }
          } catch (error) {
            console.error(
              `Error generating fill-blank options for question ${questionId} (variant payload):`,
              error,
            );
          }

          // Last resort: minimal options
          if (!result.options || result.options.length === 0) {
            result.options = [
              { id: 'opt1', label: blankAnswer },
              { id: 'opt2', label: 'Sì' },
              { id: 'opt3', label: 'No' },
              { id: 'opt4', label: 'Ciao' },
            ];
          }
          break;
        }

        // Fill blank: create a sentence with blank, generate options
        // For single words, create a simple sentence like "Grazie ___" 
        const learningPhrase = teaching.learningLanguageString.trim();
        const answer = learningPhrase; // The word that fills the blank
        
        // Create text with blank
        // For single words, put blank before: "___ Grazie"
        // For phrases, replace the last word with blank: "Grazie ___"
        if (learningPhrase.includes(' ')) {
          // Multi-word phrase: replace last word with blank
          const words = learningPhrase.split(' ');
          const lastWord = words[words.length - 1];
          result.text = learningPhrase.replace(new RegExp(`\\s+${lastWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`), ' ___');
          result.answer = lastWord; // Answer is the last word
        } else {
          // Single word: put blank before it so user selects the word
          result.text = `___ ${learningPhrase}`;
          result.answer = learningPhrase; // Answer is the word itself
        }
        result.prompt = `Complete the sentence`;
        
        // Generate options for fill-blank (similar to multiple choice)
        // Use the actual answer (word that fills the blank)
        const blankAnswer = result.answer || answer;
        try {
          const generatedOptions = await this.optionsGenerator.generateOptions(
            blankAnswer,
            lessonId,
            false, // Fill blank uses learning language
          );
          
          if (generatedOptions && generatedOptions.options && generatedOptions.options.length > 0) {
            result.options = generatedOptions.options.map((opt) => ({
              id: opt.id,
              label: opt.label,
            }));
          } else {
            // Fallback: create options from other teachings
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
            
            const fallbackOptions: string[] = [blankAnswer];
            if (lesson) {
              for (const t of lesson.teachings) {
                if (t.learningLanguageString) {
                  // For multi-word phrases, extract words as potential options
                  const words = t.learningLanguageString.split(' ');
                  for (const word of words) {
                    if (word.toLowerCase() !== blankAnswer.toLowerCase() &&
                        !fallbackOptions.some(opt => opt.toLowerCase() === word.toLowerCase())) {
                      fallbackOptions.push(word);
                      if (fallbackOptions.length >= 4) break;
                    }
                  }
                  if (fallbackOptions.length >= 4) break;
                }
              }
            }
            
            // Pad with common words if needed
            const commonWords = ['Sì', 'No', 'Ciao', 'Grazie', 'Per', 'Mille', 'Molto', 'Bene'];
            for (const word of commonWords) {
              if (fallbackOptions.length >= 4) break;
              if (word.toLowerCase() !== blankAnswer.toLowerCase() && 
                  !fallbackOptions.some(opt => opt.toLowerCase() === word.toLowerCase())) {
                fallbackOptions.push(word);
              }
            }
            
            // Shuffle and create options
            const shuffled = fallbackOptions.sort(() => Math.random() - 0.5);
            result.options = shuffled.map((label, idx) => ({
              id: `opt${idx + 1}`,
              label,
            }));
          }
        } catch (error) {
          console.error(`Error generating fill-blank options for question ${questionId}:`, error);
          // Last resort: minimal options
          result.options = [
            { id: 'opt1', label: blankAnswer },
            { id: 'opt2', label: 'Sì' },
            { id: 'opt3', label: 'No' },
            { id: 'opt4', label: 'Ciao' },
          ];
        }
        break;

      case DELIVERY_METHOD.SPEECH_TO_TEXT:
      case DELIVERY_METHOD.TEXT_TO_SPEECH:
        result.answer = variantData?.answer ?? teaching.learningLanguageString;
        result.prompt =
          typeof variantData?.prompt === 'string' && variantData.prompt.length > 0
            ? variantData.prompt
            : `Listen and type what you hear`;
        break;
    }

    return result;
  }
}
