import { StyleSheet } from 'react-native';

import { theme as baseTheme } from '@/services/theme/tokens';

/**
 * Shared styles for session card components.
 * Ensures consistency across MultipleChoiceCard, TranslateCard, ListeningCard, etc.
 */
export const cardStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: baseTheme.spacing.lg,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: baseTheme.spacing.md,
    textAlign: 'center',
  },
  questionText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: baseTheme.spacing.xl,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: baseTheme.spacing.lg,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: baseTheme.radius.md,
    padding: baseTheme.spacing.md,
    fontSize: 18,
    minHeight: 50,
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingTop: baseTheme.spacing.lg,
  },
  feedbackContainer: {
    padding: baseTheme.spacing.md,
    borderRadius: baseTheme.radius.md,
    marginBottom: baseTheme.spacing.lg,
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: baseTheme.spacing.sm,
  },
  feedbackDetail: {
    fontSize: 14,
    lineHeight: 20,
  },
  optionButton: {
    borderWidth: 2,
    borderRadius: baseTheme.radius.md,
    padding: baseTheme.spacing.md,
    marginBottom: baseTheme.spacing.sm,
    minHeight: 50,
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  hintText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: baseTheme.spacing.sm,
    textAlign: 'center',
  },
});
