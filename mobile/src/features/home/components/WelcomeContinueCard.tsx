import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { CARD_BORDER, OUTER_CARD_RADIUS, softShadow } from './homeStyles';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type LessonData = {
  lessonTitle: string;
  lessonProgress: string;
  estTime: string;
  onContinue: () => void;
};

type Props = {
  streakDays: number;
  minutesToday: number;
  displayName?: string | null;
  lesson?: LessonData | null;
};

export function WelcomeContinueCard({
  streakDays,
  minutesToday,
  displayName,
  lesson,
}: Props) {
  const { theme } = useAppTheme();
  const greeting = displayName ? `Welcome back, ${displayName}` : 'Welcome back';

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
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {greeting}
        </Text>
        <Image source={require('@/assets/logo.png')} style={styles.logo} resizeMode="contain" />
      </View>

      <View style={styles.metaRow}>
        <View style={styles.flamePill}>
          <Ionicons name="flame" size={20} color="#D44F00" />
        </View>
        <View style={styles.metaTextWrap}>
          <Text
            style={[styles.metaTitle, { color: theme.colors.text }]}
          >{`${streakDays} day streak`}</Text>
          <Text style={[styles.metaSub, { color: '#5F6F86' }]}>
            {`Studied ${minutesToday} min today`}
          </Text>
        </View>
      </View>

      {lesson ? (
        <View style={styles.lessonCard}>
          <View style={styles.lessonTopRow}>
            <View style={styles.lessonTitleWrap}>
              <View style={styles.lessonIcon}>
                <Ionicons name="sparkles" size={18} color="#1B6ED4" />
              </View>
              <View style={styles.lessonTextContainer}>
                <Text 
                  style={[styles.lessonTitle, { color: '#0D1B2A' }]} 
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {lesson.lessonTitle}
                </Text>
                <Text style={[styles.lessonSub, { color: '#0D1B2A' }]}>
                  {lesson.lessonProgress}
                </Text>
              </View>
            </View>
            <Text style={[styles.timeText, { color: '#0D1B2A' }]}>{lesson.estTime}</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue lesson"
            onPress={lesson.onContinue}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>Continue lesson</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.emptyStateCard}>
          <View style={styles.emptyStateIcon}>
            <Ionicons name="checkmark-circle" size={24} color="#5BA4F5" />
          </View>
          <Text style={[styles.emptyStateText, { color: '#0D1B2A' }]}>
            Great job! No lessons to continue
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: OUTER_CARD_RADIUS,
    borderWidth: 1,
    padding: baseTheme.spacing.lg,
    gap: baseTheme.spacing.md,
    backgroundColor: '#F9FBFF',
    ...softShadow,
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
  logo: {
    width: 56,
    height: 56,
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
  lessonCard: {
    borderRadius: 18,
    padding: baseTheme.spacing.md,
    backgroundColor: '#DCE9FF',
    borderWidth: 1,
    borderColor: '#C5D8FF',
    gap: baseTheme.spacing.md,
    shadowColor: '#1A3356',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  lessonTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lessonTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.sm,
    flex: 1,
    minWidth: 0, // Allow flex shrinking
  },
  lessonTextContainer: {
    flex: 1,
    minWidth: 0, // Allow flex shrinking for text truncation
  },
  lessonIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#C8DCFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0, // Prevent icon from shrinking
  },
  lessonTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 20,
    lineHeight: 24,
  },
  lessonSub: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 15,
    marginTop: 4,
    lineHeight: 20,
  },
  timeText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 15,
    marginLeft: baseTheme.spacing.sm,
    flexShrink: 0, // Prevent time from shrinking
  },
  ctaButton: {
    backgroundColor: '#5BA4F5',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    shadowColor: '#3D82D6',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  ctaText: {
    color: '#FFFFFF',
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 17,
  },
  emptyStateCard: {
    borderRadius: 18,
    padding: baseTheme.spacing.md,
    backgroundColor: '#DCE9FF',
    borderWidth: 1,
    borderColor: '#C5D8FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: baseTheme.spacing.sm,
    minHeight: 64,
  },
  emptyStateIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
    textAlign: 'center',
  },
});
