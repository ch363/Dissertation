/**
 * Error Types Module
 *
 * Domain-specific error types for type-safe error handling.
 */

export {
  DomainError,
  DatabaseError,
  SchemaMismatchError,
  EntityNotFoundError,
  DuplicateEntityError,
  InvalidReferenceError,
  ValidationError,
  ServiceUnavailableError,
} from './domain.errors';
