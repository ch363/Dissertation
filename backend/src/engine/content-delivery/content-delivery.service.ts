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

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DELIVERY_METHOD } from '@prisma/client';
import { DeliveryMode, ItemKind } from '../types';
import { DeliveryCandidate, DashboardPlanDto } from './types';
import {
  rankCandidates,
  mixReviewAndNew,
  pickOne,
  selectDeliveryMethod,
} from './selection.policy';
import { SessionPlanService } from './session-plan.service';
import { SessionPlanCacheService } from './session-plan-cache.service';
import { SessionPlanDto, SessionContext } from './session-types';
import { MasteryService } from '../mastery/mastery.service';

@Injectable()
export class ContentDeliveryService {
  constructor(
    private prisma: PrismaService,
    private sessionPlanService: SessionPlanService,
    private sessionPlanCache: SessionPlanCacheService,
    private masteryService: MasteryService,
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

  /**
   * Get review candidates (items that are due for review).
   */
  private async getReviewCandidates(
    userId: string,
    lessonId?: string,
  ): Promise<DeliveryCandidate[]> {
    const now = new Date();
    const candidates: DeliveryCandidate[] = [];

    // Get due questions from UserQuestionPerformance (source of truth for questions)
    // Get latest row per question where nextReviewDue <= now
    const questionWhere: any = {
      userId,
      nextReviewDue: {
        lte: now,
        not: null,
      },
    };

    if (lessonId) {
      const lessonQuestions = await this.prisma.question.findMany({
        where: {
          teaching: { lessonId },
        },
        select: { id: true },
      });
      questionWhere.questionId = { in: lessonQuestions.map((q) => q.id) };
    }

    // Get all due question performances, then dedupe to latest per question
    const allDuePerformances =
      await this.prisma.userQuestionPerformance.findMany({
        where: questionWhere,
        orderBy: { createdAt: 'desc' },
      });

    // Dedupe by questionId - keep latest per question
    const questionIdMap = new Map<string, (typeof allDuePerformances)[0]>();
    for (const perf of allDuePerformances) {
      const existing = questionIdMap.get(perf.questionId);
      if (!existing || perf.createdAt > existing.createdAt) {
        questionIdMap.set(perf.questionId, perf);
      }
    }

    // Process due questions
    for (const perf of Array.from(questionIdMap.values())) {
      const candidate = await this.buildQuestionCandidate(
        userId,
        perf.questionId,
        perf.nextReviewDue || now,
      );
      if (candidate) {
        candidate.dueScore = this.calculateDueScore(
          perf.nextReviewDue || now,
          now,
        );
        candidates.push(candidate);
      }
    }

    return candidates;
  }

  /**
   * Get new candidates (items not yet seen by user).
   */
  private async getNewCandidates(
    userId: string,
    lessonId?: string,
  ): Promise<DeliveryCandidate[]> {
    const candidates: DeliveryCandidate[] = [];

    // Get questions not yet attempted
    const whereClause: any = {};
    if (lessonId) {
      whereClause.teaching = { lessonId };
    }

    const allQuestions = await this.prisma.question.findMany({
      where: whereClause,
      include: {
        variants: {
          select: {
            deliveryMethod: true,
          },
        },
        teaching: {
          include: {
            lesson: true,
          },
        },
      },
    });

    const attemptedQuestionIds =
      await this.prisma.userQuestionPerformance.findMany({
        where: { userId },
        select: { questionId: true },
        distinct: ['questionId'],
      });
    const attemptedSet = new Set(attemptedQuestionIds.map((a) => a.questionId));

    for (const question of allQuestions) {
      if (!attemptedSet.has(question.id)) {
        const availableMethods: DELIVERY_METHOD[] =
          question.variants?.map((v) => v.deliveryMethod) ?? [];
        const candidate: DeliveryCandidate = {
          kind: 'question',
          id: question.id,
          questionId: question.id,
          teachingId: question.teachingId,
          lessonId: question.teaching.lessonId,
          dueScore: 0,
          errorScore: 0,
          timeSinceLastSeen: Infinity,
          deliveryMethods: availableMethods,
        };
        candidates.push(candidate);
      }
    }

    return candidates;
  }

  /**
   * Build a question candidate with metadata.
   */
  private async buildQuestionCandidate(
    userId: string,
    questionId: string,
    dueAt: Date,
  ): Promise<DeliveryCandidate | null> {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        variants: {
          select: {
            deliveryMethod: true,
          },
        },
        teaching: {
          include: {
            lesson: true,
          },
        },
      },
    });

    if (!question) {
      return null;
    }

    // Get recent errors
    const recentAttempts = await this.prisma.userQuestionPerformance.findMany({
      where: {
        userId,
        questionId,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const errorScore = recentAttempts.filter((a) => a.score < 80).length;
    const lastSeen = recentAttempts[0]?.createdAt || dueAt;
    const timeSinceLastSeen = Date.now() - lastSeen.getTime();

    const availableMethods: DELIVERY_METHOD[] =
      question.variants?.map((v) => v.deliveryMethod) ?? [];

    return {
      kind: 'question',
      id: question.id,
      questionId: question.id,
      teachingId: question.teachingId,
      lessonId: question.teaching.lessonId,
      dueScore: 0, // Will be set by caller
      errorScore,
      timeSinceLastSeen,
      deliveryMethods: availableMethods,
    };
  }

  /**
   * Calculate due score (higher = more overdue).
   */
  private calculateDueScore(dueAt: Date, now: Date): number {
    const overdueMs = now.getTime() - dueAt.getTime();
    return Math.max(0, overdueMs / (1000 * 60 * 60)); // Hours overdue
  }

  /**
   * Get delivery method scores for user.
   */
  private async getDeliveryMethodScores(
    userId: string,
    methods: DELIVERY_METHOD[],
  ): Promise<Map<DELIVERY_METHOD, number>> {
    const scores = await this.prisma.userDeliveryMethodScore.findMany({
      where: {
        userId,
        deliveryMethod: { in: methods },
      },
    });

    const map = new Map<DELIVERY_METHOD, number>();
    scores.forEach((s) => {
      map.set(s.deliveryMethod, s.score);
    });

    return map;
  }

  /**
   * Build rationale string for the selected item.
   */
  private buildRationale(
    candidate: DeliveryCandidate,
    mode: DeliveryMode,
  ): string {
    if (candidate.dueScore > 0) {
      return 'Due review found';
    }
    if (mode === 'new') {
      return 'New content selected';
    }
    return 'Next item to practice';
  }
}
