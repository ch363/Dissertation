import { Injectable } from '@nestjs/common';
import { DELIVERY_METHOD } from '@prisma/client';
import { LoggerService } from '../../common/logger';
import {
  SessionPlanDto,
  SessionContext,
  SessionStep,
  TeachStepItem,
  RecapStepItem,
  SessionMetadata,
  UserTimeAverages,
} from './session-types';
import { DeliveryCandidate } from './types';
import {
  calculateItemCount,
  composeWithInterleaving,
  estimateTime,
  planTeachThenTest,
  rankCandidates,
  selectModality,
} from './content-delivery.policy';
import { MasteryService } from '../mastery/mastery.service';
import { OnboardingPreferencesService } from '../../onboarding/onboarding-preferences.service';
import { CandidateService } from './candidate.service';
import { UserPerformanceService } from './user-performance.service';
import { ContentDataService } from './content-data.service';
import { StepBuilderService } from './step-builder.service';
import { ISessionPlanService } from '../../common/interfaces';

/**
 * SessionPlanService (Facade)
 *
 * Orchestrates session plan creation by delegating to focused services.
 * Implements ISessionPlanService interface for Dependency Inversion.
 *
 * SOLID Principles:
 * - Single Responsibility: Delegates to focused services
 * - Open/Closed: New features via new services, not modifying this facade
 * - Dependency Inversion: Depends on service abstractions
 */
@Injectable()
export class SessionPlanService implements ISessionPlanService {
  private readonly logger = new LoggerService(SessionPlanService.name);

  constructor(
    private masteryService: MasteryService,
    private onboardingPreferences: OnboardingPreferencesService,
    private candidateService: CandidateService,
    private userPerformance: UserPerformanceService,
    private contentData: ContentDataService,
    private stepBuilder: StepBuilderService,
  ) {}

  /**
   * Create a learning session plan for a user.
   */
  async createPlan(
    userId: string,
    context: SessionContext,
  ): Promise<SessionPlanDto> {
    const now = new Date();
    const sessionId = `session-${userId}-${Date.now()}`;

    // Get user preferences and performance data in parallel
    const [onboardingPrefs, userTimeAverages, seenTeachingIds, userPreferences] =
      await Promise.all([
        this.onboardingPreferences.getOnboardingPreferences(userId),
        this.userPerformance.getUserAverageTimes(userId),
        this.getSeenTeachingIds(userId),
        this.userPerformance.getDeliveryMethodScores(userId),
      ]);

    const challengeWeight = onboardingPrefs.challengeWeight;

    // Determine effective time budget
    let effectiveTimeBudgetSec = context.timeBudgetSec;
    if (!effectiveTimeBudgetSec && onboardingPrefs.sessionMinutes) {
      effectiveTimeBudgetSec = onboardingPrefs.sessionMinutes * 60;
    }

    // Calculate target item count
    const avgTimePerItem =
      (userTimeAverages.avgTimePerTeachSec +
        userTimeAverages.avgTimePerPracticeSec) /
      2;
    let targetItemCount = effectiveTimeBudgetSec
      ? calculateItemCount(effectiveTimeBudgetSec, avgTimePerItem)
      : 15;

    // Get prioritized skills for personalization
    const prioritizedSkills = await this.masteryService.getLowMasterySkills(
      userId,
      0.5,
    );

    // Get candidates using CandidateService
    const [reviewCandidates, newCandidates] = await Promise.all([
      this.candidateService.getReviewCandidates(userId, {
        lessonId: context.lessonId,
        moduleId: context.moduleId,
      }),
      this.candidateService.getNewCandidates(userId, {
        lessonId: context.lessonId,
        moduleId: context.moduleId,
        prioritizedSkills,
      }),
    ]);

    // Select candidates based on session mode
    const selectedCandidates = this.selectCandidates(
      context.mode,
      reviewCandidates,
      newCandidates,
      prioritizedSkills,
      challengeWeight,
      targetItemCount,
    );

    // Adjust target for review mode
    if (context.mode === 'review' && selectedCandidates.length > 1) {
      const minReviewCount = Math.min(10, selectedCandidates.length);
      targetItemCount = Math.max(targetItemCount, minReviewCount);
    }

    const finalSelected = selectedCandidates.slice(0, targetItemCount);

    // Get teaching candidates for new questions
    const newQuestions = finalSelected.filter(
      (c) => c.kind === 'question' && c.dueScore === 0,
    );
    const reviews = finalSelected.filter((c) => c.dueScore > 0);

    const teachingCandidates = await this.contentData.getTeachingCandidates(
      userId,
      newQuestions,
      seenTeachingIds,
      context.lessonId,
      context.moduleId,
    );

    // Compose final candidate sequence
    const finalCandidates = this.composeCandidateSequence(
      context.mode,
      finalSelected,
      teachingCandidates,
      newQuestions,
      reviews,
      seenTeachingIds,
    );

    // Build session steps using StepBuilderService
    const steps = await this.buildSteps(
      finalCandidates,
      userTimeAverages,
      userPreferences,
      context,
    );

    // Calculate metadata
    const totalEstimatedTime = steps.reduce(
      (sum, step) => sum + step.estimatedTimeSec,
      0,
    );
    const potentialXp = steps.filter((s) => s.type === 'practice').length * 15;

    // Add recap step
    const recapItem: RecapStepItem = {
      type: 'recap',
      summary: {
        totalItems: steps.length,
        correctCount: 0,
        accuracy: 0,
        timeSpentSec: 0,
        xpEarned: potentialXp,
        streakDays: undefined,
      },
    };

    steps.push({
      stepNumber: steps.length + 1,
      type: 'recap',
      item: recapItem,
      estimatedTimeSec: 10,
    });

    // Build metadata
    const metadata: SessionMetadata = {
      totalEstimatedTimeSec: totalEstimatedTime + 10,
      totalSteps: steps.length,
      teachSteps: steps.filter((s) => s.type === 'teach').length,
      practiceSteps: steps.filter((s) => s.type === 'practice').length,
      recapSteps: 1,
      potentialXp,
      dueReviewsIncluded: reviewCandidates.length,
      newItemsIncluded: newCandidates.length,
      topicsCovered: this.extractTopicsCovered(finalCandidates),
      deliveryMethodsUsed: this.extractDeliveryMethodsUsed(steps),
    };

    return {
      id: sessionId,
      kind: this.getSessionKind(context.mode),
      lessonId: context.lessonId,
      title: this.stepBuilder.buildTitle(context),
      steps,
      metadata,
      createdAt: now,
    };
  }

