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
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        teachingId: true,
        type: true,
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
        multipleChoice: true,
        fillBlank: true,
        speechToText: true,
        textTranslation: true,
        flashcard: true,
        textToSpeech: true,
      },
    });

    if (!question || !question.teaching) {
      return null;
    }

    const teaching = question.teaching;
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
        // First, try to read options from QuestionMultipleChoice table
        console.log(`[ContentLookup] MULTIPLE_CHOICE question ${questionId}:`, {
          hasMultipleChoice: !!question.multipleChoice,
          multipleChoiceData: question.multipleChoice ? {
            hasOptions: !!question.multipleChoice.options,
            optionsLength: question.multipleChoice.options?.length,
            options: question.multipleChoice.options,
            correctIndices: question.multipleChoice.correctIndices,
          } : null,
        });
        
        if (question.multipleChoice && question.multipleChoice.options && question.multipleChoice.options.length > 0) {
          // Use options from database
          const dbOptions = question.multipleChoice.options;
          const correctIndices = question.multipleChoice.correctIndices || [0];
          
          // Determine source text for translation MCQ
          // For MCQ, determine direction: learning->user or user->learning
          const isLearningToUser = this.determineTranslationDirection(questionId);
          const sourceText = isLearningToUser
            ? teaching.learningLanguageString
            : teaching.userLanguageString;
          
          // Validate that options are in the opposite language of sourceText
          // If they're in the same language, regenerate them dynamically
          if (this.areOptionsInSameLanguage(sourceText || '', dbOptions)) {
            console.warn(`MULTIPLE_CHOICE question ${questionId} has options in same language as sourceText. Regenerating options dynamically.`, {
              sourceText,
              dbOptions,
            });
            // Fall through to dynamic generation
          } else {
            // Options are in correct language, use them
            // Map options to frontend format with IDs
            result.options = dbOptions.map((label, idx) => ({
              id: `opt${idx + 1}`,
              label,
            }));
            
            // Find the correct option ID based on correctIndices
            // correctIndices is an array, but typically there's one correct answer
            const correctIndex = correctIndices[0] ?? 0;
            if (correctIndex >= 0 && correctIndex < dbOptions.length) {
              result.correctOptionId = `opt${correctIndex + 1}`;
            } else {
              console.warn(`MULTIPLE_CHOICE question ${questionId} has invalid correctIndex ${correctIndex}. Using first option.`);
              result.correctOptionId = 'opt1';
            }
            
            result.sourceText = sourceText;
            result.prompt = sourceText ? `How do you say '${sourceText}'?` : undefined;
            break; // Exit switch, we're done
          }
        }
        
        // Generate options dynamically (either no DB options, or DB options were in wrong language)
        // Fallback: Generate options dynamically (for backwards compatibility)
        if (!result.options) {
          const isLearningToUser = this.determineTranslationDirection(questionId);
          const correctAnswer = isLearningToUser
            ? teaching.userLanguageString
            : teaching.learningLanguageString;
          const sourceText = isLearningToUser
            ? teaching.learningLanguageString
            : teaching.userLanguageString;

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
            const isLearningToUser = this.determineTranslationDirection(questionId);
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
        // Translation: source is learning language, answer is user language
        result.source = teaching.learningLanguageString;
        result.answer = teaching.userLanguageString;
        result.prompt = `Translate '${teaching.learningLanguageString}' to English`;
        break;

      case DELIVERY_METHOD.FILL_BLANK:
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
        // Listening: answer is the learning language string
        result.answer = teaching.learningLanguageString;
        result.prompt = `Listen and type what you hear`;
        break;
    }

    return result;
  }
}
