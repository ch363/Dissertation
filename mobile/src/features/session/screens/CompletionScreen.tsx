import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { routeBuilders } from '@/services/navigation/routes';
import { theme } from '@/services/theme/tokens';
import { AttemptLog, CardKind, SessionPlan } from '@/types/session';
import { getCachedSessionPlan } from '@/services/api/session-plan-cache';

/**
 * Calculate XP for a single attempt using the same formula as the backend:
 * - Base: 5 XP for attempting
 * - Correct bonus: +10 XP if correct
 * - Speed bonus: +5 if < 5s, +3 if < 10s, +1 if < 20s
 */
function calculateXpForAttempt(attempt: AttemptLog): number {
  let xp = 5; // Base XP for attempting

  if (attempt.isCorrect) {
    xp += 10; // Bonus for correct answer

    // Speed bonus (faster = more XP, up to +5)
    if (attempt.elapsedMs < 5000) {
      xp += 5;
    } else if (attempt.elapsedMs < 10000) {
      xp += 3;
    } else if (attempt.elapsedMs < 20000) {
      xp += 1;
    }
  }

  return xp;
}

export default function CompletionScreen() {
  const params = useLocalSearchParams<{ sessionId?: string; kind?: string; lessonId?: string }>();
  const sessionId = params.sessionId;
  const kind = params.kind === 'review' ? 'review' : 'learn';
  const lessonId = params.lessonId;

  // Get the session plan from cache to extract teachings and calculate stats
  const sessionPlan = useMemo(() => {
    if (lessonId && kind === 'learn') {
      return getCachedSessionPlan(lessonId);
    }
    return null;
  }, [lessonId, kind]);

  // Calculate XP and teachings from attempts stored in route params
  // We'll pass attempts as a serialized param or calculate from session plan
  const stats = useMemo(() => {
    // For now, we'll calculate from the session plan
    // In a real implementation, we might pass attempts as params or store them
    let totalXp = 0;
    let teachingsMastered = 0;

    if (sessionPlan) {
      // Count teachings (Teach cards)
      teachingsMastered = sessionPlan.cards.filter(
        (card) => card.kind === CardKind.Teach,
      ).length;

      // Estimate XP based on practice cards
      // Each practice card attempt would give ~15-20 XP on average
      const practiceCards = sessionPlan.cards.filter(
        (card) => card.kind !== CardKind.Teach,
      );
      // Estimate: ~15 XP per practice card (assuming most are correct)
      totalXp = practiceCards.length * 15;
    }

    return {
      totalXp,
      teachingsMastered,
    };
  }, [sessionPlan]);

  const handleContinue = () => {
    if (sessionId) {
      router.replace({
        pathname: routeBuilders.sessionSummary(sessionId),
        params: { kind, lessonId },
      });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Ionicons name="trophy" size={64} color={theme.colors.primary} />
            <Text style={styles.title}>Session Complete!</Text>
            <Text style={styles.subtitle}>
              Great work! Here's what you accomplished:
            </Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="star" size={32} color={theme.colors.primary} />
              </View>
              <Text style={styles.statValue}>{stats.totalXp}</Text>
              <Text style={styles.statLabel}>XP Earned</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="book" size={32} color={theme.colors.primary} />
              </View>
              <Text style={styles.statValue}>{stats.teachingsMastered}</Text>
              <Text style={styles.statLabel}>
                {stats.teachingsMastered === 1 ? 'Teaching' : 'Teachings'} Mastered
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.primaryButton} onPress={handleContinue}>
              <Text style={styles.primaryButtonLabel}>Continue</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.xl,
    gap: theme.spacing.xl,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  header: {
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  title: {
    fontFamily: theme.typography.bold,
    fontSize: 28,
    color: theme.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: theme.typography.regular,
    fontSize: 16,
    color: theme.colors.mutedText,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'center',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  statIconContainer: {
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    fontFamily: theme.typography.bold,
    fontSize: 32,
    color: theme.colors.text,
  },
  statLabel: {
    fontFamily: theme.typography.regular,
    fontSize: 14,
    color: theme.colors.mutedText,
    textAlign: 'center',
  },
  actions: {
    marginTop: theme.spacing.sm,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  primaryButtonLabel: {
    color: '#fff',
    fontFamily: theme.typography.semiBold,
    fontSize: 16,
  },
});
