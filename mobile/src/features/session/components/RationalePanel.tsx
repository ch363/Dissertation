/**
 * Rationale Panel Component
 *
 * Displays the educational rationale/explanation for a card.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/services/theme/tokens';

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
  if (!rationale) return null;

  return (
    <View style={styles.container}>
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
        <Text style={styles.toggleText}>
          {visible ? 'Hide Why' : 'Why?'}
        </Text>
      </Pressable>

      {visible && (
        <View style={styles.content}>
          <Text style={styles.rationaleText}>{rationale}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  toggleText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  content: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  rationaleText: {
    fontSize: theme.fontSize.md,
    lineHeight: 22,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
});
