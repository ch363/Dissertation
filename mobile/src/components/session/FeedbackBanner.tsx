import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

interface FeedbackBannerProps {
  isCorrect: boolean;
  message?: string;
  details?: string;
  accessibilityLabel?: string;
}

/**
 * Reusable feedback banner for session cards.
 * Shows correct/incorrect status with optional message and details.
 *
 * @example
 * ```tsx
 * <FeedbackBanner
 *   isCorrect={true}
 *   message="Great job!"
 *   details="Your answer was perfect"
 * />
 * ```
 */
export function FeedbackBanner({
  isCorrect,
  message,
  details,
  accessibilityLabel,
}: FeedbackBannerProps): JSX.Element {
  const { theme } = useAppTheme();

  const backgroundColor = isCorrect ? `${theme.colors.secondary}20` : `${theme.colors.error}20`;

  const borderColor = isCorrect ? theme.colors.secondary : theme.colors.error;

  const textColor = isCorrect ? theme.colors.secondary : theme.colors.error;

  const iconName = isCorrect ? 'checkmark-circle' : 'close-circle';

  const defaultMessage = isCorrect ? 'Correct!' : 'Incorrect';

  return (
    <View
      style={[styles.container, { backgroundColor, borderColor }]}
      accessibilityRole="alert"
      accessibilityLabel={accessibilityLabel || `${defaultMessage}. ${message || ''}`}
    >
      <View style={styles.header}>
        <Ionicons
          name={iconName}
          size={24}
          color={textColor}
          accessible={false}
          importantForAccessibility="no"
        />
        <Text style={[styles.messageText, { color: textColor }]}>{message || defaultMessage}</Text>
      </View>
      {details && <Text style={[styles.detailsText, { color: theme.colors.text }]}>{details}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderRadius: baseTheme.radius.md,
    padding: baseTheme.spacing.md,
    marginBottom: baseTheme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.sm,
  },
  messageText: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  detailsText: {
    fontSize: 14,
    marginTop: baseTheme.spacing.sm,
    lineHeight: 20,
  },
});
