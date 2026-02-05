import { StyleSheet } from 'react-native';

import { theme as baseTheme } from '@/services/theme/tokens';

/**
 * Styles for FillBlankCard component.
 */
export const fillBlankStyles = StyleSheet.create({
  container: {
    gap: baseTheme.spacing.md,
  },
  instruction: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  questionCard: {
    borderRadius: 16,
    padding: baseTheme.spacing.lg,
    gap: baseTheme.spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.xs,
    marginBottom: baseTheme.spacing.sm,
  },
  audioLabel: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
  },
  sentenceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: baseTheme.spacing.xs,
  },
  sentenceText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 18,
    lineHeight: 28,
  },
  blankField: {
    minWidth: 100,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: baseTheme.spacing.md,
    paddingVertical: baseTheme.spacing.xs,
    flexDirection: 'row',
    gap: baseTheme.spacing.xs,
  },
  blankIcon: {
    marginLeft: baseTheme.spacing.xs,
  },
  blankText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 18,
    minHeight: 20,
  },
  optionsCard: {
    borderRadius: 16,
    padding: baseTheme.spacing.lg,
    gap: baseTheme.spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  optionsLabel: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 12,
    color: baseTheme.colors.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: baseTheme.spacing.xs,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: baseTheme.spacing.md,
  },
  optionButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: baseTheme.spacing.md,
    paddingHorizontal: baseTheme.spacing.sm,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    flexDirection: 'row',
    gap: baseTheme.spacing.xs,
  },
  optionIcon: {
    marginLeft: baseTheme.spacing.xs,
  },
  optionText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
  },
});
