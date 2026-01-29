import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/ui/IconButton';
import { useAppTheme } from '@/services/theme/ThemeProvider';

type Props = {
  /** Use for dark headers (e.g. gradient) so the icon is visible */
  iconColor?: string;
  /** If provided, this runs instead of the default help alert (e.g. navigate to Help screen) */
  onPress?: () => void;
  /** Elevated: subtle circle, border and shadow for a refined, high-end look */
  variant?: 'default' | 'elevated';
};

const ELEVATED_SIZE = 40;

export function HelpButton({ iconColor, onPress: onPressOverride, variant = 'default' }: Props) {
  const { theme } = useAppTheme();
  const isElevated = variant === 'elevated';
  const color =
    iconColor ?? (isElevated ? theme.colors.text : theme.colors.mutedText);

  const onPress = () => {
    if (onPressOverride) {
      onPressOverride();
      return;
    }
    Alert.alert(
      'Help',
      'Need a hand? You can adjust your preferences in Settings, or explore Learn to continue your journey.',
      [{ text: 'Got it', style: 'default' }],
    );
  };

  const icon = (
    <Ionicons
      name="help-circle-outline"
      size={isElevated ? 20 : 22}
      color={color}
    />
  );

  if (isElevated) {
    return (
      <View
        style={[
          styles.elevatedWrap,
          {
            width: ELEVATED_SIZE,
            height: ELEVATED_SIZE,
            borderRadius: ELEVATED_SIZE / 2,
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <IconButton
          onPress={onPress}
          accessibilityLabel="Help"
          accessibilityHint="Opens help information"
          style={styles.elevatedButton}
          hitSlop={8}
        >
          {icon}
        </IconButton>
      </View>
    );
  }

  return (
    <IconButton
      onPress={onPress}
      accessibilityLabel="Help"
      accessibilityHint="Opens help information"
      style={styles.button}
      hitSlop={8}
    >
      {icon}
    </IconButton>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 36,
    minHeight: 36,
  },
  elevatedWrap: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D1B2A',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  elevatedButton: {
    width: ELEVATED_SIZE,
    height: ELEVATED_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
