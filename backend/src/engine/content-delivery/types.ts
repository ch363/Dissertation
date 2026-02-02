import { DELIVERY_METHOD } from '@prisma/client';
import { ItemKind } from '../types';

export interface DeliveryCandidate {
  kind: ItemKind;
  id: string;
  teachingId?: string;
  questionId?: string;
  lessonId?: string;
  dueScore: number;
  errorScore: number;
  timeSinceLastSeen: number;
  title?: string;
  prompt?: string;
  options?: string[];
  deliveryMethods?: DELIVERY_METHOD[];
  skillTags?: string[];
  exerciseType?: string;
  difficulty?: number;
  estimatedMastery?: number;
}

export interface DashboardPlanDto {
  dueReviews: number;
  newItemsAvailable: number;
  nextReviewDue?: Date;
  estimatedTimeMinutes: number;
}
