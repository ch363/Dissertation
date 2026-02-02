/** Blue used for primary CTA cards (main card background). Matches design: #264FD4 */
export const CTA_CARD_BLUE = '#264FD4';
/** Lighter blue for icon/button areas on CTA cards. Matches design: #4D74ED */
export const CTA_CARD_ACCENT = '#4D74ED';

export type Theme = {
  colors: {
    primary: string;
    /** Accent for icon/button on blue CTA cards */
    ctaCardAccent: string;
    /** Profile header / top banner gradient (darker blue in dark mode) */
    profileHeader: string;
    secondary: string;
    onPrimary: string;
    onSecondary: string;
    link: string;
    background: string;
    success: string;
    error: string;
    text: string;
    mutedText: string;
    card: string;
    border: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    round: number;
  };
  typography: {
    regular: string;
    medium: string;
    semiBold: string;
    bold: string;
  };
};

const spacing = { xs: 8, sm: 12, md: 16, lg: 24, xl: 32 } as const;
const radius = { sm: 8, md: 12, lg: 16, round: 999 } as const;
const typography = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
} as const;

export const lightTheme: Theme = {
  colors: {
    // WCAG AA: ensure contrast for links and primary buttons; matches blue CTA card
    primary: CTA_CARD_BLUE,
    ctaCardAccent: CTA_CARD_ACCENT,
    profileHeader: CTA_CARD_BLUE,
    secondary: '#12BFA1',
    onPrimary: '#FFFFFF',
    // Secondary is bright; dark text provides accessible contrast
    onSecondary: '#0E141B',
    // Use primary for link text to meet contrast on light backgrounds
    link: CTA_CARD_BLUE,
    background: '#F4F8FF',
    // Darker success/error hues to meet WCAG AA when used as text on light surfaces.
    success: '#2E7D32',
    error: '#D32F2F',
    text: '#0D1B2A',
    // Darkened for WCAG AA and low-vision readability (≥4.5:1 on card/background)
    mutedText: '#4A5A70',
    card: '#FFFFFF',
    border: '#E5EAF2',
  },
  spacing,
  radius,
  typography,
};

export const darkTheme: Theme = {
  colors: {
    primary: '#62A0FF',
    ctaCardAccent: '#6B8FED',
    /** Darker blue for profile top card so it doesn’t compete with bright primary */
    profileHeader: '#2E4A8F',
    secondary: '#26D4BA',
    // Primary is light in dark mode; use dark text for accessible contrast
    onPrimary: '#0E141B',
    onSecondary: '#0E141B',
    link: '#62A0FF',
    background: '#0E141B',
    success: '#30D158',
    error: '#FF453A',
    text: '#E6EEF8',
    // Slightly darker for clearer contrast on dark surfaces
    mutedText: '#8A9FB8',
    card: '#172435',
    border: '#2A3A4F',
  },
  spacing,
  radius,
  typography,
};

// Backward-compatible named export; some files import { theme }
export const theme = lightTheme;
