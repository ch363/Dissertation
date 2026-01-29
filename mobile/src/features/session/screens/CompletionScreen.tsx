import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { routeBuilders } from '@/services/navigation/routes';
import { theme } from '@/services/theme/tokens';

const TROPHY_ORANGE = '#E85D04';
const TROPHY_GLOW = 'rgba(232, 93, 4, 0.25)';

export default function CompletionScreen() {
  const params = useLocalSearchParams<{ 
    sessionId?: string; 
    kind?: string; 
    lessonId?: string;
    planMode?: string;
    timeBudgetSec?: string;
    returnTo?: string;
    totalXp?: string;
    teachingsMastered?: string;
  }>();
  const sessionId = params.sessionId;
  const kind = params.kind === 'review' ? 'review' : 'learn';
  const lessonId = params.lessonId;
  const planMode = params.planMode;
  const timeBudgetSec = params.timeBudgetSec;
  const returnTo = params.returnTo;

  // Get stats from route params (calculated in SessionRunner)
  const stats = useMemo(() => {
    const totalXp = params.totalXp ? parseInt(params.totalXp, 10) : 0;
    const teachingsMastered = params.teachingsMastered ? parseInt(params.teachingsMastered, 10) : 0;

    return {
      totalXp,
      teachingsMastered,
    };
  }, [params.totalXp, params.teachingsMastered]);

  const handleContinue = () => {
    if (sessionId) {
      router.replace({
        pathname: routeBuilders.sessionSummary(sessionId),
        params: { kind, lessonId, planMode, timeBudgetSec, ...(returnTo ? { returnTo } : {}) },
      });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.screenLabel}>Completion</Text>
          <View style={styles.header}>
            <View style={styles.trophyWrapper}>
              <View style={styles.trophyGlow} />
              <View style={styles.trophyCircle}>
                <Ionicons name="trophy" size={72} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.titleLine1}>Session</Text>
            <Text style={styles.titleLine2}>Complete!</Text>
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
  screenLabel: {
    fontFamily: theme.typography.regular,
    fontSize: 14,
    color: theme.colors.mutedText,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  header: {
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  trophyWrapper: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  trophyGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 70,
    backgroundColor: TROPHY_GLOW,
  },
  trophyCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: TROPHY_ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleLine1: {
    fontFamily: theme.typography.bold,
    fontSize: 26,
    color: theme.colors.text,
    textAlign: 'center',
  },
  titleLine2: {
    fontFamily: theme.typography.bold,
    fontSize: 32,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: -4,
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
