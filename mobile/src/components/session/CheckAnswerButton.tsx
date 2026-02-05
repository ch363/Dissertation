import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

import { theme as baseTheme } from '@/services/theme/tokens';

interface CheckAnswerButtonProps {
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

/**
 * Reusable "Check Answer" button for session cards.
 * Shows with consistent primary button styling.
 *
 * @example
 * ```tsx
 * <CheckAnswerButton
 *   onPress={handleCheckAnswer}
 *   disabled={!userAnswer}
 * />
 * ```
 */
export function CheckAnswerButton({
  onPress,
  disabled = false,
  accessibilityLabel = 'Check answer',
}: CheckAnswerButtonProps): JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>Check Answer</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: baseTheme.spacing.md,
    paddingHorizontal: baseTheme.spacing.lg,
    borderRadius: baseTheme.radius.md,
    backgroundColor: baseTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: baseTheme.colors.surface,
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonTextDisabled: {
    color: baseTheme.colors.mutedText,
  },
});
