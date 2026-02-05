import { useState, useCallback } from 'react';

import { getUserFriendlyMessage } from '@/services/errors/error-handler';
import { createLogger } from '@/services/logging';

const logger = createLogger('useErrorHandler');

/**
 * Reusable hook for consistent error handling across components.
 *
 * @example
 * ```tsx
 * const { error, handleError, clearError } = useErrorHandler();
 *
 * const fetchData = async () => {
 *   try {
 *     const data = await api.getData();
 *     return data;
 *   } catch (err) {
 *     handleError(err, 'Failed to fetch data');
 *   }
 * };
 * ```
 */
export function useErrorHandler(context?: string) {
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback(
    (error: unknown, defaultMessage?: string) => {
      const err = error instanceof Error ? error : new Error(String(error));
      const message = getUserFriendlyMessage(error) || defaultMessage || 'An error occurred';

      logger.error(context ? `${context}: ${message}` : message, err);
      setError(message);

      return message;
    },
    [context],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError,
    hasError: error !== null,
  };
}
