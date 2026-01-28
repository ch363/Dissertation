/**
 * Pure selection policy functions for content delivery.
 * These functions have no dependencies on NestJS or Prisma - they are pure algorithms.
 */

import { DeliveryCandidate } from './types';
import { DELIVERY_METHOD } from '@prisma/client';

/**
 * Rank candidates by their priority score.
 * Higher score = higher priority.
 *
 * @param candidates Array of delivery candidates
 * @param prioritizedSkills Optional array of skill tags to prioritize (low mastery skills)
 * @param challengeWeight Optional challenge weight from onboarding (0-1). Used to adjust difficulty preference.
 */
export function rankCandidates(
  candidates: DeliveryCandidate[],
  prioritizedSkills: string[] = [],
  challengeWeight: number = 0.5,
): DeliveryCandidate[] {
  return candidates
    .map((candidate) => ({
      ...candidate,
      priorityScore: calculatePriorityScore(
        candidate,
        prioritizedSkills,
        challengeWeight,
      ),
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Calculate priority score for a candidate.
 * Factors:
 * - Due-ness (if due, high score)
 * - Recent errors (more errors = higher priority)
 * - Time since last seen (longer = higher priority for reviews)
 * - Prioritized skills (low mastery skills get bonus priority for 'New' items)
 * - Challenge weight (from onboarding) adjusts difficulty preference
 *
 * @param candidate Delivery candidate
 * @param prioritizedSkills Array of skill tags to prioritize (low mastery skills)
 * @param challengeWeight Challenge weight from onboarding (0-1). Adjusts difficulty preference.
 */
function calculatePriorityScore(
  candidate: DeliveryCandidate,
  prioritizedSkills: string[] = [],
  challengeWeight: number = 0.5,
): number {
  // Due items get highest priority
  if (candidate.dueScore > 0) {
    return 1000 + candidate.dueScore + candidate.errorScore * 10;
  }

  // Check if this candidate matches any prioritized skills (for 'New' items)
  const hasPrioritizedSkill =
    prioritizedSkills.length > 0 &&
    candidate.skillTags?.some((tag) => prioritizedSkills.includes(tag));

  // Base priority for new items
  let basePriority =
    candidate.errorScore * 5 + candidate.timeSinceLastSeen / 1000;

  // Boost priority for low mastery skills (prioritize 'New' teachings)
  if (hasPrioritizedSkill) {
    basePriority += 500; // Significant boost to prioritize these items
  }

  // Apply challenge weight to adjust difficulty preference
  // challengeWeight: 0.25 (easy) -> boost easier items, 0.85 (hard) -> boost harder items
  const difficulty = candidate.difficulty ?? 0.5;
  if (challengeWeight < 0.4) {
    // Prefer easy: boost items with difficulty < 0.4
    if (difficulty < 0.4) {
      basePriority += 100;
    }
  } else if (challengeWeight > 0.7) {
    // Prefer hard: boost items with difficulty > 0.6
    if (difficulty > 0.6) {
      basePriority += 100;
    }
  }
  // Balanced (0.4-0.7): no adjustment

  return basePriority;
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
export function pickOne(
  candidates: DeliveryCandidate[],
): DeliveryCandidate | null {
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
 * 1. Error Scaffolding: If a SkillTag has 3+ errors (errorScore >= 3), inject a Review item
 *    with high mastery (dueScore > 0 AND estimatedMastery > 0.7) for that SkillTag
 * 2. SkillTag alternation is the PRIMARY variety metric (alternate between different SkillTags)
 * 3. Exercise type alternation is the SECONDARY variety metric (no more than N of the same type in a row)
 * 4. Inject "easy wins" after 2 consecutive errors (legacy scaffolding fallback)
 * 5. Ensure at least one listening/speaking per session if enabled
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
  const recentSkillTags: string[] = []; // Track recent SkillTags (primary variety metric)
  const usedModalities = new Set<DELIVERY_METHOD>(); // Track used delivery methods
  let errorStreak = consecutiveErrors;

  // Track error streaks per SkillTag using historical errorScore
  const skillTagErrorMap = new Map<string, number>();
  for (const candidate of candidates) {
    if (
      candidate.skillTags &&
      candidate.skillTags.length > 0 &&
      candidate.errorScore > 0
    ) {
      for (const skillTag of candidate.skillTags) {
        const currentErrorCount = skillTagErrorMap.get(skillTag) || 0;
        // Accumulate errorScore per SkillTag (errorScore represents recent errors)
        skillTagErrorMap.set(
          skillTag,
          Math.max(currentErrorCount, candidate.errorScore),
        );
      }
    }
  }

  // Separate candidates: Review items with high mastery vs regular candidates
  const reviewItemsHighMastery: DeliveryCandidate[] = [];
  const easyCandidates: DeliveryCandidate[] = [];
  const mediumCandidates: DeliveryCandidate[] = [];
  const hardCandidates: DeliveryCandidate[] = [];

  for (const candidate of candidates) {
    // Review items with high mastery: dueScore > 0 AND estimatedMastery > 0.7
    if (candidate.dueScore > 0 && (candidate.estimatedMastery ?? 0) > 0.7) {
      reviewItemsHighMastery.push(candidate);
    }

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
  // Prioritizes SkillTag alternation over exercise type alternation
  const findAlternative = (
    pool: DeliveryCandidate[],
    avoidType?: string,
    preferSkillTag?: string, // SkillTag to prefer (for scaffolding) or avoid (for alternation)
    requireSkillTag?: string, // Required SkillTag (for scaffolding)
    avoidSkillTags?: string[], // SkillTags to avoid (for alternation)
  ): DeliveryCandidate | null => {
    // Priority 1: If requiring a specific SkillTag (for scaffolding), find matching item
    if (requireSkillTag) {
      for (const candidate of pool) {
        if (used.has(candidate.id)) continue;
        if (violatesConstraints(candidate)) continue;
        if (candidate.skillTags?.includes(requireSkillTag)) {
          return candidate;
        }
      }
    }

    // Priority 2: Find item with different SkillTag (primary variety metric)
    if (avoidSkillTags && avoidSkillTags.length > 0) {
      for (const candidate of pool) {
        if (used.has(candidate.id)) continue;
        if (violatesConstraints(candidate)) continue;
        if (avoidType && candidate.exerciseType === avoidType) continue;

        // Check if candidate has different SkillTags
        const hasDifferentSkillTag = !candidate.skillTags?.some((tag) =>
          avoidSkillTags.includes(tag),
        );
        if (hasDifferentSkillTag) {
          return candidate;
        }
      }
    }

    // Priority 3: Find item with different exercise type (secondary variety metric)
    if (avoidType) {
      for (const candidate of pool) {
        if (used.has(candidate.id)) continue;
        if (violatesConstraints(candidate)) continue;
        if (candidate.exerciseType !== avoidType) {
          return candidate;
        }
      }
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

    // Rule 1: Error Scaffolding - inject Review item with high mastery if SkillTag has 3+ errors
    if (enableScaffolding) {
      // Find SkillTags that need scaffolding (errorScore >= 3)
      const skillTagsNeedingScaffolding: string[] = [];
      for (const [skillTag, errorCount] of skillTagErrorMap.entries()) {
        if (errorCount >= 3) {
          skillTagsNeedingScaffolding.push(skillTag);
        }
      }

      // If any SkillTag needs scaffolding, inject Review item with high mastery
      if (skillTagsNeedingScaffolding.length > 0) {
        // Try to find Review item with high mastery for the first SkillTag needing scaffolding
        const targetSkillTag = skillTagsNeedingScaffolding[0];
        selected = findAlternative(
          reviewItemsHighMastery,
          undefined,
          undefined,
          targetSkillTag, // requireSkillTag
        );

        if (selected) {
          // Reset error tracking for this SkillTag after injecting scaffold item
          skillTagErrorMap.set(targetSkillTag, 0);
        }
      }
    }

    // Rule 2: Legacy scaffolding - inject easy win after 2 consecutive errors (fallback)
    if (
      !selected &&
      enableScaffolding &&
      errorStreak >= 2 &&
      easyCandidates.length > 0
    ) {
      selected = findAlternative(easyCandidates);
      if (selected) {
        errorStreak = 0; // Reset error streak after easy win
      }
    }

    // Rule 3: Ensure modality coverage (listening/speaking)
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

    // Rule 4 & 5: Normal selection with SkillTag alternation (primary) and type alternation (secondary)
    if (!selected) {
      // Get recent SkillTags to avoid (for alternation)
      const recentUniqueSkillTags = Array.from(new Set(recentSkillTags));
      const lastExerciseType = recentTypes[recentTypes.length - 1];

      // Priority: Try to alternate SkillTags (primary variety metric)
      if (recentUniqueSkillTags.length > 0) {
        selected = findAlternative(
          remaining,
          lastExerciseType,
          undefined,
          undefined,
          recentUniqueSkillTags, // avoidSkillTags
        );
      }

      // Fallback: Try to alternate exercise type (secondary variety metric)
      if (!selected && lastExerciseType) {
        selected = findAlternative(remaining, lastExerciseType);
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

    // Update tracking - prioritize SkillTag history (primary variety metric)
    if (selected.skillTags && selected.skillTags.length > 0) {
      // Add all SkillTags from selected item
      for (const skillTag of selected.skillTags) {
        recentSkillTags.push(skillTag);
      }
      // Keep only last 5 unique SkillTags for alternation tracking
      // Remove duplicates while preserving order (keep last occurrence of each tag)
      const seen = new Set<string>();
      const deduplicated: string[] = [];
      // Process from end to beginning to keep last occurrence
      for (let i = recentSkillTags.length - 1; i >= 0; i--) {
        const tag = recentSkillTags[i];
        if (!seen.has(tag)) {
          seen.add(tag);
          deduplicated.unshift(tag); // Add to front to maintain chronological order
        }
      }
      // Keep only the last 5
      recentSkillTags.length = 0;
      recentSkillTags.push(...deduplicated.slice(-5));
    }

    // Update exercise type tracking (secondary variety metric)
    const exerciseType = selected.exerciseType || 'unknown';
    recentTypes.push(exerciseType);
    if (recentTypes.length > maxSameTypeInRow) {
      recentTypes.shift();
    }

    if (selected.deliveryMethods) {
      selected.deliveryMethods.forEach((m) => usedModalities.add(m));
    }

    // Remove from remaining
    remaining = remaining.filter((c) => c.id !== selected.id);

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
