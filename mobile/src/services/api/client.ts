import { getSupabaseClient } from '@/services/supabase/client';
import { getApiUrl } from './config';
import { ApiClientError, type ApiError, isApiEnvelope } from './types';
import { createLogger } from '@/services/logging';

const logger = createLogger('ApiClient');

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || getApiUrl();
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      const supabase = getSupabaseClient();
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token || null;
    } catch (error) {
      logger.error('Failed to get auth token', error);
      return null;
    }
  }

  private async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    const token = await this.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(typeof options.headers === 'object' && options.headers !== null && !Array.isArray(options.headers)
        ? (options.headers as Record<string, string>)
        : {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const timeoutMs = 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const config: RequestInit = {
      ...options,
      headers,
      signal: options.signal ?? controller.signal,
    };

    try {
      let response: Response;
      try {
        response = await fetch(url, config);
      } finally {
        clearTimeout(timeoutId);
      }

      const contentType = response.headers.get('content-type');
      const isJson = contentType?.includes('application/json');

      let data: unknown;
      if (isJson) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = text ? { message: text } : {};
      }

      if (process.env.NODE_ENV === 'development') {
        logger.debug(`[API] ${options.method || 'GET'} ${endpoint}`, {
          status: response.status,
          hasData: !!data,
          dataKeys: data && typeof data === 'object' ? Object.keys(data) : [],
        });
      }

      if (!response.ok) {
        const errBody = (data && typeof data === 'object' ? data : {}) as { message?: string; error?: string };
        let errorMessage = errBody.message ?? errBody.error ?? `HTTP ${response.status}`;

        if (errBody.message?.includes('Unique constraint')) {
          errorMessage = `Database constraint error: ${errBody.message}`;
        } else if (errBody.message?.includes('Invalid')) {
          errorMessage = errBody.message;
        }

        throw new ApiClientError(
          errorMessage,
          response.status,
          response,
        );
      }

      if (data && typeof data === 'object' && isApiEnvelope(data)) {
        if (data.success) {
          return data.data as T;
        }
        throw new ApiClientError(
          data.message || 'Request failed',
          response.status,
          response,
        );
      }
      if (data && typeof data === 'object') {
        const err = data as ApiError;
        if ('statusCode' in err && 'error' in err) {
          throw new ApiClientError(
            err.message || err.error || 'Unknown error',
            err.statusCode ?? response.status,
            response,
          );
        }
      }

      return data as T;
    } catch (error: any) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiClientError(
          `Request timed out after ${timeoutMs / 1000}s. Check that the backend is running and reachable.`,
        );
      }
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : 'Network request failed';
      const isNetworkError =
        !message.includes('HTTP') &&
        (message.includes('fetch') ||
          message.includes('network') ||
          message.includes('Failed to fetch') ||
          message.includes('Network request failed') ||
          message.includes('connection') ||
          message.includes('timeout'));
      throw new ApiClientError(
        isNetworkError
          ? `${message}. Check that the backend is running and reachable (e.g. EXPO_PUBLIC_API_URL).`
          : message,
      );
    }
  }

  async get<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances if needed
export { ApiClient };
