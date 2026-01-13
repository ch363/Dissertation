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
