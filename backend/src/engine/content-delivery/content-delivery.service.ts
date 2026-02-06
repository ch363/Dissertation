import { Injectable } from '@nestjs/common';
import { DashboardPlanDto } from './types';
import { SessionPlanService } from './session-plan.service';
import { SessionPlanCacheService } from './session-plan-cache.service';
import { SessionPlanDto, SessionContext } from './session-types';
import { UserQuestionPerformanceRepository } from '../repositories';
import { QuestionRepository } from '../../questions/questions.repository';
import { TIME_ESTIMATES } from './session.config';

/**
 * ContentDeliveryService
 *
 * Orchestrates content delivery and session planning.
 * Follows Dependency Inversion Principle - depends on repository interfaces.
 */
@Injectable()
export class ContentDeliveryService {
  constructor(
    private userQuestionPerformanceRepo: UserQuestionPerformanceRepository,
    private questionRepository: QuestionRepository,
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

    // Get due review count using repository
    const dueQuestionCount =
      await this.userQuestionPerformanceRepo.countDueReviewsLatestPerQuestion(
        userId,
        now,
      );

    const dueReviews = Array(dueQuestionCount).fill({ dueAt: now });

    // Get all question IDs and attempted question IDs
    const allQuestionIds = await this.questionRepository.findAllIds();
    const attemptedQuestionIds =
      await this.userQuestionPerformanceRepo.findDistinctQuestionIdsByUser(
        userId,
      );

    const attemptedSet = new Set(attemptedQuestionIds);
    const newItemsCount = allQuestionIds.filter(
      (id) => !attemptedSet.has(id),
    ).length;

    // Get next review due date
    const nextReview =
      await this.userQuestionPerformanceRepo.findFirstNextReviewDue(
        userId,
        now,
      );

    // Convert seconds to minutes for time estimates
    const reviewTimeMinutes =
      (dueReviews.length * TIME_ESTIMATES.BY_DELIVERY_METHOD.MULTIPLE_CHOICE) / 60;
    const newItemTimeMinutes =
      (newItemsCount * TIME_ESTIMATES.TEACH_STEP_SECONDS) / 60;
    const estimatedTimeMinutes = Math.ceil(reviewTimeMinutes + newItemTimeMinutes);

    return {
      dueReviews: dueReviews.length,
      newItemsAvailable: newItemsCount,
      nextReviewDue: nextReview ?? undefined,
      estimatedTimeMinutes,
    };
  }
}
