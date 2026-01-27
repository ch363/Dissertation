import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { useAppTheme } from '@/services/theme/ThemeProvider';

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
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },
});
