import React from 'react';
import { Pressable, StyleSheet, View, type Insets, type ViewStyle } from 'react-native';

type Props = {
  accessibilityLabel: string;
  accessibilityHint?: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  style?: ViewStyle;
  hitSlop?: Insets | number;
  children: React.ReactNode;
  testID?: string;
};

export function IconButton({
  accessibilityLabel,
  accessibilityHint,
  onPress,
  disabled = false,
  busy = false,
  style,
  hitSlop = 10,
  children,
  testID,
}: Props) {
  const isDisabled = disabled || busy;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy }}
      onPress={onPress}
      disabled={isDisabled}
      hitSlop={hitSlop}
      style={[styles.base, style]}
    >
      {/* Icon content is decorative; label lives on the button itself */}
      <View accessible={false} importantForAccessibility="no">
        {children}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

