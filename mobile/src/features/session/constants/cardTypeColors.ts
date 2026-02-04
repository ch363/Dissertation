/**
 * Color coding for card/delivery types
 *
 * Following HCI best practices for recognition over recall:
 * - Each delivery method has a distinct, semantically meaningful color
 * - Colors are applied consistently to borders and instruction labels
 * - WCAG AA compliant for accessibility
 * - Subtle but effective visual differentiation
 */

export const CARD_TYPE_COLORS = {
  // Teaching cards - Calm blue (learning new content)
  teach: {
    primary: '#3B82F6', // blue-500
    border: '#60A5FA', // blue-400
    instruction: '#2563EB', // blue-600
    light: '#DBEAFE', // blue-100
  },

  // Multiple choice - Vibrant purple (recall and selection)
  multipleChoice: {
    primary: '#8B5CF6', // violet-500
    border: '#A78BFA', // violet-400
    instruction: '#7C3AED', // violet-600
    light: '#EDE9FE', // violet-100
  },

  // Fill in the blank - Warm amber (partial recall with context)
  fillBlank: {
    primary: '#F59E0B', // amber-500
    border: '#FBBF24', // amber-400
    instruction: '#D97706', // amber-600
    light: '#FEF3C7', // amber-100
  },

  // Translation - Emerald green (production/creation)
  translate: {
    primary: '#10B981', // emerald-500
    border: '#34D399', // emerald-400
    instruction: '#059669', // emerald-600
    light: '#D1FAE5', // emerald-100
  },

  // Listening (Type What You Hear) - Teal (audio input)
  listeningType: {
    primary: '#14B8A6', // teal-500
    border: '#2DD4BF', // teal-400
    instruction: '#0D9488', // teal-600
    light: '#CCFBF1', // teal-100
  },

  // Pronunciation (Speak) - Coral/orange (speech output)
  listeningSpeak: {
    primary: '#F97316', // orange-500
    border: '#FB923C', // orange-400
    instruction: '#EA580C', // orange-600
    light: '#FFEDD5', // orange-100
  },
} as const;

/**
 * Get card type colors based on CardKind
 */
export function getCardTypeColors(cardKind: string) {
  switch (cardKind) {
    case 'teach':
      return CARD_TYPE_COLORS.teach;
    case 'mcq':
      return CARD_TYPE_COLORS.multipleChoice;
    case 'fill_blank':
      return CARD_TYPE_COLORS.fillBlank;
    case 'translate_to_en':
    case 'translate_from_en':
      return CARD_TYPE_COLORS.translate;
    case 'listening':
      // Will need mode to distinguish, default to type
      return CARD_TYPE_COLORS.listeningType;
    default:
      return CARD_TYPE_COLORS.teach;
  }
}

/**
 * Get listening card colors based on mode
 */
export function getListeningCardColors(mode?: 'type' | 'speak') {
  return mode === 'speak' ? CARD_TYPE_COLORS.listeningSpeak : CARD_TYPE_COLORS.listeningType;
}
