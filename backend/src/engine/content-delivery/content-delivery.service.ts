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

  async getSessionPlan(
    userId: string,
    context: SessionContext,
  ): Promise<SessionPlanDto> {
    const cacheKey = this.sessionPlanCache.generateKey(
      userId,
      context.mode,
      context.lessonId,
      context.moduleId,
      context.timeBudgetSec,
    );

    const cachedPlan = this.sessionPlanCache.get(cacheKey);
    if (cachedPlan) {
      return cachedPlan;
    }

    const plan = await this.sessionPlanService.createPlan(userId, context);

    this.sessionPlanCache.set(cacheKey, plan);

    return plan;
  }

  /**
   * Dashboard plan uses "latest per question" for due count so it matches
   * getDueReviewCount and review session plans (questions disappear after
   * completion).
   */
  async getDashboardPlan(userId: string): Promise<DashboardPlanDto> {
    const now = new Date();

    type Row = { count: bigint };
    const dueResult = await this.prisma.$queryRaw<Row[]>`
      SELECT COUNT(*) AS count FROM (
        SELECT question_id, next_review_due,
               ROW_NUMBER() OVER (PARTITION BY question_id ORDER BY created_at DESC) AS rn
        FROM user_question_performance
        WHERE user_id = ${userId}::uuid
      ) sub
      WHERE rn = 1 AND next_review_due IS NOT NULL AND next_review_due <= ${now}
    `;
    const dueQuestionCount = Number(dueResult[0]?.count ?? 0);

    const dueReviews = Array(dueQuestionCount).fill({ dueAt: now });

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

    const estimatedTimeMinutes = dueReviews.length * 5 + newItemsCount * 3;

    return {
      dueReviews: dueReviews.length,
      newItemsAvailable: newItemsCount,
      nextReviewDue: nextReview,
      estimatedTimeMinutes,
    };
  }
}
