import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { StaticCard, TappableCard } from '@/components/ui';
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
    <StaticCard title={greeting} titleVariant="subtle" compact>
      {showStreak || showMinutesToday ? (
        <View style={styles.metaRow}>
          {showStreak ? (
            <View
              style={[
                styles.flamePill,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
              ]}
            >
              <Ionicons
                name="flame"
                size={20}
                color={theme.colors.error}
                accessible={false}
                importantForAccessibility="no"
              />
            </View>
          ) : null}
          <View style={styles.metaTextWrap}>
            {showStreak ? (
              <Text
                style={[styles.metaTitle, { color: theme.colors.text }]}
              >{`${streakDays} day streak`}</Text>
            ) : null}
            {showMinutesToday ? (
              <Text
                style={[styles.metaSub, { color: theme.colors.mutedText }]}
              >{`Studied ${minutesToday} min today`}</Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {onPressMessage ? (
        <TappableCard
          title={message}
          leftIcon="sparkles"
          onPress={onPressMessage}
          accessibilityLabel={message}
          accessibilityHint="Continues to next action"
        />
      ) : (
        <View
          style={[
            styles.messageBlock,
            { backgroundColor: theme.colors.border + '40', borderColor: theme.colors.border },
          ]}
        >
          <Ionicons
            name="sparkles"
            size={20}
            color={theme.colors.primary}
            accessible={false}
            importantForAccessibility="no"
          />
          <Text style={[styles.messageText, { color: theme.colors.text }]}>{message}</Text>
        </View>
      )}
    </StaticCard>
  );
}

const styles = StyleSheet.create({
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.sm,
  },
  flamePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: baseTheme.spacing.sm,
    paddingVertical: baseTheme.spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    gap: baseTheme.spacing.xs,
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
  messageBlock: {
    borderRadius: 18,
    paddingVertical: baseTheme.spacing.sm + 6,
    paddingHorizontal: baseTheme.spacing.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: baseTheme.spacing.sm,
    minHeight: 52,
  },
  messageText: {
    flex: 1,
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 15,
    lineHeight: 22,
  },
});
