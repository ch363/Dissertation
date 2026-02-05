import { createLogger } from '../logging';

import { ApiClientError } from '@/services/api/types';

const logger = createLogger('ErrorHandler');

export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

export class AppError extends Error {
  constructor(
    message: string,
    public readonly type: ErrorType = ErrorType.UNKNOWN,
    public readonly statusCode?: number,
    public readonly userMessage?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Check if an error is a network-related error
 * Consolidates network error detection logic from multiple files
 */
export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('timeout') ||
    message.includes('connection') ||
    message.includes('reachable') ||
    message.includes('failed to fetch')
  );
}

export function classifyError(error: unknown): ErrorType {
  if (error instanceof AppError) {
    return error.type;
  }

  if (error instanceof ApiClientError) {
    const code = error.statusCode;
    if (code === 401 || code === 403) return ErrorType.AUTH;
    if (code === 404) return ErrorType.NOT_FOUND;
    if (code != null && code >= 500) return ErrorType.SERVER;
  }

  if (isNetworkError(error)) {
    return ErrorType.NETWORK;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return ErrorType.AUTH;
    }

    if (message.includes('not found')) {
      return ErrorType.NOT_FOUND;
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION;
    }
  }

  return ErrorType.UNKNOWN;
}

export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof AppError && error.userMessage) {
    return error.userMessage;
  }

  const errorType = classifyError(error);

  switch (errorType) {
    case ErrorType.NETWORK:
      return 'Unable to connect. Please check your internet connection.';

    case ErrorType.AUTH:
      return 'Authentication failed. Please sign in again.';

    case ErrorType.VALIDATION:
      return 'Please check your input and try again.';

    case ErrorType.NOT_FOUND:
      return 'The requested resource was not found.';

    case ErrorType.SERVER:
      return 'Server error. Please try again later.';

    case ErrorType.UNKNOWN:
    default:
      return 'Something went wrong. Please try again.';
  }
}

export function handleError(error: unknown, context: string): string {
  const errorType = classifyError(error);
  const userMessage = getUserFriendlyMessage(error);

  if (error instanceof Error) {
    logger.error(`Error in ${context}`, error, {
      type: errorType,
      stack: error.stack,
    });
  } else {
    logger.error(`Error in ${context}`, undefined, {
      type: errorType,
      error: String(error),
    });
  }

  return userMessage;
}

export async function executeSafely<T>(
  operation: () => Promise<T>,
  context: string,
  fallbackValue?: T,
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    handleError(error, context);
    return fallbackValue;
  }
}

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
