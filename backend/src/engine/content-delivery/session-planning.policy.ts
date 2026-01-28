/**
 * Pure session planning policy functions.
 * These functions have no dependencies on NestJS or Prisma - they are pure algorithms.
 */

import { DELIVERY_METHOD } from '@prisma/client';
import { DeliveryCandidate } from './types';
import { UserTimeAverages } from './session-types';

/**
 * Calculate how many items can fit in the time budget.
 * @param timeBudgetSec Time budget in seconds
 * @param avgTimePerItem Average time per item in seconds
 * @param bufferRatio Buffer ratio (0-1) to account for variability (default: 0.2 = 20%)
 * @returns Number of items that fit in budget
 */
export function calculateItemCount(
  timeBudgetSec: number,
  avgTimePerItem: number,
  bufferRatio: number = 0.2,
): number {
  if (avgTimePerItem <= 0) {
    return 10; // Default fallback
  }

  const effectiveBudget = timeBudgetSec * (1 - bufferRatio);
  const count = Math.floor(effectiveBudget / avgTimePerItem);
  return Math.max(1, Math.min(count, 50)); // Clamp between 1 and 50
}

/**
 * Interleave items across groups to ensure variety.
 * @param items Array of items to interleave
 * @param getGroupKey Function to get group key for an item
 * @returns Interleaved array
 */
export function interleaveItems<T>(
  items: T[],
  getGroupKey: (item: T) => string,
): T[] {
  // Group items by key
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = getGroupKey(item);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  }

  // Interleave: take one from each group in round-robin fashion
  const interleaved: T[] = [];
  const groupArrays = Array.from(groups.values());
  const maxLength = Math.max(...groupArrays.map((g) => g.length));

  for (let i = 0; i < maxLength; i++) {
    for (const group of groupArrays) {
      if (i < group.length) {
        interleaved.push(group[i]);
      }
    }
  }

  return interleaved;
}

/**
 * Select adaptive modality (delivery method) for an item.
 * Favors methods that the user performs best on (higher scores).
 * Uses weighted selection to strongly favor best-performing methods while
 * still allowing occasional variety for exploration.
 * 
 * @param item The item to select modality for
 * @param availableMethods Available delivery methods for the item
 * @param userPreferences Map of delivery method to preference score (0-1)
 * @param context Context for selection (e.g., previous methods used)
 * @returns Selected delivery method
 */
export function selectModality(
  item: DeliveryCandidate,
  availableMethods: DELIVERY_METHOD[],
  userPreferences: Map<DELIVERY_METHOD, number>,
  context?: {
    recentMethods?: DELIVERY_METHOD[];
    avoidRepetition?: boolean;
  },
): DELIVERY_METHOD | undefined {
  if (availableMethods.length === 0) {
    return undefined;
  }

  // If only one method available, return it
  if (availableMethods.length === 1) {
    return availableMethods[0];
  }

  // Score each available method based on user performance
  const methodScores = availableMethods.map((method) => {
    // Get user's performance score for this method (0-1 scale)
    // Higher scores mean the user performs better on this method
    const performanceScore = userPreferences.get(method) || 0.5; // Default to neutral
    
    return { method, score: performanceScore };
  });

  // Find the best-performing method
  const bestMethod = methodScores.reduce((best, current) => 
    current.score > best.score ? current : best
  );

  // Use weighted random selection that strongly favors higher scores
  // This allows best methods to be selected most of the time, but still
  // gives other methods a chance (about 15-20% of the time for exploration)
  
  // Calculate weights using exponential scaling to strongly favor higher scores
  // Score^4 makes the difference between 0.9 and 0.5 much more pronounced
  const weights = methodScores.map(({ method, score }) => ({
    method,
    weight: Math.pow(Math.max(0.1, score), 4), // Use score^4, minimum 0.1^4 to avoid zero weights
  }));

  // Calculate total weight for normalization
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);

  // Use weighted random selection: 85% of the time pick from weighted distribution,
  // 15% of the time pick randomly for exploration
  const useWeightedSelection = Math.random() < 0.85;

  if (useWeightedSelection) {
    // Weighted random selection
    let random = Math.random() * totalWeight;
    for (const { method, weight } of weights) {
      random -= weight;
      if (random <= 0) {
        return method;
      }
    }
    // Fallback (shouldn't happen, but just in case)
    return bestMethod.method;
  } else {
    // 15% exploration: randomly select from available methods
    // This ensures other methods still get a chance even if they have lower scores
    const randomIndex = Math.floor(Math.random() * availableMethods.length);
    return availableMethods[randomIndex];
  }
}

/**
 * Group items by topic (teaching or lesson).
 * @param items Items to group
 * @returns Map of topic key to items
 */
