import { Injectable } from '@nestjs/common';
import { DeliveryCandidate } from './types';
import { rankCandidates } from './content-delivery.policy';
import { LoggerService } from '../../common/logger';
import { SELECTION } from './session.config';

export interface CandidateSelectionOptions {
  mode: string;
  prioritizedSkills: string[];
  challengeWeight: number;
  targetItemCount: number;
}

/**
 * CandidateSelectorService
 *
 * Responsible for selecting and ranking candidates based on session mode.
 * Follows Single Responsibility Principle - focused only on candidate selection.
 */
@Injectable()
export class CandidateSelectorService {
  private readonly logger = new LoggerService(CandidateSelectorService.name);

  /**
   * Select candidates based on session mode and preferences.
   *
   * @param reviewCandidates - Candidates due for review (SRS)
   * @param newCandidates - New candidates not yet attempted
   * @param options - Selection options including mode, skills, and target count
   */
  selectCandidates(
    reviewCandidates: DeliveryCandidate[],
    newCandidates: DeliveryCandidate[],
    options: CandidateSelectionOptions,
  ): DeliveryCandidate[] {
    const { mode, prioritizedSkills, challengeWeight, targetItemCount } = options;

    switch (mode) {
      case 'review':
        return this.selectReviewMode(reviewCandidates);

      case 'learn':
        return this.selectLearnMode(
          reviewCandidates,
          newCandidates,
          prioritizedSkills,
          challengeWeight,
          targetItemCount,
        );

      default:
        return this.selectMixedMode(
          reviewCandidates,
          newCandidates,
          prioritizedSkills,
          challengeWeight,
          targetItemCount,
        );
    }
  }

  /**
   * Review mode: only due reviews, deduplicated.
   */
  private selectReviewMode(
    reviewCandidates: DeliveryCandidate[],
  ): DeliveryCandidate[] {
    const byId = new Map<string, DeliveryCandidate>();
    for (const candidate of reviewCandidates) {
      if (!byId.has(candidate.id)) {
        byId.set(candidate.id, candidate);
      }
    }
    return Array.from(byId.values());
  }

  /**
   * Learn mode: prioritize new content, fill with reviews if needed.
   */
  private selectLearnMode(
    reviewCandidates: DeliveryCandidate[],
    newCandidates: DeliveryCandidate[],
    prioritizedSkills: string[],
    challengeWeight: number,
    targetItemCount: number,
  ): DeliveryCandidate[] {
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

  /**
   * Mixed mode: reviews and new content based on configured ratio.
   */
  private selectMixedMode(
    reviewCandidates: DeliveryCandidate[],
    newCandidates: DeliveryCandidate[],
    prioritizedSkills: string[],
    challengeWeight: number,
    targetItemCount: number,
  ): DeliveryCandidate[] {
    const rankedReviews = rankCandidates(reviewCandidates, [], challengeWeight);
    const rankedNew = rankCandidates(
      newCandidates,
      prioritizedSkills,
      challengeWeight,
    );
    const reviewCount = Math.floor(
      targetItemCount * SELECTION.MIXED_MODE_REVIEW_RATIO,
    );
    const newCount = targetItemCount - reviewCount;
    return [
      ...rankedReviews.slice(0, reviewCount),
      ...rankedNew.slice(0, newCount),
    ];
  }

  /**
   * Adjust target count for review mode.
   */
  adjustTargetForReviewMode(
    mode: string,
    selectedCount: number,
    currentTarget: number,
  ): number {
    if (mode === 'review' && selectedCount > 1) {
      const minReviewCount = Math.min(SELECTION.MIN_REVIEW_COUNT, selectedCount);
      return Math.max(currentTarget, minReviewCount);
    }
    return currentTarget;
  }
}
