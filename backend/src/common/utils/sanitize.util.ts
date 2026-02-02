// XSS prevention: strips HTML/JavaScript from user input
// Defense in depth: sanitize at input, encode at output
export function sanitizeString(
  input: string | null | undefined,
  maxLength: number = 10000,
): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input.trim();

  // Prevent DoS via large inputs
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Decode entities first to prevent bypass (e.g., &lt;script&gt;)
  sanitized = sanitized
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, '/')
    .replace(/&#(\d+);/gi, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    );

  // Run multiple times to catch nested encoding
  for (let i = 0; i < 3; i++) {
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }

  sanitized = sanitized
    .replace(/javascript\s*:/gi, '')
    .replace(/vbscript\s*:/gi, '')
    .replace(/data\s*:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/expression\s*\(/gi, '')
    .replace(/url\s*\(/gi, '');

  // Prisma parameterized queries handle SQL injection at DB layer

  return sanitized;
}

export function sanitizeUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  const trimmed = url.trim();

  try {
    const parsed = new URL(trimmed);

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }

    return parsed.toString();
  } catch {
    return '';
  }
}

// Default maxLength: 10MB = ~13.3M chars in base64
export function sanitizeBase64(
  base64: string | null | undefined,
  maxLength: number = 13333333,
): string {
  if (!base64 || typeof base64 !== 'string') {
    return '';
  }

  const sanitized = base64.replace(/^data:[^;]+;base64,/, '');

  if (sanitized.length > maxLength) {
    return '';
  }

  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(sanitized)) {
    return '';
  }

  return sanitized;
}

export function isValidUuid(uuid: string | null | undefined): boolean {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }

  const trimmed = uuid.trim();
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  return uuidRegex.test(trimmed);
}

export function sanitizeUuid(uuid: string | null | undefined): string {
  if (!uuid || typeof uuid !== 'string') {
    return '';
  }

  const trimmed = uuid.trim();
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(trimmed)) {
    return '';
  }

  return trimmed.toLowerCase();
}

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
