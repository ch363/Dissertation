/**
 * Input Sanitization Utilities
 * 
 * Security Best Practices (OWASP):
 * - Prevents XSS (Cross-Site Scripting) attacks
 * - Removes potentially dangerous HTML/JavaScript
 * - Validates and sanitizes user inputs
 * - Prevents NoSQL injection and other injection attacks
 */

/**
 * Sanitize string input by removing HTML tags and dangerous characters
 * Prevents XSS attacks by stripping HTML/JavaScript
 * 
 * OWASP Recommendation: Defense in depth - sanitize at input, encode at output
 * 
 * @param input - String to sanitize
 * @param maxLength - Maximum allowed length (default: 10000)
 * @returns Sanitized string
 */
export function sanitizeString(input: string | null | undefined, maxLength: number = 10000): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = input.trim();

  // Enforce length limit FIRST to prevent DoS via large inputs
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Decode HTML entities FIRST (before stripping tags) to prevent bypass
  // e.g., &lt;script&gt; -> <script> -> stripped
  sanitized = sanitized
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, '/')
    .replace(/&#(\d+);/gi, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

  // Remove HTML tags (XSS prevention) - run multiple times to catch nested encoding
  for (let i = 0; i < 3; i++) {
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }

  // Remove potentially dangerous patterns
  sanitized = sanitized
    .replace(/javascript\s*:/gi, '') // Remove javascript: protocol (with optional whitespace)
    .replace(/vbscript\s*:/gi, '') // Remove vbscript: protocol
    .replace(/data\s*:/gi, '') // Remove data: protocol (can contain scripts)
    .replace(/on\w+\s*=/gi, '') // Remove event handlers (onclick, onerror, etc.)
    .replace(/expression\s*\(/gi, '') // Remove CSS expression()
    .replace(/url\s*\(/gi, ''); // Remove CSS url() which can contain javascript:

  // Note: We do NOT strip quotes/semicolons for general strings as they may be valid
  // Parameterized queries (Prisma) handle SQL injection prevention at the DB layer

  return sanitized;
}

/**
 * Sanitize URL input
 * Validates and sanitizes URLs to prevent malicious redirects
 * 
 * @param url - URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  const trimmed = url.trim();

  // Basic URL validation
  try {
    const parsed = new URL(trimmed);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }

    // Return sanitized URL
    return parsed.toString();
  } catch {
    // Invalid URL format
    return '';
  }
}

/**
 * Sanitize base64 string (for audio/image uploads)
 * Validates base64 format and removes dangerous patterns
 * 
 * @param base64 - Base64 string to sanitize
 * @param maxLength - Maximum allowed length (default: 10MB = ~13.3M chars in base64)
 * @returns Sanitized base64 string or empty string if invalid
 */
export function sanitizeBase64(base64: string | null | undefined, maxLength: number = 13333333): string {
  if (!base64 || typeof base64 !== 'string') {
    return '';
  }

  // Remove data URL prefix if present (e.g., "data:audio/wav;base64,")
  let sanitized = base64.replace(/^data:[^;]+;base64,/, '');

  // Enforce length limit
  if (sanitized.length > maxLength) {
    return '';
  }

  // Validate base64 format (only alphanumeric, +, /, = characters)
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(sanitized)) {
    return '';
  }

  return sanitized;
}

/**
 * Sanitize UUID string
 * Validates UUID format (v4)
 * 
 * @param uuid - UUID string to validate
 * @returns Valid UUID or empty string
 */
export function sanitizeUuid(uuid: string | null | undefined): string {
  if (!uuid || typeof uuid !== 'string') {
    return '';
  }

  const trimmed = uuid.trim();

  // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(trimmed)) {
    return '';
  }

  return trimmed.toLowerCase();
}

/**
 * Sanitize integer input
 * Validates and converts to integer
 * 
 * @param value - Value to sanitize
 * @param min - Minimum allowed value (optional)
 * @param max - Maximum allowed value (optional)
 * @returns Sanitized integer or null if invalid
 */
export function sanitizeInt(
  value: string | number | null | undefined,
  min?: number,
  max?: number,
): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const num = typeof value === 'number' ? value : parseInt(String(value), 10);

  if (isNaN(num) || !isFinite(num)) {
    return null;
  }

  if (min !== undefined && num < min) {
    return null;
  }

  if (max !== undefined && num > max) {
    return null;
  }

  return num;
}

/**
 * Sanitize enum value
 * Validates that value is one of the allowed enum values
 * 
 * @param value - Value to validate
 * @param allowedValues - Array of allowed enum values
 * @returns Valid enum value or null
 */
export function sanitizeEnum<T extends string>(
  value: string | null | undefined,
  allowedValues: readonly T[],
): T | null {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  
  if (allowedValues.includes(trimmed as T)) {
    return trimmed as T;
  }

  return null;
}
