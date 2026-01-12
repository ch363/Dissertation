/**
 * Centralized logger. Replace implementations here to forward errors to a backend later.
 */
export type LogContext = Record<string, unknown> | undefined;

export function logError(error: unknown, context?: LogContext) {
  try {
    let message: string;
    if (error instanceof Error) {
      message = error.message;
    } else if (error && typeof error === 'object') {
      try {
        message = JSON.stringify(error);
      } catch {
        message = String(error);
      }
    } else {
      message = String(error);
    }

    const base = {
      level: 'error',
      ts: new Date().toISOString(),
      message,
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
