/**
 * Utility functions for safe error message extraction
 * Used to handle unknown error types in catch blocks
 */

/**
 * Safely extracts the error message from an unknown error
 * @param error - The caught error (can be any type)
 * @returns The error message string
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Safely extracts the error stack trace from an unknown error
 * @param error - The caught error (can be any type)
 * @returns The stack trace string or undefined
 */
export function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack;
  }
  return undefined;
}

/**
 * Type guard for Prisma errors
 * @param error - The caught error
 * @returns True if the error is a Prisma known request error
 */
export function isPrismaError(
  error: unknown,
): error is { code: string; meta?: Record<string, unknown> } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  );
}
