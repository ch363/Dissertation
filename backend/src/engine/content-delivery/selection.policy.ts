/**
 * Pure selection policy functions for content delivery.
 * These functions have no dependencies on NestJS or Prisma - they are pure algorithms.
 */

import { DeliveryCandidate } from './types';
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

/**
 * Interleaving composer: applies constraint-based rules to ensure variety.
 * This is the "first-class" interleaving implementation (SR-04).
 * 
 * Rules:
 * 1. No more than N of the same exercise type in a row
 * 2. Alternate skills/tags where possible
 * 3. Inject 1-2 "easy wins" after 2 consecutive errors (scaffolding)
 * 4. Ensure at least one listening/speaking per session if enabled
 * 
 * @param candidates Ranked candidates to compose
 * @param options Interleaving options
 * @returns Composed sequence with interleaving constraints applied
 */
export interface InterleavingOptions {
  maxSameTypeInRow?: number; // Max consecutive items of same exercise type (default: 2)
  requireModalityCoverage?: boolean; // Require at least one listening/speaking (default: true)
  enableScaffolding?: boolean; // Inject easy wins after errors (default: true)
  consecutiveErrors?: number; // Track consecutive errors for scaffolding
}

export function composeWithInterleaving(
  candidates: DeliveryCandidate[],
  options: InterleavingOptions = {},
): DeliveryCandidate[] {
  const {
    maxSameTypeInRow = 2,
    requireModalityCoverage = true,
    enableScaffolding = true,
    consecutiveErrors = 0,
  } = options;

  if (candidates.length === 0) {
    return [];
  }

  const composed: DeliveryCandidate[] = [];
  const used = new Set<string>(); // Track used candidate IDs
  const recentTypes: string[] = []; // Track recent exercise types
  const recentSkills: string[] = []; // Track recent skills
  const usedModalities = new Set<DELIVERY_METHOD>(); // Track used delivery methods
  let errorStreak = consecutiveErrors;

  // Separate candidates by difficulty for scaffolding
  const easyCandidates: DeliveryCandidate[] = [];
  const mediumCandidates: DeliveryCandidate[] = [];
  const hardCandidates: DeliveryCandidate[] = [];

  for (const candidate of candidates) {
    const difficulty = candidate.difficulty ?? 0.5;
    const mastery = candidate.estimatedMastery ?? 0.5;
    // Easy = low difficulty OR high mastery
    if (difficulty < 0.3 || mastery > 0.7) {
      easyCandidates.push(candidate);
    } else if (difficulty > 0.7 || mastery < 0.3) {
      hardCandidates.push(candidate);
    } else {
      mediumCandidates.push(candidate);
    }
  }

  // Helper to check if candidate violates constraints
  const violatesConstraints = (candidate: DeliveryCandidate): boolean => {
    // Check same type in a row
    const exerciseType = candidate.exerciseType || 'unknown';
    const recentSameType = recentTypes.filter((t) => t === exerciseType).length;
    if (recentSameType >= maxSameTypeInRow) {
      return true;
    }

    return false;
  };

  // Helper to find best alternative that doesn't violate constraints
  const findAlternative = (
    pool: DeliveryCandidate[],
    avoidType?: string,
    preferSkill?: string,
  ): DeliveryCandidate | null => {
    // First, try to find one with different type and different skill
    for (const candidate of pool) {
      if (used.has(candidate.id)) continue;
      if (violatesConstraints(candidate)) continue;
      if (avoidType && candidate.exerciseType === avoidType) continue;

      // Prefer different skill if available
      if (preferSkill && candidate.skillTags?.includes(preferSkill)) {
        continue; // Skip if same skill
      }

      return candidate;
    }

    // Fallback: any that doesn't violate constraints
    for (const candidate of pool) {
      if (used.has(candidate.id)) continue;
      if (violatesConstraints(candidate)) continue;
      return candidate;
    }

    // Last resort: any unused candidate
    for (const candidate of pool) {
      if (used.has(candidate.id)) continue;
      return candidate;
    }

    return null;
  };

  // Main composition loop
  let remaining = [...candidates];
  let needsModalityCoverage = requireModalityCoverage;

  while (remaining.length > 0 || needsModalityCoverage) {
    let selected: DeliveryCandidate | null = null;

    // Rule 3: Scaffolding - inject easy win after 2 consecutive errors
    if (enableScaffolding && errorStreak >= 2 && easyCandidates.length > 0) {
      selected = findAlternative(easyCandidates);
      if (selected) {
        errorStreak = 0; // Reset error streak after easy win
      }
    }

    // Rule 4: Ensure modality coverage (listening/speaking)
    if (!selected && needsModalityCoverage) {
      const listeningSpeaking: DELIVERY_METHOD[] = [
        DELIVERY_METHOD.SPEECH_TO_TEXT,
        DELIVERY_METHOD.TEXT_TO_SPEECH,
      ];
      for (const candidate of remaining) {
        if (used.has(candidate.id)) continue;
        const hasListeningSpeaking = candidate.deliveryMethods?.some((m) =>
          listeningSpeaking.includes(m),
        );
        if (hasListeningSpeaking) {
          selected = candidate;
          needsModalityCoverage = false;
          break;
        }
      }
    }

    // Rule 1 & 2: Normal selection with type/skill alternation
    if (!selected) {
      // Try to alternate skills
      const lastSkill = recentSkills[recentSkills.length - 1];
      if (lastSkill) {
        // Try to find candidate with different skill
        selected = findAlternative(remaining, undefined, lastSkill);
      }

      // If no good alternative, pick best available
      if (!selected) {
        for (const candidate of remaining) {
          if (used.has(candidate.id)) continue;
          if (!violatesConstraints(candidate)) {
            selected = candidate;
            break;
          }
        }
      }

      // If still nothing, use first available (constraints relaxed)
      if (!selected) {
        for (const candidate of remaining) {
          if (used.has(candidate.id)) continue;
          selected = candidate;
          break;
        }
      }
    }

    if (!selected) {
      break; // No more candidates
    }

    // Add to composed sequence
    composed.push(selected);
    used.add(selected.id);

    // Update tracking
    const exerciseType = selected.exerciseType || 'unknown';
    recentTypes.push(exerciseType);
    if (recentTypes.length > maxSameTypeInRow) {
      recentTypes.shift();
    }

    if (selected.skillTags && selected.skillTags.length > 0) {
      recentSkills.push(...selected.skillTags);
      // Keep only last few skills
      if (recentSkills.length > 5) {
        recentSkills.splice(0, recentSkills.length - 5);
      }
    }

    if (selected.deliveryMethods) {
      selected.deliveryMethods.forEach((m) => usedModalities.add(m));
    }

    // Remove from remaining
    remaining = remaining.filter((c) => c.id !== selected!.id);

    // If we've covered modality, mark as done
    if (needsModalityCoverage) {
      const listeningSpeaking: DELIVERY_METHOD[] = [
        DELIVERY_METHOD.SPEECH_TO_TEXT,
        DELIVERY_METHOD.TEXT_TO_SPEECH,
      ];
      const hasCoverage = selected.deliveryMethods?.some((m) =>
        listeningSpeaking.includes(m),
      );
      if (hasCoverage) {
        needsModalityCoverage = false;
      }
    }
  }

  return composed;
}
