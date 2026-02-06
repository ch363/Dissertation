import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressService } from '../progress/progress.service';
import {
  UserLessonRepository,
  UserTeachingCompletedRepository,
} from '../progress/repositories';
import { UserSkillMasteryRepository } from '../engine/repositories';
import { isMissingColumnOrSchemaMismatchError } from '../common/utils/prisma-error.util';
import { LoggerService } from '../common/logger';

/**
 * MeLearningService
 *
 * Handles learning-related data for the user including lessons, mastery, and recent activity.
 * Follows SRP - focused on learning progress concerns.
 */
@Injectable()
export class MeLearningService {
  private readonly logger = new LoggerService(MeLearningService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly progressService: ProgressService,
    private readonly userLessonRepository: UserLessonRepository,
    private readonly userTeachingCompletedRepository: UserTeachingCompletedRepository,
    private readonly userSkillMasteryRepository: UserSkillMasteryRepository,
  ) {}

  /**
   * Get all lessons the user has started with progress info.
   */
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

    // Build a map from questionId to lessonId using loaded data
    const questionIdToLessonId = new Map<string, string>();
    const questionIdSet = new Set<string>();
    teachings.forEach((teaching) => {
      teaching.questions.forEach((q) => {
        questionIdSet.add(q.id);
        questionIdToLessonId.set(q.id, teaching.lessonId);
      });
    });

    const dueItems = await this.progressService.getDueReviewsLatest(userId);
    const dueCountByLessonId = new Map<string, number>();
    for (const item of dueItems) {
      if (!questionIdSet.has(item.questionId)) continue;
      const lessonId = questionIdToLessonId.get(item.questionId);
      if (lessonId) {
        dueCountByLessonId.set(lessonId, (dueCountByLessonId.get(lessonId) || 0) + 1);
      }
    }

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

  /**
   * Get all mastery records for the user.
   */
  async getAllMastery(userId: string) {
    const masteryRecords = await this.userSkillMasteryRepository.findManyByUserOrdered(userId);

    // Get all question performances to calculate mastered/total counts per skill
    const performances = await this.prisma.userQuestionPerformance.findMany({
      where: { userId },
      include: {
        question: {
          include: {
            skillTags: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const skillStats = new Map<string, { mastered: number; total: number }>();

    performances.forEach((perf) => {
      perf.question.skillTags.forEach((skill) => {
        const tag = skill.name;
        if (!skillStats.has(tag)) {
          skillStats.set(tag, { mastered: 0, total: 0 });
        }
        const stats = skillStats.get(tag)!;
        stats.total++;
        if (perf.score && perf.score >= 0.8) {
          stats.mastered++;
        }
      });
    });

    return masteryRecords.map((record) => {
      const stats = skillStats.get(record.skillTag) || { mastered: 0, total: 0 };
      return {
        skillType: record.skillTag,
        skillTag: record.skillTag,
        masteryProbability: record.masteryProbability,
        averageMastery: record.masteryProbability,
        masteredCount: stats.mastered,
        totalCount: stats.total,
        lastUpdated: record.lastUpdated,
      };
    });
  }

  /**
   * Get recent learning activity (lesson, teaching, question).
   */
  async getRecent(userId: string) {
    const recentLesson = await this.findRecentIncompleteLesson(userId);
    const recentTeaching = await this.userTeachingCompletedRepository.findMostRecentByUser(
      userId,
    );
    const recentQuestion = await this.findRecentQuestion(userId);

    let actualCompletedTeachings = 0;
    if (recentLesson) {
      actualCompletedTeachings = await this.userTeachingCompletedRepository.countByUserAndTeachingIds(
        userId,
        recentLesson.lesson.teachings.map((t) => t.id),
      );
    }

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
            completedTeachings: actualCompletedTeachings,
            totalTeachings: recentLesson.lesson.teachings.length,
            dueReviewCount: 0,
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

  /**
   * Find the most recent lesson that has incomplete teachings.
   */
  private async findRecentIncompleteLesson(userId: string) {
    const userLessons = await this.prisma.userLesson.findMany({
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
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    for (const ul of userLessons) {
      const totalTeachings = ul.lesson.teachings.length;
      const actualCompletedCount = await this.userTeachingCompletedRepository.countByUserAndTeachingIds(
        userId,
        ul.lesson.teachings.map((t) => t.id),
      );
      if (actualCompletedCount < totalTeachings) {
        return ul;
      }
    }

    return null;
  }

  /**
   * Find the most recently revised question.
   */
  private async findRecentQuestion(userId: string): Promise<{
    lastRevisedAt?: Date | null;
    nextReviewDue?: Date | null;
    question: {
      id: string;
      teaching: {
        id: string;
        userLanguageString: string;
        learningLanguageString: string;
        lesson: {
          id: string;
          title: string;
          module: { id: string; title: string };
        };
      };
    };
  } | null> {
    try {
      return await this.prisma.userQuestionPerformance.findFirst({
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
    } catch (error: unknown) {
      if (!isMissingColumnOrSchemaMismatchError(error)) {
        throw error;
      }

      // Fallback for schema mismatch
      const fallback = await this.prisma.userQuestionPerformance.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          createdAt: true,
          question: {
            select: {
              id: true,
              teaching: {
                select: {
                  id: true,
                  userLanguageString: true,
                  learningLanguageString: true,
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

      return fallback
        ? {
            question: fallback.question,
            lastRevisedAt: fallback.createdAt,
            nextReviewDue: null,
          }
        : null;
    }
  }
}
