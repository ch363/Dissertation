import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DELIVERY_METHOD } from '@prisma/client';

@Injectable()
export class LearnService {
  constructor(private prisma: PrismaService) {}

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

    const now = new Date();

    // 3) Find due reviews within this lesson first
    const allQuestionIds = lesson.teachings.flatMap((t) => t.questions.map((q) => q.id));

    if (allQuestionIds.length === 0) {
      return {
        type: 'done' as const,
        lessonId,
        rationale: 'No questions in this lesson',
      };
    }

    // Get all due reviews for questions in this lesson
    const dueReviews = await this.prisma.userQuestionPerformance.findMany({
      where: {
        userId,
        questionId: { in: allQuestionIds },
        nextReviewDue: {
          lte: now,
          not: null,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Dedup by questionId - keep latest per question
    const questionIdMap = new Map<string, typeof dueReviews[0]>();
    dueReviews.forEach((review) => {
      const existing = questionIdMap.get(review.questionId);
      if (!existing || review.createdAt > existing.createdAt) {
        questionIdMap.set(review.questionId, review);
      }
    });

    if (questionIdMap.size > 0) {
      // Return first due review
      const review = Array.from(questionIdMap.values())[0];
      const question = lesson.teachings
        .flatMap((t) => t.questions)
        .find((q) => q.id === review.questionId);

      if (!question) {
        throw new NotFoundException('Question not found');
      }

      const teaching = lesson.teachings.find((t) =>
        t.questions.some((q) => q.id === question.id),
      );

      if (!teaching) {
        throw new NotFoundException('Teaching not found');
      }

      // Get suggested delivery method
      const suggestedDeliveryMethod = await this.getSuggestedDeliveryMethod(
        userId,
        question.questionDeliveryMethods.map((qdm) => qdm.deliveryMethod),
      );

      return {
        type: 'review' as const,
        lessonId,
        teachingId: teaching.id,
        question: {
          id: question.id,
          teachingId: teaching.id,
          deliveryMethods: question.questionDeliveryMethods.map((qdm) => qdm.deliveryMethod),
        },
        suggestedDeliveryMethod,
        rationale: 'Due review found',
      };
    }

    // 4) Else return new content: next unanswered or least-practiced question
    // Get all performance records for questions in this lesson
    const allPerformances = await this.prisma.userQuestionPerformance.findMany({
      where: {
        userId,
        questionId: { in: allQuestionIds },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Find questions that haven't been attempted, or least practiced
    const questionAttemptCounts = new Map<string, number>();
    allPerformances.forEach((perf) => {
      questionAttemptCounts.set(perf.questionId, (questionAttemptCounts.get(perf.questionId) || 0) + 1);
    });

    // Sort questions: unanswered first, then by attempt count ascending
    const allQuestions = lesson.teachings.flatMap((t) => t.questions);
    const sortedQuestions = allQuestions.sort((a, b) => {
      const aCount = questionAttemptCounts.get(a.id) || 0;
      const bCount = questionAttemptCounts.get(b.id) || 0;
      if (aCount === 0 && bCount > 0) return -1;
      if (aCount > 0 && bCount === 0) return 1;
      return aCount - bCount;
    });

    if (sortedQuestions.length > 0) {
      const question = sortedQuestions[0];
      const teaching = lesson.teachings.find((t) =>
        t.questions.some((q) => q.id === question.id),
      );

      if (!teaching) {
        throw new NotFoundException('Teaching not found');
      }

      const suggestedDeliveryMethod = await this.getSuggestedDeliveryMethod(
        userId,
        question.questionDeliveryMethods.map((qdm) => qdm.deliveryMethod),
      );

      return {
        type: 'new' as const,
        lessonId,
        teachingId: teaching.id,
        question: {
          id: question.id,
          teachingId: teaching.id,
          deliveryMethods: question.questionDeliveryMethods.map((qdm) => qdm.deliveryMethod),
        },
        suggestedDeliveryMethod,
        rationale: 'Next question to practice',
      };
    }

    // 5) Else return type="done"
    return {
      type: 'done' as const,
      lessonId,
      rationale: 'All questions completed',
    };
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
