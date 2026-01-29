import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, StyleSheet } from 'react-native';

import { IconButton } from '@/components/ui/IconButton';
import { useAppTheme } from '@/services/theme/ThemeProvider';

type Props = {
  /** Use for dark headers (e.g. gradient) so the icon is visible */
  iconColor?: string;
  /** If provided, this runs instead of the default help alert (e.g. navigate to Help screen) */
  onPress?: () => void;
};

export function HelpButton({ iconColor, onPress: onPressOverride }: Props) {
  const { theme } = useAppTheme();
  const color = iconColor ?? theme.colors.mutedText;

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

  return (
    <IconButton
      onPress={onPress}
      accessibilityLabel="Help"
      accessibilityHint="Opens help information"
      style={styles.button}
      hitSlop={8}
    >
      <Ionicons name="help-circle-outline" size={22} color={color} />
    </IconButton>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 36,
    minHeight: 36,
  },
});
