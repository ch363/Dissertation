import {
  SessionPlanDto,
  SessionContext,
} from '../../engine/content-delivery/session-types';

/**
 * ISessionPlanService Interface
 *
 * Defines the contract for session plan creation.
 * Demonstrates Dependency Inversion Principle:
 * - High-level modules depend on this abstraction
 * - Concrete implementations implement this interface
 */
export interface ISessionPlanService {
  /**
   * Create a learning session plan for a user.
   *
   * @param userId - The user's ID
   * @param context - Session context including mode, time budget, and scope
   * @returns A complete session plan with steps
   */
  createPlan(userId: string, context: SessionContext): Promise<SessionPlanDto>;
}

/**
 * Injection token for ISessionPlanService
 */
export const SESSION_PLAN_SERVICE = 'ISessionPlanService';
