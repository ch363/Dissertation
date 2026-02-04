import { DELIVERY_METHOD } from '@prisma/client';
import { classifyDifficulty } from './difficulty-calculator.service';
import { DeliveryCandidate } from './types';
import { UserTimeAverages } from './session-types';

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
    return 1000 + candidate.dueScore + candidate.errorScore * 10;
  }

  const hasPrioritizedSkill =
    prioritizedSkills.length > 0 &&
    candidate.skillTags?.some((tag) => prioritizedSkills.includes(tag));

  let basePriority =
    candidate.errorScore * 5 + candidate.timeSinceLastSeen / 1000;

  if (hasPrioritizedSkill) {
    basePriority += 500;
  }

  const difficulty = candidate.difficulty ?? 0.5;
  if (challengeWeight < 0.4) {
    if (difficulty < 0.4) {
      basePriority += 100;
    }
  } else if (challengeWeight > 0.7) {
    if (difficulty > 0.6) {
      basePriority += 100;
    }
  }

  return basePriority;
}

export interface InterleavingOptions {
  maxSameTypeInRow?: number;
  requireModalityCoverage?: boolean;
  enableScaffolding?: boolean;
  consecutiveErrors?: number;
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
  const used = new Set<string>();
  const recentTypes: string[] = [];
  const recentSkillTags: string[] = [];
  const usedModalities = new Set<DELIVERY_METHOD>();
  let errorStreak = consecutiveErrors;

  const skillTagErrorMap = new Map<string, number>();
  for (const candidate of candidates) {
    if (
      candidate.skillTags &&
      candidate.skillTags.length > 0 &&
      candidate.errorScore > 0
    ) {
      for (const skillTag of candidate.skillTags) {
        const currentErrorCount = skillTagErrorMap.get(skillTag) || 0;
        skillTagErrorMap.set(
          skillTag,
          Math.max(currentErrorCount, candidate.errorScore),
        );
      }
    }
  }

  const reviewItemsHighMastery: DeliveryCandidate[] = [];
  const easyCandidates: DeliveryCandidate[] = [];
  const mediumCandidates: DeliveryCandidate[] = [];
  const hardCandidates: DeliveryCandidate[] = [];

  for (const candidate of candidates) {
    if (candidate.dueScore > 0 && (candidate.estimatedMastery ?? 0) > 0.7) {
      reviewItemsHighMastery.push(candidate);
    }

    const difficulty = candidate.difficulty ?? 0.5;
    const mastery = candidate.estimatedMastery ?? 0.5;
    const band = classifyDifficulty(difficulty, mastery);
    if (band === 'easy') {
      easyCandidates.push(candidate);
    } else if (band === 'hard') {
      hardCandidates.push(candidate);
    } else {
      mediumCandidates.push(candidate);
    }
  }

  const violatesConstraints = (candidate: DeliveryCandidate): boolean => {
    const exerciseType = candidate.exerciseType || 'unknown';
    const recentSameType = recentTypes.filter((t) => t === exerciseType).length;
    if (recentSameType >= maxSameTypeInRow) {
      return true;
    }
    return false;
  };

  const findAlternative = (
    pool: DeliveryCandidate[],
    avoidType?: string,
    preferSkillTag?: string,
    requireSkillTag?: string,
    avoidSkillTags?: string[],
  ): DeliveryCandidate | null => {
    if (requireSkillTag) {
      for (const candidate of pool) {
        if (used.has(candidate.id)) continue;
        if (violatesConstraints(candidate)) continue;
        if (candidate.skillTags?.includes(requireSkillTag)) {
          return candidate;
        }
      }
    }

    if (avoidSkillTags && avoidSkillTags.length > 0) {
      for (const candidate of pool) {
        if (used.has(candidate.id)) continue;
        if (violatesConstraints(candidate)) continue;
        if (avoidType && candidate.exerciseType === avoidType) continue;

        const hasDifferentSkillTag = !candidate.skillTags?.some((tag) =>
          avoidSkillTags.includes(tag),
        );
        if (hasDifferentSkillTag) {
          return candidate;
        }
      }
    }

    if (avoidType) {
      for (const candidate of pool) {
        if (used.has(candidate.id)) continue;
        if (violatesConstraints(candidate)) continue;
        if (candidate.exerciseType !== avoidType) {
          return candidate;
        }
      }
    }

    for (const candidate of pool) {
      if (used.has(candidate.id)) continue;
      if (violatesConstraints(candidate)) continue;
      return candidate;
    }

    for (const candidate of pool) {
      if (used.has(candidate.id)) continue;
      return candidate;
    }

    return null;
  };

