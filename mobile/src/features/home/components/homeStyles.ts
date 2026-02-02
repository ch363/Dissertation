export const CARD_RADIUS = 14;
export const OUTER_CARD_RADIUS = 16;
export const CARD_BORDER = '#E6ECF5';

/** iOS-style subtle shadow: softer and smaller */
export const softShadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 4,
};

/** Shared card layout tokens. Align with theme.spacing (md=16, lg=24). */
export const cardPaddingHorizontal = 18;
export const cardPaddingVertical = 14;
export const iconContainerSize = 40;
export const iconContainerRadius = 10;
export const cardGapBetweenRows = 10;

/** Card typography. Use numberOfLines 1–2 and ellipsizeMode="tail" on all card titles/subtitles. */
export const cardTitleFontSize = 17;
export const cardTitleFontSizeLarge = 19;
export const cardSubtitleFontSize = 14;
export const cardTitleLines = 2;
export const cardSubtitleLines = 2;
export const ellipsizeMode = 'tail' as const;

/** Compact card padding for reduced-height blocks (e.g. streak). */
export const cardPaddingVerticalCompact = 10;
