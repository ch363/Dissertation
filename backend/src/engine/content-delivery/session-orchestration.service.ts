import { Injectable } from '@nestjs/common';
import { DELIVERY_METHOD } from '@prisma/client';
import { SessionPlanDto, SessionContext } from './session-types';
import { UserPerformanceService } from './user-performance.service';
import { ContentDataService } from './content-data.service';
import { StepBuilderService } from './step-builder.service';
import { CandidateService } from './candidate.service';
import { MasteryService } from '../mastery/mastery.service';
import { OnboardingPreferencesService } from '../../onboarding/onboarding-preferences.service';
import {
  calculateItemCount,
  rankCandidates,
  selectModality,
} from './content-delivery.policy';
import { LoggerService } from '../../common/logger';

/**
 * SessionOrchestrationService
 * 
 * High-level orchestration of session plan creation.
 * Follows Single Responsibility Principle - focused on workflow coordination.
 * 
 * Delegates to:
 * - UserPerformanceService: user data
 * - ContentDataService: content retrieval
 * - StepBuilderService: step construction
 * - CandidateService: candidate selection
 */
@Injectable()
export class SessionOrchestrationService {
  private readonly logger = new LoggerService(SessionOrchestrationService.name);

  constructor(
    private userPerformance: UserPerformanceService,
    private contentData: ContentDataService,
    private stepBuilder: StepBuilderService,
    private candidateService: CandidateService,
    private masteryService: MasteryService,
    private onboardingPreferences: OnboardingPreferencesService,
  ) {}

  /**
   * Create a session plan for a user given a context.
   * Orchestrates the entire planning process.
   */
  async createPlan(
    userId: string,
    context: SessionContext,
  ): Promise<SessionPlanDto> {
    const sessionId = `session-${userId}-${Date.now()}`;

    // Get user preferences and performance data
    const [onboardingPrefs, userTimeAverages, seenTeachingIds, deliveryScores] =
      await Promise.all([
        this.onboardingPreferences.getOnboardingPreferences(userId),
        this.userPerformance.getUserAverageTimes(userId),
        this.userPerformance.getSeenTeachingIds(userId),
        this.userPerformance.getDeliveryMethodScores(userId),
      ]);

    const challengeWeight = onboardingPrefs.challengeWeight;

    // Determine time budget
    let effectiveTimeBudgetSec = context.timeBudgetSec;
    if (!effectiveTimeBudgetSec && onboardingPrefs.sessionMinutes) {
      effectiveTimeBudgetSec = onboardingPrefs.sessionMinutes * 60;
    }

    // Calculate target item count
    const avgTimePerItem =
      (userTimeAverages.avgTimePerTeachSec +
        userTimeAverages.avgTimePerPracticeSec) /
      2;
    const targetItemCount = effectiveTimeBudgetSec
      ? calculateItemCount(effectiveTimeBudgetSec, avgTimePerItem)
      : 15;

    // Get prioritized skills
    const prioritizedSkills = await this.masteryService.getLowMasterySkills(
      userId,
      0.5,
    );

    // Get candidates based on mode
    const reviewCandidates = await this.candidateService.getReviewCandidates(
      userId,
      {
        lessonId: context.lessonId,
        moduleId: context.moduleId,
      },
    );

    const newCandidates = await this.candidateService.getNewCandidates(userId, {
      lessonId: context.lessonId,
      moduleId: context.moduleId,
      prioritizedSkills,
    });

    // Select candidates based on mode
    let selectedCandidates = [];
    if (context.mode === 'review') {
      selectedCandidates = this.deduplicateCandidates(reviewCandidates);
    } else if (context.mode === 'learn') {
      const rankedNew = rankCandidates(newCandidates, prioritizedSkills);
      selectedCandidates = rankedNew.slice(0, targetItemCount);
    } else {
      // Mixed mode
      const rankedReview = rankCandidates(reviewCandidates, prioritizedSkills);
      const rankedNew = rankCandidates(newCandidates, prioritizedSkills);
      const reviewCount = Math.floor(targetItemCount * 0.3);
      const newCount = targetItemCount - reviewCount;
      selectedCandidates = [
        ...rankedReview.slice(0, reviewCount),
        ...rankedNew.slice(0, newCount),
      ];
    }

    // Build steps from candidates
    const steps = [];
    for (const candidate of selectedCandidates) {
      if (candidate.kind === 'teaching') {
        steps.push({
          type: 'teach',
          teachingId: candidate.id,
          lessonId: candidate.lessonId || context.lessonId,
        });
      } else {
        // Select delivery method
        const deliveryMethod = selectModality(
          candidate,
          deliveryScores,
          challengeWeight,
        );

        // Get question data
        const question = await this.contentData.getQuestionData(candidate.id);

        if (question) {
          const practiceItem = await this.stepBuilder.buildPracticeStepItem(
            question,
            deliveryMethod,
            candidate.teachingId || '',
            candidate.lessonId || context.lessonId || '',
          );
          steps.push(practiceItem);
        }
      }
    }

    // Build session plan
    const title = this.stepBuilder.buildTitle(context);

    return {
      id: sessionId,
      title,
      steps,
      metadata: {
        mode: context.mode || 'mixed',
        timeBudgetSec: effectiveTimeBudgetSec,
        targetItemCount,
        actualItemCount: steps.length,
      },
    };
  }

  private deduplicateCandidates(candidates: any[]) {
    const byId = new Map();
    for (const c of candidates) {
      if (!byId.has(c.id)) byId.set(c.id, c);
    }
    return Array.from(byId.values());
  }
}
