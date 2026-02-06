import { Injectable } from '@nestjs/common';
import { KNOWLEDGE_LEVEL } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_SUGGESTIONS_LIMIT } from '../common/constants';
import { LoggerService } from '../common/logger';
import {
  LessonSuggestion,
  ModuleSuggestion,
  SuggestionsResult,
} from '../common/interfaces/learn.interface';

// Re-export for backward compatibility
export type { LessonSuggestion, ModuleSuggestion, SuggestionsResult };

/**
 * SuggestionService
 *
 * Handles content suggestions for users.
 * Follows Single Responsibility Principle - focused on suggestion logic.
 */
@Injectable()
export class SuggestionService {
  private readonly logger = new LoggerService(SuggestionService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get content suggestions for a user.
   */
  async getSuggestions(
    userId: string,
    currentLessonId?: string,
    moduleId?: string,
    limit: number = DEFAULT_SUGGESTIONS_LIMIT,
  ): Promise<SuggestionsResult> {
    // Get user's completed teachings
    const completedTeachings = await this.prisma.userTeachingCompleted.findMany({
      where: { userId },
      select: { teachingId: true },
    });
    const completedTeachingIds = new Set(
      completedTeachings.map((ct) => ct.teachingId),
    );

    // Get user's started lessons
    const startedLessons = await this.prisma.userLesson.findMany({
      where: { userId },
      select: { lessonId: true },
    });
    const startedLessonIds = new Set(startedLessons.map((sl) => sl.lessonId));

    // Get user's knowledge level
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { knowledgeLevel: true },
    });
    const userKnowledgeLevel = user?.knowledgeLevel;

    const suggestedLessons: LessonSuggestion[] = [];
    const suggestedModules: ModuleSuggestion[] = [];

    // Suggest next lesson in current module
    if (currentLessonId) {
      const nextLessonSuggestion = await this.getNextLessonInModule(
        currentLessonId,
        moduleId,
        startedLessonIds,
      );
      if (nextLessonSuggestion) {
        suggestedLessons.push(nextLessonSuggestion);
      }
    }

    // Suggest lessons matching user's knowledge level
    if (userKnowledgeLevel && suggestedLessons.length < limit) {
      const levelMatchedLessons = await this.getLessonsMatchingLevel(
        userKnowledgeLevel,
        startedLessonIds,
        moduleId,
        limit - suggestedLessons.length,
      );
      suggestedLessons.push(...levelMatchedLessons);
    }

    // Suggest modules with new lessons
    const moduleSuggestions = await this.getModulesWithNewLessons(
      startedLessonIds,
      limit,
    );
    suggestedModules.push(...moduleSuggestions);

    return {
      lessons: suggestedLessons.slice(0, limit),
      modules: suggestedModules.slice(0, limit),
    };
  }

  /**
   * Get the next lesson in the current module.
   */
  private async getNextLessonInModule(
    currentLessonId: string,
    moduleId: string | undefined,
    startedLessonIds: Set<string>,
  ): Promise<LessonSuggestion | null> {
    const currentLesson = await this.prisma.lesson.findUnique({
      where: { id: currentLessonId },
      include: {
        module: {
          include: {
            lessons: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!currentLesson) return null;
    if (moduleId && currentLesson.module.id !== moduleId) return null;

    const moduleLessons = currentLesson.module.lessons;
    const currentIndex = moduleLessons.findIndex(
      (l) => l.id === currentLessonId,
    );
    const nextLesson = moduleLessons[currentIndex + 1];

    if (!nextLesson || startedLessonIds.has(nextLesson.id)) {
      return null;
    }

    return {
      lesson: {
        id: nextLesson.id,
        title: nextLesson.title,
        imageUrl: nextLesson.imageUrl,
      },
      module: {
        id: currentLesson.module.id,
        title: currentLesson.module.title,
      },
      reason: 'Next lesson in current module',
    };
  }

  /**
   * Get lessons matching the user's knowledge level.
   */
  private async getLessonsMatchingLevel(
    knowledgeLevel: KNOWLEDGE_LEVEL,
    startedLessonIds: Set<string>,
    moduleId: string | undefined,
    limit: number,
  ): Promise<LessonSuggestion[]> {
    const alignedLessons = await this.prisma.lesson.findMany({
      where: {
        ...(moduleId ? { moduleId } : {}),
        teachings: {
          some: {
            knowledgeLevel,
          },
        },
        id: {
          notIn: Array.from(startedLessonIds),
        },
      },
      include: {
        module: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      take: limit,
      orderBy: { createdAt: 'asc' },
    });

    return alignedLessons.map((lesson) => ({
      lesson: {
        id: lesson.id,
        title: lesson.title,
        imageUrl: lesson.imageUrl,
      },
      module: lesson.module,
      reason: `Matches your ${knowledgeLevel} level`,
    }));
  }

  /**
   * Get modules that contain new (unstarted) lessons.
   */
  private async getModulesWithNewLessons(
    startedLessonIds: Set<string>,
    limit: number,
  ): Promise<ModuleSuggestion[]> {
    const allModules = await this.prisma.module.findMany({
      include: {
        lessons: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const suggestions: ModuleSuggestion[] = [];

    for (const module of allModules) {
      const allLessonIds = module.lessons.map((l) => l.id);
      const allStarted = allLessonIds.every((lid) => startedLessonIds.has(lid));

      if (!allStarted && suggestions.length < limit) {
        suggestions.push({
          module: {
            id: module.id,
            title: module.title,
            imageUrl: module.imageUrl,
          },
          reason: 'Contains new lessons',
        });
      }
    }

    return suggestions;
  }
}
