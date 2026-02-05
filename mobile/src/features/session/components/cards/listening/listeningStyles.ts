import { Platform, StyleSheet } from 'react-native';

import { theme as baseTheme } from '@/services/theme/tokens';

/**
 * Shared styles for ListeningCard components.
 * Extracted to follow Single Responsibility Principle.
 */
export const listeningStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    minHeight: 0,
    gap: baseTheme.spacing.md,
    alignItems: 'stretch',
  },
  pronunciationContainer: {
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
    paddingVertical: baseTheme.spacing.lg,
    paddingHorizontal: baseTheme.spacing.lg,
  },

  // Instruction styles
  instruction: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },

  // Audio card styles
  audioCard: {
    alignItems: 'center',
    marginTop: baseTheme.spacing.sm,
    marginBottom: baseTheme.spacing.sm,
  },

  // Input styles
  inputCard: {
    width: '100%',
    gap: baseTheme.spacing.sm,
  },
  inputLabel: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 14,
    color: baseTheme.colors.text,
  },
  textInput: {
    borderWidth: 2,
    borderColor: baseTheme.colors.primary,
    borderRadius: 12,
    padding: baseTheme.spacing.md,
    fontSize: 18,
    fontFamily: baseTheme.typography.regular,
    color: baseTheme.colors.text,
    minHeight: 50,
  },

  // Check button
  checkButton: {
    backgroundColor: baseTheme.colors.primary,
    padding: baseTheme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: baseTheme.spacing.md,
  },
  checkButtonText: {
    color: '#fff',
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
  },

  // Result styles
  resultCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: baseTheme.spacing.lg,
    alignItems: 'center',
    gap: baseTheme.spacing.sm,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  resultCardCorrect: {
    backgroundColor: '#d4edda',
    borderWidth: 2,
    borderColor: '#28a745',
  },
  resultCardWrong: {
    backgroundColor: '#f8d7da',
    borderWidth: 2,
    borderColor: '#dc3545',
  },
  resultTitle: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 18,
    color: baseTheme.colors.text,
    textTransform: 'uppercase',
  },
  answerComparison: {
    width: '100%',
    gap: baseTheme.spacing.md,
  },
  answerRow: {
    gap: baseTheme.spacing.xs,
  },
  answerLabel: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 12,
    color: baseTheme.colors.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  answerValue: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 18,
    color: baseTheme.colors.text,
  },
  answerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.sm,
  },
  answerText: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 20,
    color: baseTheme.colors.text,
    flexShrink: 1,
  },

  // Info card
  infoCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: baseTheme.spacing.lg,
    gap: baseTheme.spacing.md,
  },
  infoLabel: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 12,
    color: baseTheme.colors.mutedText,
    textTransform: 'uppercase',
    marginBottom: baseTheme.spacing.xs,
  },
  infoText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 16,
    color: baseTheme.colors.text,
  },
  alsoCorrectSection: {
    marginTop: baseTheme.spacing.sm,
    gap: baseTheme.spacing.xs,
  },
  alsoCorrectTag: {
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: baseTheme.spacing.md,
    paddingVertical: baseTheme.spacing.xs,
    alignSelf: 'flex-start',
  },
  alsoCorrectText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    color: baseTheme.colors.text,
  },

  // Error & warning styles
  errorText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 12,
    color: '#dc3545',
    textAlign: 'center',
    marginTop: baseTheme.spacing.xs,
  },
  simulatorWarning: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: baseTheme.spacing.sm,
    marginTop: baseTheme.spacing.xs,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  warningText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 11,
    color: '#856404',
    textAlign: 'center',
    marginBottom: baseTheme.spacing.xs,
  },
  warningSubtext: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 10,
    color: '#856404',
    textAlign: 'center',
    marginTop: 2,
  },
});

/**
 * Styles specific to pronunciation/speak mode
 */
