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
  // Enhanced metadata for interleaving
  skillTags?: string[]; // Skills/topics this item covers (e.g., ["greetings", "verb essere"])
  exerciseType?: string; // Type of exercise (e.g., "vocabulary", "grammar", "listening")
  difficulty?: number; // 0.0 to 1.0, where 0 = easy, 1 = hard
  estimatedMastery?: number; // 0.0 to 1.0, user's estimated mastery of this item
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
