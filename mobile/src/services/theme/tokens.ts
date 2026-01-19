export type Theme = {
  colors: {
    primary: string;
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
    semiBold: string;
    bold: string;
  };
};

const spacing = { xs: 8, sm: 12, md: 16, lg: 24, xl: 32 } as const;
const radius = { sm: 8, md: 12, lg: 16, round: 999 } as const;
const typography = {
  regular: 'Poppins_400Regular',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
} as const;

export const lightTheme: Theme = {
  colors: {
    // WCAG AA: ensure contrast for links and primary buttons
    primary: '#1A6FD6',
    secondary: '#12BFA1',
    onPrimary: '#FFFFFF',
    // Secondary is bright; dark text provides accessible contrast
    onSecondary: '#0E141B',
    // Use primary for link text to meet contrast on light backgrounds
    link: '#1A6FD6',
    background: '#F4F8FF',
    success: '#34C759',
    error: '#FF3B30',
    text: '#0D1B2A',
    mutedText: '#5B6C84',
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
    secondary: '#26D4BA',
    // Primary is light in dark mode; use dark text for accessible contrast
    onPrimary: '#0E141B',
    onSecondary: '#0E141B',
    link: '#62A0FF',
    background: '#0E141B',
    success: '#30D158',
    error: '#FF453A',
    text: '#E6EEF8',
    mutedText: '#9FB1C6',
    card: '#172435',
    border: '#2A3A4F',
  },
  spacing,
  radius,
  typography,
};

// Backward-compatible named export; some files import { theme }
export const theme = lightTheme;
