import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { DELIVERY_METHOD, KNOWLEDGE_LEVEL } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async upsertUser(authUid: string) {
    return this.prisma.user.upsert({
      where: { id: authUid },
      update: {},
      create: {
        id: authUid,
        knowledgePoints: 0,
        knowledgeLevel: 'A1',
      },
    });
  }

  async updateUser(userId: string, updateDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: updateDto,
    });
  }

  async getUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
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
}
