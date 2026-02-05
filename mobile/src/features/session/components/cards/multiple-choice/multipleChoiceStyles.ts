import { StyleSheet } from 'react-native';

import { CARD_TYPE_COLORS } from '@/features/session/constants/cardTypeColors';
import { theme as baseTheme } from '@/services/theme/tokens';

// Figma design tokens (from MultipleChoiceScreen – blue/indigo/slate/emerald)
export const FIGMA = {
  instruction: CARD_TYPE_COLORS.multipleChoice.instruction,
  word: '#0f172a', // slate-900
  optionBorder: '#e2e8f0', // slate-200
  optionBorderHover: '#cbd5e1', // slate-300
  optionText: '#334155', // slate-700
  optionTextSelected: '#0f172a', // slate-900
  optionSelectedBg: ['#eff6ff', '#eef2ff'] as const, // blue-50 → indigo-50
  optionSelectedBorder: '#60a5fa', // blue-400
  optionCorrectBorder: '#059669', // emerald-600
  optionCorrectBg: 'rgba(5, 150, 105, 0.12)',
  optionIncorrectBorder: '#dc2626', // red-600
  optionIncorrectBg: 'rgba(220, 38, 38, 0.12)',
  optionBg: 'rgba(255, 255, 255, 0.8)',
  ctaGradient: ['#2563eb', '#4f46e5'] as const,
  ctaDisabledBg: '#e2e8f0', // slate-200
  ctaDisabledText: '#94a3b8', // slate-400
  ctaText: '#FFFFFF',
  feedbackSuccess: '#059669',
} as const;

const OPTION_PADDING_H = 24;
const OPTION_PADDING_V = 16;
const RADIUS_OPTION = 16;
const RADIUS_CTA = 20;
const CTA_HEIGHT = 56;

/**
 * Styles for MultipleChoiceCard component.
 */
export const multipleChoiceStyles = StyleSheet.create({
  container: {
    flex: 1,
    gap: baseTheme.spacing.md,
  },
  instruction: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 24,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 32,
    borderLeftWidth: 3,
    borderLeftColor: CARD_TYPE_COLORS.multipleChoice.border,
    paddingLeft: baseTheme.spacing.sm,
    borderRadius: baseTheme.radius.sm,
  },
  sourceText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 24,
    flex: 1,
  },
  prompt: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 20,
    marginBottom: baseTheme.spacing.sm,
  },
  optionsContainer: {
    gap: 12,
  },
  optionOuter: {
    borderRadius: RADIUS_OPTION,
    borderWidth: 2,
    overflow: 'hidden',
  },
  optionSelectedShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  optionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: OPTION_PADDING_H,
    paddingVertical: OPTION_PADDING_V,
    borderRadius: RADIUS_OPTION - 2,
    minHeight: 56,
  },
  optionLabel: {
    fontFamily: baseTheme.typography.medium,
    fontSize: 16,
    flex: 1,
  },
  errorContainer: {
    padding: baseTheme.spacing.lg,
    borderRadius: RADIUS_OPTION,
    borderWidth: 2,
  },
  errorText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    textAlign: 'center',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: baseTheme.spacing.xs,
    paddingVertical: baseTheme.spacing.sm,
    paddingHorizontal: baseTheme.spacing.md,
    borderRadius: RADIUS_OPTION,
  },
  feedbackText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 14,
  },
  ctaWrap: {
    alignSelf: 'stretch',
  },
  ctaDisabled: {
    opacity: 1,
  },
  ctaPressed: {
    opacity: 0.95,
  },
  ctaButton: {
    height: CTA_HEIGHT,
    borderRadius: RADIUS_CTA,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 4,
  },
  ctaText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
  },
  tryAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: baseTheme.spacing.xs,
    paddingVertical: baseTheme.spacing.sm,
    paddingHorizontal: baseTheme.spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: baseTheme.colors.primary,
    backgroundColor: '#fff',
    marginTop: baseTheme.spacing.xs,
  },
  tryAgainButtonText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 14,
    color: baseTheme.colors.primary,
  },
});
