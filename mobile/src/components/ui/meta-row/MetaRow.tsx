import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type Props = {
  text: string;
  icon?: keyof typeof Ionicons.glyphMap;
  textColor?: string;
  style?: ViewStyle;
};

export function MetaRow({ text, icon, textColor, style }: Props) {
  const { theme } = useAppTheme();
  const color = textColor ?? theme.colors.mutedText;

  return (
    <View style={[styles.row, style]}>
      {icon ? (
        <Ionicons
          name={icon}
          size={16}
          color={color}
          style={styles.icon}
          accessible={false}
          importantForAccessibility="no"
        />
      ) : null}
      <Text style={[styles.text, { color }]} numberOfLines={1} ellipsizeMode="tail">
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    opacity: 0.9,
    marginTop: -1,
  },
  text: {
    fontFamily: baseTheme.typography.medium,
    fontSize: 15,
    opacity: 0.95,
  },
});
