import { StyleSheet } from 'react-native';

import { theme as baseTheme } from '@/services/theme/tokens';

// Professional App Redesign / Figma (LessonScreen) colours
export const CARD_GRADIENT = ['#eff6ff', '#e0e7ff', '#eff6ff'] as const;
export const USAGE_CARD_BG = 'rgba(248, 250, 252, 0.8)';
export const USAGE_ICON_SLATE = '#94a3b8';
export const CARD_RADIUS = 32;
export const USAGE_RADIUS = 24;

/**
 * Styles for TeachCard component.
 */
export const teachStyles = StyleSheet.create({
  container: {
    gap: baseTheme.spacing.lg,
  },
  teachCard: {
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    paddingHorizontal: baseTheme.spacing.xl,
    paddingVertical: baseTheme.spacing.xl + 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    overflow: 'hidden',
  },
  teachCardSpeaking: {
    borderColor: 'rgba(59, 130, 246, 0.4)',
    shadowOpacity: 0.1,
  },
  teachCardInner: {
    alignItems: 'center',
    gap: baseTheme.spacing.md,
  },
  teachEmoji: {
    fontSize: 48,
    marginBottom: baseTheme.spacing.xs,
  },
  phraseBlock: {
    alignItems: 'center',
    gap: baseTheme.spacing.xs,
    marginBottom: baseTheme.spacing.sm,
    paddingTop: 4,
  },
  teachPhrase: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 56,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 68,
  },
  teachTranslation: {
    fontFamily: baseTheme.typography.medium,
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 24,
  },
  usageNoteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingHorizontal: baseTheme.spacing.md + 4,
    paddingVertical: baseTheme.spacing.md,
    borderRadius: USAGE_RADIUS,
    backgroundColor: USAGE_CARD_BG,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
  },
  usageNoteIcon: {
    marginTop: 2,
  },
  usageNoteText: {
    flex: 1,
    fontFamily: baseTheme.typography.regular,
    fontSize: 15,
    lineHeight: 22,
  },
});
