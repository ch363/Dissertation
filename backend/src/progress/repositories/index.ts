/**
 * Progress Repositories
 *
 * Repository interfaces and implementations for progress tracking.
 * Demonstrates Dependency Inversion Principle:
 * - Progress services depend on repository interfaces (abstractions)
 * - Concrete implementations can be swapped for testing or different backends
 */

export { UserLessonRepository } from './user-lesson.repository';
export type {
  IUserLessonRepository,
  UserLessonWithDetails,
} from './user-lesson.repository';

export { UserTeachingCompletedRepository } from './user-teaching-completed.repository';
export type {
  IUserTeachingCompletedRepository,
  UserTeachingCompletedWithDetails,
} from './user-teaching-completed.repository';
