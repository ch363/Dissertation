import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../common/logger';
import { SessionPlanCacheService } from '../engine/content-delivery/session-plan-cache.service';
import { getEndOfLocalDayUtc } from '../common/utils/date.util';
import { normalizeTitle } from '../common/utils/string.util';
import { UserLessonRepository } from './repositories/user-lesson.repository';
import { UserTeachingCompletedRepository } from './repositories/user-teaching-completed.repository';
import { TeachingRepository } from '../teachings/teachings.repository';

/**
 * LessonProgressService
 * 
 * Manages user progress through lessons and modules.
 * Follows Single Responsibility Principle - focused on lesson lifecycle tracking.
 * 
 * DIP Compliance: Uses repositories for data access where possible.
 * Note: Some Prisma calls remain for complex cross-entity queries
 * (getUserLessons performances, markModuleCompleted module lookup).
 */
@Injectable()
export class LessonProgressService {
  private readonly logger = new LoggerService(LessonProgressService.name);

  constructor(
    private readonly prisma: PrismaService, // Retained for complex cross-entity queries
    private readonly sessionPlanCache: SessionPlanCacheService,
    private readonly userLessonRepository: UserLessonRepository,
    private readonly userTeachingCompletedRepository: UserTeachingCompletedRepository,
    private readonly teachingRepository: TeachingRepository,
  ) {}

  /**
   * Mark a lesson as started for a user.
   * Creates or updates the UserLesson record.
   */
  async startLesson(userId: string, lessonId: string) {
    return this.userLessonRepository.startLesson(userId, lessonId, {
      lesson: {
        select: {
          id: true,
          title: true,
          imageUrl: true,
        },
      },
    });
  }

  /**
   * Mark a lesson as ended for a user.
   */
  async endLesson(userId: string, lessonId: string) {
    return this.userLessonRepository.endLesson(userId, lessonId);
  }

  /**
   * Get all lessons for a user with progress and due review counts.
   */
  async getUserLessons(userId: string, tzOffsetMinutes?: number) {
    const offsetMs = (tzOffsetMinutes ?? 0) * 60 * 1000;
    const nowUserLocal = new Date(Date.now() + offsetMs);
    const endOfTodayUtc = getEndOfLocalDayUtc(nowUserLocal, offsetMs);

    // Get all user lessons with lesson details using repository
    type UserLessonWithDetails = {
      lessonId: string;
      userId: string;
      completedTeachings: number;
      startedAt: Date | null;
      endedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      lesson: {
        id: string;
        title: string;
        imageUrl: string | null;
        moduleId: string;
        module: { id: string; title: string };
        _count: { teachings: number };
      };
    };
    const userLessons = (await this.userLessonRepository.findManyByUserId(userId, {
      include: {
        lesson: {
          include: {
            module: {
              select: {
                id: true,
                title: true,
              },
            },
            _count: {
              select: {
                teachings: true,
              },
            },
          },
        },
      },
      orderBy: {
        lesson: {
          title: 'asc',
        },
      },
    })) as unknown as UserLessonWithDetails[];

    // Get performance for questions in these lessons (through teaching relation)
    const lessonIds = userLessons.map((ul) => ul.lessonId);
    const performances = await this.prisma.userQuestionPerformance.findMany({
      where: {
        userId,
        question: {
          teaching: {
            lessonId: {
              in: lessonIds,
            },
          },
        },
      },
      include: {
        question: {
          include: {
            teaching: {
              select: {
                lessonId: true,
              },
            },
          },
        },
      },
    });

    // Group performances by lesson and count due reviews
    const performancesByLesson = new Map<string, any[]>();
    for (const perf of performances) {
      const lessonId = perf.question.teaching?.lessonId;
      if (!lessonId) continue;
      if (!performancesByLesson.has(lessonId)) {
        performancesByLesson.set(lessonId, []);
      }
      performancesByLesson.get(lessonId)!.push(perf);
    }

    return userLessons.map((ul) => {
      const perfs = performancesByLesson.get(ul.lessonId) || [];
      const dueReviewCount = perfs.filter(
        (p) => p.nextReviewDue && p.nextReviewDue <= endOfTodayUtc,
      ).length;

      return {
        lessonId: ul.lessonId,
        userId: ul.userId,
        completedTeachings: ul.completedTeachings,
        startedAt: ul.startedAt,
        endedAt: ul.endedAt,
        createdAt: ul.createdAt,
        updatedAt: ul.updatedAt,
        lesson: {
          id: ul.lesson.id,
          title: ul.lesson.title,
          imageUrl: ul.lesson.imageUrl,
          moduleId: ul.lesson.moduleId,
          totalTeachings: ul.lesson._count.teachings,
          module: ul.lesson.module,
        },
        dueReviewCount,
      };
    });
  }

  /**
   * Mark a teaching as completed for a user.
   * Increments completedTeachings count and invalidates session plan cache.
   * Uses repositories for DIP compliance.
   */
  async completeTeaching(
    userId: string,
    teachingId: string,
    timeSpentMs?: number,
  ) {
    // Get teaching using repository
    const teaching = await this.teachingRepository.findByIdWithQuestionIds(teachingId);

    if (!teaching) {
      throw new NotFoundException(`Teaching ${teachingId} not found`);
    }

    const { lessonId } = teaching;

    if (!lessonId) {
      this.logger.warn(
        `Teaching ${teachingId} has no lessonId, skipping UserLesson update`,
      );
      return null;
    }

    // Record teaching completion using repository
    await this.userTeachingCompletedRepository.markCompleted(userId, teachingId);

    // Get completed teachings for this user in this lesson using repository
    const viewedTeachings = await this.userTeachingCompletedRepository.findManyByUserAndLesson(
      userId,
      lessonId,
    );

    const completedCount = viewedTeachings.length;

    // Update or create UserLesson with completed count using repository
    const updated = await this.userLessonRepository.upsert(userId, lessonId, {
      completedTeachings: completedCount,
    });

    // Invalidate session plan cache for this lesson
    this.sessionPlanCache.invalidateLesson(userId, lessonId);

    return updated;
  }

  /**
   * Mark all lessons in a module as completed.
   */
  async markModuleCompleted(userId: string, moduleIdOrSlug: string) {
    // Find module by ID or title (normalized)
    const module = await this.prisma.module.findFirst({
      where: {
        OR: [{ id: moduleIdOrSlug }, { title: normalizeTitle(moduleIdOrSlug) }],
      },
      include: {
        lessons: {
          include: {
            teachings: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!module) {
      throw new NotFoundException(
        `Module not found: ${moduleIdOrSlug}`,
      );
    }

    // Mark all teachings and lessons as completed using repositories
    for (const lesson of module.lessons) {
      const teachingIds = lesson.teachings.map((t) => t.id);
      
      // Mark all teachings as completed using repository batch operation
      await this.userTeachingCompletedRepository.markManyCompleted(userId, teachingIds);

      // Update UserLesson using repository
      await this.userLessonRepository.upsert(userId, lesson.id, {
        completedTeachings: lesson.teachings.length,
      });

      // Invalidate cache
      this.sessionPlanCache.invalidateLesson(userId, lesson.id);
    }

    return { moduleId: module.id, lessonsCompleted: module.lessons.length };
  }
}
