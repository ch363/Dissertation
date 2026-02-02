import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HelpButton } from '@/components/navigation/HelpButton';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type Props = {
  onActionPress?: () => void;
};

export function LearnHeader({ onActionPress }: Props) {
  const { theme, isDark } = useAppTheme();
  const gradientStart = isDark ? `${theme.colors.primary}22` : `${theme.colors.primary}10`;
  const gradientEnd = isDark ? `${theme.colors.primary}08` : `${theme.colors.primary}05`;

  return (
    <View style={styles.outer}>
      <LinearGradient
        colors={[gradientStart, gradientEnd, 'transparent']}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
      >
        <View style={styles.accentGroup}>
          <View style={[styles.accentBar, { backgroundColor: theme.colors.primary }]} />
          <View style={[styles.accentDot, { backgroundColor: theme.colors.primary + '60' }]} />
        </View>
        <View style={styles.content}>
          <View style={styles.textSection}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Learn</Text>
            <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>
              Explore lessons and track your progress
            </Text>
          </View>
          <View style={styles.headerActions}>
            <HelpButton
              variant="elevated"
              accessibilityLabel="Help, learn screen tips"
              accessibilityHint="Opens help information"
            />
            {onActionPress && (
              <Pressable
                onPress={onActionPress}
                style={({ pressed }) => [
                  styles.actionButton,
                  {
                    backgroundColor: pressed ? theme.colors.border : 'transparent',
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="More options"
              >
                <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
              </Pressable>
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
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  accentGroup: {
    position: 'absolute',
    top: 0,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  accentBar: {
    width: 32,
    height: 3,
    borderRadius: 2,
  },
  accentDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  textSection: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 32,
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  subtitle: {
    fontFamily: baseTheme.typography.medium,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 300,
    opacity: 0.85,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