export const pronunciationStyles = StyleSheet.create({
  // Layout
  inputMiddle: {
    flex: 1,
    minHeight: 0,
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  phraseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    marginBottom: baseTheme.spacing.sm,
  },

  // Instruction
  instruction: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },

  // Phrase display
  phraseBlock: {
    alignItems: 'center',
    marginBottom: baseTheme.spacing.xl,
    paddingHorizontal: baseTheme.spacing.md,
    flexShrink: 1,
  },
  phraseBlockInInput: {
    marginBottom: baseTheme.spacing.sm,
    flex: 1,
    marginRight: baseTheme.spacing.md,
  },
  phrase: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 34,
    color: baseTheme.colors.text,
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: baseTheme.spacing.xs,
  },
  translation: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 15,
    color: baseTheme.colors.mutedText,
    textAlign: 'center',
  },

  // Tip box
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: baseTheme.radius.lg,
    paddingVertical: baseTheme.spacing.md,
    paddingHorizontal: baseTheme.spacing.lg,
    marginTop: baseTheme.spacing.xl,
    marginBottom: baseTheme.spacing.xl,
    borderWidth: 1,
    borderColor: baseTheme.colors.border,
  },
  tipBoxInInput: {
    marginTop: baseTheme.spacing.sm,
    marginBottom: baseTheme.spacing.sm,
  },
  tipIcon: {
    marginRight: baseTheme.spacing.sm,
  },
  tipText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    color: baseTheme.colors.mutedText,
    flex: 1,
  },

  // Record button
  recordSection: {
    alignItems: 'center',
    marginBottom: baseTheme.spacing.xl,
  },
  recordSectionInInput: {
    marginBottom: baseTheme.spacing.sm,
  },
  recordButton: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: baseTheme.spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  recordButtonActive: {
    backgroundColor: '#B91C1C',
    ...Platform.select({
      ios: {
        shadowOpacity: 0.25,
        shadowRadius: 14,
      },
      android: { elevation: 8 },
    }),
  },
  recordHint: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 13,
    color: baseTheme.colors.mutedText,
    textAlign: 'center',
  },

  // Loading screen
  loadingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: baseTheme.spacing.lg,
  },
  spinner: {
    marginBottom: baseTheme.spacing.lg,
  },
  loadingTitle: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 22,
    color: baseTheme.colors.text,
    textAlign: 'center',
  },

  // Result screen
  resultHeading: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  score: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 56,
    color: '#0D9488',
    marginBottom: baseTheme.spacing.xs,
  },
  scoreLabel: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 16,
    color: baseTheme.colors.text,
    marginBottom: baseTheme.spacing.md,
  },

  // Progress bar
  barContainer: {
    width: '100%',
    marginBottom: baseTheme.spacing.lg,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    position: 'relative',
  },
  barFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#14B8A6',
    borderRadius: 4,
  },
  barMarker: {
    position: 'absolute',
    top: -2,
    width: 4,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#22C55E',
    marginLeft: -2,
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 0,
  },
  barLabelText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 12,
    color: baseTheme.colors.mutedText,
  },

  // Word analysis
  analysisTitle: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 12,
    color: baseTheme.colors.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: baseTheme.spacing.xs,
    alignSelf: 'flex-start',
  },
  wordList: {
    width: '100%',
    gap: baseTheme.spacing.sm,
    marginBottom: baseTheme.spacing.md,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordIcon: {
    marginRight: 10,
  },
  wordText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 18,
    color: baseTheme.colors.text,
    flex: 1,
  },
  wordBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wordBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  wordBadgePerfect: {
    backgroundColor: '#DCFCE7',
  },
  wordBadgeImprove: {
    backgroundColor: '#FFEDD5',
  },
  wordBadgeText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 13,
  },
  wordBadgeTextPerfect: {
    color: '#166534',
  },
  wordBadgeTextImprove: {
    color: '#C2410C',
  },
  wordSpeaker: {
    padding: 4,
  },

  // Practice again button
  practiceAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#F97316',
    marginBottom: baseTheme.spacing.sm,
    gap: 8,
  },
  practiceAgainIcon: {
    marginRight: 4,
  },
  practiceAgainText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
    color: '#fff',
  },
});
