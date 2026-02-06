/**
 * Domain Error Types
 *
 * Custom error classes for domain-specific error handling.
 * Replaces string-based error detection with proper error types (KISS principle).
 *
 * Benefits:
 * - Type-safe error handling
 * - Better error messages and context
 * - Easier to test and mock
 * - More maintainable than string matching
 */

/**
 * Base class for domain errors.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Database-related errors.
 */
export class DatabaseError extends DomainError {
  readonly code: string = 'DATABASE_ERROR';
}

/**
 * Error when a database column or table doesn't exist.
 * Typically indicates a schema mismatch or migration issue.
 */
export class SchemaMismatchError extends DatabaseError {
  readonly code = 'SCHEMA_MISMATCH';

  constructor(detail?: string) {
    super(
      detail
        ? `Database schema mismatch: ${detail}`
        : 'Database schema mismatch detected',
    );
  }
}

/**
 * Error when a required entity is not found.
 */
export class EntityNotFoundError extends DomainError {
  readonly code = 'ENTITY_NOT_FOUND';

  constructor(entityType: string, identifier?: string) {
    super(
      identifier
        ? `${entityType} not found: ${identifier}`
        : `${entityType} not found`,
    );
  }
}

/**
 * Error when a unique constraint is violated.
 */
export class DuplicateEntityError extends DomainError {
  readonly code = 'DUPLICATE_ENTITY';

  constructor(entityType: string, field?: string) {
    super(
      field
        ? `${entityType} already exists with this ${field}`
        : `${entityType} already exists`,
    );
  }
}

/**
 * Error when a foreign key constraint is violated.
 */
export class InvalidReferenceError extends DomainError {
  readonly code = 'INVALID_REFERENCE';

  constructor(fromEntity: string, toEntity: string) {
    super(`Invalid reference from ${fromEntity} to ${toEntity}`);
  }
}

/**
 * Error when validation fails.
 */
export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.field = field;
  }
}

/**
 * Error when a service is temporarily unavailable.
 */
export class ServiceUnavailableError extends DomainError {
  readonly code = 'SERVICE_UNAVAILABLE';

  constructor(service: string) {
    super(`Service temporarily unavailable: ${service}`);
  }
}
