export type Theme = {
  colors: {
    primary: string;
    secondary: string;
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
  regular: 'Inter_400Regular',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const lightTheme: Theme = {
  colors: {
    primary: '#1F7AE0',
    secondary: '#12BFA1',
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
