import { Ionicons } from '@expo/vector-icons';
import React, { ReactNode } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

const CARD_RADIUS = 20;
const CARD_PADDING_H = 20;
const CARD_PADDING_V = 20;
const CARD_PADDING_V_COMPACT = 16;
const ICON_SIZE = 44;
const ICON_RADIUS = 12;
const softShadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.04,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};

type Props = {
  title?: string;
  titleVariant?: 'default' | 'subtle';
  leftIcon?: ReactNode | keyof typeof Ionicons.glyphMap;
  iconBoxStyle?: ViewStyle;
  children: ReactNode;
  compact?: boolean;
  style?: ViewStyle;
};

export function StaticCard({
  title,
  titleVariant = 'default',
  leftIcon,
  iconBoxStyle,
  children,
  compact = false,
  style,
}: Props) {
  const { theme } = useAppTheme();
  const paddingVertical = compact ? CARD_PADDING_V_COMPACT : CARD_PADDING_V;
  const titleStyle = titleVariant === 'subtle' ? styles.titleSubtle : styles.title;
  const iconContainerStyle = [styles.iconBox, { backgroundColor: theme.colors.border }, iconBoxStyle];

  const iconElement =
    typeof leftIcon === 'string' ? (
      <View style={iconContainerStyle}>
        <Ionicons
          name={leftIcon}
          size={20}
          color={theme.colors.primary}
          accessible={false}
          importantForAccessibility="no"
        />
      </View>
    ) : leftIcon ? (
      <View style={iconContainerStyle}>
        {leftIcon}
      </View>
    ) : null;

  const hasHeader = title != null || iconElement != null;

  return (
    <View
      style={[
        styles.outer,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          paddingHorizontal: CARD_PADDING_H,
          paddingVertical,
        },
        style,
      ]}
    >
      {hasHeader ? (
        <View style={styles.headerRow}>
          {iconElement}
          {title != null ? (
            <Text
              style={[titleStyle, { color: theme.colors.text }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
          ) : null}
        </View>
      ) : null}
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    ...softShadow,
    overflow: 'hidden',
    gap: baseTheme.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 18,
    letterSpacing: -0.2,
    flex: 1,
  },
  titleSubtle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 17,
    letterSpacing: -0.2,
    flex: 1,
  },
  body: {
    gap: 0,
  },
});