export function groupByTopic(
  items: DeliveryCandidate[],
): Map<string, DeliveryCandidate[]> {
  const groups = new Map<string, DeliveryCandidate[]>();

  for (const item of items) {
    // Use teachingId as primary key, fallback to lessonId
    const key = item.teachingId || item.lessonId || 'unknown';
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  }

  return groups;
}

/**
 * Estimate time for an item based on user history.
 * @param item Item to estimate time for
 * @param userHistory User's time averages
 * @param deliveryMethod Delivery method being used
 * @returns Estimated time in seconds
 */
export function estimateTime(
  item: DeliveryCandidate,
  userHistory: UserTimeAverages,
  deliveryMethod?: DELIVERY_METHOD,
): number {
  if (item.kind === 'teaching') {
    return userHistory.avgTimePerTeachSec || 30; // Default 30s for teaching
  }

  if (item.kind === 'question' && deliveryMethod) {
    const methodAvg = userHistory.avgTimeByDeliveryMethod.get(deliveryMethod);
    if (methodAvg) {
      return methodAvg;
    }
  }

  // Fallback to general practice average
  return userHistory.avgTimePerPracticeSec || 60; // Default 60s for practice
}

/**
 * Arrange items in teach-then-test sequence.
 * For each question, if its teaching hasn't been seen, add teaching before question.
 * @param teachings Array of teaching items
 * @param questions Array of question items
 * @param seenTeachingIds Set of teaching IDs already seen by user
 * @returns Ordered array with teachings before their questions
 */
export function planTeachThenTest(
  teachings: DeliveryCandidate[],
  questions: DeliveryCandidate[],
  seenTeachingIds: Set<string>,
): DeliveryCandidate[] {
  const sequence: DeliveryCandidate[] = [];
  const teachingMap = new Map<string, DeliveryCandidate>();

  // Index teachings by ID
  for (const teaching of teachings) {
    if (teaching.teachingId) {
      teachingMap.set(teaching.teachingId, teaching);
    }
  }

  // Process questions and add teachings if needed
  for (const question of questions) {
    if (question.teachingId) {
      const teaching = teachingMap.get(question.teachingId);
      // Add teaching if it exists, hasn't been seen, and not already in sequence
      if (
        teaching &&
        !seenTeachingIds.has(question.teachingId) &&
        !sequence.some((s) => s.id === teaching.id)
      ) {
        sequence.push(teaching);
      }
    }
    sequence.push(question);
  }

  return sequence;
}

/**
 * Calculate default time averages when user history is unavailable.
 * @returns Default time averages
 */
export function getDefaultTimeAverages(): UserTimeAverages {
  return {
    avgTimePerTeachSec: 30, // 30 seconds per teaching card
    avgTimePerPracticeSec: 60, // 60 seconds per practice item
    avgTimeByDeliveryMethod: new Map([
      [DELIVERY_METHOD.FLASHCARD, 20],
      [DELIVERY_METHOD.MULTIPLE_CHOICE, 30],
      [DELIVERY_METHOD.FILL_BLANK, 45],
      [DELIVERY_METHOD.TEXT_TRANSLATION, 60],
      [DELIVERY_METHOD.SPEECH_TO_TEXT, 90],
      [DELIVERY_METHOD.TEXT_TO_SPEECH, 90],
    ]),
    avgTimeByQuestionType: new Map(),
  };
}

/**
 * Mix items by delivery method to ensure variety.
 * @param items Items to mix
 * @returns Mixed array with variety across delivery methods
 */
export function mixByDeliveryMethod(
  items: DeliveryCandidate[],
): DeliveryCandidate[] {
  // Group by delivery method
  const byMethod = new Map<DELIVERY_METHOD, DeliveryCandidate[]>();
  const noMethod: DeliveryCandidate[] = [];

  for (const item of items) {
    if (item.deliveryMethods && item.deliveryMethods.length > 0) {
      // Use first available method as primary
      const method = item.deliveryMethods[0];
      if (!byMethod.has(method)) {
        byMethod.set(method, []);
      }
      byMethod.get(method)!.push(item);
    } else {
      noMethod.push(item);
    }
  }

  // Interleave across methods
  const methodArrays = Array.from(byMethod.values());
  const interleaved: DeliveryCandidate[] = [];
  const maxLength = Math.max(...methodArrays.map((a) => a.length), 0);

  for (let i = 0; i < maxLength; i++) {
    for (const methodArray of methodArrays) {
      if (i < methodArray.length) {
        interleaved.push(methodArray[i]);
      }
    }
  }

  // Append items with no delivery method
  interleaved.push(...noMethod);

  return interleaved;
}
