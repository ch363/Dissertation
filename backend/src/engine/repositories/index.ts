/**
 * Engine Repositories
 *
 * Repository interfaces and implementations for engine services.
 * Demonstrates Dependency Inversion Principle:
 * - Engine services depend on repository interfaces (abstractions)
 * - Concrete implementations can be swapped for testing or different backends
 */

export { UserQuestionPerformanceRepository } from './user-question-performance.repository';
export type {
  IUserQuestionPerformanceRepository,
  PerformanceWithQuestion,
  CreatePerformanceInput,
} from './user-question-performance.repository';

export { UserDeliveryMethodScoreRepository } from './user-delivery-method-score.repository';
export type { IUserDeliveryMethodScoreRepository } from './user-delivery-method-score.repository';

export { UserTeachingViewRepository } from './user-teaching-view.repository';
export type { IUserTeachingViewRepository } from './user-teaching-view.repository';

export { UserSkillMasteryRepository } from './user-skill-mastery.repository';
export type { IUserSkillMasteryRepository } from './user-skill-mastery.repository';

export { UserKnowledgeLevelProgressRepository } from './user-knowledge-level-progress.repository';
export type { IUserKnowledgeLevelProgressRepository } from './user-knowledge-level-progress.repository';
