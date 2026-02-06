import { DELIVERY_METHOD } from '@prisma/client';
import { DeliveryCandidate } from './types';
import { UserTimeAverages } from './session-types';
import {
  InterleavingOrchestrator,
  InterleavingOrchestratorOptions,
} from './interleaving';
import {
  PRIORITY_SCORING,
  SELECTION,
  TIME_ESTIMATES,
} from './session.config';

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

function calculatePriorityScore(
  candidate: DeliveryCandidate,
  prioritizedSkills: string[] = [],
  challengeWeight: number = 0.5,
): number {
  if (candidate.dueScore > 0) {
    return (
      PRIORITY_SCORING.DUE_REVIEW_BASE_PRIORITY +
      candidate.dueScore +
      candidate.errorScore * PRIORITY_SCORING.DUE_ERROR_MULTIPLIER
    );
  }

  const hasPrioritizedSkill =
    prioritizedSkills.length > 0 &&
    candidate.skillTags?.some((tag) => prioritizedSkills.includes(tag));

  let basePriority =
    candidate.errorScore * PRIORITY_SCORING.NEW_ERROR_MULTIPLIER +
    candidate.timeSinceLastSeen / PRIORITY_SCORING.TIME_DIVISOR;

  if (hasPrioritizedSkill) {
    basePriority += PRIORITY_SCORING.PRIORITIZED_SKILL_BONUS;
  }

  const difficulty = candidate.difficulty ?? 0.5;
  if (challengeWeight < PRIORITY_SCORING.LOW_CHALLENGE_THRESHOLD) {
    if (difficulty < PRIORITY_SCORING.LOW_DIFFICULTY_THRESHOLD) {
      basePriority += PRIORITY_SCORING.DIFFICULTY_MATCH_BONUS;
    }
  } else if (challengeWeight > PRIORITY_SCORING.HIGH_CHALLENGE_THRESHOLD) {
    if (difficulty > PRIORITY_SCORING.HIGH_DIFFICULTY_THRESHOLD) {
      basePriority += PRIORITY_SCORING.DIFFICULTY_MATCH_BONUS;
    }
  }

  return basePriority;
}

/**
 * InterleavingOptions - Options for interleaving composition.
 * Re-exported for backward compatibility.
 */
export type InterleavingOptions = InterleavingOrchestratorOptions;

/**
 * Compose candidates with interleaving logic.
 *
 * This function delegates to InterleavingOrchestrator which breaks down
 * the complex logic into focused, testable components:
 * - CandidateClassifier: Groups by difficulty/mastery
 * - SkillErrorTracker: Tracks errors for scaffolding
 * - ConstraintValidator: Validates selection constraints
 * - AlternativeFinder: Finds alternative candidates
 *
 * @param candidates - Candidates to compose
 * @param options - Interleaving options
 * @returns Composed candidates in optimal order
 */
export function composeWithInterleaving(
  candidates: DeliveryCandidate[],
  options: InterleavingOptions = {},
): DeliveryCandidate[] {
  const orchestrator = new InterleavingOrchestrator();
  return orchestrator.compose(candidates, options);
}

export function calculateItemCount(
  timeBudgetSec: number,
  avgTimePerItem: number,
  bufferRatio: number = SELECTION.TIME_BUFFER_RATIO,
): number {
  if (avgTimePerItem <= 0) {
    return SELECTION.DEFAULT_TARGET_ITEM_COUNT;
  }

  const effectiveBudget = timeBudgetSec * (1 - bufferRatio);
  const count = Math.floor(effectiveBudget / avgTimePerItem);
  return Math.max(
    SELECTION.MIN_ITEMS_PER_SESSION,
    Math.min(count, SELECTION.MAX_ITEMS_PER_SESSION),
  );
}

/**
 * Generic interleaving utility for mixing items from different groups.
 * @internal Currently only used in unit tests - consider promoting to production if needed.
 */
