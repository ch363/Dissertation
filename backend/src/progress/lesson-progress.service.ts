import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../common/logger';
import { SessionPlanCacheService } from '../engine/content-delivery/session-plan-cache.service';
import { getEndOfLocalDayUtc } from '../common/utils/date.util';
import { normalizeTitle } from '../common/utils/string.util';

/**
 * LessonProgressService
 * 
 * Manages user progress through lessons and modules.
 * Follows Single Responsibility Principle - focused on lesson lifecycle tracking.
 */
@Injectable()
export class LessonProgressService {
  private readonly logger = new LoggerService(LessonProgressService.name);

  constructor(
    private prisma: PrismaService,
    private sessionPlanCache: SessionPlanCacheService,
  ) {}

  /**
   * Mark a lesson as started for a user.
   * Creates or updates the UserLesson record.
   */
  async startLesson(userId: string, lessonId: string) {
    const now = new Date();
    return this.prisma.userLesson.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        startedAt: now,
        updatedAt: now,
      },
      create: {
        userId,
        lessonId,
        completedTeachings: 0,
        startedAt: now,
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        },
      },
    });
  }

  /**
   * Mark a lesson as ended for a user.
   */
  async endLesson(userId: string, lessonId: string) {
    const now = new Date();
    return this.prisma.userLesson.update({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      data: {
        endedAt: now,
        updatedAt: now,
      },
    });
  }

  /**
   * Get all lessons for a user with progress and due review counts.
   */
  async getUserLessons(userId: string, tzOffsetMinutes?: number) {
    const offsetMs = (tzOffsetMinutes ?? 0) * 60 * 1000;
    const nowUserLocal = new Date(Date.now() + offsetMs);
    const endOfTodayUtc = getEndOfLocalDayUtc(nowUserLocal, offsetMs);

    // Get all user lessons with lesson details
    const userLessons = await this.prisma.userLesson.findMany({
      where: { userId },
      include: {
        lesson: {
          include: {
            module: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
            _count: {
              select: {
                teachings: true,
                questions: true,
              },
            },
          },
        },
      },
      orderBy: {
        lesson: {
          order: 'asc',
        },
      },
    });

    // Get performance for questions in these lessons
    const lessonIds = userLessons.map((ul) => ul.lessonId);
    const performances = await this.prisma.userQuestionPerformance.findMany({
      where: {
        userId,
        question: {
          lessonId: {
            in: lessonIds,
          },
        },
      },
      include: {
        question: {
          select: {
            lessonId: true,
          },
        },
      },
    });

    // Group performances by lesson and count due reviews
    const performancesByLesson = new Map<string, any[]>();
    for (const perf of performances) {
      const lessonId = perf.question.lessonId;
      if (!lessonId) continue;
      if (!performancesByLesson.has(lessonId)) {
        performancesByLesson.set(lessonId, []);
      }
      performancesByLesson.get(lessonId)!.push(perf);
    }

    return userLessons.map((ul) => {
      const perfs = performancesByLesson.get(ul.lessonId) || [];
      const dueReviewCount = perfs.filter(
        (p) => p.nextReviewAt && p.nextReviewAt <= endOfTodayUtc,
      ).length;

      return {
        id: ul.id,
        userId: ul.userId,
        lessonId: ul.lessonId,
        completedTeachings: ul.completedTeachings,
        startedAt: ul.startedAt,
        endedAt: ul.endedAt,
        createdAt: ul.createdAt,
        updatedAt: ul.updatedAt,
        lesson: {
          id: ul.lesson.id,
          title: ul.lesson.title,
          slug: ul.lesson.slug,
          order: ul.lesson.order,
          imageUrl: ul.lesson.imageUrl,
          moduleId: ul.lesson.moduleId,
          totalTeachings: ul.lesson._count.teachings,
          totalQuestions: ul.lesson._count.questions,
          module: ul.lesson.module,
        },
        dueReviewCount,
      };
    });
  }

  /**
   * Mark a teaching as completed for a user.
   * Increments completedTeachings count and invalidates session plan cache.
   */
  async completeTeaching(
    userId: string,
    teachingId: string,
    timeSpentMs?: number,
  ) {
    // Get teaching to find associated lesson
    const teaching = await this.prisma.teaching.findUnique({
      where: { id: teachingId },
      select: {
        lessonId: true,
        questions: {
          select: {
            id: true,
          },
        },
      },
    });

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

    // Record teaching view
    const now = new Date();
    await this.prisma.userTeachingView.upsert({
      where: {
        userId_teachingId: {
          userId,
          teachingId,
        },
      },
      update: {
        viewedAt: now,
        ...(timeSpentMs !== undefined && { timeSpentMs }),
      },
      create: {
        userId,
        teachingId,
        viewedAt: now,
        ...(timeSpentMs !== undefined && { timeSpentMs }),
      },
    });

    // Get all teachings in this lesson
    const allTeachings = await this.prisma.teaching.findMany({
      where: { lessonId },
      select: { id: true },
    });

    // Get viewed teachings for this user in this lesson
    const viewedTeachings = await this.prisma.userTeachingView.findMany({
      where: {
        userId,
        teaching: {
          lessonId,
        },
      },
      select: { teachingId: true },
    });

    const completedCount = viewedTeachings.length;

    // Update or create UserLesson with completed count
    const updated = await this.prisma.userLesson.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        completedTeachings: completedCount,
        updatedAt: now,
      },
      create: {
        userId,
        lessonId,
        completedTeachings: completedCount,
        startedAt: now,
      },
    });

    // Invalidate session plan cache for this lesson
    this.sessionPlanCache.invalidate(userId, lessonId);

    return updated;
  }

  /**
   * Mark all lessons in a module as completed.
   */
  async markModuleCompleted(userId: string, moduleIdOrSlug: string) {
    // Find module by ID or slug
    const module = await this.prisma.module.findFirst({
      where: {
        OR: [{ id: moduleIdOrSlug }, { slug: normalizeTitle(moduleIdOrSlug) }],
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

    const now = new Date();

    // Mark all teachings as viewed
    for (const lesson of module.lessons) {
      for (const teaching of lesson.teachings) {
        await this.prisma.userTeachingView.upsert({
          where: {
            userId_teachingId: {
              userId,
              teachingId: teaching.id,
            },
          },
          update: {
            viewedAt: now,
          },
          create: {
            userId,
            teachingId: teaching.id,
            viewedAt: now,
          },
        });
      }

      // Update UserLesson
      await this.prisma.userLesson.upsert({
        where: {
          userId_lessonId: {
            userId,
            lessonId: lesson.id,
          },
        },
        update: {
          completedTeachings: lesson.teachings.length,
          updatedAt: now,
        },
        create: {
          userId,
          lessonId: lesson.id,
          completedTeachings: lesson.teachings.length,
          startedAt: now,
        },
      });

      // Invalidate cache
      this.sessionPlanCache.invalidate(userId, lesson.id);
    }

    return { moduleId: module.id, lessonsCompleted: module.lessons.length };
  }
}
