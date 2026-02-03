import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HelpButton } from '../help-button/HelpButton';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type Props = {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  label?: string;
  onBackPress?: () => void;
  backLabel?: string;
  showHelp?: boolean;
  showHome?: boolean;
  accentColor?: string;
};

export function ScreenHeader({
  title,
  subtitle,
  icon = 'star-outline',
  label,
  onBackPress,
  backLabel = 'Back',
  showHelp = true,
  showHome = false,
  accentColor,
}: Props) {
  const { theme, isDark } = useAppTheme();
  const primaryColor = accentColor || theme.colors.primary;
  const gradientStart = isDark ? `${primaryColor}18` : `${primaryColor}0C`;
  const gradientEnd = isDark ? `${primaryColor}06` : `${primaryColor}04`;
  const accentBg = isDark ? `${primaryColor}28` : `${primaryColor}1A`;

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const handleHome = () => {
    router.dismissAll();
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.outer}>
      <LinearGradient
        colors={[gradientStart, gradientEnd, 'transparent']}
        locations={[0, 0.6, 1]}
        style={styles.gradient}
      >
        <View style={styles.topRow}>
          {/* Back Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Back to ${backLabel}`}
            hitSlop={12}
            onPress={handleBack}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && { backgroundColor: theme.colors.border },
            ]}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </Pressable>

          {/* Right Actions */}
          <View style={styles.rightActions}>
            {showHelp && (
              <HelpButton
                variant="elevated"
                accessibilityLabel={`Help, ${title}`}
                accessibilityHint="Opens help information"
              />
            )}
            {showHome && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go to Home"
                hitSlop={12}
                onPress={handleHome}
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && { backgroundColor: theme.colors.border },
                ]}
              >
                <Ionicons name="home-outline" size={20} color={theme.colors.text} />
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.textSection}>
            {label && (
              <View style={[styles.labelRow, { backgroundColor: accentBg }]}>
                <Ionicons name={icon} size={14} color={primaryColor} />
                <Text style={[styles.label, { color: primaryColor }]}>{label}</Text>
              </View>
            )}
            <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
            {subtitle && (
              <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginBottom: 0,
  },
  gradient: {
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  textSection: {
    flex: 1,
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  label: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 34,
    letterSpacing: -1,
    lineHeight: 40,
  },
  subtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 16,
    lineHeight: 22,
    maxWidth: 320,
  },
});
