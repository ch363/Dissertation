import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { StaticCard, TappableCard } from '@/components/ui';
import {
  cardGapBetweenRows,
  iconContainerRadius,
  iconContainerSize,
} from './homeStyles';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

const DAILY_GOAL_MINUTES = 10;

type Props = {
  minutesToday: number;
  completedItemsToday: number;
  accuracyToday?: number | null;
  onSuggestLearn?: () => void;
  style?: ViewStyle;
};

function getTimeIconGradient(isDark: boolean): [string, string] {
  if (isDark) return ['#26D4BA22', '#26D4BA18'];
  return ['#12BFA122', '#12BFA118'];
}

function getItemsIconGradient(primaryHex: string, isDark: boolean): [string, string] {
  if (isDark) return [`${primaryHex}22`, `${primaryHex}18`];
  return [`${primaryHex}22`, `${primaryHex}18`];
}

export const HomeTodayAtAGlance = React.memo(function HomeTodayAtAGlance({
  minutesToday,
  completedItemsToday,
  accuracyToday,
  onSuggestLearn,
  style,
}: Props) {
  const { theme, isDark } = useAppTheme();
  const [timeGradStart, timeGradEnd] = getTimeIconGradient(isDark);
  const [itemsGradStart, itemsGradEnd] = getItemsIconGradient(theme.colors.primary, isDark);
  const isAllZero = minutesToday === 0 && completedItemsToday === 0;

  if (isAllZero) {
    return (
      <TappableCard
        overline="TODAY'S PROGRESS"
        title="Learn something new today"
        subtitle="5-minute lesson"
        leftIcon="time-outline"
        onPress={onSuggestLearn ?? (() => {})}
        accessibilityLabel="Today's progress. Learn something new today, 5-minute lesson."
        accessibilityHint="Opens the Learn tab"
        variant="default"
        style={style}
      />
    );
  }

  const content = (
    <View style={styles.rows}>
      <View style={styles.row}>
        <LinearGradient
          colors={[timeGradStart, timeGradEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconBox}
        >
          <Ionicons
            name="time-outline"
            size={18}
            color={theme.colors.secondary}
            accessible={false}
            importantForAccessibility="no"
          />
        </LinearGradient>
        <View style={styles.rowContent}>
          <Text
            style={[styles.rowLabel, { color: theme.colors.mutedText }]}
            numberOfLines={1}
            ellipsizeMode="tail"
            maxFontSizeMultiplier={1.3}
          >
            Time studied
          </Text>
          <Text
            style={[styles.rowValue, { color: theme.colors.text }]}
            numberOfLines={1}
            ellipsizeMode="tail"
            maxFontSizeMultiplier={1.3}
          >
            {minutesToday}/{DAILY_GOAL_MINUTES} min
          </Text>
        </View>
      </View>
      <View style={styles.row}>
        <LinearGradient
          colors={[itemsGradStart, itemsGradEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconBox}
        >
          <Ionicons
            name="checkmark-done-outline"
            size={18}
            color={theme.colors.primary}
            accessible={false}
            importantForAccessibility="no"
          />
        </LinearGradient>
        <View style={styles.rowContent}>
          <Text
            style={[styles.rowLabel, { color: theme.colors.mutedText }]}
            numberOfLines={1}
            ellipsizeMode="tail"
            maxFontSizeMultiplier={1.3}
          >
            Completed
          </Text>
          <Text
            style={[styles.rowValue, { color: theme.colors.text }]}
            numberOfLines={1}
            ellipsizeMode="tail"
            maxFontSizeMultiplier={1.3}
          >
            {completedItemsToday} {completedItemsToday === 1 ? 'item' : 'items'}
          </Text>
        </View>
      </View>
      {typeof accuracyToday === 'number' ? (
        <View style={styles.row}>
          <View style={[styles.iconBox, { backgroundColor: theme.colors.border }]}>
            <Ionicons
              name="stats-chart-outline"
              size={18}
              color={theme.colors.primary}
              accessible={false}
              importantForAccessibility="no"
            />
          </View>
          <View style={styles.rowContent}>
            <Text
              style={[styles.rowLabel, { color: theme.colors.mutedText }]}
              numberOfLines={1}
              ellipsizeMode="tail"
              maxFontSizeMultiplier={1.3}
            >
              Accuracy today
            </Text>
            <Text
              style={[styles.rowValue, { color: theme.colors.text }]}
              numberOfLines={1}
              ellipsizeMode="tail"
              maxFontSizeMultiplier={1.3}
            >
              {accuracyToday}%
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );

  return (
    <StaticCard title="Today's Progress" titleVariant="subtle" style={style}>
      <View style={styles.contentSection}>{content}      </View>
    </StaticCard>
  );
});

const styles = StyleSheet.create({
  contentSection: {
    gap: cardGapBetweenRows,
  },
  rows: {
    gap: cardGapBetweenRows,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBox: {
    width: iconContainerSize,
    height: iconContainerSize,
    borderRadius: iconContainerRadius,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  rowContent: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  rowLabel: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 14,
  },
  rowValue: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
    letterSpacing: -0.2,
  },
});
