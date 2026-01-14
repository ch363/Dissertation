import { getSupabaseClient } from '@/services/supabase/client';
import { getApiUrl } from './config';
import { ApiClientError, type ApiResponse } from './types';

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
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    const token = await this.getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      const isJson = contentType?.includes('application/json');

      let data: any;
      if (isJson) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = text ? { message: text } : {};
      }

      // Debug logging for development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API] ${options.method || 'GET'} ${endpoint}`, {
          status: response.status,
          hasData: !!data,
          dataKeys: data && typeof data === 'object' ? Object.keys(data) : [],
        });
      }

      if (!response.ok) {
        // Try to extract more detailed error information
        let errorMessage = data.message || data.error || `HTTP ${response.status}`;
        
        // Handle Prisma errors
        if (data.message && typeof data.message === 'string') {
          if (data.message.includes('Unique constraint')) {
            errorMessage = `Database constraint error: ${data.message}`;
          } else if (data.message.includes('Invalid')) {
            errorMessage = data.message;
          }
        }
        
        throw new ApiClientError(
          errorMessage,
          response.status,
          response,
        );
      }

      // Handle wrapped API responses (from TransformInterceptor)
      // Backend wraps responses in { success: true, data: ... } format
      // But some endpoints might return data directly, so check both formats
      if (data && typeof data === 'object') {
        // Check if it's a wrapped response from TransformInterceptor
        if ('data' in data && 'success' in data) {
          // If success is true, return the data
          if ((data as any).success === true) {
            return (data as any).data as T;
          }
          // If success is false, it might be an error response
          if ((data as any).success === false && (data as any).message) {
            throw new ApiClientError(
              (data as any).message || 'Request failed',
              response.status,
              response,
            );
          }
        }
        // If response has statusCode, it's an error response (shouldn't reach here due to !response.ok check)
        if ('statusCode' in data && 'error' in data) {
          // This shouldn't happen, but handle it just in case
          throw new ApiClientError(
            data.message || data.error || 'Unknown error',
            data.statusCode || response.status,
            response,
          );
        }
      }

      return data as T;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError(
        error instanceof Error ? error.message : 'Network request failed',
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
