/**
 * Centralized logger. Replace implementations here to forward errors to a backend later.
 */
export type LogContext = Record<string, unknown> | undefined;

export function logError(error: unknown, context?: LogContext) {
  try {
    const base = {
      level: 'error',
      ts: new Date().toISOString(),
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
      context,
    };
    // For now, print to console. Hook up a backend here if desired.
    // eslint-disable-next-line no-console
    console.error('[AppError]', base);
  } catch {
    // never throw from logger
  }
}