export function interleaveItems<T>(
  items: T[],
  getGroupKey: (item: T) => string,
): T[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = getGroupKey(item);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  }

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

  if (availableMethods.length === 1) {
    return availableMethods[0];
  }

  const methodScores = availableMethods.map((method) => {
    const performanceScore = userPreferences.get(method) || 0.5;
    return { method, score: performanceScore };
  });

  const bestMethod = methodScores.reduce((best, current) =>
    current.score > best.score ? current : best,
  );

  const weights = methodScores.map(({ method, score }) => ({
    method,
    weight: Math.pow(Math.max(0.1, score), 4),
  }));

  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  const useWeightedSelection =
    Math.random() < SELECTION.WEIGHTED_SELECTION_PROBABILITY;

  if (useWeightedSelection) {
    let random = Math.random() * totalWeight;
    for (const { method, weight } of weights) {
      random -= weight;
      if (random <= 0) {
        return method;
      }
    }
    return bestMethod.method;
  } else {
    const randomIndex = Math.floor(Math.random() * availableMethods.length);
    return availableMethods[randomIndex];
  }
}

/**
 * Groups delivery candidates by topic (teaching or lesson).
 * @internal Currently only used in unit tests - consider promoting to production if needed.
 */
export function groupByTopic(
  items: DeliveryCandidate[],
): Map<string, DeliveryCandidate[]> {
  const groups = new Map<string, DeliveryCandidate[]>();

  for (const item of items) {
    const key = item.teachingId || item.lessonId || 'unknown';
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  }

  return groups;
}

export function estimateTime(
  item: DeliveryCandidate,
  userHistory: UserTimeAverages,
  deliveryMethod?: DELIVERY_METHOD,
): number {
  if (item.kind === 'teaching') {
    return userHistory.avgTimePerTeachSec || TIME_ESTIMATES.TEACH_STEP_SECONDS;
  }

  if (item.kind === 'question' && deliveryMethod) {
    const methodAvg = userHistory.avgTimeByDeliveryMethod.get(deliveryMethod);
    if (methodAvg) {
      return methodAvg;
    }
  }

  return userHistory.avgTimePerPracticeSec || TIME_ESTIMATES.PRACTICE_STEP_SECONDS;
}

export function planTeachThenTest(
  teachings: DeliveryCandidate[],
  questions: DeliveryCandidate[],
  seenTeachingIds: Set<string>,
): DeliveryCandidate[] {
  const sequence: DeliveryCandidate[] = [];
  const teachingMap = new Map<string, DeliveryCandidate>();

  for (const teaching of teachings) {
    if (teaching.teachingId) {
      teachingMap.set(teaching.teachingId, teaching);
    }
  }

  for (const question of questions) {
    if (question.teachingId) {
      const teaching = teachingMap.get(question.teachingId);
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

export function getDefaultTimeAverages(): UserTimeAverages {
  return {
    avgTimePerTeachSec: TIME_ESTIMATES.TEACH_STEP_SECONDS,
    avgTimePerPracticeSec: TIME_ESTIMATES.PRACTICE_STEP_SECONDS,
    avgTimeByDeliveryMethod: new Map(
      Object.entries(TIME_ESTIMATES.BY_DELIVERY_METHOD) as [
        DELIVERY_METHOD,
        number,
      ][],
    ),
    avgTimeByQuestionType: new Map(),
  };
}

/**
 * Mixes items by delivery method for variety.
 * @internal Currently only used in unit tests - consider promoting to production if needed.
 */
export function mixByDeliveryMethod(
  items: DeliveryCandidate[],
): DeliveryCandidate[] {
  const byMethod = new Map<DELIVERY_METHOD, DeliveryCandidate[]>();
  const noMethod: DeliveryCandidate[] = [];

  for (const item of items) {
    if (item.deliveryMethods && item.deliveryMethods.length > 0) {
      const method = item.deliveryMethods[0];
      if (!byMethod.has(method)) {
        byMethod.set(method, []);
      }
      byMethod.get(method)!.push(item);
    } else {
      noMethod.push(item);
    }
  }

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

  interleaved.push(...noMethod);
  return interleaved;
}
