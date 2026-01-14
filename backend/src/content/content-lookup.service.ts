import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { validateLessonFile, findContentFiles } from './validation/validator';
import { LessonContent } from './validation/content.schema';
import { questionIdFromSlug, lessonIdFromSlug } from './importer/slug-to-id';
import { DELIVERY_METHOD } from '@prisma/client';

/**
 * Service to look up question data from content files
 * This allows the session plan service to populate question-specific fields
 * like multiple choice options, answers, etc.
 */
@Injectable()
export class ContentLookupService {
  private contentCache: Map<string, LessonContent> = new Map();

  /**
   * Load lesson content from file (with caching)
   */
  private async loadLessonContent(lessonId: string): Promise<LessonContent | null> {
    // Check cache first
    if (this.contentCache.has(lessonId)) {
      return this.contentCache.get(lessonId)!;
    }

    // Try to find lesson file by searching content directory
    const contentDir = join(process.cwd(), 'content');
    const { lessons } = findContentFiles(contentDir);

    for (const lessonPath of lessons) {
      try {
        const lessonContent = validateLessonFile(lessonPath);
        // Generate ID from slug to check if it matches
        const generatedId = lessonIdFromSlug(lessonContent.slug);
        
        if (generatedId === lessonId) {
          this.contentCache.set(lessonId, lessonContent);
          return lessonContent;
        }
      } catch (error) {
        // Skip invalid files
        continue;
      }
    }

    return null;
  }

  /**
   * Get question data by question ID
   */
  async getQuestionData(questionId: string, lessonId: string): Promise<{
    options?: Array<{ id: string; label: string }>;
    correctOptionId?: string;
    text?: string;
    answer?: string;
    hint?: string;
    audioUrl?: string;
    source?: string;
    explanation?: string;
    prompt?: string;
  } | null> {
    const lessonContent = await this.loadLessonContent(lessonId);
    if (!lessonContent) {
      return null;
    }

    // Find question by matching generated ID
    for (const question of lessonContent.questions) {
      const generatedId = questionIdFromSlug(question.slug);
      if (generatedId === questionId) {
        // Return question data based on type
        const result: any = {
          prompt: question.multipleChoice?.prompt || 
                  question.translation?.prompt || 
                  question.fillBlank?.prompt || 
                  question.listening?.prompt,
        };

        if (question.multipleChoice) {
          result.options = question.multipleChoice.options.map(opt => ({
            id: opt.id,
            label: opt.label,
          }));
          result.correctOptionId = question.multipleChoice.options.find(opt => opt.isCorrect)?.id;
          result.explanation = question.multipleChoice.explanation;
        }

        if (question.translation) {
          result.source = question.translation.source;
          result.answer = question.translation.answer;
          result.hint = question.translation.hint;
          // Also set prompt from translation if not already set
          if (!result.prompt && question.translation.prompt) {
            result.prompt = question.translation.prompt;
          }
        }

        if (question.fillBlank) {
          result.text = question.fillBlank.text;
          result.answer = question.fillBlank.answer;
          result.hint = question.fillBlank.hint;
        }

        if (question.listening) {
          result.audioUrl = question.listening.audioUrl;
          result.answer = question.listening.answer;
        }

        return result;
      }
    }

    return null;
  }
}
