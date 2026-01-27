import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CARD_BORDER, OUTER_CARD_RADIUS, softShadow } from './homeStyles';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type Props = {
  streakDays: number;
  minutesToday: number;
  displayName?: string | null;
  message: string;
  onPressMessage?: () => void;
};

export function WelcomeContinueCard({
  streakDays,
  minutesToday,
  displayName,
  message,
  onPressMessage,
}: Props) {
  const { theme } = useAppTheme();
  const greeting = displayName ? `Welcome back, ${displayName}` : 'Welcome back';
  const showStreak = streakDays > 0;
  const showMinutesToday = minutesToday > 0;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: CARD_BORDER,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Text
          style={[styles.title, { color: theme.colors.text }]}
          accessibilityRole="header"
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {greeting}
        </Text>
      </View>

      {showStreak || showMinutesToday ? (
        <View style={styles.metaRow}>
          {showStreak ? (
            <View style={styles.flamePill}>
              <Ionicons name="flame" size={20} color="#D44F00" accessible={false} importantForAccessibility="no" />
            </View>
          ) : null}
          <View style={styles.metaTextWrap}>
            {showStreak ? (
              <Text style={[styles.metaTitle, { color: theme.colors.text }]}>{`${streakDays} day streak`}</Text>
            ) : null}
            {showMinutesToday ? (
              <Text style={[styles.metaSub, { color: '#5F6F86' }]}>{`Studied ${minutesToday} min today`}</Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {onPressMessage ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={message}
          onPress={onPressMessage}
          style={({ pressed }) => [
            styles.messageCard,
            {
              borderColor: '#D9E6FF',
              opacity: pressed ? 0.92 : 1,
            },
          ]}
        >
            <View style={styles.messageIcon}>
              <Ionicons name="sparkles" size={20} color="#1B6ED4" accessible={false} importantForAccessibility="no" />
            </View>
            <Text style={[styles.messageText, { color: '#0D1B2A' }]}>{message}</Text>
        </Pressable>
      ) : (
        <View style={styles.messageCard}>
          <View style={styles.messageIcon}>
            <Ionicons name="sparkles" size={20} color="#1B6ED4" accessible={false} importantForAccessibility="no" />
          </View>
          <Text style={[styles.messageText, { color: '#0D1B2A' }]}>{message}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: OUTER_CARD_RADIUS,
    borderWidth: 1,
    paddingTop: baseTheme.spacing.md,
    paddingHorizontal: baseTheme.spacing.lg,
    paddingBottom: baseTheme.spacing.md,
    gap: baseTheme.spacing.sm,
    backgroundColor: '#FBFCFF',
    // Soften the welcome card so “Next up” can be the hero.
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.sm,
  },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 22,
    flex: 1,
  },
  flamePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#FFEBDD',
    gap: 8,
  },
  flameText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.sm,
  },
  metaTextWrap: {
    flex: 1,
  },
  metaTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 18,
  },
  metaSub: {
    marginTop: 2,
    fontFamily: baseTheme.typography.regular,
    fontSize: 15,
  },
  messageCard: {
    borderRadius: 18,
    paddingVertical: baseTheme.spacing.sm + 6,
    paddingHorizontal: baseTheme.spacing.md,
    backgroundColor: '#EEF5FF',
    borderWidth: 1,
    borderColor: '#D9E6FF',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: baseTheme.spacing.sm,
    minHeight: 52,
  },
  messageIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 1,
  },
  messageText: {
    flex: 1,
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 15,
    lineHeight: 22,
  },
});
