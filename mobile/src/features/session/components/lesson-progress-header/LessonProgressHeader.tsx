import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { routes } from '@/services/navigation/routes';
import { theme } from '@/services/theme/tokens';

type Props = {
  title: string;
  current: number; // 1-based
  total: number;
  onBackPress?: () => void;
  /** Route to navigate to when user confirms exit (e.g. home, learn, or course detail). */
  returnTo?: string;
};

export function LessonProgressHeader({ title, current, total, onBackPress, returnTo }: Props) {
  const progress = total > 0 ? Math.min(1, Math.max(0, current / total)) : 0;

  const handleExitPress = () => {
    Alert.alert(
      'Exit session?',
      'Your progress in this session will not be saved. Are you sure you want to leave?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: () => {
            const destination =
              returnTo && returnTo.trim().length > 0 ? returnTo : routes.tabs.home;
            router.replace(destination as Parameters<typeof router.replace>[0]);
          },
        },
      ],
    );
  };

  const showBackButton = current > 1;

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        {showBackButton ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={onBackPress ?? (() => router.back())}
            hitSlop={10}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.mutedText} />
          </Pressable>
        ) : (
          <View style={styles.backButton} />
        )}

        <Text style={styles.titleText} numberOfLines={1}>
          {title}
        </Text>

        {/* Exit session button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Exit session"
          onPress={handleExitPress}
          hitSlop={10}
          style={styles.exitButton}
        >
          <Ionicons name="close" size={22} color={theme.colors.mutedText} />
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
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    flex: 1,
    textAlign: 'center',
    fontFamily: theme.typography.semiBold,
    fontSize: 17,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.md,
  },
  counterText: {
    fontFamily: theme.typography.medium,
    fontSize: 14,
    color: theme.colors.mutedText,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  progressTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: theme.colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
  },
});
