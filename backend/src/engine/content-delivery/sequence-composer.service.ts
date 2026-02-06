import { Injectable } from '@nestjs/common';
import { DeliveryCandidate } from './types';
import {
  composeWithInterleaving,
  planTeachThenTest,
} from './content-delivery.policy';
import { LoggerService } from '../../common/logger';

export interface InterleavingOptions {
  maxSameTypeInRow: number;
  requireModalityCoverage: boolean;
  enableScaffolding: boolean;
  consecutiveErrors: number;
}

/**
 * SequenceComposerService
 *
 * Responsible for composing and interleaving candidate sequences.
 * Follows Single Responsibility Principle - focused only on sequence composition.
 */
@Injectable()
export class SequenceComposerService {
  private readonly logger = new LoggerService(SequenceComposerService.name);

  /**
   * Compose the final candidate sequence based on session mode.
   *
   * @param mode - Session mode (learn, review, mixed)
   * @param selectedCandidates - All selected candidates
   * @param teachingCandidates - Teaching candidates for new content
   * @param newQuestions - New question candidates
   * @param reviews - Review candidates
   * @param seenTeachingIds - Set of already seen teaching IDs
   */
  composeSequence(
    mode: string,
    selectedCandidates: DeliveryCandidate[],
    teachingCandidates: DeliveryCandidate[],
    newQuestions: DeliveryCandidate[],
    reviews: DeliveryCandidate[],
    seenTeachingIds: Set<string>,
  ): DeliveryCandidate[] {
    if (mode === 'learn' || mode === 'mixed') {
      return this.composeLearnOrMixedSequence(
        teachingCandidates,
        newQuestions,
        reviews,
        seenTeachingIds,
      );
    }

    return this.composeReviewSequence(selectedCandidates);
  }

  /**
   * Compose sequence for learn or mixed mode.
   * Uses teach-then-test pattern for new content, interleaved with reviews.
   */
  private composeLearnOrMixedSequence(
    teachingCandidates: DeliveryCandidate[],
    newQuestions: DeliveryCandidate[],
    reviews: DeliveryCandidate[],
    seenTeachingIds: Set<string>,
  ): DeliveryCandidate[] {
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

  /**
   * Compose sequence for review mode.
   * Uses interleaving for variety and scaffolding.
   */
  private composeReviewSequence(
    candidates: DeliveryCandidate[],
  ): DeliveryCandidate[] {
    return composeWithInterleaving(candidates, {
      maxSameTypeInRow: 2,
      requireModalityCoverage: true,
      enableScaffolding: true,
      consecutiveErrors: 0,
    });
  }

  /**
   * Interleave reviews with teach-test pairs.
   * Ensures reviews are spread between new content introduction.
   */
  interleaveWithPairs(
    reviews: DeliveryCandidate[],
    teachTestSequence: DeliveryCandidate[],
  ): DeliveryCandidate[] {
    const result: DeliveryCandidate[] = [];
    let reviewIndex = 0;

    // Group teach-test into pairs
    const pairs = this.groupIntoPairs(teachTestSequence);

    // Interleave pairs with reviews
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
   * Group teach-test sequence into pairs.
   * A pair consists of a teaching followed by its associated question.
   */
  private groupIntoPairs(sequence: DeliveryCandidate[]): DeliveryCandidate[][] {
    const pairs: DeliveryCandidate[][] = [];

    for (let i = 0; i < sequence.length; i++) {
      const item = sequence[i];

      if (item.kind === 'teaching' && i + 1 < sequence.length) {
        const nextItem = sequence[i + 1];
        if (
          nextItem.kind === 'question' &&
          nextItem.teachingId === item.teachingId
        ) {
          pairs.push([item, nextItem]);
          i++; // Skip the next item since it's part of this pair
          continue;
        }
      }

      pairs.push([item]);
    }

    return pairs;
  }
}
