import { LearningPathCardDto } from '../../learn/learning-path.dto';
import {
  SessionPlanDto,
  SessionContext,
} from '../../engine/content-delivery/session-types';

/**
 * Suggestion types for the learn service
 */
export interface LessonSuggestion {
  lesson: {
    id: string;
    title: string;
    imageUrl?: string | null;
  };
  module: {
    id: string;
    title: string;
  };
  reason: string;
}

export interface ModuleSuggestion {
  module: {
    id: string;
    title: string;
    imageUrl?: string | null;
  };
  reason: string;
}

export interface SuggestionsResult {
  lessons: LessonSuggestion[];
  modules: ModuleSuggestion[];
}

/**
 * ILearnService Interface
 *
 * Defines the contract for learning-related operations.
 * Demonstrates Dependency Inversion Principle.
 */
export interface ILearnService {
  /**
   * Get the learning path for a user (modules with progress).
   *
   * @param userId - The user's ID
   * @returns Array of learning path cards
   */
  getLearningPath(userId: string): Promise<LearningPathCardDto[]>;

  /**
   * Get content suggestions for a user.
   *
   * @param userId - The user's ID
   * @param currentLessonId - Optional current lesson context
   * @param moduleId - Optional module filter
   * @param limit - Maximum suggestions to return
   * @returns Suggested lessons and modules
   */
  getSuggestions(
    userId: string,
    currentLessonId?: string,
    moduleId?: string,
    limit?: number,
  ): Promise<SuggestionsResult>;

  /**
   * Get a session plan for a user.
   *
   * @param userId - The user's ID
   * @param context - Session context
   * @returns A session plan
   */
  getSessionPlan(
    userId: string,
    context: SessionContext,
  ): Promise<SessionPlanDto>;
}

/**
 * Injection token for ILearnService
 */
export const LEARN_SERVICE = 'ILearnService';
