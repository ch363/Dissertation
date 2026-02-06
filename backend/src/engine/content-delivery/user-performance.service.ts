import { Injectable } from '@nestjs/common';
import { DELIVERY_METHOD } from '@prisma/client';
import { UserTimeAverages } from './session-types';
import { getDefaultTimeAverages } from './content-delivery.policy';
import { OnboardingPreferencesService } from '../../onboarding/onboarding-preferences.service';
import { LoggerService } from '../../common/logger';
import { isMissingColumnOrSchemaMismatchError } from '../../common/utils/prisma-error.util';
import {
  UserQuestionPerformanceRepository,
  UserDeliveryMethodScoreRepository,
  UserTeachingViewRepository,
} from '../repositories';

/**
 * UserPerformanceService
 *
 * Manages user performance data and preferences.
 * Follows Single Responsibility Principle - focused on user-specific data retrieval.
 * Follows Dependency Inversion Principle - depends on repository interfaces.
 */
@Injectable()
export class UserPerformanceService {
  private readonly logger = new LoggerService(UserPerformanceService.name);

  constructor(
    private userQuestionPerformanceRepo: UserQuestionPerformanceRepository,
    private userDeliveryMethodScoreRepo: UserDeliveryMethodScoreRepository,
    private userTeachingViewRepo: UserTeachingViewRepository,
    private onboardingPreferences: OnboardingPreferencesService,
  ) {}

  /**
   * Get user's average completion times per delivery method.
   */
  async getUserAverageTimes(userId: string): Promise<UserTimeAverages> {
    let performances;
    try {
      performances = await this.userQuestionPerformanceRepo.findManyByUserId(
        userId,
        {
          take: 100,
          select: {
            timeToComplete: true,
            deliveryMethod: true,
          },
        },
      );
    } catch (error: unknown) {
      // Gracefully handle schema mismatch errors (e.g., during migrations)
      if (isMissingColumnOrSchemaMismatchError(error)) {
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
    return this.userTeachingViewRepo.getSeenTeachingIdsByUserId(userId);
  }

  /**
   * Get user's delivery method performance scores.
   */
  async getDeliveryMethodScores(
    userId: string,
  ): Promise<Map<DELIVERY_METHOD, number>> {
    return this.userDeliveryMethodScoreRepo.getScoreMapByUserId(userId);
  }
}
