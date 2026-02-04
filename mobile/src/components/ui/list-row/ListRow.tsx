import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type Variant = 'default' | 'destructive';

type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  variant?: Variant;
  style?: ViewStyle;
  testID?: string;
};

export function ListRow({
  title,
  subtitle,
  right,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  variant = 'default',
  style,
  testID,
}: Props) {
  const { theme } = useAppTheme();
  const titleColor = variant === 'destructive' ? theme.colors.error : theme.colors.text;
  const subtitleColor = theme.colors.mutedText;

  const content = (
    <>
      <View style={styles.left}>
        <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: subtitleColor }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </>
  );

  if (!onPress) {
    return (
      <View style={[styles.row, style]} testID={testID}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.9 : 1 }, style]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: baseTheme.spacing.md,
    paddingHorizontal: baseTheme.spacing.md,
    minHeight: 52,
  },
  left: {
    flex: 1,
    paddingRight: baseTheme.spacing.md,
    gap: 2,
  },
  right: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 16,
    flexShrink: 1,
  },
  subtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 12,
    lineHeight: 16,
    flexShrink: 1,
  },
});
