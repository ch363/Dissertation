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
    paddingTop: 4,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 20,
    width: 32,
    height: 3,
    borderRadius: 2,
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
  },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 32,
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  subtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 16,
    lineHeight: 22,
    maxWidth: 300,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
