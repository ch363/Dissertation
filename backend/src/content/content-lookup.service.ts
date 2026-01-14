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
  } | null> {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        teaching: {
          select: {
            userLanguageString: true,
            learningLanguageString: true,
            tip: true,
          },
        },
      },
    });

    if (!question || !question.teaching) {
      return null;
    }

    const teaching = question.teaching;
    const result: any = {};

    // Use tip from teaching as hint
    result.hint = teaching.tip || undefined;

    // Determine answer and source based on delivery method
    switch (deliveryMethod) {
      case DELIVERY_METHOD.MULTIPLE_CHOICE:
        // For MCQ, determine direction: learning->user or user->learning
        // Check if we're translating from learning language to user language
        // (This would be determined by the prompt, but for now we'll default to learning->user)
        const isLearningToUser = true; // TODO: Could be determined by question context
        const correctAnswer = isLearningToUser
          ? teaching.userLanguageString
          : teaching.learningLanguageString;
        const sourceText = isLearningToUser
          ? teaching.learningLanguageString
          : teaching.userLanguageString;

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
          result.sourceText = sourceText;
          result.prompt = `How do you say '${sourceText}'?`;
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
