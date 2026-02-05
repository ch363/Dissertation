import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

import { theme as baseTheme } from '@/services/theme/tokens';

interface TryAgainButtonProps {
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

/**
 * Reusable "Try Again" button for session cards.
 * Shows refresh icon with consistent styling.
 *
 * @example
 * ```tsx
 * <TryAgainButton onPress={handleTryAgain} />
 * ```
 */
export function TryAgainButton({
  onPress,
  disabled = false,
  accessibilityLabel = 'Try again',
}: TryAgainButtonProps): JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons
        name="refresh"
        size={18}
        color={disabled ? baseTheme.colors.mutedText : baseTheme.colors.primary}
      />
      <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>Try Again</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: baseTheme.spacing.xs,
    paddingVertical: baseTheme.spacing.sm,
    paddingHorizontal: baseTheme.spacing.md,
    borderRadius: baseTheme.radius.md,
    backgroundColor: `${baseTheme.colors.primary}10`,
  },
  buttonDisabled: {
    backgroundColor: baseTheme.colors.surface,
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: baseTheme.colors.primary,
  },
  buttonTextDisabled: {
    color: baseTheme.colors.mutedText,
  },
});