  /**
   * Select candidates based on session mode.
   */
  private selectCandidates(
    mode: string,
    reviewCandidates: DeliveryCandidate[],
    newCandidates: DeliveryCandidate[],
    prioritizedSkills: string[],
    challengeWeight: number,
    targetItemCount: number,
  ): DeliveryCandidate[] {
    if (mode === 'review') {
      // Deduplicate review candidates
      const byId = new Map<string, DeliveryCandidate>();
      for (const c of reviewCandidates) {
        if (!byId.has(c.id)) byId.set(c.id, c);
      }
      return Array.from(byId.values());
    }

    if (mode === 'learn') {
      const rankedNew = rankCandidates(
        newCandidates,
        prioritizedSkills,
        challengeWeight,
      );
      const rankedReviews = rankCandidates(reviewCandidates, [], challengeWeight);

      if (rankedNew.length >= targetItemCount) {
        return rankedNew;
      }

      const newCount = rankedNew.length;
      const reviewCount = targetItemCount - newCount;
      return [...rankedNew, ...rankedReviews.slice(0, reviewCount)];
    }

    // Mixed mode
    const rankedReviews = rankCandidates(reviewCandidates, [], challengeWeight);
    const rankedNew = rankCandidates(
      newCandidates,
      prioritizedSkills,
      challengeWeight,
    );
    const reviewCount = Math.floor(targetItemCount * 0.7);
    const newCount = targetItemCount - reviewCount;
    return [
      ...rankedReviews.slice(0, reviewCount),
      ...rankedNew.slice(0, newCount),
    ];
  }

  /**
   * Compose the final candidate sequence with interleaving.
   */
  private composeCandidateSequence(
    mode: string,
    selectedCandidates: DeliveryCandidate[],
    teachingCandidates: DeliveryCandidate[],
    newQuestions: DeliveryCandidate[],
    reviews: DeliveryCandidate[],
    seenTeachingIds: Set<string>,
  ): DeliveryCandidate[] {
    if (mode === 'learn' || mode === 'mixed') {
      const teachingsForNew = teachingCandidates.filter((t) =>
        newQuestions.some((q) => q.teachingId === t.teachingId),
      );
      const teachThenTestSequence = planTeachThenTest(
        teachingsForNew,
        newQuestions,
        seenTeachingIds,
      );

      if (reviews.length > 0) {
        const interleavedReviews = composeWithInterleaving(reviews, {
          maxSameTypeInRow: 2,
          requireModalityCoverage: false,
          enableScaffolding: false,
          consecutiveErrors: 0,
        });
        return this.interleaveWithPairs(interleavedReviews, teachThenTestSequence);
      }

      return teachThenTestSequence;
    }

    return composeWithInterleaving(selectedCandidates, {
      maxSameTypeInRow: 2,
      requireModalityCoverage: true,
      enableScaffolding: true,
      consecutiveErrors: 0,
    });
  }

  /**
   * Build session steps from candidates.
   */
  private async buildSteps(
    candidates: DeliveryCandidate[],
    userTimeAverages: UserTimeAverages,
    userPreferences: Map<DELIVERY_METHOD, number>,
    context: SessionContext,
  ): Promise<SessionStep[]> {
    const steps: SessionStep[] = [];
    let stepNumber = 1;
    const recentMethods: DELIVERY_METHOD[] = [];

    for (const candidate of candidates) {
      if (candidate.kind === 'teaching') {
        const step = await this.buildTeachStep(
          candidate,
          stepNumber++,
          userTimeAverages,
        );
        if (step) steps.push(step);
      } else if (candidate.kind === 'question') {
        const step = await this.buildPracticeStep(
          candidate,
          stepNumber,
          userTimeAverages,
          userPreferences,
          recentMethods,
          context,
        );
        if (step) {
          steps.push(step);
          stepNumber++;
        }
      }
    }

    return steps;
  }

