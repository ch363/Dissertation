import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ContinueLesson } from '@/features/learn/mock';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type Props = {
  data: ContinueLesson;
};

export function ContinueLearningCard({ data }: Props) {
  const { theme } = useAppTheme();
  const progressWidth = Math.min(1, Math.max(0, data.progress));

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Continue Learning</Text>
      <View
        style={[
          styles.card,
          {
            backgroundColor: '#E9F2FF',
            borderColor: theme.colors.border,
            shadowColor: '#0D1B2A',
          },
        ]}
      >
        <View style={styles.gradientBubble} />
        <View style={styles.row}>
          <View style={{ flex: 1, gap: baseTheme.spacing.sm }}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{data.courseTitle}</Text>
            <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>
              {data.lessonTitle}
            </Text>
            <View
              style={[
                styles.innerPanel,
                {
                  backgroundColor: '#FFFFFF',
                  borderColor: theme.colors.border,
                  shadowColor: '#0D1B2A',
                },
              ]}
            >
              <Text style={[styles.panelText, { color: theme.colors.text }]}>
                You&apos;re {data.minutesAway} minutes away from meeting your daily goal
              </Text>
              <View style={styles.progressRow}>
                <View style={[styles.progressTrack, { backgroundColor: '#E0E7F5' }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${progressWidth * 100}%`, backgroundColor: theme.colors.primary },
                    ]}
                  />
                </View>
                <Text style={[styles.progressLabel, { color: theme.colors.mutedText }]}>
                  {data.progressLabel}
                </Text>
              </View>
            </View>
          </View>
          <View
            style={[
              styles.illustration,
              {
                backgroundColor: '#DDEAFE',
                borderColor: theme.colors.border,
              },
            ]}
          />
        </View>
        <Button
          title="Continue Lesson"
          onPress={() => {}}
          style={{
            marginTop: baseTheme.spacing.md,
            borderRadius: baseTheme.radius.lg,
            paddingVertical: baseTheme.spacing.md,
            shadowColor: '#0D1B2A',
            shadowOpacity: 0.12,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: baseTheme.spacing.lg,
    paddingHorizontal: baseTheme.spacing.lg,
  },
  sectionTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 18,
    marginBottom: baseTheme.spacing.md,
  },
  card: {
    borderRadius: 24,
    padding: baseTheme.spacing.lg,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  gradientBubble: {
    position: 'absolute',
    right: -40,
    top: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#CFE2FF',
    opacity: 0.4,
  },
  row: {
    flexDirection: 'row',
    gap: baseTheme.spacing.lg,
  },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 22,
  },
  subtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
  },
  innerPanel: {
    borderRadius: 14,
    borderWidth: 1,
    padding: baseTheme.spacing.md,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    gap: baseTheme.spacing.sm,
  },
  panelText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 14,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 10,
    borderRadius: 999,
  },
  progressFill: {
    height: 10,
    borderRadius: 999,
  },
  progressLabel: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 12,
  },
  illustration: {
    width: 110,
    height: 120,
    borderRadius: 20,
    borderWidth: 1,
    opacity: 0.9,
  },
});
