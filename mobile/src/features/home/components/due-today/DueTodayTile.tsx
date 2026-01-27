import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CARD_BORDER, CARD_RADIUS, softShadow } from '../homeStyles';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

export type DueTodayTileItem = {
  title: string;
  lessons: string;
  eta: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  locked?: boolean;
  lockCopy?: string;
  completed?: boolean;
};

type Props = {
  item: DueTodayTileItem;
  onPress: (route: string) => void;
};

export function DueTodayTile({ item, onPress }: Props) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${item.lessons}, ${item.eta}`}
      onPress={() => onPress(item.route)}
      style={[
        styles.tile,
        {
          backgroundColor: theme.colors.card,
          borderColor: CARD_BORDER,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.iconCircle}>
          <Ionicons name={item.icon} size={20} color="#1B6ED4" accessible={false} importantForAccessibility="no" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{item.title}</Text>
          <Text style={[styles.subtitle, { color: '#5F6F86' }]}>{item.lessons}</Text>
        </View>
        {item.completed ? (
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={theme.colors.primary}
            accessible={false}
            importantForAccessibility="no"
          />
        ) : (
          <Ionicons
            name="chevron-forward"
            size={18}
            color={theme.colors.mutedText}
            accessible={false}
            importantForAccessibility="no"
          />
        )}
      </View>
      <View style={styles.etaRow}>
        <Ionicons name="time-outline" size={14} color={theme.colors.mutedText} accessible={false} importantForAccessibility="no" />
        <Text style={[styles.etaText, { color: theme.colors.mutedText }]}>{item.eta}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    paddingVertical: baseTheme.spacing.md,
    paddingHorizontal: baseTheme.spacing.md,
    gap: baseTheme.spacing.sm,
    minHeight: 134,
    backgroundColor: '#FFFFFF',
    ...softShadow,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.sm,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#E6F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
  },
  subtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 13,
    marginTop: 2,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: baseTheme.spacing.xs,
  },
  etaText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 13,
  },
});
