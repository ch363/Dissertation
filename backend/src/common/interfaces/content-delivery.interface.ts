import {
  SessionPlanDto,
  SessionContext,
} from '../../engine/content-delivery/session-types';

/**
 * IContentDeliveryService Interface
 *
 * Defines the contract for content delivery operations.
 * Demonstrates Dependency Inversion Principle.
 */
export interface IContentDeliveryService {
  /**
   * Get a session plan for a user with caching.
   *
   * @param userId - The user's ID
   * @param context - Session context including mode, time budget, and scope
   * @returns A session plan (may be cached)
   */
  getSessionPlan(
    userId: string,
    context: SessionContext,
  ): Promise<SessionPlanDto>;
}

/**
 * Injection token for IContentDeliveryService
 */
export const CONTENT_DELIVERY_SERVICE = 'IContentDeliveryService';
