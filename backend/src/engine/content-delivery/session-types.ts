import { DELIVERY_METHOD } from '@prisma/client';

export type SessionKind = 'learn' | 'review' | 'mixed';

export type StepType = 'teach' | 'practice' | 'recap';

export interface TeachStepItem {
  type: 'teach';
  teachingId: string;
  lessonId: string;
  phrase: string;
  translation: string;
  emoji?: string;
  tip?: string;
  knowledgeLevel?: string;
}

export interface PracticeStepItem {
  type: 'practice';
  questionId: string;
  teachingId: string;
  lessonId: string;
  prompt?: string;
  deliveryMethod: DELIVERY_METHOD;
  options?: Array<{ id: string; label: string }>;
  correctOptionId?: string;
  text?: string;
  answer?: string;
  hint?: string;
  source?: string;
  sourceText?: string;
  translation?: string;
}

export interface RecapStepItem {
  type: 'recap';
  summary: {
    totalItems: number;
    correctCount: number;
    accuracy: number;
    timeSpentSec: number;
    xpEarned: number;
    streakDays?: number;
  };
}

export type StepItem = TeachStepItem | PracticeStepItem | RecapStepItem;

export interface SessionStep {
  stepNumber: number;
  type: StepType;
  item: StepItem;
  estimatedTimeSec: number;
  deliveryMethod?: DELIVERY_METHOD;
  rationale?: string;
}

export interface SessionMetadata {
  totalEstimatedTimeSec: number;
  totalSteps: number;
  teachSteps: number;
  practiceSteps: number;
  recapSteps: number;
  potentialXp: number;
  dueReviewsIncluded: number;
  newItemsIncluded: number;
  topicsCovered: string[];
  deliveryMethodsUsed: DELIVERY_METHOD[];
}

export interface SessionPlanDto {
  id: string;
  kind: SessionKind;
  lessonId?: string;
  title?: string;
  steps: SessionStep[];
  metadata: SessionMetadata;
  createdAt: Date;
}

export interface SessionContext {
  mode: 'learn' | 'review' | 'mixed';
  timeBudgetSec?: number;
  lessonId?: string;
  moduleId?: string;
  theme?: string;
}

export interface UserTimeAverages {
  avgTimePerTeachSec: number;
  avgTimePerPracticeSec: number;
  avgTimeByDeliveryMethod: Map<DELIVERY_METHOD, number>;
  avgTimeByQuestionType: Map<string, number>;
}
