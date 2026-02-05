/**
 * Form validation utilities
 * Consolidates validation logic used across authentication screens
 */

/**
 * Email validation regex
 * Simple pattern checking for email format
 */
export const EMAIL_REGEX = /\S+@\S+\.\S+/;

/**
 * Validate email address format
 * @param email Email string to validate
 * @returns Error message if invalid, null if valid
 */
export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (trimmed.length > 0 && !EMAIL_REGEX.test(trimmed)) {
    return 'Enter a valid email address.';
  }
  return null;
}

/**
 * Validate password meets minimum length requirement
 * @param password Password string to validate
 * @param minLength Minimum length (default 8)
 * @returns Error message if invalid, null if valid
 */
export function validatePassword(
  password: string,
  minLength: number = 8,
): string | null {
  if (password.length > 0 && password.length < minLength) {
    return `Password must be at least ${minLength} characters.`;
  }
  return null;
}

/**
 * Validate that two passwords match
 * @param password First password
 * @param confirmPassword Second password to confirm
 * @returns Error message if they don't match, null if they match
 */
export function validatePasswordMatch(
  password: string,
  confirmPassword: string,
): string | null {
  if (confirmPassword.length > 0 && password !== confirmPassword) {
    return 'Passwords do not match.';
  }
  return null;
}
