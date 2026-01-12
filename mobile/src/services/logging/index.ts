import { logError as logErrorImpl, type LogContext } from '@/services/logging/logger';

/**
 * UI-safe logging facade. Centralize here so the logging implementation
 * can change without touching screens.
 */
export function logError(error: unknown, context?: LogContext) {
  logErrorImpl(error, context);
}

export type { LogContext };
