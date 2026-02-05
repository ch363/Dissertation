import { Request } from 'express';

/**
 * Standard error response structure for all exception filters
 */
export interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string;
  error: string;
  code?: string;
}

/**
 * Builds a standardized error response object
 * Used by all exception filters for consistent error formatting
 *
 * @param request - Express request object
 * @param status - HTTP status code
 * @param message - Error message
 * @param error - Error type/category
 * @param code - Optional error code (e.g., Prisma error codes)
 * @returns Standardized error response object
 */
export function buildErrorResponse(
  request: Request,
  status: number,
  message: string,
  error: string,
  code?: string,
): ErrorResponse {
  return {
    statusCode: status,
    timestamp: new Date().toISOString(),
    path: request.url,
    method: request.method,
    message,
    error,
    ...(code && { code }),
  };
}
