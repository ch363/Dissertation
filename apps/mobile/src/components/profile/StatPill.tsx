import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { theme as baseTheme } from '@/theme';

export function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#EAF4FF',
  },
  value: { fontFamily: baseTheme.typography.semiBold, color: '#0D1B2A' },
  label: { color: '#27566c', fontSize: 12 },
});
