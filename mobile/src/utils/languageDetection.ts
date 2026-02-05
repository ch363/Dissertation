/**
 * Language detection utilities for TTS and speech recognition.
 * Centralizes language detection logic used across card components.
 */

/** Common Italian words for detection */
const COMMON_ITALIAN_WORDS = [
  'ciao',
  'grazie',
  'prego',
  'scusa',
  'bene',
  'sì',
  'no',
  'buongiorno',
  'buonasera',
  'arrivederci',
  'per favore',
  'acqua',
  'vino',
  'formaggio',
];

/** Common Spanish words for detection */
const COMMON_SPANISH_WORDS = [
  'agua',
  'vino',
  'hola',
  'gracias',
  'sí',
  'no',
  'buenos días',
  'por favor',
];

/**
 * Checks if text contains Italian diacritical characters.
 */
export function hasItalianChars(text: string): boolean {
  return /[àèéìíîòóùú]/.test(text);
}

/**
 * Checks if text contains Spanish diacritical characters.
 */
export function hasSpanishChars(text: string): boolean {
  return /[ñáéíóúü¿¡]/.test(text);
}

/**
 * Checks if text is a common Italian word.
 */
export function isCommonItalianWord(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return COMMON_ITALIAN_WORDS.some((word) => normalized === word);
}

/**
 * Checks if text is a common Spanish word.
 */
export function isCommonSpanishWord(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return COMMON_SPANISH_WORDS.some((word) => normalized === word);
}

/**
 * Determines if text appears to be in a target language (Italian/Spanish) rather than English.
 * Used to decide whether to play TTS for option/answer text.
 *
 * @param text - The text to analyze
 * @returns true if text appears to be Italian or Spanish
 */
export function isTargetLanguageText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  return (
    hasItalianChars(trimmed) ||
    hasSpanishChars(trimmed) ||
    isCommonItalianWord(trimmed) ||
    isCommonSpanishWord(trimmed)
  );
}

/**
 * Determines the appropriate language code for TTS based on text content.
 *
 * @param text - The text to analyze
 * @param defaultLanguage - Default language if detection fails (default: 'it-IT')
 * @returns Language code for TTS (e.g., 'it-IT', 'es-ES')
 */
export function detectLanguageForTts(
  text: string,
  defaultLanguage: string = 'it-IT',
): string {
  const trimmed = text.trim();

  if (hasSpanishChars(trimmed) || isCommonSpanishWord(trimmed)) {
    return 'es-ES';
  }

  if (hasItalianChars(trimmed) || isCommonItalianWord(trimmed)) {
    return 'it-IT';
  }

  return defaultLanguage;
}
