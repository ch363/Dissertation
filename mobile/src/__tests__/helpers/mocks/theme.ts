/**
 * Shared theme mocks for tests
 * Eliminates duplication of theme provider mocking across test files
 */

export const mockTheme = {
  colors: {
    primary: '#3b82f6',
    secondary: '#10b981',
    error: '#ef4444',
    text: '#1f2937',
    background: '#ffffff',
    card: '#f9fafb',
    surface: '#f3f4f6',
    border: '#e5e7eb',
    mutedText: '#6b7280',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
} as const;

/**
 * Mock implementation of useAppTheme hook
 * Use this in jest.mock() calls for @/services/theme/ThemeProvider
 */
export const mockUseAppTheme = () => ({ theme: mockTheme });

/**
 * Jest mock for ThemeProvider
 * Usage:
 * ```ts
 * jest.mock('@/services/theme/ThemeProvider', () => ({
 *   useAppTheme: mockUseAppTheme,
 * }));
 * ```
 */
export function setupThemeMock() {
  jest.mock('@/services/theme/ThemeProvider', () => ({
    useAppTheme: mockUseAppTheme,
  }));
}
