/**
 * Check if an error indicates a schema mismatch (missing column/table).
 * This typically happens during migrations or when the database is out of sync.
 *
 * Use this to gracefully handle schema mismatches instead of string-based detection.
 */
export function isMissingColumnOrSchemaMismatchError(error: unknown): boolean {
  const message = String((error as Error)?.message ?? '');
  return (
    message.includes('does not exist in the current database') ||
    message.includes('does not exist') ||
    message.includes('(not available)') ||
    message.includes('column') ||
    message.includes('not available')
  );
}

export function isPrismaNotFoundError(error: unknown): boolean {
  const message = String((error as Error)?.message ?? '');
  return (
    message.includes('Record to update not found') ||
    message.includes('Record to delete not found') ||
    message.includes('No') ||
    message.includes('not found')
  );
}

export function isPrismaUniqueConstraintError(error: unknown): boolean {
  const message = String((error as Error)?.message ?? '');
  return (
    message.includes('Unique constraint failed') ||
    message.includes('unique constraint')
  );
}

export function isPrismaForeignKeyError(error: unknown): boolean {
  const message = String((error as Error)?.message ?? '');
  return (
    message.includes('Foreign key constraint failed') ||
    message.includes('foreign key constraint')
  );
}
