import { DELIVERY_METHOD } from '@prisma/client';

/**
 * Session Configuration Constants
 *
 * Centralized configuration for session planning and content delivery.
 * Extracts magic numbers for maintainability and clarity (KISS principle).
 */

/**
 * Time estimation constants (in seconds).
 */
export const TIME_ESTIMATES = {
  /** Default time for a teaching step */
  TEACH_STEP_SECONDS: 30,
  /** Default time for a practice step */
  PRACTICE_STEP_SECONDS: 60,
  /** Time estimate for recap step */
  RECAP_STEP_SECONDS: 10,
  /** Default time per item when no history available */
  DEFAULT_ITEM_SECONDS: 45,
  /** Time estimates by delivery method */
  BY_DELIVERY_METHOD: {
    [DELIVERY_METHOD.FLASHCARD]: 20,
    [DELIVERY_METHOD.MULTIPLE_CHOICE]: 30,
    [DELIVERY_METHOD.FILL_BLANK]: 45,
    [DELIVERY_METHOD.TEXT_TRANSLATION]: 60,
    [DELIVERY_METHOD.SPEECH_TO_TEXT]: 90,
    [DELIVERY_METHOD.TEXT_TO_SPEECH]: 90,
  } as Record<DELIVERY_METHOD, number>,
} as const;

/**
 * Candidate selection constants.
 */
export const SELECTION = {
  /** Probability of using weighted selection vs random */
  WEIGHTED_SELECTION_PROBABILITY: 0.85,
  /** Default target item count when no time budget */
  DEFAULT_TARGET_ITEM_COUNT: 15,
  /** Maximum items per session */
  MAX_ITEMS_PER_SESSION: 50,
  /** Minimum items per session */
  MIN_ITEMS_PER_SESSION: 1,
  /** Buffer ratio for time budget calculation */
  TIME_BUFFER_RATIO: 0.2,
  /** Review mode: minimum number of reviews to include */
  MIN_REVIEW_COUNT: 10,
  /** Mixed mode: ratio of reviews to new content */
  MIXED_MODE_REVIEW_RATIO: 0.7,
} as const;

/**
 * Priority scoring constants.
 */
export const PRIORITY_SCORING = {
  /** Base priority for due reviews */
  DUE_REVIEW_BASE_PRIORITY: 1000,
  /** Multiplier for error score in due reviews */
  DUE_ERROR_MULTIPLIER: 10,
  /** Multiplier for error score in new items */
  NEW_ERROR_MULTIPLIER: 5,
  /** Divisor for time since last seen */
  TIME_DIVISOR: 1000,
  /** Bonus for items with prioritized skills */
  PRIORITIZED_SKILL_BONUS: 500,
  /** Bonus for difficulty matching user preference */
  DIFFICULTY_MATCH_BONUS: 100,
  /** Low challenge threshold */
  LOW_CHALLENGE_THRESHOLD: 0.4,
  /** High challenge threshold */
  HIGH_CHALLENGE_THRESHOLD: 0.7,
  /** Low difficulty threshold */
  LOW_DIFFICULTY_THRESHOLD: 0.4,
  /** High difficulty threshold */
  HIGH_DIFFICULTY_THRESHOLD: 0.6,
} as const;

/**
 * Interleaving constants.
 */
export const INTERLEAVING = {
  /** Maximum same type items in a row */
  MAX_SAME_TYPE_IN_ROW: 2,
  /** Number of recent methods to track for variety */
  RECENT_METHODS_TRACK_COUNT: 5,
} as const;

/**
 * XP and rewards constants.
 */
export const REWARDS = {
  /** Base XP per practice step */
  XP_PER_PRACTICE_STEP: 15,
} as const;

/**
 * Mastery thresholds.
 */
export const MASTERY = {
  /** Low mastery threshold for skill prioritization */
  LOW_MASTERY_THRESHOLD: 0.5,
} as const;

/**
 * Exercise type mapping by delivery method.
 *
 * Follows Open/Closed Principle - extend by adding to map, not modifying logic.
 * Priority order matters: first match wins when a question has multiple methods.
 */
export const EXERCISE_TYPE_MAP: Record<DELIVERY_METHOD, string> = {
  [DELIVERY_METHOD.SPEECH_TO_TEXT]: 'speaking',
  [DELIVERY_METHOD.TEXT_TO_SPEECH]: 'speaking',
  [DELIVERY_METHOD.TEXT_TRANSLATION]: 'translation',
  [DELIVERY_METHOD.FILL_BLANK]: 'grammar',
  [DELIVERY_METHOD.MULTIPLE_CHOICE]: 'vocabulary',
  [DELIVERY_METHOD.FLASHCARD]: 'vocabulary',
};

/**
 * Exercise type priority order for when multiple methods exist.
 * Higher priority types are checked first.
 */
const EXERCISE_TYPE_PRIORITY: DELIVERY_METHOD[] = [
  DELIVERY_METHOD.SPEECH_TO_TEXT,
  DELIVERY_METHOD.TEXT_TO_SPEECH,
  DELIVERY_METHOD.TEXT_TRANSLATION,
  DELIVERY_METHOD.FILL_BLANK,
  DELIVERY_METHOD.MULTIPLE_CHOICE,
  DELIVERY_METHOD.FLASHCARD,
];

/**
 * Determine the exercise type for a question based on its delivery methods.
 *
 * @param deliveryMethods - Available delivery methods for the question
 * @param teaching - Optional teaching with tip for fallback classification
 * @returns Exercise type string (speaking, translation, grammar, vocabulary, practice)
 */
export function determineExerciseType(
  deliveryMethods: DELIVERY_METHOD[],
  teaching?: { tip?: string | null },
): string {
  // Check methods in priority order
  for (const method of EXERCISE_TYPE_PRIORITY) {
    if (deliveryMethods.includes(method)) {
      return EXERCISE_TYPE_MAP[method];
    }
  }

  // Fallback to teaching tip analysis
  if (teaching?.tip) {
    const tipLower = teaching.tip.toLowerCase();
    if (tipLower.includes('grammar') || tipLower.includes('rule')) {
      return 'grammar';
    }
    if (tipLower.includes('vocabulary') || tipLower.includes('word')) {
      return 'vocabulary';
    }
  }

  return 'practice';
}

/**
 * Aggregated session config for convenience.
 */
export const SESSION_CONFIG = {
  timeEstimates: TIME_ESTIMATES,
  selection: SELECTION,
  priorityScoring: PRIORITY_SCORING,
  interleaving: INTERLEAVING,
  rewards: REWARDS,
  mastery: MASTERY,
  exerciseTypeMap: EXERCISE_TYPE_MAP,
} as const;
