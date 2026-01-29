import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type Props = {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
};

export function TabBarButton({ label, iconName, isFocused, onPress, onLongPress }: Props) {
  const { theme } = useAppTheme();
  const activeColor = theme.colors.primary;
  const inactiveColor = theme.colors.mutedText;

  const innerBg = isFocused ? { backgroundColor: `${theme.colors.primary}12` } : undefined;

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
      accessibilityHint={`Switch to ${label} tab`}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.container}
      hitSlop={10}
    >
      <View style={[styles.inner, innerBg]}>
        <Ionicons
          name={iconName}
          size={26}
          color={isFocused ? activeColor : inactiveColor}
          style={styles.icon}
          accessible={false}
          importantForAccessibility="no"
        />
        <Text
          style={[
            styles.label,
            {
              color: isFocused ? activeColor : inactiveColor,
              fontFamily: isFocused ? baseTheme.typography.semiBold : baseTheme.typography.regular,
            },
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    paddingVertical: 4,
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
  },
  icon: {
    marginBottom: 1,
  },
  label: {
    fontSize: 11,
    flexShrink: 1,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
