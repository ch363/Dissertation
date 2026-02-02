import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../common/logger';

/**
 * Service to generate contextual multiple choice options
 * Creates 3 wrong answers based on the lesson context and randomizes positions
 */
@Injectable()
export class OptionsGeneratorService {
  private readonly logger = new LoggerService(OptionsGeneratorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Common Italian words/phrases that can be used as distractors
   * Organized by category for better contextual matching
   */
  private readonly commonDistractors: {
    greetings: string[];
    common: string[];
    numbers: string[];
    colors: string[];
    family: string[];
    food: string[];
    time: string[];
  } = {
    greetings: [
      'Ciao',
      'Buongiorno',
      'Buonasera',
      'Arrivederci',
      'Salve',
      'Prego',
    ],
    common: [
      'Grazie',
      'Per favore',
      'Scusa',
      'Mi dispiace',
      'Prego',
      'Sì',
      'No',
      'Bene',
      'Male',
    ],
    numbers: ['Uno', 'Due', 'Tre', 'Quattro', 'Cinque'],
    colors: ['Rosso', 'Blu', 'Verde', 'Giallo', 'Nero', 'Bianco'],
    family: ['Madre', 'Padre', 'Fratello', 'Sorella', 'Nonno', 'Nonna'],
    food: ['Pane', 'Acqua', 'Vino', 'Formaggio', 'Pasta', 'Pizza'],
    time: ['Oggi', 'Domani', 'Ieri', 'Mattina', 'Sera', 'Notte'],
  };

  /**
   * Generate 4 options for a multiple choice question
   * @param correctAnswer The correct answer (learningLanguageString or userLanguageString)
   * @param lessonId The lesson ID to get contextual distractors from other teachings
   * @param isLearningToUser If true, correct answer is in user language; if false, in learning language
   * @returns Array of 4 options with IDs, where one is marked as correct
   */
  async generateOptions(
    correctAnswer: string,
    lessonId: string,
    isLearningToUser: boolean = false,
  ): Promise<{
    options: Array<{ id: string; label: string; isCorrect: boolean }>;
    correctOptionId: string;
  }> {
    // Get other teachings from the same lesson for contextual distractors
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        teachings: {
          select: {
            learningLanguageString: true,
            userLanguageString: true,
          },
        },
      },
    });

    // Collect potential distractors from the lesson
    const contextualDistractors: string[] = [];
    if (lesson) {
      for (const teaching of lesson.teachings) {
        if (isLearningToUser) {
          // If translating from learning to user language, use other user language strings
          if (teaching.userLanguageString !== correctAnswer) {
            contextualDistractors.push(teaching.userLanguageString);
          }
        } else {
          // If translating from user to learning language, use other learning language strings
          if (teaching.learningLanguageString !== correctAnswer) {
            contextualDistractors.push(teaching.learningLanguageString);
          }
        }
      }
    }

    // Combine contextual distractors with common distractors
    const allDistractors = [
      ...contextualDistractors,
      ...this.getRelevantCommonDistractors(correctAnswer),
    ];

    // Remove duplicates and the correct answer
    const uniqueDistractors = Array.from(
      new Set(
        allDistractors.filter(
          (d) => d && d.toLowerCase() !== correctAnswer.toLowerCase(),
        ),
      ),
    );

    // Ensure we have at least 3 distractors (pad with common words if needed)
    let selectedDistractors = this.shuffleArray(uniqueDistractors);
    if (selectedDistractors.length < 3) {
      // Add more common distractors if we don't have enough
      const additionalDistractors = this.commonDistractors.common
        .filter((d) => d && d.toLowerCase() !== correctAnswer.toLowerCase())
        .filter(
          (d) =>
            !selectedDistractors.some(
              (s) => s && s.toLowerCase() === d.toLowerCase(),
            ),
        );
      selectedDistractors = [...selectedDistractors, ...additionalDistractors];

      // If still not enough, use all common distractors
      if (selectedDistractors.length < 3) {
        const allCommon = this.commonDistractors.common.filter(
          (d) => d && d.toLowerCase() !== correctAnswer.toLowerCase(),
        );
        selectedDistractors = [...selectedDistractors, ...allCommon];
        // Remove duplicates again
        selectedDistractors = Array.from(new Set(selectedDistractors));
      }
    }
    selectedDistractors = selectedDistractors.slice(0, 3);

    // Final safety check - if we still don't have 3, use placeholder options
    if (selectedDistractors.length < 3) {
      this.logger.logWarn(
        'Only generated insufficient distractors, using fallback options',
        {
          distractorsCount: selectedDistractors.length,
          correctAnswer,
          lessonId,
        },
      );
      // Use generic fallback options
      const fallbacks = isLearningToUser
        ? ['Yes', 'No', 'Hello', 'Goodbye', 'Please', 'Sorry']
        : ['Sì', 'No', 'Ciao', 'Arrivederci', 'Per favore', 'Scusa'];
      const fallbackDistractors = fallbacks
        .filter((d) => d.toLowerCase() !== correctAnswer.toLowerCase())
        .slice(0, 3 - selectedDistractors.length);
      selectedDistractors = [
        ...selectedDistractors,
        ...fallbackDistractors,
      ].slice(0, 3);
    }

    // Create options with the correct answer
    const allOptions = [correctAnswer, ...selectedDistractors];
    const shuffledOptions = this.shuffleArray(allOptions);

    // Generate options with IDs
    const options = shuffledOptions.map((label, index) => ({
      id: `opt${index + 1}`,
      label,
      isCorrect: label === correctAnswer,
    }));

    const correctOption = options.find((opt) => opt.isCorrect);
    if (!correctOption) {
      throw new Error('Failed to generate correct option');
    }

    return {
      options,
      correctOptionId: correctOption.id,
    };
  }

  /**
   * Get relevant common distractors based on the answer
   * Tries to match category based on common words
   */
  private getRelevantCommonDistractors(answer: string): string[] {
    const lowerAnswer = answer.toLowerCase();
    const relevant: string[] = [];

    // Check which category the answer might belong to
    if (
      this.commonDistractors.greetings.some((g) =>
        lowerAnswer.includes(g.toLowerCase()),
      )
    ) {
      relevant.push(...this.commonDistractors.greetings);
    }
    if (
      this.commonDistractors.common.some((c) =>
        lowerAnswer.includes(c.toLowerCase()),
      )
    ) {
      relevant.push(...this.commonDistractors.common);
    }
    if (
      this.commonDistractors.food.some((f) =>
        lowerAnswer.includes(f.toLowerCase()),
      )
    ) {
      relevant.push(...this.commonDistractors.food);
    }
    if (
      this.commonDistractors.family.some((f) =>
        lowerAnswer.includes(f.toLowerCase()),
      )
    ) {
      relevant.push(...this.commonDistractors.family);
    }

    // Always include some common words as fallback
    if (relevant.length < 5) {
      relevant.push(...this.commonDistractors.common);
    }

    return relevant;
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
