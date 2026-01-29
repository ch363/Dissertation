import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { OUTER_CARD_RADIUS, softShadow } from './homeStyles';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type Props = {
  text: string;
};

export function HomeWhyThisNext({ text }: Props) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.section}>
      <View
        style={[
          styles.card,
          {
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.card,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Ionicons name="sparkles" size={18} color={theme.colors.primary} />
          <Text style={[styles.title, { color: theme.colors.text }]}>Focus</Text>
        </View>
        <Text style={[styles.body, { color: theme.colors.mutedText }]}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: baseTheme.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 17,
    letterSpacing: -0.2,
  },
  card: {
    borderWidth: 1,
    borderRadius: OUTER_CARD_RADIUS,
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: baseTheme.spacing.sm,
    ...softShadow,
  },
  body: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 15,
    lineHeight: 22,
  },
});

