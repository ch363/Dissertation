import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/services/theme/ThemeProvider';

export type LoadingRowProps = {
  /** Optional label, default "Loading…" */
  label?: string;
};

/**
 * Inline loading row: primary spinner + muted label.
 * Use for section/list loading states (no full-screen, no blur).
 */
export function LoadingRow({ label = 'Loading…' }: LoadingRowProps) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.row}>
      <ActivityIndicator size="small" color={theme.colors.primary} />
      <Text style={[styles.label, { color: theme.colors.mutedText }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  label: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
  },
});
