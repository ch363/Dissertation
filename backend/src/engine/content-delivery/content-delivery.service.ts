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
import { DeliveryCandidate, NextDeliveryItemDto, DashboardPlanDto } from './types';
import { rankCandidates, mixReviewAndNew, pickOne, selectDeliveryMethod } from './selection.policy';

@Injectable()
export class ContentDeliveryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get the next item to deliver to the user.
   * @param userId User ID
   * @param opts Options including delivery mode
   * @returns Next delivery item DTO
   */
  async getNextItem(
    userId: string,
    opts?: { mode?: DeliveryMode; lessonId?: string },
  ): Promise<NextDeliveryItemDto | null> {
    const mode = opts?.mode || 'mixed';
    const now = new Date();

    // Get candidates based on mode
    let candidates: DeliveryCandidate[] = [];

    if (mode === 'review' || mode === 'mixed') {
      const reviewCandidates = await this.getReviewCandidates(userId, opts?.lessonId);
      candidates.push(...reviewCandidates);
    }

    if (mode === 'new' || mode === 'mixed') {
      const newCandidates = await this.getNewCandidates(userId, opts?.lessonId);
      candidates.push(...newCandidates);
    }

    // Separate reviews and new items
    const reviews = candidates.filter((c) => c.dueScore > 0);
    const newItems = candidates.filter((c) => c.dueScore === 0);

    // Apply selection policy
    let selected: DeliveryCandidate | null = null;

    if (mode === 'mixed' && reviews.length > 0 && newItems.length > 0) {
      const mixed = mixReviewAndNew(reviews, newItems, 0.7);
      selected = pickOne(mixed);
    } else if (reviews.length > 0) {
      selected = pickOne(reviews);
    } else if (newItems.length > 0) {
      selected = pickOne(newItems);
    }

    if (!selected) {
      return null;
    }

    // Get delivery method scores for user
    const methodScores = await this.getDeliveryMethodScores(userId, selected.deliveryMethods || []);

    // Build response
    return {
      kind: selected.kind,
      id: selected.id,
      teachingId: selected.teachingId,
      questionId: selected.questionId,
      lessonId: selected.lessonId,
      title: selected.title,
      prompt: selected.prompt,
      options: selected.options,
      deliveryMethods: selected.deliveryMethods,
      suggestedDeliveryMethod: selectDeliveryMethod(selected.deliveryMethods || [], methodScores),
      rationale: this.buildRationale(selected, mode),
    };
  }

  /**
   * Get dashboard plan showing upcoming items and stats.
   */
  async getDashboardPlan(userId: string): Promise<DashboardPlanDto> {
    const now = new Date();

    // Count due reviews from UserQuestionPerformance
    const dueQuestionCount = await this.prisma.userQuestionPerformance.count({
      where: {
        userId,
        nextReviewDue: {
          lte: now,
          not: null,
        },
      },
      distinct: ['questionId'],
    });

    const dueReviews = Array(dueQuestionCount).fill({ dueAt: now });

    // Count new items (questions not yet attempted)
    const allQuestions = await this.prisma.question.findMany({
      select: { id: true },
    });
    const attemptedQuestionIds = await this.prisma.userQuestionPerformance.findMany({
      where: { userId },
      select: { questionId: true },
      distinct: ['questionId'],
    });
    const attemptedSet = new Set(attemptedQuestionIds.map((a) => a.questionId));
    const newItemsCount = allQuestions.filter((q) => !attemptedSet.has(q.id)).length;

    // Get next review due date from questions
    const nextQuestionReview = await this.prisma.userQuestionPerformance.findFirst({
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

    const nextReview = nextQuestionReview?.nextReviewDue;

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
    const allDuePerformances = await this.prisma.userQuestionPerformance.findMany({
      where: questionWhere,
      orderBy: { createdAt: 'desc' },
    });

    // Dedupe by questionId - keep latest per question
    const questionIdMap = new Map<string, typeof allDuePerformances[0]>();
    for (const perf of allDuePerformances) {
      const existing = questionIdMap.get(perf.questionId);
      if (!existing || perf.createdAt > existing.createdAt) {
        questionIdMap.set(perf.questionId, perf);
      }
    }

    // Process due questions
    for (const perf of questionIdMap.values()) {
      const candidate = await this.buildQuestionCandidate(
        userId,
        perf.questionId,
        perf.nextReviewDue || now,
      );
      if (candidate) {
        candidate.dueScore = this.calculateDueScore(perf.nextReviewDue || now, now);
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
        teaching: {
          include: {
            lesson: true,
          },
        },
        questionDeliveryMethods: true,
      },
    });

    const attemptedQuestionIds = await this.prisma.userQuestionPerformance.findMany({
      where: { userId },
      select: { questionId: true },
      distinct: ['questionId'],
    });
    const attemptedSet = new Set(attemptedQuestionIds.map((a) => a.questionId));

    for (const question of allQuestions) {
      if (!attemptedSet.has(question.id)) {
        const candidate: DeliveryCandidate = {
          kind: 'question',
          id: question.id,
          questionId: question.id,
          teachingId: question.teachingId,
          lessonId: question.teaching.lessonId,
          dueScore: 0,
          errorScore: 0,
          timeSinceLastSeen: Infinity,
          deliveryMethods: question.questionDeliveryMethods.map((qdm) => qdm.deliveryMethod),
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
        teaching: {
          include: {
            lesson: true,
          },
        },
        questionDeliveryMethods: true,
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

    return {
      kind: 'question',
      id: question.id,
      questionId: question.id,
      teachingId: question.teachingId,
      lessonId: question.teaching.lessonId,
      dueScore: 0, // Will be set by caller
      errorScore,
      timeSinceLastSeen,
      deliveryMethods: question.questionDeliveryMethods.map((qdm) => qdm.deliveryMethod),
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
  private buildRationale(candidate: DeliveryCandidate, mode: DeliveryMode): string {
    if (candidate.dueScore > 0) {
      return 'Due review found';
    }
    if (mode === 'new') {
      return 'New content selected';
    }
    return 'Next item to practice';
  }
}
