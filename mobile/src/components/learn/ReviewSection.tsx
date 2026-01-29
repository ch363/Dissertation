import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { ScrollView } from '@/components/ui';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type Props = {
  dueCount: number;
  onStart?: () => void;
};

export function ReviewSection({ dueCount, onStart }: Props) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Review</Text>
          {dueCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{dueCount}</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>
        Strengthen what you&apos;ve already learned
      </Text>
      <View style={styles.cardWrapper}>
        <Pressable
          onPress={dueCount > 0 ? onStart : undefined}
          disabled={dueCount === 0}
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: '#FFFFFF',
              opacity: dueCount === 0 ? 0.6 : pressed ? 0.95 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, dueCount > 0 ? styles.iconRed : styles.iconGray]}>
              <Ionicons name="time-outline" size={24} color={dueCount > 0 ? '#DC2626' : '#9CA3AF'} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Due for Review</Text>
              <Text style={[styles.cardSubtitle, { color: theme.colors.mutedText }]}>
                {dueCount === 0 ? 'No cards due today' : `${dueCount} ${dueCount === 1 ? 'card' : 'cards'} due today`}
              </Text>
            </View>
          </View>
          
          {dueCount > 0 && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>{dueCount}</Text>
                <Text style={[styles.statLabel, { color: theme.colors.mutedText }]}>Cards</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  ~{Math.max(1, Math.ceil(dueCount * 1.5))}m
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.mutedText }]}>Time</Text>
              </View>
            </View>
          )}

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
    marginTop: 16,
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  badge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: baseTheme.typography.bold,
    color: '#DC2626',
  },
  subtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 15,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  cardWrapper: {
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    borderRadius: 12,
    padding: 12,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconRed: {
    backgroundColor: '#FEF2F2',
  },
  iconGray: {
    backgroundColor: '#F8FAFC',
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 18,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 15,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 24,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: baseTheme.typography.medium,
    fontSize: 12,
  },
  divider: {
    width: 1,
    height: 40,
  },
  ctaButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  ctaGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 17,
    color: '#FFFFFF',
  },
});
