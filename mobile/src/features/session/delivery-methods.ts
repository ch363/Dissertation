/**
 * Delivery Method Constants and Mapping
 *
 * This file defines the mapping between backend delivery methods and frontend card types.
 * It serves as the single source of truth for how delivery methods are handled in the UI.
 */

import { CardKind } from '@/types/session';

/**
 * Backend delivery methods (matching Prisma DELIVERY_METHOD enum)
 */
export const DELIVERY_METHOD = {
  FILL_BLANK: 'FILL_BLANK',
  FLASHCARD: 'FLASHCARD',
  MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
  SPEECH_TO_TEXT: 'SPEECH_TO_TEXT',
  TEXT_TO_SPEECH: 'TEXT_TO_SPEECH',
  TEXT_TRANSLATION: 'TEXT_TRANSLATION',
} as const;

export type DeliveryMethod = (typeof DELIVERY_METHOD)[keyof typeof DELIVERY_METHOD];

/**
 * Mapping from backend delivery method to frontend CardKind
 */
export const DELIVERY_METHOD_TO_CARD_KIND: Record<DeliveryMethod, CardKind> = {
  [DELIVERY_METHOD.MULTIPLE_CHOICE]: CardKind.MultipleChoice,
  [DELIVERY_METHOD.FILL_BLANK]: CardKind.FillBlank,
  [DELIVERY_METHOD.TEXT_TRANSLATION]: CardKind.TranslateToEn, // Direction determined by content
  [DELIVERY_METHOD.FLASHCARD]: CardKind.TranslateToEn, // Flashcard uses translation format
  [DELIVERY_METHOD.SPEECH_TO_TEXT]: CardKind.Listening,
  [DELIVERY_METHOD.TEXT_TO_SPEECH]: CardKind.Listening,
};

/**
 * Get the CardKind for a delivery method
 */
export function getCardKindForDeliveryMethod(
  deliveryMethod: DeliveryMethod,
  isItalianToEnglish?: boolean,
): CardKind {
  if (deliveryMethod === DELIVERY_METHOD.TEXT_TRANSLATION) {
    return isItalianToEnglish ? CardKind.TranslateToEn : CardKind.TranslateFromEn;
  }
  return DELIVERY_METHOD_TO_CARD_KIND[deliveryMethod];
}

/**
 * Check if a delivery method requires user input
 */
export function requiresInput(deliveryMethod: DeliveryMethod): boolean {
  return [
    DELIVERY_METHOD.FILL_BLANK,
    DELIVERY_METHOD.TEXT_TRANSLATION,
    DELIVERY_METHOD.FLASHCARD,
    DELIVERY_METHOD.SPEECH_TO_TEXT,
    DELIVERY_METHOD.TEXT_TO_SPEECH,
  ].includes(deliveryMethod);
}

/**
 * Check if a delivery method requires selection (e.g., multiple choice)
 */
export function requiresSelection(deliveryMethod: DeliveryMethod): boolean {
  return deliveryMethod === DELIVERY_METHOD.MULTIPLE_CHOICE;
}

/**
 * Reverse mapping: Get delivery method from CardKind
 * Note: This is a best-effort mapping. Some card kinds (like TranslateToEn vs TranslateFromEn)
 * both map to TEXT_TRANSLATION, and Listening can be SPEECH_TO_TEXT or TEXT_TO_SPEECH.
 * For validation, we'll use the most common mapping.
 */
export function getDeliveryMethodForCardKind(
  cardKind: CardKind,
  isFlashcard?: boolean,
): DeliveryMethod {
  if (cardKind === CardKind.MultipleChoice) {
    return DELIVERY_METHOD.MULTIPLE_CHOICE;
  }
  if (cardKind === CardKind.FillBlank) {
    return DELIVERY_METHOD.FILL_BLANK;
  }
  if (cardKind === CardKind.TranslateToEn || cardKind === CardKind.TranslateFromEn) {
    return isFlashcard ? DELIVERY_METHOD.FLASHCARD : DELIVERY_METHOD.TEXT_TRANSLATION;
  }
  if (cardKind === CardKind.Listening) {
    // Default to SPEECH_TO_TEXT for listening cards
    // Could be enhanced to check card.mode if available
    return DELIVERY_METHOD.SPEECH_TO_TEXT;
  }
  // Default fallback (shouldn't happen for practice cards)
  return DELIVERY_METHOD.TEXT_TRANSLATION;
}
