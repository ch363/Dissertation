import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ProgressService } from '../progress/progress.service';
import { ResetProgressDto } from '../progress/dto/reset-progress.dto';

@Injectable()
export class MeService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private progressService: ProgressService,
  ) {}

  async getMe(userId: string) {
    // Provision user on first request
    return this.usersService.upsertUser(userId);
  }

  async getDashboard(userId: string) {
    const now = new Date();

    // Count deduped due reviews (latest per question where nextReviewDue <= now)
    const dueReviews = await this.prisma.userQuestionPerformance.findMany({
      where: {
        userId,
        nextReviewDue: {
          lte: now,
          not: null,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Dedup by questionId - keep only the latest per question
    const questionIdSet = new Set<string>();
    const dedupedDueReviews = dueReviews.filter((review) => {
      if (questionIdSet.has(review.questionId)) {
        return false;
      }
      questionIdSet.add(review.questionId);
      return true;
    });

    const dueReviewCount = dedupedDueReviews.length;

    // Count active lessons
    const activeLessonCount = await this.prisma.userLesson.count({
      where: { userId },
    });

    // Get XP total - sum of UserKnowledgeLevelProgress.value
    const xpProgress = await this.prisma.userKnowledgeLevelProgress.aggregate({
      where: { userId },
      _sum: {
        value: true,
      },
    });

    const xpTotal = xpProgress._sum.value || 0;

    return {
      dueReviewCount,
      activeLessonCount,
      xpTotal,
      streak: null, // Placeholder as per spec
    };
  }

  async getMyLessons(userId: string) {
    const userLessons = await this.prisma.userLesson.findMany({
      where: { userId },
      include: {
        lesson: {
          include: {
            module: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    const now = new Date();

    // Get all teachings for these lessons to count totals
    const lessonIds = userLessons.map((ul) => ul.lessonId);
    const teachings = await this.prisma.teaching.findMany({
      where: {
        lessonId: { in: lessonIds },
      },
      include: {
        questions: true,
      },
    });

    const teachingsByLessonId = new Map<string, typeof teachings>();
    teachings.forEach((teaching) => {
      const existing = teachingsByLessonId.get(teaching.lessonId) || [];
      existing.push(teaching);
      teachingsByLessonId.set(teaching.lessonId, existing);
    });

    // Get due reviews for questions in these lessons
    const questionIds = teachings.flatMap((t) => t.questions.map((q) => q.id));
    const dueReviews = await this.prisma.userQuestionPerformance.findMany({
      where: {
        userId,
        questionId: { in: questionIds },
        nextReviewDue: {
          lte: now,
          not: null,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Dedup by questionId per lesson
    const dueReviewsByQuestionId = new Map<string, typeof dueReviews[0]>();
    dueReviews.forEach((review) => {
      const existing = dueReviewsByQuestionId.get(review.questionId);
      if (!existing || review.createdAt > existing.createdAt) {
        dueReviewsByQuestionId.set(review.questionId, review);
      }
    });

    // Map question IDs to lesson IDs
    const questionToLessonId = new Map<string, string>();
    teachings.forEach((teaching) => {
      teaching.questions.forEach((q) => {
        questionToLessonId.set(q.id, teaching.lessonId);
      });
    });

    // Count due reviews per lesson
    const dueCountByLessonId = new Map<string, number>();
    dueReviewsByQuestionId.forEach((review) => {
      const lessonId = questionToLessonId.get(review.questionId);
      if (lessonId) {
        dueCountByLessonId.set(lessonId, (dueCountByLessonId.get(lessonId) || 0) + 1);
      }
    });

    return userLessons.map((ul) => {
      const teachingsInLesson = teachingsByLessonId.get(ul.lessonId) || [];
      const totalTeachings = teachingsInLesson.length;
      const dueReviewCount = dueCountByLessonId.get(ul.lessonId) || 0;

      return {
        lesson: {
          id: ul.lesson.id,
          title: ul.lesson.title,
          imageUrl: ul.lesson.imageUrl,
          module: {
            id: ul.lesson.module.id,
            title: ul.lesson.module.title,
          },
        },
        completedTeachings: ul.completedTeachings,
        totalTeachings,
        dueReviewCount,
      };
    });
  }

  async getRecent(userId: string) {
    // Get most recently accessed lesson
    const recentLesson = await this.prisma.userLesson.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        lesson: {
          include: {
            module: {
              select: {
                id: true,
                title: true,
              },
            },
            teachings: {
              take: 1,
              orderBy: { createdAt: 'asc' },
              include: {
                questions: {
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    // Get most recently completed teaching
    const recentTeaching = await this.prisma.userTeachingCompleted.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        teaching: {
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
                module: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Get most recently attempted question
    const recentQuestion = await this.prisma.userQuestionPerformance.findFirst({
      where: { userId },
      orderBy: { lastRevisedAt: 'desc' },
      include: {
        question: {
          include: {
            teaching: {
              include: {
                lesson: {
                  select: {
                    id: true,
                    title: true,
                    module: {
                      select: {
                        id: true,
                        title: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return {
      recentLesson: recentLesson
        ? {
            lesson: {
              id: recentLesson.lesson.id,
              title: recentLesson.lesson.title,
              imageUrl: recentLesson.lesson.imageUrl,
              module: recentLesson.lesson.module,
            },
            lastAccessedAt: recentLesson.updatedAt,
            completedTeachings: recentLesson.completedTeachings,
          }
        : null,
      recentTeaching: recentTeaching
        ? {
            teaching: {
              id: recentTeaching.teaching.id,
              userLanguageString: recentTeaching.teaching.userLanguageString,
              learningLanguageString: recentTeaching.teaching.learningLanguageString,
            },
            lesson: recentTeaching.teaching.lesson,
            completedAt: recentTeaching.createdAt,
          }
        : null,
      recentQuestion: recentQuestion
        ? {
            question: {
              id: recentQuestion.question.id,
            },
            teaching: {
              id: recentQuestion.question.teaching.id,
              userLanguageString: recentQuestion.question.teaching.userLanguageString,
              learningLanguageString: recentQuestion.question.teaching.learningLanguageString,
            },
            lesson: recentQuestion.question.teaching.lesson,
            lastRevisedAt: recentQuestion.lastRevisedAt,
            nextReviewDue: recentQuestion.nextReviewDue,
          }
        : null,
    };
  }

  async resetAllProgress(userId: string, options?: ResetProgressDto) {
    return this.progressService.resetAllProgress(userId, options);
  }

  async deleteAccount(userId: string) {
    // Delete all user data in a transaction
    // Note: Cascade deletes should handle related records, but we'll be explicit
    return this.prisma.$transaction(async (tx) => {
      // Delete all progress records (cascade should handle, but being explicit)
      await tx.userLesson.deleteMany({ where: { userId } });
      await tx.userTeachingCompleted.deleteMany({ where: { userId } });
      await tx.userQuestionPerformance.deleteMany({ where: { userId } });
      await tx.userKnowledgeLevelProgress.deleteMany({ where: { userId } });
      await tx.userDeliveryMethodScore.deleteMany({ where: { userId } });

      // Delete the user record itself
      await tx.user.delete({
        where: { id: userId },
      });

      return {
        message: 'Account and all associated data deleted successfully',
        deletedAt: new Date().toISOString(),
      };
    });
  }
}
