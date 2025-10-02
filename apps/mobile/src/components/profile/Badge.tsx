import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme as baseTheme } from '@/theme';

export function Badge({ text }: { text: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: baseTheme.colors.card,
    borderWidth: 1,
    borderColor: baseTheme.colors.border,
  },
  text: { color: baseTheme.colors.text, fontFamily: baseTheme.typography.semiBold },
});
