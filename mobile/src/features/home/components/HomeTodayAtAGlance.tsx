import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { OUTER_CARD_RADIUS, softShadow } from './homeStyles';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type Props = {
  dueReviewCount: number;
  minutesToday: number;
};

/** Gradient background for "Reviews due" icon box. Uses theme primary (blue card blue). */
function getReviewsIconGradient(primaryHex: string, isDark: boolean): [string, string] {
  if (isDark) return [`${primaryHex}22`, `${primaryHex}18`];
  return [`${primaryHex}22`, `${primaryHex}18`];
}

/** Gradient background for "Time studied" icon box. */
function getTimeIconGradient(isDark: boolean): [string, string] {
  if (isDark) return ['#26D4BA22', '#26D4BA18'];
  return ['#12BFA122', '#12BFA118'];
}

/** Gradient background for header strip. */
function getHeaderGradient(isDark: boolean): [string, string] {
  if (isDark) return ['#172435', '#0E141B'];
  return ['#F4F8FF', '#FFFFFF'];
}

export function HomeTodayAtAGlance({ dueReviewCount, minutesToday }: Props) {
  const { theme, isDark } = useAppTheme();
  const reviewValue = dueReviewCount === 0 ? 'None' : `${dueReviewCount} ${dueReviewCount === 1 ? 'review' : 'reviews'} due`;

  const [reviewGradStart, reviewGradEnd] = getReviewsIconGradient(theme.colors.primary, isDark);
  const [timeGradStart, timeGradEnd] = getTimeIconGradient(isDark);
  const [headerGradStart, headerGradEnd] = getHeaderGradient(isDark);

  return (
    <View style={styles.section}>
      <View
        style={[
          styles.cardOuter,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <LinearGradient
          colors={[headerGradStart, headerGradEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerStrip}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Today's Progress</Text>
        </LinearGradient>
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.contentSection}>
          <View style={styles.row}>
            <LinearGradient
              colors={[reviewGradStart, reviewGradEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconBox}
            >
              <Ionicons
                name={dueReviewCount === 0 ? 'locate-outline' : 'refresh'}
                size={20}
                color={theme.colors.primary}
                accessible={false}
                importantForAccessibility="no"
              />
            </LinearGradient>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: theme.colors.mutedText }]}>Reviews due</Text>
              <Text style={[styles.rowValue, { color: theme.colors.text }]}>{reviewValue}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <LinearGradient
              colors={[timeGradStart, timeGradEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconBox}
            >
              <Ionicons
                name="time-outline"
                size={20}
                color={theme.colors.secondary}
                accessible={false}
                importantForAccessibility="no"
              />
            </LinearGradient>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: theme.colors.mutedText }]}>Time studied</Text>
              <Text style={[styles.rowValue, { color: theme.colors.text }]}>
                {minutesToday} {minutesToday === 1 ? 'minute' : 'minutes'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 0,
  },
  cardOuter: {
    borderRadius: OUTER_CARD_RADIUS,
    borderWidth: 1,
    overflow: 'hidden',
    ...softShadow,
  },
  headerStrip: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  sectionTitle: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 17,
    letterSpacing: -0.3,
  },
  contentSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    gap: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
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
