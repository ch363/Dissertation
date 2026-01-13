import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DELIVERY_METHOD } from '@prisma/client';
import { ContentDeliveryService } from '../engine/content-delivery/content-delivery.service';

@Injectable()
export class LearnService {
  constructor(
    private prisma: PrismaService,
    private contentDelivery: ContentDeliveryService,
  ) {}

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
            questions: {
              include: {
                questionDeliveryMethods: true,
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    const allQuestionIds = lesson.teachings.flatMap((t) => t.questions.map((q) => q.id));

    if (allQuestionIds.length === 0) {
      return {
        type: 'done' as const,
        lessonId,
        rationale: 'No questions in this lesson',
      };
    }

    // Use engine's content delivery service to get next item
    const nextItem = await this.contentDelivery.getNextItem(userId, {
      mode: 'mixed',
      lessonId,
    });

    if (!nextItem) {
      return {
        type: 'done' as const,
        lessonId,
        rationale: 'All questions completed',
      };
    }

    // Convert engine DTO to existing response format
    if (nextItem.kind === 'question' && nextItem.questionId) {
      // Check if it's a review or new
      const isReview = await this.isReviewItem(userId, nextItem.questionId);

      return {
        type: isReview ? ('review' as const) : ('new' as const),
        lessonId,
        teachingId: nextItem.teachingId,
        question: {
          id: nextItem.questionId,
          teachingId: nextItem.teachingId,
          deliveryMethods: nextItem.deliveryMethods || [],
        },
        suggestedDeliveryMethod: nextItem.suggestedDeliveryMethod,
        rationale: nextItem.rationale,
      };
    }

    // Fallback to old logic if engine returns unexpected type
    return {
      type: 'done' as const,
      lessonId,
      rationale: 'No items available',
    };
  }

  /**
   * Check if a question is a review item (has due nextReviewDue).
   */
  private async isReviewItem(userId: string, questionId: string): Promise<boolean> {
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
    const completedTeachings = await this.prisma.userTeachingCompleted.findMany({
      where: { userId },
      select: { teachingId: true },
    });

    const completedTeachingIds = new Set(completedTeachings.map((ct) => ct.teachingId));

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

      if (currentLesson) {
        const moduleLessons = currentLesson.module.lessons;
        const currentIndex = moduleLessons.findIndex((l) => l.id === currentLessonId);
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
}
