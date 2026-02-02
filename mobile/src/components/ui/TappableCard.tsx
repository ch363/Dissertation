import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

const CARD_RADIUS = 18;
const CARD_PADDING_H = 16;
const CARD_PADDING_V = 16;
const ICON_SIZE = 52;
const ICON_RADIUS = 14;
const CHEVRON_SIZE = 20;
const softShadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.04,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};
const primaryShadow = {
  shadowColor: '#1d4ed8',
  shadowOpacity: 0.3,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
  elevation: 8,
};

type Props = {
  title: string;
  subtitle?: string;
  overline?: string;
  leftIcon?: ReactNode | keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  metaRow?: ReactNode;
  segmentedControl?: ReactNode;
  variant?: 'default' | 'primary';
  iconBackgroundColor?: string;
  style?: ViewStyle;
};

export function TappableCard({
  title,
  subtitle,
  overline,
  leftIcon,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  metaRow,
  segmentedControl,
  variant = 'default',
  iconBackgroundColor: iconBackgroundColorProp,
  style,
}: Props) {
  const { theme, isDark } = useAppTheme();
  const isPrimary = variant === 'primary';
  const bgColor = isPrimary ? theme.colors.primary : theme.colors.card;
  
  const gradientColors = isDark
    ? ['#1d4ed8', '#1e40af']
    : ['#2563eb', '#1d4ed8'];
  
  const overlineColor = isPrimary ? (isDark ? '#93c5fd' : '#bfdbfe') : theme.colors.mutedText;
  const titleColor = isPrimary ? '#FFFFFF' : theme.colors.text;
  const subtitleColor = isPrimary ? (isDark ? '#dbeafe' : '#dbeafe') : theme.colors.mutedText;
  const chevronColor = isPrimary ? '#FFFFFF' : theme.colors.text;
  
  const iconBgColor = iconBackgroundColorProp ?? 
    (isPrimary ? 'rgba(59, 130, 246, 0.4)' : theme.colors.border);

  const iconElement =
    typeof leftIcon === 'string' ? (
      <View style={[styles.iconBox, { backgroundColor: iconBgColor }]}>
      <Ionicons
        name={leftIcon as keyof typeof Ionicons.glyphMap}
        size={24}
        color={isPrimary ? '#FFFFFF' : theme.colors.text}
        accessible={false}
        importantForAccessibility="no"
      />
      </View>
    ) : leftIcon ? (
      <View style={[styles.iconBox, { backgroundColor: iconBgColor }]}>{leftIcon}</View>
    ) : null;

  const content = (
    <View style={styles.inner}>
      <View style={styles.topRow}>
        {iconElement}
        <View style={styles.textWrap}>
          {overline != null && overline !== '' ? (
            <Text
              style={[styles.overline, { color: overlineColor }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {overline}
            </Text>
          ) : null}
          <Text
            style={[styles.title, { color: titleColor }]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          {subtitle != null && subtitle !== '' ? (
            <Text
              style={[styles.subtitle, { color: subtitleColor }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Ionicons
          name="chevron-forward"
          size={CHEVRON_SIZE}
          color={chevronColor}
          style={[styles.chevron, isPrimary && { opacity: 1 }]}
          accessible={false}
          importantForAccessibility="no"
        />
      </View>
      {segmentedControl ? <View style={styles.segmentedWrap}>{segmentedControl}</View> : null}
      {metaRow ? <View style={styles.metaWrap}>{metaRow}</View> : null}
    </View>
  );

  if (isPrimary) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        onPress={onPress}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.outer, styles.primaryOuter, style]}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [
        styles.outer,
        { backgroundColor: bgColor, borderRadius: CARD_RADIUS },
        pressed && styles.pressed,
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    ...softShadow,
    overflow: 'hidden',
  },
  primaryOuter: {
    ...primaryShadow,
    borderRadius: CARD_RADIUS,
  },
  pressed: {
    opacity: 0.94,
  },
  inner: {
    paddingHorizontal: CARD_PADDING_H,
    paddingVertical: CARD_PADDING_V,
    gap: baseTheme.spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  overline: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 12,
    letterSpacing: 0.7,
    opacity: 1,
    marginBottom: 2,
  },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 23,
    lineHeight: 27,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    lineHeight: 18,
    marginTop: 2,
    opacity: 1,
  },
  chevron: {
    opacity: 0.4,
  },
  segmentedWrap: {
    marginTop: 6,
  },
  metaWrap: {
    marginTop: 2,
  },
});
