import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/services/theme/tokens';
import { routes } from '@/services/navigation/routes';

type Props = {
  title: string;
  current: number; // 1-based
  total: number;
  onBackPress?: () => void;
};

export function LessonProgressHeader({ title, current, total, onBackPress }: Props) {
  const progress = total > 0 ? Math.min(1, Math.max(0, current / total)) : 0;

  const handleHomePress = () => {
    // Dismiss all modals/stacks to reveal the home screen underneath
    router.dismissAll();
    // Navigate to home - this will slide the current screen right, revealing home underneath
    // Using navigate instead of replace to get the stack animation
    router.navigate(routes.tabs.home);
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBackPress ?? (() => router.back())}
          hitSlop={10}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={22} color={theme.colors.mutedText} />
        </Pressable>

        <Text style={styles.titleText} numberOfLines={1}>
          {title}
        </Text>

        {/* Home button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Home"
          onPress={handleHomePress}
          hitSlop={10}
          style={styles.homeButton}
        >
          <Ionicons name="home" size={22} color={theme.colors.mutedText} />
        </Pressable>
      </View>

      <Text style={styles.counterText}>{`Question ${current} of ${total}`}</Text>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    flex: 1,
    textAlign: 'center',
    fontFamily: theme.typography.semiBold,
    fontSize: 18,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.sm,
  },
  counterText: {
    fontFamily: theme.typography.semiBold,
    fontSize: 16,
    color: theme.colors.mutedText,
    textAlign: 'center',
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#E6E8EB',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#16A39A', // teal (figma-like)
  },
});

