import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScrollView } from '@/components/ui';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

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

export function ProfileScreenSkeleton() {
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header area (gradient placeholder) */}
        <View style={[styles.headerCard, { borderColor: theme.colors.border }]}>
          <View style={styles.headerRow}>
            <Animated.View style={[styles.avatarCircle, { backgroundColor: SKELETON_COLOR, opacity: pulse }]} />
            <View style={styles.headerInfo}>
              <SkeletonBar width={120} height={22} borderRadius={10} animatedOpacity={pulse} />
              <SkeletonBar width={80} height={14} animatedOpacity={pulse} style={{ marginTop: 8 }} />
            </View>
          </View>
          <View style={styles.weeklyRow}>
            <SkeletonBar width={70} height={14} animatedOpacity={pulse} />
            <SkeletonBar width={50} height={14} animatedOpacity={pulse} />
          </View>
        </View>

        {/* Stats grid */}
        <View style={styles.statsRow}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.statCard, { borderColor: theme.colors.border }]}>
              <Animated.View style={[styles.statIcon, { backgroundColor: SKELETON_COLOR, opacity: pulse }]} />
              <SkeletonBar width={32} height={20} animatedOpacity={pulse} style={{ marginTop: 8 }} />
              <SkeletonBar width={60} height={12} animatedOpacity={pulse} style={{ marginTop: 4 }} />
            </View>
          ))}
        </View>

        {/* Level progress section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SkeletonBar width={120} height={18} animatedOpacity={pulse} />
            <SkeletonBar width={60} height={14} animatedOpacity={pulse} />
          </View>
          <View style={[styles.levelRow, { borderColor: theme.colors.border }]}>
            <SkeletonBar width={100} height={18} animatedOpacity={pulse} />
            <SkeletonBar width={80} height={14} animatedOpacity={pulse} />
          </View>
          <Animated.View style={[styles.progressBar, { backgroundColor: SKELETON_COLOR, opacity: pulse }]} />
        </View>

        {/* Skills / Activity section placeholder */}
        <View style={styles.section}>
          <SkeletonBar width={100} height={18} animatedOpacity={pulse} />
          <View style={[styles.listCard, { borderColor: theme.colors.border }]}>
            <View style={styles.listRow}>
              <Animated.View style={[styles.listIcon, { backgroundColor: SKELETON_COLOR, opacity: pulse }]} />
              <View style={{ flex: 1, gap: baseTheme.spacing.xs }}>
                <SkeletonBar width="80%" height={16} animatedOpacity={pulse} />
                <SkeletonBar width="50%" height={12} animatedOpacity={pulse} />
              </View>
            </View>
            <View style={styles.listRow}>
              <Animated.View style={[styles.listIcon, { backgroundColor: SKELETON_COLOR, opacity: pulse }]} />
              <View style={{ flex: 1, gap: baseTheme.spacing.xs }}>
                <SkeletonBar width="70%" height={16} animatedOpacity={pulse} />
                <SkeletonBar width="40%" height={12} animatedOpacity={pulse} />
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
