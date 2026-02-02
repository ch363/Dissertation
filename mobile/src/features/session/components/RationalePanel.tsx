/**
 * Rationale Panel Component
 *
 * Displays the educational rationale/explanation for a card.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

interface RationalePanelProps {
  rationale: string;
  visible: boolean;
  onToggle: () => void;
}

export const RationalePanel: React.FC<RationalePanelProps> = ({
  rationale,
  visible,
  onToggle,
}) => {
  const ctx = useAppTheme();
  const theme = ctx?.theme ?? baseTheme;
  if (!rationale) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <Pressable
        style={styles.toggleButton}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Hide rationale' : 'Show rationale'}
      >
        <Ionicons
          name={visible ? 'chevron-up' : 'lightbulb-outline'}
          size={20}
          color={theme.colors.primary}
        />
        <Text style={[styles.toggleText, { color: theme.colors.primary }]}>
          {visible ? 'Hide Why' : 'Why?'}
        </Text>
      </Pressable>

      {visible && (
        <View style={[styles.content, { borderTopColor: theme.colors.border }]}>
          <Text style={[styles.rationaleText, { color: theme.colors.mutedText }]}>{rationale}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: baseTheme.spacing.md,
    borderRadius: baseTheme.radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: baseTheme.spacing.md,
    gap: baseTheme.spacing.sm,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: baseTheme.spacing.md,
    paddingBottom: baseTheme.spacing.md,
    borderTopWidth: 1,
  },
  rationaleText: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: baseTheme.spacing.sm,
  },
});
