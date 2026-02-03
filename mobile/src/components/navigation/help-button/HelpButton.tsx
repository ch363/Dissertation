import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/ui';
import { routes } from '@/services/navigation/routes';
import { useAppTheme } from '@/services/theme/ThemeProvider';

type Props = {
  iconColor?: string;
  onPress?: () => void;
  variant?: 'default' | 'elevated';
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

const ELEVATED_SIZE = 40;

export function HelpButton({
  iconColor,
  onPress: onPressOverride,
  variant = 'default',
  accessibilityLabel: a11yLabel,
  accessibilityHint: a11yHint,
}: Props) {
  const { theme } = useAppTheme();
  const isElevated = variant === 'elevated';
  const color =
    iconColor ?? (isElevated ? theme.colors.text : theme.colors.mutedText);

  const pathname = usePathname();
  const onPress = () => {
    if (onPressOverride) {
      onPressOverride();
      return;
    }
    router.push({
      pathname: routes.tabs.settings.faq,
      params: pathname ? { returnTo: pathname } : undefined,
    });
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
          accessibilityLabel={a11yLabel ?? 'Help'}
          accessibilityHint={a11yHint ?? 'Opens FAQ'}
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
      accessibilityLabel={a11yLabel ?? 'Help'}
      accessibilityHint={a11yHint ?? 'Opens FAQ'}
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
