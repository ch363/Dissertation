import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: Props) {
  const { theme } = useAppTheme();
  const isDisabled = disabled || loading;

  const background =
    variant === 'ghost'
      ? 'transparent'
      : variant === 'secondary'
        ? theme.colors.secondary
        : theme.colors.primary;

  const textColor = isDisabled
    ? theme.colors.mutedText
    : variant === 'ghost'
      ? theme.colors.text
      : variant === 'secondary'
        ? theme.colors.onSecondary
        : theme.colors.onPrimary;
  const borderColor = variant === 'ghost' ? theme.colors.border : 'transparent';

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        {
          backgroundColor: isDisabled ? theme.colors.border : background,
          borderColor,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  text: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 17,
    letterSpacing: -0.2,
    textAlign: 'center',
    flexShrink: 1,
  },
});
