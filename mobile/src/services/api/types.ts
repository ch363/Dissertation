/** Typed wrapper for API responses: success with data or failure with message. */
export type ApiEnvelope<T> = { success: true; data: T } | { success: false; message: string };

export function isApiEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  if (value === null || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  if (o.success === true && 'data' in o) return true;
  if (o.success === false && typeof o.message === 'string') return true;
  return false;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  error?: string;
}

export class ApiClientError extends Error {
  statusCode?: number;
  response?: Response;

  constructor(message: string, statusCode?: number, response?: Response) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.response = response;
  }
}
