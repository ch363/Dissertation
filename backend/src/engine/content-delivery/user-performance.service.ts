import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DELIVERY_METHOD } from '@prisma/client';
import { UserTimeAverages } from './session-types';
import { getDefaultTimeAverages } from './content-delivery.policy';
import { OnboardingPreferencesService } from '../../onboarding/onboarding-preferences.service';
import { LoggerService } from '../../common/logger';

/**
 * UserPerformanceService
 * 
 * Manages user performance data and preferences.
 * Follows Single Responsibility Principle - focused on user-specific data retrieval.
 */
@Injectable()
export class UserPerformanceService {
  private readonly logger = new LoggerService(UserPerformanceService.name);

  constructor(
    private prisma: PrismaService,
    private onboardingPreferences: OnboardingPreferencesService,
  ) {}

  /**
   * Get user's average completion times per delivery method.
   */
  async getUserAverageTimes(userId: string): Promise<UserTimeAverages> {
    let performances;
    try {
      performances = await this.prisma.userQuestionPerformance.findMany({
        where: { userId },
        select: {
          timeToComplete: true,
          deliveryMethod: true,
        },
        take: 100,
      });
    } catch (error: any) {
      if (
        error?.message?.includes('column') ||
        error?.message?.includes('does not exist') ||
        error?.message?.includes('not available')
      ) {
        return getDefaultTimeAverages();
      }
      throw error;
    }

    const methodTimes = new Map<DELIVERY_METHOD, number[]>();
    const allPracticeTimes: number[] = [];

    for (const perf of performances) {
      if (perf.timeToComplete) {
        allPracticeTimes.push(perf.timeToComplete / 1000);

        const deliveryMethod = perf.deliveryMethod;
        if (!methodTimes.has(deliveryMethod)) {
          methodTimes.set(deliveryMethod, []);
        }
        methodTimes.get(deliveryMethod)!.push(perf.timeToComplete / 1000);
      }
    }

    const avgByMethod = new Map<DELIVERY_METHOD, number>();
    for (const [method, times] of Array.from(methodTimes.entries())) {
      const avg = times.reduce((sum, t) => sum + t, 0) / times.length;
      avgByMethod.set(method, avg);
    }

    const avgPracticeTime =
      allPracticeTimes.length > 0
        ? allPracticeTimes.reduce((sum, t) => sum + t, 0) /
          allPracticeTimes.length
        : 60;

    const defaults = getDefaultTimeAverages();
    return {
      avgTimePerTeachSec: defaults.avgTimePerTeachSec,
      avgTimePerPracticeSec: avgPracticeTime || defaults.avgTimePerPracticeSec,
      avgTimeByDeliveryMethod:
        avgByMethod.size > 0 ? avgByMethod : defaults.avgTimeByDeliveryMethod,
      avgTimeByQuestionType: defaults.avgTimeByQuestionType,
    };
  }

  /**
   * Get set of teaching IDs the user has already seen.
   */
  async getSeenTeachingIds(userId: string): Promise<Set<string>> {
    const viewedTeachings = await this.prisma.userTeachingView.findMany({
      where: { userId },
      select: { teachingId: true },
    });

    return new Set(viewedTeachings.map((v) => v.teachingId));
  }

  /**
   * Get user's delivery method performance scores.
   */
  async getDeliveryMethodScores(userId: string): Promise<Map<DELIVERY_METHOD, number>> {
    const scores = await this.prisma.userDeliveryMethodScore.findMany({
      where: { userId },
    });

    const scoreMap = new Map<DELIVERY_METHOD, number>();
    for (const score of scores) {
      scoreMap.set(score.deliveryMethod, score.score);
    }

    return scoreMap;
  }
}