  /**
   * Build a teach step from a teaching candidate.
   */
  private async buildTeachStep(
    candidate: DeliveryCandidate,
    stepNumber: number,
    userTimeAverages: UserTimeAverages,
  ): Promise<SessionStep | null> {
    const teaching = await this.contentData.getTeachingData(candidate.id);
    if (!teaching) return null;

    const stepItem: TeachStepItem = {
      type: 'teach',
      teachingId: teaching.id,
      lessonId: teaching.lessonId,
      phrase: teaching.learningLanguageString,
      translation: teaching.userLanguageString,
      emoji: teaching.emoji || undefined,
      tip: teaching.tip || undefined,
      knowledgeLevel: teaching.knowledgeLevel,
    };

    return {
      stepNumber,
      type: 'teach',
      item: stepItem,
      estimatedTimeSec: estimateTime(candidate, userTimeAverages),
    };
  }

  /**
   * Build a practice step from a question candidate.
   */
  private async buildPracticeStep(
    candidate: DeliveryCandidate,
    stepNumber: number,
    userTimeAverages: UserTimeAverages,
    userPreferences: Map<DELIVERY_METHOD, number>,
    recentMethods: DELIVERY_METHOD[],
    context: SessionContext,
  ): Promise<SessionStep | null> {
    const question = await this.contentData.getQuestionData(candidate.id);
    if (
      !question ||
      !candidate.deliveryMethods ||
      candidate.deliveryMethods.length === 0
    ) {
      return null;
    }

    // Select delivery method
    const selectedMethod = selectModality(
      candidate,
      candidate.deliveryMethods,
      userPreferences,
      {
        recentMethods,
        avoidRepetition: true,
      },
    );

    if (!selectedMethod) return null;

    // Track recent methods
    recentMethods.push(selectedMethod);
    if (recentMethods.length > 5) {
      recentMethods.shift();
    }

    // Build step item using StepBuilderService
    const stepItem = await this.stepBuilder.buildPracticeStepItem(
      question,
      selectedMethod,
      candidate.teachingId || '',
      candidate.lessonId || context.lessonId || '',
    );

    return {
      stepNumber,
      type: 'practice',
      item: stepItem,
      estimatedTimeSec: estimateTime(candidate, userTimeAverages, selectedMethod),
      deliveryMethod: selectedMethod,
    };
  }

  /**
   * Get seen teaching IDs for a user.
   */
  private async getSeenTeachingIds(userId: string): Promise<Set<string>> {
    try {
      return await this.userPerformance.getSeenTeachingIds(userId);
    } catch {
      // Fallback if table doesn't exist
      return new Set();
    }
  }

  /**
   * Interleave reviews with teach-test pairs.
   */
  private interleaveWithPairs(
    reviews: DeliveryCandidate[],
    teachTestSequence: DeliveryCandidate[],
  ): DeliveryCandidate[] {
    const result: DeliveryCandidate[] = [];
    let reviewIndex = 0;

    const pairs: DeliveryCandidate[][] = [];
    for (let i = 0; i < teachTestSequence.length; i++) {
      const item = teachTestSequence[i];
      if (item.kind === 'teaching' && i + 1 < teachTestSequence.length) {
        const nextItem = teachTestSequence[i + 1];
        if (
          nextItem.kind === 'question' &&
          nextItem.teachingId === item.teachingId
        ) {
          pairs.push([item, nextItem]);
          i++;
          continue;
        }
      }
      pairs.push([item]);
    }

    let pairIndex = 0;
    while (pairIndex < pairs.length || reviewIndex < reviews.length) {
      if (pairIndex < pairs.length) {
        result.push(...pairs[pairIndex]);
        pairIndex++;
      }
      if (reviewIndex < reviews.length) {
        result.push(reviews[reviewIndex]);
        reviewIndex++;
      }
    }

    return result;
  }

  /**
   * Extract topics covered from candidates.
   */
  private extractTopicsCovered(candidates: DeliveryCandidate[]): string[] {
    return Array.from(
      new Set(
        candidates
          .map((c) => c.teachingId || c.lessonId || '')
          .filter(Boolean),
      ),
    );
  }

  /**
   * Extract delivery methods used from steps.
   */
  private extractDeliveryMethodsUsed(steps: SessionStep[]): DELIVERY_METHOD[] {
    return Array.from(
      new Set(
        steps
          .filter((s) => s.deliveryMethod)
          .map((s) => s.deliveryMethod as DELIVERY_METHOD),
      ),
    );
  }

  /**
   * Get session kind from mode.
   */
  private getSessionKind(mode: string): 'learn' | 'review' | 'mixed' {
    if (mode === 'review') return 'review';
    if (mode === 'learn') return 'learn';
    return 'mixed';
  }
}
