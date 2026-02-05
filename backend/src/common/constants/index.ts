/**
 * Common constants used throughout the backend
 * Extracted to avoid magic numbers and improve maintainability
 */

// ============================================================================
// Time Constants
// ============================================================================
export const MS_PER_SECOND = 1000;
export const SECONDS_PER_MINUTE = 60;
export const MINUTES_PER_HOUR = 60;
export const HOURS_PER_DAY = 24;
export const DAYS_PER_WEEK = 7;

// Derived time constants
export const MS_PER_MINUTE = MS_PER_SECOND * SECONDS_PER_MINUTE;
export const MS_PER_HOUR = MS_PER_MINUTE * MINUTES_PER_HOUR;
export const MS_PER_DAY = MS_PER_HOUR * HOURS_PER_DAY;
export const SECONDS_PER_DAY =
  SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY;

// ============================================================================
// Scoring Constants
// ============================================================================
export const FULL_SCORE = 100;
export const ZERO_SCORE = 0;
export const PASS_THRESHOLD_PERCENTAGE = 50;
export const MAX_PERCENTAGE_CHANGE = 100;

// ============================================================================
// Input Limits
// ============================================================================
export const DEFAULT_MAX_STRING_LENGTH = 10000;
export const DEFAULT_MAX_BASE64_LENGTH = 13333333; // ~10MB in base64
export const DEFAULT_BODY_LIMIT = '15mb';

// Content field limits
export const MAX_TITLE_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 5000;
export const MAX_URL_LENGTH = 2048;
export const MAX_OTHER_TEXT_LENGTH = 500;

// ============================================================================
// Pagination and Query Limits
// ============================================================================
export const DEFAULT_SUGGESTIONS_LIMIT = 3;
export const DEFAULT_RECENT_ATTEMPTS_LIMIT = 10;
export const MAX_LEARNING_STYLES = 4;

// ============================================================================
// Audio Processing Constants
// ============================================================================
export const DEFAULT_SAMPLE_RATE_HZ = 16000;
export const DEFAULT_BITS_PER_SAMPLE = 16;
export const DEFAULT_AUDIO_CHANNELS = 1;
export const MAX_AUDIO_DURATION_SECONDS = 35;

// ============================================================================
// Progress and Streak Constants
// ============================================================================
export const DAYS_FOR_STREAK_CALCULATION = 30;

// ============================================================================
// Sanitization Constants
// ============================================================================
export const MAX_SANITIZATION_ITERATIONS = 3;
