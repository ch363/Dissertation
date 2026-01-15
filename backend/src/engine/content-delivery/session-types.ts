import { DELIVERY_METHOD } from '@prisma/client';

/**
 * Session plan types for structured learning sessions.
 * These types support teach-then-test, interleaving, and adaptive modality selection.
 */

export type SessionKind = 'learn' | 'review' | 'mixed';

export type StepType = 'teach' | 'practice' | 'recap';

/**
 * Teaching step item - introduces new content
 */
export interface TeachStepItem {
  type: 'teach';
  teachingId: string;
  lessonId: string;
  phrase: string; // learningLanguageString
  translation: string; // userLanguageString
  emoji?: string;
  tip?: string;
  knowledgeLevel?: string;
}

/**
 * Practice step item - question/practice exercise
 */
export interface PracticeStepItem {
  type: 'practice';
  questionId: string;
  teachingId: string;
  lessonId: string;
  prompt?: string;
  deliveryMethod: DELIVERY_METHOD;
  // Delivery method specific fields
  options?: Array<{ id: string; label: string }>; // For MULTIPLE_CHOICE
  correctOptionId?: string; // For MULTIPLE_CHOICE
  text?: string; // For FILL_BLANK
  answer?: string; // For FILL_BLANK, TEXT_TRANSLATION
  hint?: string; // For FILL_BLANK, TEXT_TRANSLATION
  source?: string; // For TEXT_TRANSLATION
  sourceText?: string; // For MULTIPLE_CHOICE (translation MCQ)
  translation?: string; // For TEXT_TO_SPEECH (userLanguageString for display)
}

/**
 * Recap step item - session summary and feedback
 */
export interface RecapStepItem {
  type: 'recap';
  summary: {
    totalItems: number;
    correctCount: number;
    accuracy: number;
    timeSpentSec: number;
    xpEarned: number;
    streakDays?: number;
    badgesEarned?: string[];
  };
}

export type StepItem = TeachStepItem | PracticeStepItem | RecapStepItem;

/**
 * A single step in a learning session
 */
export interface SessionStep {
  stepNumber: number;
  type: StepType;
  item: StepItem;
  estimatedTimeSec: number;
  deliveryMethod?: DELIVERY_METHOD; // For practice steps
}

/**
 * Session metadata with statistics and estimates
 */
export interface SessionMetadata {
  totalEstimatedTimeSec: number;
  totalSteps: number;
  teachSteps: number;
  practiceSteps: number;
  recapSteps: number;
  potentialXp: number;
  dueReviewsIncluded: number;
  newItemsIncluded: number;
  topicsCovered: string[]; // Teaching/lesson IDs covered
  deliveryMethodsUsed: DELIVERY_METHOD[];
}

/**
 * Complete session plan with ordered steps
 */
export interface SessionPlanDto {
  id: string;
  kind: SessionKind;
  lessonId?: string;
  title?: string;
  steps: SessionStep[];
  metadata: SessionMetadata;
  createdAt: Date;
}

/**
 * Context for creating a session plan
 */
export interface SessionContext {
  mode: 'learn' | 'review' | 'mixed';
  timeBudgetSec?: number; // e.g., 300 (5 min), 600 (10 min), 900 (15 min)
  lessonId?: string;
  theme?: string; // Optional topic filter
}

/**
 * User's average time per item type (for adaptive time estimation)
 */
export interface UserTimeAverages {
  avgTimePerTeachSec: number;
  avgTimePerPracticeSec: number;
  avgTimeByDeliveryMethod: Map<DELIVERY_METHOD, number>;
  avgTimeByQuestionType: Map<string, number>;
}
