import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DELIVERY_METHOD } from '@prisma/client';
import { ContentDeliveryService } from '../engine/content-delivery/content-delivery.service';
import {
  SessionPlanDto,
  SessionContext,
} from '../engine/content-delivery/session-types';
import { LearningPathCardDto } from './learning-path.dto';
import { ReviewSummaryDto } from './review-summary.dto';

@Injectable()
export class LearnService {
  constructor(
    private prisma: PrismaService,
    private contentDelivery: ContentDeliveryService,
  ) {}

  /**
   * Learning Hub: Build the "Learning Path" carousel cards with user progress.
   *
   * Placeholders:
   * - `flag`: hardcoded until we model target language/user preferences.
   * - `level`: derived from user.knowledgeLevel as a coarse label.
   * - `cta`: heuristic; can be replaced with product rules later.
   */
  async getLearningPath(userId: string): Promise<LearningPathCardDto[]> {
    const [user, modules] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { knowledgeLevel: true },
      }),
      this.prisma.module.findMany({
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          title: true,
          description: true,
          lessons: {
            select: {
              id: true,
              _count: { select: { teachings: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
    ]);

    const level = String(user?.knowledgeLevel ?? 'A1');
    const flag = '🇮🇹';

    const allLessonIds = modules.flatMap((m) => m.lessons.map((l) => l.id));
    const userLessons = allLessonIds.length
      ? await this.prisma.userLesson.findMany({
          where: {
            userId,
            lessonId: { in: allLessonIds },
          },
          select: {
            lessonId: true,
            completedTeachings: true,
          },
        })
      : [];

    const completedTeachingsByLessonId = new Map<string, number>();
    userLessons.forEach((ul) =>
      completedTeachingsByLessonId.set(ul.lessonId, ul.completedTeachings),
    );

    return modules.map((m) => {
      const total = m.lessons.length;
      let completed = 0;

      for (const lesson of m.lessons) {
        const teachingsCount = lesson._count.teachings;
        const completedTeachings =
          completedTeachingsByLessonId.get(lesson.id) ?? 0;
        // Avoid marking empty lessons as completed.
        if (teachingsCount > 0 && completedTeachings >= teachingsCount) {
          completed++;
        }
      }

      const subtitle =
        m.description && m.description.trim().length > 0
          ? m.description.trim()
          : `${total} ${total === 1 ? 'lesson' : 'lessons'}`;

      // Placeholder CTA rules:
      // - all completed => Review
      // - some progress => Continue
      // - none => Start
      const cta =
        total > 0 && completed === total
          ? 'Review'
          : completed > 0
            ? 'Continue'
            : 'Start';

      return {
        id: m.id,
        title: m.title,
        subtitle,
        level,
        flag,
        completed,
        total,
        status: 'active',
        cta,
      };
    });
  }

  /**
   * Learning Hub: Review summary (due items).
   *
   * Note: There is already `GET /me/dashboard` which includes `dueReviewCount`.
   * This endpoint exists as a convenience to match the mobile UI shape.
   */
  async getReviewSummary(userId: string): Promise<ReviewSummaryDto> {
    const now = new Date();

    const dueReviews = await this.prisma.userQuestionPerformance.findMany({
      where: {
        userId,
        nextReviewDue: {
          lte: now,
          not: null,
        },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        questionId: true,
        createdAt: true,
      },
    });

    const seen = new Set<string>();
    const deduped = dueReviews.filter((r) => {
      if (seen.has(r.questionId)) return false;
      seen.add(r.questionId);
      return true;
    });

    const dueCount = deduped.length;
    const progress = Math.max(0, Math.min(1, 1 - dueCount / 10));

    return {
      dueCount,
      progress,
      subtitle: `${dueCount} ${dueCount === 1 ? 'item needs' : 'items need'} review today`,
    };
  }

  /**
   * @deprecated This method is maintained for backward compatibility.
   * Use getSessionPlan() to get a complete session plan instead.
   */
  async getNext(userId: string, lessonId: string) {
    // 1) Validate lessonId present (already validated by route param)
    // 2) Ensure UserLesson exists (upsert start implicitly)
    const userLesson = await this.prisma.userLesson.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        updatedAt: new Date(),
      },
      create: {
        userId,
        lessonId,
        completedTeachings: 0,
      },
    });

    // Verify lesson exists
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        teachings: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    const allQuestionIds = lesson.teachings.flatMap((t) =>
      t.questions.map((q) => q.id),
    );

    if (allQuestionIds.length === 0) {
      return {
        type: 'done' as const,
        lessonId,
        rationale: 'No questions in this lesson',
      };
    }

    // Use session plan service to get next item
    const context: SessionContext = {
      mode: 'mixed',
      lessonId,
    };
    const plan = await this.contentDelivery.getSessionPlan(userId, context);

    if (plan.steps.length === 0) {
      return {
        type: 'done' as const,
        lessonId,
        rationale: 'All questions completed',
      };
    }

    // Extract first non-recap step
    const firstStep = plan.steps.find((s) => s.type !== 'recap');
    if (!firstStep) {
      return {
        type: 'done' as const,
        lessonId,
        rationale: 'No items available',
      };
    }

    // Convert step to existing response format
    if (firstStep.type === 'practice' && firstStep.item.type === 'practice') {
      // Check if it's a review or new
      const isReview = await this.isReviewItem(
        userId,
        firstStep.item.questionId,
      );

      return {
        type: isReview ? ('review' as const) : ('new' as const),
        lessonId,
        teachingId: firstStep.item.teachingId,
        question: {
          id: firstStep.item.questionId,
          teachingId: firstStep.item.teachingId,
          deliveryMethods: [firstStep.item.deliveryMethod],
        },
        suggestedDeliveryMethod: firstStep.item.deliveryMethod,
        rationale: 'Next practice item',
      };
    } else if (firstStep.type === 'teach' && firstStep.item.type === 'teach') {
      // For teaching items, return as 'new' type
      return {
        type: 'new' as const,
        lessonId,
        teachingId: firstStep.item.teachingId,
        rationale: 'Next teaching item',
      };
    }

    // Fallback
    return {
      type: 'done' as const,
      lessonId,
      rationale: 'No items available',
    };
  }

  /**
   * Check if a question is a review item (has due nextReviewDue).
   */
  private async isReviewItem(
    userId: string,
    questionId: string,
  ): Promise<boolean> {
    const latest = await this.prisma.userQuestionPerformance.findFirst({
      where: {
        userId,
        questionId,
        nextReviewDue: {
          not: null,
        },
      },
      orderBy: { createdAt: 'desc' },
      select: { nextReviewDue: true },
    });

    if (!latest || !latest.nextReviewDue) {
      return false;
    }

    return latest.nextReviewDue <= new Date();
  }

  private async getSuggestedDeliveryMethod(
    userId: string,
    availableMethods: DELIVERY_METHOD[],
  ): Promise<DELIVERY_METHOD | undefined> {
    if (availableMethods.length === 0) {
      return undefined;
    }

    // Get user's delivery method scores
    const userScores = await this.prisma.userDeliveryMethodScore.findMany({
      where: {
        userId,
        deliveryMethod: { in: availableMethods },
      },
    });

    // Create a map of method -> score
    const scoreMap = new Map<DELIVERY_METHOD, number>();
    userScores.forEach((us) => {
      scoreMap.set(us.deliveryMethod, us.score);
    });

    // Sort available methods by score (highest first), then pick first
    const sortedMethods = availableMethods.sort((a, b) => {
      const aScore = scoreMap.get(a) || 0;
      const bScore = scoreMap.get(b) || 0;
      return bScore - aScore;
    });

    return sortedMethods[0];
  }

  async getSuggestions(
    userId: string,
    currentLessonId?: string,
    moduleId?: string,
    limit: number = 3,
  ) {
    // Get user's completed teachings
    const completedTeachings = await this.prisma.userTeachingCompleted.findMany(
      {
        where: { userId },
        select: { teachingId: true },
      },
    );

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

    // Build suggestions
    const suggestedLessons: Array<{
      lesson: any;
      module: any;
      reason: string;
    }> = [];

    const suggestedModules: Array<{
      module: any;
      reason: string;
    }> = [];

    // If currentLessonId provided, suggest next lesson in same module
    if (currentLessonId) {
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

      // If moduleId is provided, only use currentLessonId if it belongs to the requested module.
      if (
        currentLesson &&
        (!moduleId || currentLesson.module.id === moduleId)
      ) {
        const moduleLessons = currentLesson.module.lessons;
        const currentIndex = moduleLessons.findIndex(
          (l) => l.id === currentLessonId,
        );
        const nextLesson = moduleLessons[currentIndex + 1];

        if (nextLesson && !startedLessonIds.has(nextLesson.id)) {
          suggestedLessons.push({
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
          });
        }
      }
    }

    // Suggest lessons based on knowledge level alignment
    if (userKnowledgeLevel) {
      const alignedLessons = await this.prisma.lesson.findMany({
        where: {
          ...(moduleId ? { moduleId } : {}),
          teachings: {
            some: {
              knowledgeLevel: userKnowledgeLevel,
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
        take: limit - suggestedLessons.length,
        orderBy: { createdAt: 'asc' },
      });

      alignedLessons.forEach((lesson) => {
        if (suggestedLessons.length < limit) {
          suggestedLessons.push({
            lesson: {
              id: lesson.id,
              title: lesson.title,
              imageUrl: lesson.imageUrl,
            },
            module: lesson.module,
            reason: `Matches your ${userKnowledgeLevel} level`,
          });
        }
      });
    }

    // Suggest modules (excluding those with all lessons started)
    const allModules = await this.prisma.module.findMany({
      include: {
        lessons: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    allModules.forEach((module) => {
      const allLessonIds = module.lessons.map((l) => l.id);
      const allStarted = allLessonIds.every((lid) => startedLessonIds.has(lid));

      if (!allStarted && suggestedModules.length < limit) {
        suggestedModules.push({
          module: {
            id: module.id,
            title: module.title,
            imageUrl: module.imageUrl,
          },
          reason: 'Contains new lessons',
        });
      }
    });

    return {
      lessons: suggestedLessons.slice(0, limit),
      modules: suggestedModules.slice(0, limit),
    };
  }

  /**
   * Get a complete session plan for the user.
   * @param userId User ID
   * @param context Session context
   * @returns Complete session plan
   */
  async getSessionPlan(
    userId: string,
    context: SessionContext,
  ): Promise<SessionPlanDto> {
    return this.contentDelivery.getSessionPlan(userId, context);
  }
}
