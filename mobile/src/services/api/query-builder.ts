/**
 * Query string builder utilities for API requests
 * Eliminates duplication of URLSearchParams patterns
 */

/**
 * Build a query string from an object of parameters
 * Automatically filters out undefined and null values
 */
export function buildQueryString(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
}

/**
 * Build a query string with timezone offset
 * Uses current timezone offset if not provided
 */
export function buildTzQueryString(options?: {
  tzOffsetMinutes?: number;
}): string {
  const tzOffsetMinutes =
    options?.tzOffsetMinutes ?? new Date().getTimezoneOffset();

  if (!Number.isFinite(tzOffsetMinutes)) {
    return '';
  }

  return buildQueryString({ tzOffsetMinutes });
}

/**
 * Append query string to URL
 * Handles the ? prefix automatically
 */
export function appendQueryString(url: string, query: string): string {
  return query ? `${url}?${query}` : url;
}

/**
 * Build URL with query parameters
 * Convenience function combining appendQueryString and buildQueryString
 */
export function buildUrl(
  baseUrl: string,
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const query = buildQueryString(params);
  return appendQueryString(baseUrl, query);
}
