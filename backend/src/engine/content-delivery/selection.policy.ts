/**
 * Pure selection policy functions for content delivery.
 * These functions have no dependencies on NestJS or Prisma - they are pure algorithms.
 */

import { DeliveryCandidate, NextDeliveryItemDto } from './types';
import { DELIVERY_METHOD } from '@prisma/client';

/**
 * Rank candidates by their priority score.
 * Higher score = higher priority.
 */
export function rankCandidates(candidates: DeliveryCandidate[]): DeliveryCandidate[] {
  return candidates
    .map((candidate) => ({
      ...candidate,
      priorityScore: calculatePriorityScore(candidate),
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Calculate priority score for a candidate.
 * Factors:
 * - Due-ness (if due, high score)
 * - Recent errors (more errors = higher priority)
 * - Time since last seen (longer = higher priority for reviews)
 */
function calculatePriorityScore(candidate: DeliveryCandidate): number {
  // Due items get highest priority
  if (candidate.dueScore > 0) {
    return 1000 + candidate.dueScore + candidate.errorScore * 10;
  }
  
  // New items get base priority
  return candidate.errorScore * 5 + candidate.timeSinceLastSeen / 1000;
}

/**
 * Mix review and new items according to the specified ratio.
 * @param reviews Review candidates (due items)
 * @param newItems New item candidates
 * @param ratio Review ratio (0-1), e.g., 0.7 = 70% reviews
 * @returns Mixed array of candidates
 */
export function mixReviewAndNew(
  reviews: DeliveryCandidate[],
  newItems: DeliveryCandidate[],
  ratio: number = 0.7,
): DeliveryCandidate[] {
  const rankedReviews = rankCandidates(reviews);
  const rankedNew = rankCandidates(newItems);

  if (rankedReviews.length === 0) {
    return rankedNew;
  }
  if (rankedNew.length === 0) {
    return rankedReviews;
  }

  const mixed: DeliveryCandidate[] = [];
  const totalNeeded = Math.max(rankedReviews.length, rankedNew.length);
  const reviewCount = Math.floor(totalNeeded * ratio);
  const newCount = totalNeeded - reviewCount;

  // Add reviews
  for (let i = 0; i < reviewCount && i < rankedReviews.length; i++) {
    mixed.push(rankedReviews[i]);
  }

  // Add new items
  for (let i = 0; i < newCount && i < rankedNew.length; i++) {
    mixed.push(rankedNew[i]);
  }

  return mixed;
}

/**
 * Pick the single best candidate from a ranked list.
 */
export function pickOne(candidates: DeliveryCandidate[]): DeliveryCandidate | null {
  if (candidates.length === 0) {
    return null;
  }
  return rankCandidates(candidates)[0];
}

/**
 * Select delivery method from available options.
 * Prefers methods with higher scores.
 */
export function selectDeliveryMethod(
  availableMethods: DELIVERY_METHOD[],
  methodScores?: Map<DELIVERY_METHOD, number>,
): DELIVERY_METHOD | undefined {
  if (availableMethods.length === 0) {
    return undefined;
  }

  // Sort by score (highest first), fallback to first available
  const sorted = [...availableMethods].sort((a, b) => {
    const aScore = methodScores?.get(a) || 0;
    const bScore = methodScores?.get(b) || 0;
    return bScore - aScore;
  });

  return sorted[0];
}
