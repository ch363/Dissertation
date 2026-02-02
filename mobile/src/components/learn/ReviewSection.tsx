import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';
import {
  estimateReviewMinutes,
  formatReviewMinutesRange,
  formatReviewMinutesRangeFromEstimate,
} from '@/features/home/utils/estimateReviewMinutes';

type Props = {
  dueCount: number;
  estimatedReviewMinutes?: number | null;
  onStart?: () => void;
};

export function ReviewSection({ dueCount, estimatedReviewMinutes: fromDashboard, onStart }: Props) {
  const { theme } = useAppTheme();
  const minutes =
    fromDashboard != null && fromDashboard > 0 ? fromDashboard : estimateReviewMinutes(dueCount);
  const isQuickSession = fromDashboard == null || fromDashboard <= 0;
  const timeStr = isQuickSession
    ? formatReviewMinutesRange(dueCount)
    : formatReviewMinutesRangeFromEstimate(minutes);
  const timeCopy = isQuickSession ? `${timeStr} (adaptive, may vary)` : timeStr;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Review</Text>
      </View>
      <View style={styles.cardWrapper}>
        <Pressable
          onPress={dueCount > 0 ? onStart : undefined}
          disabled={dueCount === 0}
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: theme.colors.card,
              opacity: dueCount === 0 ? 0.6 : pressed ? 0.95 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.cardRow}>
            <View style={[styles.iconWrap, { backgroundColor: theme.colors.primary + '14' }]}>
              <Ionicons name="time-outline" size={18} color={theme.colors.primary} />
            </View>
            {dueCount > 0 ? (
              <Text style={[styles.oneLine, { color: theme.colors.text }]} numberOfLines={1}>
                <Text style={styles.oneLineBold}>{dueCount} due today</Text>
                <Text style={{ color: theme.colors.mutedText }}> · {timeCopy}</Text>
              </Text>
            ) : (
              <Text style={[styles.oneLine, { color: theme.colors.mutedText }]}>
                No reviews due · Check back later
              </Text>
            )}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Start Review"
            onPress={dueCount > 0 ? onStart : undefined}
            disabled={dueCount === 0}
            style={({ pressed }) => [
              styles.ctaButton,
              {
                opacity: dueCount === 0 ? 0.5 : pressed ? 0.8 : 1,
              },
            ]}
          >
            <LinearGradient
              colors={dueCount > 0 ? [theme.colors.primary, theme.colors.primary] : ['#9CA3AF', '#6B7280']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaLabel}>Start Review</Text>
            </LinearGradient>
          </Pressable>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 12,
    gap: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 17,
    letterSpacing: -0.2,
  },
  cardWrapper: {
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  oneLine: {
    flex: 1,
    fontFamily: baseTheme.typography.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  oneLineBold: {
    fontFamily: baseTheme.typography.semiBold,
  },
  ctaButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  ctaGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
