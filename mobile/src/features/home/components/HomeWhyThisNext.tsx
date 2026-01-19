import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
            shadowColor: '#0D1B2A',
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Ionicons name="sparkles" size={16} color={theme.colors.primary} />
          <Text style={[styles.title, { color: theme.colors.text }]}>Focus</Text>
        </View>
        <Text style={[styles.body, { color: theme.colors.mutedText }]}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: baseTheme.spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: baseTheme.spacing.md,
    paddingHorizontal: baseTheme.spacing.md,
    gap: baseTheme.spacing.sm,
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  body: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 15,
    lineHeight: 22,
  },
});

