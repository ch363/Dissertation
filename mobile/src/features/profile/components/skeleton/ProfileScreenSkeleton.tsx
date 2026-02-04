import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScrollView } from '@/components/ui';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

function SkeletonBar({
  width,
  height = 14,
  borderRadius = 8,
  style,
  animatedOpacity,
  skeletonColor,
}: {
  width: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
  animatedOpacity: Animated.Value;
  skeletonColor: string;
}) {
  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: skeletonColor,
          opacity: animatedOpacity,
        },
        style,
      ]}
    />
  );
}

export function ProfileScreenSkeleton() {
  const { theme } = useAppTheme();
  const pulse = useRef(new Animated.Value(0.4)).current;
  const skeletonColor = theme.colors.border;

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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header area — name, level, XP + weekly stats skeleton */}
        <View style={[styles.headerCard, { borderColor: theme.colors.border }]}>
          <View style={styles.headerRow}>
            <Animated.View
              style={[styles.avatarCircle, { backgroundColor: skeletonColor, opacity: pulse }]}
            />
            <View style={styles.headerInfo}>
              <SkeletonBar
                width={120}
                height={22}
                borderRadius={10}
                animatedOpacity={pulse}
                skeletonColor={skeletonColor}
              />
              <View style={styles.headerStatsRow}>
                <SkeletonBar
                  width={60}
                  height={14}
                  animatedOpacity={pulse}
                  style={{ marginTop: 8 }}
                  skeletonColor={skeletonColor}
                />
                <SkeletonBar
                  width={48}
                  height={14}
                  animatedOpacity={pulse}
                  style={{ marginTop: 8 }}
                  skeletonColor={skeletonColor}
                />
              </View>
            </View>
          </View>
          {/* XP / Weekly stats skeleton — mirrors "This Week" block */}
          <View style={[styles.weeklyBlock, { borderTopColor: theme.colors.border + '40' }]}>
            <View style={styles.weeklyRow}>
              <SkeletonBar
                width={72}
                height={14}
                animatedOpacity={pulse}
                skeletonColor={skeletonColor}
              />
              <SkeletonBar
                width={56}
                height={16}
                animatedOpacity={pulse}
                skeletonColor={skeletonColor}
              />
            </View>
            <SkeletonBar
              width="90%"
              height={11}
              animatedOpacity={pulse}
              style={{ marginTop: 6 }}
              skeletonColor={skeletonColor}
            />
          </View>
        </View>

        {/* Stats grid */}
        <View style={styles.statsRow}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.statCard, { borderColor: theme.colors.border }]}>
              <Animated.View
                style={[styles.statIcon, { backgroundColor: skeletonColor, opacity: pulse }]}
              />
              <SkeletonBar
                width={32}
                height={20}
                animatedOpacity={pulse}
                style={{ marginTop: 8 }}
                skeletonColor={skeletonColor}
              />
              <SkeletonBar
                width={60}
                height={12}
                animatedOpacity={pulse}
                style={{ marginTop: 4 }}
                skeletonColor={skeletonColor}
              />
            </View>
          ))}
        </View>

        {/* Level progress section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SkeletonBar
              width={120}
              height={18}
              animatedOpacity={pulse}
              skeletonColor={skeletonColor}
            />
            <SkeletonBar
              width={60}
              height={14}
              animatedOpacity={pulse}
              skeletonColor={skeletonColor}
            />
          </View>
          <View style={[styles.levelRow, { borderColor: theme.colors.border }]}>
            <SkeletonBar
              width={100}
              height={18}
              animatedOpacity={pulse}
              skeletonColor={skeletonColor}
            />
            <SkeletonBar
              width={80}
              height={14}
              animatedOpacity={pulse}
              skeletonColor={skeletonColor}
            />
          </View>
          <Animated.View
            style={[styles.progressBar, { backgroundColor: skeletonColor, opacity: pulse }]}
          />
        </View>

        {/* Skills / Activity section placeholder */}
        <View style={styles.section}>
          <SkeletonBar
            width={100}
            height={18}
            animatedOpacity={pulse}
            skeletonColor={skeletonColor}
          />
          <View style={[styles.listCard, { borderColor: theme.colors.border }]}>
            <View style={styles.listRow}>
              <Animated.View
                style={[styles.listIcon, { backgroundColor: skeletonColor, opacity: pulse }]}
              />
              <View style={{ flex: 1, gap: baseTheme.spacing.xs }}>
                <SkeletonBar
                  width="80%"
                  height={16}
                  animatedOpacity={pulse}
                  skeletonColor={skeletonColor}
                />
                <SkeletonBar
                  width="50%"
                  height={12}
                  animatedOpacity={pulse}
                  skeletonColor={skeletonColor}
                />
              </View>
            </View>
            <View style={styles.listRow}>
              <Animated.View
                style={[styles.listIcon, { backgroundColor: skeletonColor, opacity: pulse }]}
              />
              <View style={{ flex: 1, gap: baseTheme.spacing.xs }}>
                <SkeletonBar
                  width="70%"
                  height={16}
                  animatedOpacity={pulse}
                  skeletonColor={skeletonColor}
                />
                <SkeletonBar
                  width="40%"
                  height={12}
                  animatedOpacity={pulse}
                  skeletonColor={skeletonColor}
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 24,
    paddingBottom: baseTheme.spacing.xl,
  },
  headerCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: baseTheme.spacing.lg,
    gap: baseTheme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  headerInfo: {
    flex: 1,
  },
  headerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weeklyBlock: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  weeklyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: baseTheme.spacing.sm,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: baseTheme.spacing.md,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  section: {
    gap: baseTheme.spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: baseTheme.spacing.sm,
    borderBottomWidth: 1,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    width: '100%',
  },
  listCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: baseTheme.spacing.md,
    gap: baseTheme.spacing.sm,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.md,
  },
  listIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
});
