import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../common/logger';
import { getEndOfLocalDayUtc } from '../common/utils/date.util';
import { QuestionAttemptService } from './question-attempt.service';
import { UserLessonRepository } from './repositories';
import { UserQuestionPerformanceRepository } from '../engine/repositories';

/**
 * ProgressSummaryService
 * 
 * Provides aggregated progress statistics and summaries.
 * Follows Single Responsibility Principle - focused on progress reporting.
 * Uses QuestionAttemptService for due review counting (DRY principle).
 * 
 * DIP Compliance: Uses repository abstractions where possible.
 * Note: Some Prisma calls remain for cross-entity aggregations (User, Module, Lesson counts)
 * that would be better served by dedicated services in the future.
 */
@Injectable()
export class ProgressSummaryService {
  private readonly logger = new LoggerService(ProgressSummaryService.name);

  constructor(
    private readonly prisma: PrismaService, // Retained for cross-entity aggregations
    private readonly userLessonRepository: UserLessonRepository,
    private readonly userQuestionPerformanceRepository: UserQuestionPerformanceRepository,
    @Inject(forwardRef(() => QuestionAttemptService))
    private readonly questionAttemptService: QuestionAttemptService,
  ) {}

  /**
   * Calculate user's learning streak in days.
   * Returns 0 if no activity in last 48 hours.
   * Uses repository for DIP compliance.
   */
  async calculateStreak(userId: string): Promise<number> {
    const now = new Date();

    // Use repository for performance data
    const performances = await this.userQuestionPerformanceRepository.findManyByUserId(
      userId,
      {
        select: {
          lastRevisedAt: true,
          createdAt: true,
        } as any, // Cast needed for partial select
      },
    );

    if (performances.length === 0) {
      return 0;
    }

    // Find most recent activity
    const mostRecentActivity = performances.reduce((latest, perf) => {
      const activityDate = perf.lastRevisedAt || perf.createdAt;
      if (!activityDate) return latest;
      const perfDate = new Date(activityDate);
      return perfDate > latest ? perfDate : latest;
    }, new Date(0));

    const hoursSinceLastActivity =
      (now.getTime() - mostRecentActivity.getTime()) / (1000 * 60 * 60);

    // Streak broken if no activity in 48 hours
    if (hoursSinceLastActivity > 48) {
      return 0;
    }

    // Count unique active days
    const activeDays = new Set<string>();
    performances.forEach((perf) => {
      const activityDate = perf.lastRevisedAt || perf.createdAt;
      if (activityDate) {
        const date = new Date(activityDate);
        // Normalize to start of day in UTC
        const dayKey = new Date(
          Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
          ),
        )
          .toISOString()
          .split('T')[0];
        activeDays.add(dayKey);
      }
    });

    // Convert to sorted array of dates
    const sortedDays = Array.from(activeDays)
      .sort()
      .map((d) => new Date(d));

    if (sortedDays.length === 0) {
      return 0;
    }

    // Calculate consecutive days from most recent
    let streak = 1;
    for (let i = sortedDays.length - 1; i > 0; i--) {
      const curr = sortedDays[i];
      const prev = sortedDays[i - 1];
      const diffMs = curr.getTime() - prev.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Get comprehensive progress summary for a user.
   * Includes XP, streak, completed lessons/modules, and due reviews.
   */
  async getProgressSummary(userId: string, tzOffsetMinutes?: number) {
    const now = new Date();

    // Get user XP
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { knowledgePoints: true },
    });

    const xp = user?.knowledgePoints || 0;

    // Get due review count using QuestionAttemptService (single source of truth)
    const dueCutoff = getEndOfLocalDayUtc(now, tzOffsetMinutes);
    const dueReviewCount = await this.questionAttemptService.getDueReviewCount(
      userId,
      dueCutoff,
    );

    // Get user lessons with details using repository
    const userLessons = await this.userLessonRepository.findManyWithLessonDetails(userId);

    // Count completed lessons (where all teachings are viewed)
    const completedLessons = userLessons.filter(
      (ul) =>
        ul.completedTeachings >= ul.lesson.teachings.length &&
        ul.lesson.teachings.length > 0,
    ).length;

    const totalLessons = await this.prisma.lesson.count();

    // Get all modules with lessons
    const modules = await this.prisma.module.findMany({
      include: {
        lessons: {
          include: {
            teachings: {
              select: { id: true },
            },
          },
        },
      },
    });

    // Count completed modules (where all lessons are completed)
    let completedModules = 0;
    for (const module of modules) {
      const moduleLessons = module.lessons;
      if (moduleLessons.length === 0) continue;

      const allLessonsCompleted = moduleLessons.every((lesson) => {
        const userLesson = userLessons.find((ul) => ul.lessonId === lesson.id);
        if (!userLesson) return false;
        return (
          userLesson.completedTeachings >= lesson.teachings.length &&
          lesson.teachings.length > 0
        );
      });

      if (allLessonsCompleted) {
        completedModules++;
      }
    }

    const totalModules = await this.prisma.module.count();

    // Calculate streak
    const streak = await this.calculateStreak(userId);

    return {
      xp,
      streak,
      completedLessons,
      completedModules,
      totalLessons,
      totalModules,
      dueReviewCount,
    };
  }
}
