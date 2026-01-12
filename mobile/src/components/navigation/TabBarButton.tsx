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

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={label}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.container}
      hitSlop={10}
    >
      <View style={styles.inner}>
        <Ionicons
          name={iconName}
          size={26}
          color={isFocused ? activeColor : inactiveColor}
          style={styles.icon}
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
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  icon: {
    marginBottom: 2,
  },
  label: {
    fontSize: 12,
  },
});
