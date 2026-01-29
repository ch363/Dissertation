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
  const gradientStart = isDark ? `${theme.colors.primary}18` : `${theme.colors.primary}0C`;
  const gradientEnd = isDark ? `${theme.colors.primary}06` : `${theme.colors.primary}04`;
  const accentBg = isDark ? `${theme.colors.primary}28` : `${theme.colors.primary}1A`;

  return (
    <View style={styles.outer}>
      <LinearGradient
        colors={[gradientStart, gradientEnd, 'transparent']}
        locations={[0, 0.6, 1]}
        style={styles.gradient}
      >
        <View style={[styles.accentBar, { backgroundColor: theme.colors.primary }]} />
        <View style={styles.content}>
          <View style={styles.textSection}>
            <View style={[styles.labelRow, { backgroundColor: accentBg }]}>
              <Ionicons name="school-outline" size={14} color={theme.colors.primary} />
              <Text style={[styles.label, { color: theme.colors.primary }]}>Learning</Text>
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>Learn</Text>
            <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>
              Explore lessons and track your progress
            </Text>
          </View>
          <View style={styles.headerActions}>
            <HelpButton />
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
    paddingTop: 2,
    paddingBottom: 8,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 20,
    width: 24,
    height: 2,
    borderRadius: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  textSection: {
    flex: 1,
    gap: 2,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  label: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 26,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 300,
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
