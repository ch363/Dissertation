/**
 * Content Delivery Service
 *
 * This service is responsible for selecting what content to show next to the user.
 * It implements the adaptive learning selection algorithm:
 * 1. Prefer due reviews first (items with next_due <= now)
 * 2. If no due reviews, select "new" items not yet seen
 * 3. "mixed" mode = 70% review / 30% new (if both available)
 *
 * This is a SERVICE LAYER, not middleware. It's called by LearnService
 * to determine what to show next. It does NOT handle HTTP requests directly.
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DashboardPlanDto } from './types';
import { SessionPlanService } from './session-plan.service';
import { SessionPlanCacheService } from './session-plan-cache.service';
import { SessionPlanDto, SessionContext } from './session-types';

@Injectable()
export class ContentDeliveryService {
  constructor(
    private prisma: PrismaService,
    private sessionPlanService: SessionPlanService,
    private sessionPlanCache: SessionPlanCacheService,
  ) {}

  /**
   * Get a complete session plan for the user.
   * Checks cache first, then generates plan if cache miss.
   * @param userId User ID
   * @param context Session context
   * @returns Complete session plan
   */
  async getSessionPlan(
    userId: string,
    context: SessionContext,
  ): Promise<SessionPlanDto> {
    // Generate cache key from context
    const cacheKey = this.sessionPlanCache.generateKey(
      userId,
      context.mode,
      context.lessonId,
      context.moduleId,
      context.timeBudgetSec,
    );

    // Check cache first
    const cachedPlan = this.sessionPlanCache.get(cacheKey);
    if (cachedPlan) {
      return cachedPlan;
    }

    // Cache miss - generate new plan
    const plan = await this.sessionPlanService.createPlan(userId, context);

    // Store in cache before returning
    this.sessionPlanCache.set(cacheKey, plan);

    return plan;
  }

  /**
   * Get dashboard plan showing upcoming items and stats.
   */
  async getDashboardPlan(userId: string): Promise<DashboardPlanDto> {
    const now = new Date();

    // Count due reviews from UserQuestionPerformance (distinct by questionId)
    const dueQuestionIds = await this.prisma.userQuestionPerformance.findMany({
      where: {
        userId,
        nextReviewDue: {
          lte: now,
          not: null,
        },
      },
      select: { questionId: true },
      distinct: ['questionId'],
    });
    const dueQuestionCount = dueQuestionIds.length;

    const dueReviews = Array(dueQuestionCount).fill({ dueAt: now });

    // Count new items (questions not yet attempted)
    const allQuestions = await this.prisma.question.findMany({
      select: { id: true },
    });
    const attemptedQuestionIds =
      await this.prisma.userQuestionPerformance.findMany({
        where: { userId },
        select: { questionId: true },
        distinct: ['questionId'],
      });
    const attemptedSet = new Set(attemptedQuestionIds.map((a) => a.questionId));
    const newItemsCount = allQuestions.filter(
      (q) => !attemptedSet.has(q.id),
    ).length;

    // Get next review due date from questions
    const nextQuestionReview =
      await this.prisma.userQuestionPerformance.findFirst({
        where: {
          userId,
          nextReviewDue: {
            gt: now,
            not: null,
          },
        },
        orderBy: { nextReviewDue: 'asc' },
        select: { nextReviewDue: true },
      });

    const nextReview = nextQuestionReview?.nextReviewDue ?? undefined;

    // Estimate time (5 min per review, 3 min per new item)
    const estimatedTimeMinutes = dueReviews.length * 5 + newItemsCount * 3;

    return {
      dueReviews: dueReviews.length,
      newItemsAvailable: newItemsCount,
      nextReviewDue: nextReview,
      estimatedTimeMinutes,
    };
  }
}
