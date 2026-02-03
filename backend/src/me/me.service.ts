import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DELIVERY_METHOD } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ProgressService } from '../progress/progress.service';
import { ResetProgressDto } from '../progress/dto/reset-progress.dto';
import { isMissingColumnOrSchemaMismatchError } from '../common/utils/prisma-error.util';
import {
  getStartOfWeekLocalUtc,
  getEndOfWeekLocalUtc,
} from '../common/utils/date.util';
import { LoggerService } from '../common/logger';

@Injectable()
export class MeService {
  private supabaseAdmin: ReturnType<typeof createClient> | null = null;
  private readonly logger = new LoggerService(MeService.name);

  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private progressService: ProgressService,
    private configService: ConfigService,
  ) {
    const supabaseUrl = this.configService.get<string>('supabase.url');
    const serviceRoleKey = this.configService.get<string>(
      'supabase.serviceRoleKey',
    );
    if (supabaseUrl && serviceRoleKey) {
      this.supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
  }

  async getMe(userId: string) {
    const user = await this.usersService.upsertUser(userId);
    let displayName = user.name;

    if (!displayName || displayName.trim() === '') {
      if (this.supabaseAdmin) {
        try {
          const { data: authUser, error } =
            await this.supabaseAdmin.auth.admin.getUserById(userId);
          if (!error && authUser?.user) {
            const authMetadataName = (authUser.user.user_metadata as any)?.name;
            if (authMetadataName && authMetadataName.trim()) {
              displayName = authMetadataName.trim();
              try {
                await this.usersService.updateUser(userId, {
                  name: displayName || undefined,
                });
                user.name = displayName;
              } catch (syncError) {
                this.logger.logWarn(
                  'Failed to sync name from auth metadata to DB',
                  { error: String(syncError) },
                );
              }
            } else {
              const email = authUser.user.email;
              if (email) {
                const emailName = email.split('@')[0];
                displayName =
                  emailName.charAt(0).toUpperCase() + emailName.slice(1);
              } else {
                displayName = 'User';
              }
            }
          } else {
            displayName = 'User';
          }
        } catch (error) {
          this.logger.logWarn('Failed to fetch user metadata from Supabase', { error: String(error) });
          displayName = 'User';
        }
      } else {
        displayName = 'User';
      }
    }

    return {
      ...user,
      displayName: displayName || 'User',
    };
  }

  async getDashboard(userId: string, tzOffsetMinutes?: number) {
    const now = new Date();
    const dashboardData = await this.fetchDashboardData(userId, now, tzOffsetMinutes);
    const streakInfo = await this.calculateStreakInfo(userId);
    const xpProgress = await this.calculateXPProgress(userId, now, dashboardData);
    const weeklyActivity = await this.getWeeklyActivity(userId, now, tzOffsetMinutes);
    return this.buildDashboardResponse(dashboardData, streakInfo, xpProgress, weeklyActivity);
  }

  /**
   * XP earned per day for the current week (Mon=0 .. Sun=6) in user's timezone.
   */
  private async getWeeklyActivity(
    userId: string,
    now: Date,
    tzOffsetMinutes?: number,
  ): Promise<number[]> {
    const weekStart = getStartOfWeekLocalUtc(now, tzOffsetMinutes);
    const weekEnd = getEndOfWeekLocalUtc(now, tzOffsetMinutes);
    const rows = await this.prisma.userKnowledgeLevelProgress.findMany({
      where: {
        userId,
        createdAt: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      select: { value: true, createdAt: true },
    });
    const offsetMs = Number.isFinite(tzOffsetMinutes) ? (tzOffsetMinutes! * 60_000) : 0;
    const dailyXp = [0, 0, 0, 0, 0, 0, 0];
    for (const row of rows) {
      const localMs = row.createdAt.getTime() - offsetMs;
      const localDate = new Date(localMs);
      const dayOfWeek = localDate.getUTCDay();
      const monToSunIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      dailyXp[monToSunIndex] += row.value;
    }
    return dailyXp;
  }

  private async fetchDashboardData(
    userId: string,
    now: Date,
    tzOffsetMinutes?: number,
  ) {
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Use "due right now" (same as session plan and due list) so the count matches
    // what the user can actually review. Previously we used end-of-day, which showed
    // "2 due" when 0 were due right now.
    const dueReviewCount = await this.progressService.getDueReviewCount(userId, now);

    const activeLessonCount = await this.prisma.userLesson.count({
      where: { userId },
    });

    const xpProgress = await this.prisma.userKnowledgeLevelProgress.aggregate({
      where: { userId },
      _sum: {
        value: true,
      },
    });

    const recentPerformances = await this.prisma.userQuestionPerformance.findMany({
      where: {
        userId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
        percentageAccuracy: {
          not: null,
        },
      },
      select: {
        percentageAccuracy: true,
      },
    });

    const accuracyPerformances = await this.prisma.userQuestionPerformance.findMany({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { deliveryMethod: true, score: true },
    });

    const grammaticalMethods: DELIVERY_METHOD[] = [
      DELIVERY_METHOD.TEXT_TRANSLATION,
      DELIVERY_METHOD.SPEECH_TO_TEXT,
      DELIVERY_METHOD.TEXT_TO_SPEECH,
    ];
    const grammaticalPerformances = await this.prisma.userQuestionPerformance.findMany({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
        deliveryMethod: { in: grammaticalMethods },
        percentageAccuracy: { not: null },
      },
      select: { deliveryMethod: true, percentageAccuracy: true },
    });

    const studyTimePerformances = await this.prisma.userQuestionPerformance.findMany({
      where: {
        userId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        timeToComplete: true,
      },
    });

    return {
      dueReviewCount,
      activeLessonCount,
      xpTotal: xpProgress._sum.value || 0,
      recentPerformances,
      accuracyPerformances,
      grammaticalPerformances,
      studyTimePerformances,
    };
  }

  private async calculateStreakInfo(userId: string) {
    const streak = await this.progressService.calculateStreak(userId);
    return { streak };
  }

  private async calculateXPProgress(
    userId: string,
    now: Date,
    dashboardData: Awaited<ReturnType<typeof this.fetchDashboardData>>,
  ) {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklyXpProgress = await this.prisma.userKnowledgeLevelProgress.aggregate({
      where: {
        userId,
        createdAt: {
          gte: weekAgo,
        },
      },
      _sum: {
        value: true,
      },
    });

    const weeklyXP = weeklyXpProgress._sum.value || 0;

    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const previousWeekXpProgress = await this.prisma.userKnowledgeLevelProgress.aggregate({
      where: {
        userId,
        createdAt: {
          gte: twoWeeksAgo,
          lt: weekAgo,
        },
      },
      _sum: {
        value: true,
      },
    });

    const previousWeekXP = previousWeekXpProgress._sum.value || 0;

    let weeklyXPChange = 0;
    if (previousWeekXP > 0) {
      weeklyXPChange = Math.round(((weeklyXP - previousWeekXP) / previousWeekXP) * 100);
    } else if (weeklyXP > 0) {
      weeklyXPChange = 100;
    }

    let accuracyPercentage = 0;
    if (dashboardData.recentPerformances.length > 0) {
      const totalAccuracy = dashboardData.recentPerformances.reduce(
        (sum, perf) => sum + (perf.percentageAccuracy || 0),
        0,
      );
      accuracyPercentage = Math.round(totalAccuracy / dashboardData.recentPerformances.length);
    }

    const passThreshold = 50;
    const accuracyByDeliveryMethod: Record<string, number> = {};
    const methodCounts = new Map<string, { pass: number; total: number }>();
    
    for (const p of dashboardData.accuracyPerformances) {
      const key = p.deliveryMethod;
      const current = methodCounts.get(key) ?? { pass: 0, total: 0 };
      current.total += 1;
      if (p.score >= passThreshold) current.pass += 1;
      methodCounts.set(key, current);
    }
    
    for (const method of Object.values(DELIVERY_METHOD)) {
      const stats = methodCounts.get(method);
      accuracyByDeliveryMethod[method] =
        stats && stats.total > 0
          ? Math.round((stats.pass / stats.total) * 100)
          : 0;
    }

    const grammaticalMethods: DELIVERY_METHOD[] = [
      DELIVERY_METHOD.TEXT_TRANSLATION,
      DELIVERY_METHOD.SPEECH_TO_TEXT,
      DELIVERY_METHOD.TEXT_TO_SPEECH,
    ];
    const grammaticalByMethod = new Map<string, number[]>();
    
    for (const p of dashboardData.grammaticalPerformances) {
      const acc = p.percentageAccuracy ?? 0;
      const list = grammaticalByMethod.get(p.deliveryMethod) ?? [];
      list.push(acc);
      grammaticalByMethod.set(p.deliveryMethod, list);
    }
    
    const grammaticalAccuracyByDeliveryMethod: Record<string, number> = {};
    for (const method of grammaticalMethods) {
      const values = grammaticalByMethod.get(method) ?? [];
      grammaticalAccuracyByDeliveryMethod[method] =
        values.length > 0
          ? Math.round(values.reduce((s, v) => s + v, 0) / values.length)
          : 0;
    }

    // Study time (last 30 days): question card time (timeToComplete) + teaching time (endedAt - startedAt) + lesson time (endedAt - startedAt).
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const questionTimeMs = dashboardData.studyTimePerformances.reduce((sum, perf) => {
      return sum + (perf.timeToComplete || 0);
    }, 0);

    const teachingRows = await this.prisma.userTeachingCompleted.findMany({
      where: {
        userId,
        endedAt: { gte: thirtyDaysAgo, not: null },
        startedAt: { not: null },
      },
      select: { startedAt: true, endedAt: true },
    });
    let teachingTimeMs = 0;
    for (const row of teachingRows) {
      if (row.startedAt != null && row.endedAt != null) {
        teachingTimeMs += row.endedAt.getTime() - row.startedAt.getTime();
      }
    }

    const lessonRows = await this.prisma.userLesson.findMany({
      where: {
        userId,
        endedAt: { gte: thirtyDaysAgo, not: null },
        startedAt: { not: null },
      },
      select: { startedAt: true, endedAt: true },
    });
    let lessonTimeMs = 0;
    for (const row of lessonRows) {
      if (row.startedAt != null && row.endedAt != null) {
        lessonTimeMs += row.endedAt.getTime() - row.startedAt.getTime();
      }
    }

    const totalStudyTimeMs = questionTimeMs + teachingTimeMs + lessonTimeMs;

    const studyTimeMinutes = Math.floor(totalStudyTimeMs / (1000 * 60));

    const performancesWithTime = dashboardData.studyTimePerformances.filter(
      (p) => p.timeToComplete != null && p.timeToComplete > 0,
    );
    const defaultMinutesPerCard = 0.5;
    const avgMsPerCard =
      performancesWithTime.length > 0
        ? questionTimeMs / performancesWithTime.length
        : defaultMinutesPerCard * 60 * 1000;
    const avgMinutesPerCard = avgMsPerCard / (60 * 1000);
    const estimatedReviewMinutes = Math.max(
      1,
      Math.ceil(dashboardData.dueReviewCount * avgMinutesPerCard),
    );

    return {
      weeklyXP,
      weeklyXPChange,
      accuracyPercentage,
      accuracyByDeliveryMethod,
      grammaticalAccuracyByDeliveryMethod,
      studyTimeMinutes,
      estimatedReviewMinutes,
    };
  }

  private buildDashboardResponse(
    dashboardData: Awaited<ReturnType<typeof this.fetchDashboardData>>,
    streakInfo: { streak: any },
    xpProgress: Awaited<ReturnType<typeof this.calculateXPProgress>>,
    weeklyActivity: number[],
  ) {
    return {
      dueReviewCount: dashboardData.dueReviewCount,
      estimatedReviewMinutes: xpProgress.estimatedReviewMinutes,
      activeLessonCount: dashboardData.activeLessonCount,
      xpTotal: dashboardData.xpTotal,
      streak: streakInfo.streak,
      weeklyXP: xpProgress.weeklyXP,
      weeklyXPChange: xpProgress.weeklyXPChange,
      weeklyActivity,
      accuracyPercentage: xpProgress.accuracyPercentage,
      accuracyByDeliveryMethod: xpProgress.accuracyByDeliveryMethod,
      grammaticalAccuracyByDeliveryMethod: xpProgress.grammaticalAccuracyByDeliveryMethod,
      studyTimeMinutes: xpProgress.studyTimeMinutes,
    };
  }

  async getStats(userId: string) {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    let todayPerformances: Array<{
      timeToComplete: number | null;
      percentageAccuracy: number | null;
    }> = [];
    try {
      todayPerformances = await this.prisma.userQuestionPerformance.findMany({
        where: {
          userId,
          OR: [
            {
              lastRevisedAt: {
                gte: startOfToday,
                lt: endOfToday,
              },
            },
            {
              lastRevisedAt: null,
              createdAt: {
                gte: startOfToday,
                lt: endOfToday,
              },
            },
          ],
        },
        select: {
          timeToComplete: true,
          percentageAccuracy: true,
        },
      });
    } catch (error: unknown) {
      if (!isMissingColumnOrSchemaMismatchError(error)) {
        throw error;
      }
      try {
        todayPerformances = await this.prisma.userQuestionPerformance.findMany({
          where: {
            userId,
            createdAt: {
              gte: startOfToday,
              lt: endOfToday,
            },
          },
          select: {
            timeToComplete: true,
            percentageAccuracy: true,
          },
        });
      } catch (fallbackError: unknown) {
        if (!isMissingColumnOrSchemaMismatchError(fallbackError)) {
          throw fallbackError;
        }
        todayPerformances = [];
      }
    }

    const totalMs = todayPerformances.reduce((sum, perf) => {
      return sum + (perf.timeToComplete || 0);
    }, 0);

    const minutesToday = Math.round(totalMs / (1000 * 60));
    const completedItemsToday = todayPerformances.length;

    const withAccuracy = todayPerformances.filter(
      (p) => p.percentageAccuracy != null,
    );
    const accuracyToday =
      withAccuracy.length > 0
        ? Math.round(
            withAccuracy.reduce((s, p) => s + (p.percentageAccuracy ?? 0), 0) /
              withAccuracy.length,
          )
        : undefined;

    return {
      minutesToday,
      completedItemsToday,
      ...(accuracyToday !== undefined && { accuracyToday }),
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

    const questionIdSet = new Set(teachings.flatMap((t) => t.questions.map((q) => q.id)));
    const dueItems = await this.progressService.getDueReviewsLatest(userId);
    const dueCountByLessonId = new Map<string, number>();
    for (const item of dueItems) {
      if (!questionIdSet.has(item.questionId)) continue;
      const lessonId = item.question?.teaching?.lesson?.id;
      if (lessonId) {
        dueCountByLessonId.set(
          lessonId,
          (dueCountByLessonId.get(lessonId) || 0) + 1,
        );
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

  async getAllMastery(userId: string) {
    const masteryRecords = await this.prisma.userSkillMastery.findMany({
      where: { userId },
      orderBy: { lastUpdated: 'desc' },
      select: {
        skillTag: true,
        masteryProbability: true,
        lastUpdated: true,
      },
    });

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

  async getRecent(userId: string) {
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

    let recentLesson: (typeof userLessons)[0] | null = null;
    for (const ul of userLessons) {
      const totalTeachings = ul.lesson.teachings.length;
      const actualCompletedCount =
        await this.prisma.userTeachingCompleted.count({
          where: {
            userId,
            teachingId: {
              in: ul.lesson.teachings.map((t) => t.id),
            },
          },
        });
      if (actualCompletedCount < totalTeachings) {
        recentLesson = ul;
        break;
      }
    }

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

    let recentQuestion: null | {
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
    } = null;

    try {
      recentQuestion = await this.prisma.userQuestionPerformance.findFirst({
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

      recentQuestion = fallback
        ? {
            question: fallback.question,
            lastRevisedAt: fallback.createdAt,
            nextReviewDue: null,
          }
        : null;
    }

    let actualCompletedTeachings = 0;
    if (recentLesson) {
      const completedTeachings = await this.prisma.userTeachingCompleted.count({
        where: {
          userId,
          teachingId: {
            in: recentLesson.lesson.teachings.map((t) => t.id),
          },
        },
      });
      actualCompletedTeachings = completedTeachings;
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
              learningLanguageString:
                recentTeaching.teaching.learningLanguageString,
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
              userLanguageString:
                recentQuestion.question.teaching.userLanguageString,
              learningLanguageString:
                recentQuestion.question.teaching.learningLanguageString,
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

  async uploadAvatar(userId: string, avatarUrl: string) {
    await this.usersService.updateUser(userId, {
      avatarUrl,
    });

    return {
      message: 'Avatar uploaded successfully',
      avatarUrl,
    };
  }

  async deleteAccount(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.userLesson.deleteMany({ where: { userId } });
      await tx.userTeachingCompleted.deleteMany({ where: { userId } });
      await tx.userQuestionPerformance.deleteMany({ where: { userId } });
      await tx.userKnowledgeLevelProgress.deleteMany({ where: { userId } });
      await tx.userDeliveryMethodScore.deleteMany({ where: { userId } });

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
