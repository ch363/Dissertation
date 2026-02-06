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
  estimateTime,
  selectModality,
} from './content-delivery.policy';
import {
  SELECTION,
  TIME_ESTIMATES,
  REWARDS,
  MASTERY,
} from './session.config';
import { MasteryService } from '../mastery/mastery.service';
import { OnboardingPreferencesService } from '../../onboarding/onboarding-preferences.service';
import { CandidateService } from './candidate.service';
import { UserPerformanceService } from './user-performance.service';
import { ContentDataService } from './content-data.service';
import { StepBuilderService } from './step-builder.service';
import { CandidateSelectorService } from './candidate-selector.service';
import { SequenceComposerService } from './sequence-composer.service';
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
    private candidateSelector: CandidateSelectorService,
    private sequenceComposer: SequenceComposerService,
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
      : SELECTION.DEFAULT_TARGET_ITEM_COUNT;

    // Get prioritized skills for personalization
    const prioritizedSkills = await this.masteryService.getLowMasterySkills(
      userId,
      MASTERY.LOW_MASTERY_THRESHOLD,
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

    // Select candidates based on session mode using CandidateSelectorService
    const selectedCandidates = this.candidateSelector.selectCandidates(
      reviewCandidates,
      newCandidates,
      {
        mode: context.mode,
        prioritizedSkills,
        challengeWeight,
        targetItemCount,
      },
    );

    // Adjust target for review mode
    targetItemCount = this.candidateSelector.adjustTargetForReviewMode(
      context.mode,
      selectedCandidates.length,
      targetItemCount,
    );

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

    // Compose final candidate sequence using SequenceComposerService
    const finalCandidates = this.sequenceComposer.composeSequence(
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
    const potentialXp =
      steps.filter((s) => s.type === 'practice').length *
      REWARDS.XP_PER_PRACTICE_STEP;

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
      estimatedTimeSec: TIME_ESTIMATES.RECAP_STEP_SECONDS,
    });

    // Build metadata
    const metadata: SessionMetadata = {
      totalEstimatedTimeSec: totalEstimatedTime + TIME_ESTIMATES.RECAP_STEP_SECONDS,
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
