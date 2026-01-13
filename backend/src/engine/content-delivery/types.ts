import { DELIVERY_METHOD } from '@prisma/client';
import { ItemKind } from '../types';

/**
 * A candidate item that could be delivered next
 */
export interface DeliveryCandidate {
  kind: ItemKind;
  id: string;
  teachingId?: string;
  questionId?: string;
  lessonId?: string;
  // Scoring factors
  dueScore: number; // Higher = more due
  errorScore: number; // Higher = more recent errors
  timeSinceLastSeen: number; // Milliseconds since last seen
  // Metadata
  title?: string;
  prompt?: string;
  options?: string[];
  deliveryMethods?: DELIVERY_METHOD[];
}

/**
 * The next item to deliver to the user
 */
export interface NextDeliveryItemDto {
  kind: ItemKind;
  id: string;
  teachingId?: string;
  questionId?: string;
  lessonId?: string;
  title?: string;
  prompt?: string;
  options?: string[];
  deliveryMethods?: DELIVERY_METHOD[];
  suggestedDeliveryMethod?: DELIVERY_METHOD;
  rationale: string;
}

/**
 * Dashboard plan showing what's coming up
 */
export interface DashboardPlanDto {
  dueReviews: number;
  newItemsAvailable: number;
  nextReviewDue?: Date;
  estimatedTimeMinutes: number;
}
