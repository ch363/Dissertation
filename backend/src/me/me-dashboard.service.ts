import { Injectable } from '@nestjs/common';
import { DELIVERY_METHOD } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressService } from '../progress/progress.service';
import { UserLessonRepository } from '../progress/repositories';
import { UserKnowledgeLevelProgressRepository } from '../engine/repositories';
import { isMissingColumnOrSchemaMismatchError } from '../common/utils/prisma-error.util';
import {
  getStartOfWeekLocalUtc,
  getEndOfWeekLocalUtc,
  getStartOfLocalDayUtc,
  getEndOfLocalDayUtc,
} from '../common/utils/date.util';
import { LoggerService } from '../common/logger';

/**
 * MeDashboardService
 *
 * Handles dashboard and statistics data for the user.
 * Follows SRP - focused on dashboard/stats concerns.
 */
@Injectable()
export class MeDashboardService {
  private readonly logger = new LoggerService(MeDashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly progressService: ProgressService,
    private readonly userLessonRepository: UserLessonRepository,
    private readonly xpProgressRepository: UserKnowledgeLevelProgressRepository,
  ) {}

  /**
   * Get comprehensive dashboard data for a user.
   */
  async getDashboard(userId: string, tzOffsetMinutes?: number) {
    const now = new Date();
    const dashboardData = await this.fetchDashboardData(userId, now, tzOffsetMinutes);
    const streakInfo = await this.calculateStreakInfo(userId);
    const xpProgress = await this.calculateXPProgress(userId, now, dashboardData);
    const weeklyActivity = await this.getWeeklyActivity(userId, now, tzOffsetMinutes);
    return this.buildDashboardResponse(dashboardData, streakInfo, xpProgress, weeklyActivity);
  }

  /**
   * Get daily stats (minutes, items, accuracy).
   */
  async getStats(userId: string, tzOffsetMinutes?: number) {
    const now = new Date();
    const startOfToday = Number.isFinite(tzOffsetMinutes)
      ? getStartOfLocalDayUtc(now, tzOffsetMinutes)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = Number.isFinite(tzOffsetMinutes)
      ? new Date(getEndOfLocalDayUtc(now, tzOffsetMinutes).getTime() + 1)
      : (() => {
          const end = new Date(startOfToday);
          end.setDate(end.getDate() + 1);
          return end;
        })();

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

    const withAccuracy = todayPerformances.filter((p) => p.percentageAccuracy != null);
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

    const rows = await this.xpProgressRepository.findManyByUserInRange(
      userId,
      weekStart,
      weekEnd,
    );

    const offsetMs = Number.isFinite(tzOffsetMinutes) ? tzOffsetMinutes! * 60_000 : 0;
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

    const dueReviewCount = await this.progressService.getDueReviewCount(userId, now);
    const activeLessonCount = await this.userLessonRepository.countByUserId(userId);
    const xpTotal = await this.xpProgressRepository.getTotalXp(userId);

    const recentPerformances = await this.prisma.userQuestionPerformance.findMany({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
        percentageAccuracy: { not: null },
      },
      select: { percentageAccuracy: true },
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
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { timeToComplete: true },
    });

    return {
      dueReviewCount,
      activeLessonCount,
      xpTotal,
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

    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    // Use repository for XP aggregations
    const weeklyXP = await this.xpProgressRepository.aggregateSum(userId, {
      startDate: weekAgo,
    });

    const previousWeekXP = await this.xpProgressRepository.aggregateSum(userId, {
      startDate: twoWeeksAgo,
      endDate: weekAgo,
    });

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
        stats && stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 0;
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
        values.length > 0 ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : 0;
    }

    // Calculate study time
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const questionTimeMs = dashboardData.studyTimePerformances.reduce(
      (sum, perf) => sum + (perf.timeToComplete || 0),
      0,
    );

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
    streakInfo: { streak: number },
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
}
