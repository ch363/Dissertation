import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScrollView } from '@/components/ui';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

const CARD_WIDTH = 260;
const SKELETON_COLOR = '#E6ECF5';

function SkeletonBar({
  width,
  height = 14,
  borderRadius = 8,
  style,
  animatedOpacity,
}: {
  width: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
  animatedOpacity: Animated.Value;
}) {
  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: SKELETON_COLOR,
          opacity: animatedOpacity,
        },
        style,
      ]}
    />
  );
}

export function LearnScreenSkeleton() {
  const { theme } = useAppTheme();
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.75,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <SkeletonBar width={120} height={28} borderRadius={10} animatedOpacity={pulse} />
        </View>

        {/* Learning Path section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SkeletonBar width={140} height={18} animatedOpacity={pulse} />
            <SkeletonBar width={24} height={14} animatedOpacity={pulse} />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
          >
            {[1, 2, 3].map((i) => (
              <View key={i} style={[styles.pathCard, { borderColor: theme.colors.border }]}>
                <SkeletonBar width="70%" height={16} animatedOpacity={pulse} />
                <SkeletonBar width="50%" height={12} animatedOpacity={pulse} />
                <View style={styles.segmentRow}>
                  {[1, 2, 3, 4, 5, 6].map((j) => (
                    <Animated.View
                      key={j}
                      style={[styles.segment, { backgroundColor: SKELETON_COLOR, opacity: pulse }]}
                    />
                  ))}
                </View>
                <SkeletonBar width={80} height={36} borderRadius={12} animatedOpacity={pulse} />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Review section */}
        <View style={styles.section}>
          <SkeletonBar width={80} height={18} animatedOpacity={pulse} />
          <SkeletonBar width={220} height={14} animatedOpacity={pulse} />
          <View style={[styles.reviewCard, { borderColor: theme.colors.border }]}>
            <View style={styles.reviewRow}>
              <View style={{ flex: 1, gap: baseTheme.spacing.xs }}>
                <SkeletonBar width="80%" height={18} animatedOpacity={pulse} />
                <SkeletonBar width="60%" height={14} animatedOpacity={pulse} />
              </View>
              <Animated.View
                style={[
                  styles.reviewIllustration,
                  { backgroundColor: SKELETON_COLOR, opacity: pulse },
                ]}
              />
            </View>
            <SkeletonBar width="100%" height={48} borderRadius={12} animatedOpacity={pulse} />
          </View>
        </View>

        {/* Browse CTA */}
        <View style={[styles.listCta, { borderColor: theme.colors.border }]}>
          <View style={styles.listCtaHeader}>
            <SkeletonBar width={160} height={16} animatedOpacity={pulse} />
            <SkeletonBar width={40} height={14} animatedOpacity={pulse} />
          </View>
          <SkeletonBar width="90%" height={13} animatedOpacity={pulse} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: baseTheme.spacing.xl,
  },
  header: {
    paddingHorizontal: baseTheme.spacing.lg,
    paddingBottom: baseTheme.spacing.md,
  },
  section: {
    marginTop: baseTheme.spacing.lg,
    gap: baseTheme.spacing.sm,
    paddingHorizontal: baseTheme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  carouselContent: {
    gap: baseTheme.spacing.md,
    paddingRight: baseTheme.spacing.lg,
    marginTop: baseTheme.spacing.sm,
  },
  pathCard: {
    width: CARD_WIDTH,
    borderRadius: 20,
    borderWidth: 1,
    padding: baseTheme.spacing.lg,
    gap: baseTheme.spacing.sm,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  reviewCard: {
    marginTop: baseTheme.spacing.md,
    borderRadius: 24,
    borderWidth: 1,
    padding: baseTheme.spacing.lg,
    gap: baseTheme.spacing.md,
  },
  reviewRow: {
    flexDirection: 'row',
    gap: baseTheme.spacing.md,
  },
  reviewIllustration: {
    width: 96,
    height: 96,
    borderRadius: 20,
  },
  listCta: {
    marginTop: baseTheme.spacing.lg,
    marginHorizontal: baseTheme.spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    padding: baseTheme.spacing.md,
    gap: baseTheme.spacing.xs,
  },
  listCtaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