  let remaining = [...candidates];
  let needsModalityCoverage = requireModalityCoverage;

  while (remaining.length > 0 || needsModalityCoverage) {
    let selected: DeliveryCandidate | null = null;

    if (enableScaffolding) {
      const skillTagsNeedingScaffolding: string[] = [];
      for (const [skillTag, errorCount] of skillTagErrorMap.entries()) {
        if (errorCount >= 3) {
          skillTagsNeedingScaffolding.push(skillTag);
        }
      }

      if (skillTagsNeedingScaffolding.length > 0) {
        const targetSkillTag = skillTagsNeedingScaffolding[0];
        selected = findAlternative(
          reviewItemsHighMastery,
          undefined,
          undefined,
          targetSkillTag,
        );

        if (selected) {
          skillTagErrorMap.set(targetSkillTag, 0);
        }
      }
    }

    if (
      !selected &&
      enableScaffolding &&
      errorStreak >= 2 &&
      easyCandidates.length > 0
    ) {
      selected = findAlternative(easyCandidates);
      if (selected) {
        errorStreak = 0;
      }
    }

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

    if (!selected) {
      const recentUniqueSkillTags = Array.from(new Set(recentSkillTags));
      const lastExerciseType = recentTypes[recentTypes.length - 1];

      if (recentUniqueSkillTags.length > 0) {
        selected = findAlternative(
          remaining,
          lastExerciseType,
          undefined,
          undefined,
          recentUniqueSkillTags,
        );
      }

      if (!selected && lastExerciseType) {
        selected = findAlternative(remaining, lastExerciseType);
      }

      if (!selected) {
        for (const candidate of remaining) {
          if (used.has(candidate.id)) continue;
          if (!violatesConstraints(candidate)) {
            selected = candidate;
            break;
          }
        }
      }

      if (!selected) {
        for (const candidate of remaining) {
          if (used.has(candidate.id)) continue;
          selected = candidate;
          break;
        }
      }
    }

    if (!selected) {
      break;
    }

    composed.push(selected);
    used.add(selected.id);

    if (selected.skillTags && selected.skillTags.length > 0) {
      for (const skillTag of selected.skillTags) {
        recentSkillTags.push(skillTag);
      }
      const seen = new Set<string>();
      const deduplicated: string[] = [];
      for (let i = recentSkillTags.length - 1; i >= 0; i--) {
        const tag = recentSkillTags[i];
        if (!seen.has(tag)) {
          seen.add(tag);
          deduplicated.unshift(tag);
        }
      }
      recentSkillTags.length = 0;
      recentSkillTags.push(...deduplicated.slice(-5));
    }

    const exerciseType = selected.exerciseType || 'unknown';
    recentTypes.push(exerciseType);
    if (recentTypes.length > maxSameTypeInRow) {
      recentTypes.shift();
    }

    if (selected.deliveryMethods) {
      selected.deliveryMethods.forEach((m) => usedModalities.add(m));
    }

    remaining = remaining.filter((c) => c.id !== selected.id);

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

export function calculateItemCount(
  timeBudgetSec: number,
  avgTimePerItem: number,
  bufferRatio: number = 0.2,
): number {
  if (avgTimePerItem <= 0) {
    return 10;
  }

  const effectiveBudget = timeBudgetSec * (1 - bufferRatio);
  const count = Math.floor(effectiveBudget / avgTimePerItem);
  return Math.max(1, Math.min(count, 50));
}

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
  const useWeightedSelection = Math.random() < 0.85;

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
    return userHistory.avgTimePerTeachSec || 30;
  }

  if (item.kind === 'question' && deliveryMethod) {
    const methodAvg = userHistory.avgTimeByDeliveryMethod.get(deliveryMethod);
    if (methodAvg) {
      return methodAvg;
    }
  }

  return userHistory.avgTimePerPracticeSec || 60;
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
    avgTimePerTeachSec: 30,
    avgTimePerPracticeSec: 60,
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
